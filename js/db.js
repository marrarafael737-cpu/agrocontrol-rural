// AgroControl Rural - Database Adapter (Supabase & LocalStorage Cache)

const DB_KEY = 'agrocontrol_db';
const SUPABASE_URL = 'https://atfzjrjazbjyyehqvrgd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0ZnpqcmphemJqeXllaHF2cmdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMzk4MDYsImV4cCI6MjA5NDcxNTgwNn0.pwWnYHzg4noGgI25hcHsITSEmWl3PX3Tn5nabWyG0yk';

// Inicializar cliente do Supabase
let supabaseClient = null;
if (typeof window.supabase !== 'undefined') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase carregado com sucesso!');
} else {
    console.warn('Supabase JS SDK não encontrado. O app funcionará apenas em modo local/mock.');
}

const defaultData = {
    despesas: [],
    receitas: [],
    gado: [],
    bezerros: [],
    contas: []
};

// Objeto de Cache local em memória
let localCache = { ...defaultData };

// Inicializa o banco de dados carregando do IndexedDB
async function initDB() {
    let data;
    try {
        data = await localforage.getItem(DB_KEY);
    } catch (e) {
        console.error("Erro ao ler localForage:", e);
    }

    if (!data) {
        // Auto-Migração do LocalStorage Antigo (Garante 0 perda de dados)
        const oldData = localStorage.getItem(DB_KEY);
        if (oldData) {
            try {
                localCache = JSON.parse(oldData);
                console.log("Migrando banco de dados do LocalStorage para IndexedDB...");
                await localforage.setItem(DB_KEY, localCache);
                localStorage.removeItem(DB_KEY);
            } catch(e) {
                localCache = { ...defaultData };
            }
        } else {
            localCache = { ...defaultData };
            await localforage.setItem(DB_KEY, localCache);
        }
    } else {
        localCache = data;
    }

    window.dispatchEvent(new Event('db-ready'));
}

// Salva o cache local no IndexedDB assincronamente (Fire and Forget)
function saveLocal() {
    localforage.setItem(DB_KEY, localCache).catch(err => {
        console.error("Falha fatal ao persistir no IndexedDB:", err);
    });
}

// Gera ID único
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Formatação monetária
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// Formatação de data
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

const DB = {
    
    // === Fila de Sincronização (Background Sync) ===
    queueSyncAction: async (table, action, payload) => {
        let queue = [];
        try {
            queue = await localforage.getItem('agrocontrol_sync_queue') || [];
        } catch(e) {}
        queue.push({ table, action, payload, timestamp: Date.now() });
        await localforage.setItem('agrocontrol_sync_queue', queue);
    },
    
    processSyncQueue: async () => {
        if (!supabaseClient || !navigator.onLine) return;
        let queue = [];
        try {
            queue = await localforage.getItem('agrocontrol_sync_queue') || [];
        } catch(e) {}
        if (queue.length === 0) return;
        
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        console.log(`Processando fila de sincronização (${queue.length} itens)...`);
        
        const failedQueue = [];
        let authExpired = false;
        
        for (const item of queue) {
            try {
                if (item.action === 'INSERT') {
                    const payload = { ...item.payload, user_id: user.id };
                    const { error } = await supabaseClient.from(item.table).insert([payload]);
                    if (error) throw error;
                } else if (item.action === 'UPDATE') {
                    const { error } = await supabaseClient.from(item.table).update(item.payload).eq('id', item.payload.id);
                    if (error) throw error;
                } else if (item.action === 'DELETE') {
                    const { error } = await supabaseClient.from(item.table).delete().eq('id', item.payload.id);
                    if (error) throw error;
                }
            } catch (err) {
                console.error(`Erro ao processar item da fila (${item.table} - ${item.action}):`, err);
                failedQueue.push(item);
                // Verifica erro de Autenticação/Sessão (Token expirado)
                if (err.status === 401 || err.code === 'PGRST301' || (err.message && err.message.includes('JWT'))) {
                    authExpired = true;
                }
            }
        }
        
        await localforage.setItem('agrocontrol_sync_queue', failedQueue);
        
        if (authExpired) {
            window.dispatchEvent(new CustomEvent('auth-expired', { detail: { count: failedQueue.length } }));
        }
    },

    // Busca paginada para evitar estouro de memória e limite de 1000 linhas do Supabase
    fetchAllPaginated: async (table) => {
        let allData = [];
        let from = 0;
        const limit = 1000;
        while (true) {
            const { data, error } = await supabaseClient.from(table).select('*').range(from, from + limit - 1);
            if (error) return { error, data: null };
            if (!data || data.length === 0) break;
            allData.push(...data);
            from += limit;
            if (data.length < limit) break;
        }
        return { error: null, data: allData };
    },

    // === Sincronização Supabase ===
    
    // Verifica se há um usuário autenticado
    isAuthenticated: async () => {
        if (!supabaseClient) return false;
        const { data: { session } } = await supabaseClient.auth.getSession();
        return !!session;
    },

    // Retorna os dados do usuário atual
    getUser: async () => {
        if (!supabaseClient) return null;
        const { data: { user } } = await supabaseClient.auth.getUser();
        return user;
    },

    // Realiza o cadastro de um novo usuário
    signUp: async (email, password) => {
        if (!supabaseClient) throw new Error("Supabase não configurado.");
        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        if (error) throw error;
        return data;
    },

    // Realiza o login do usuário
    signIn: async (email, password) => {
        if (!supabaseClient) throw new Error("Supabase não configurado.");
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Após logar com sucesso, sincroniza os dados do Supabase
        await DB.syncFromSupabase();
        return data;
    },

    // Realiza o logout do usuário
    signOut: async () => {
        if (supabaseClient) {
            await supabaseClient.auth.signOut();
        }
        localStorage.removeItem('agrocontrol_auth');
        localStorage.removeItem(DB_KEY);
        localCache = { ...defaultData };
        saveLocal();
    },

    // Sincroniza dados do Supabase para o cache local
    syncFromSupabase: async () => {
        if (!supabaseClient) return false;
        
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            console.log("Nenhum usuário logado. Utilizando dados locais de teste.");
            return false;
        }

        console.log("Sincronizando dados com o Supabase...");
        await DB.processSyncQueue();

        try {
            // Executa as consultas em paralelo para máxima eficiência (Paginadas)
            const [gadoRes, bezerrosRes, despesasRes, receitasRes, contasRes] = await Promise.all([
                DB.fetchAllPaginated('gado'),
                DB.fetchAllPaginated('bezerros'),
                DB.fetchAllPaginated('despesas'),
                DB.fetchAllPaginated('receitas'),
                DB.fetchAllPaginated('contas')
            ]);

            // Trata erros de tabela não criada (ex: Relação inexistente)
            if (gadoRes.error && gadoRes.error.code === 'P0001') {
                console.warn("Tabelas ainda não criadas no Supabase. Por favor, execute o script SQL setup.");
                return false;
            }

            // Atualiza cache apenas com dados válidos se as consultas completarem sem erros críticos
            if (!gadoRes.error) localCache.gado = gadoRes.data;
            if (!bezerrosRes.error) localCache.bezerros = bezerrosRes.data;
            if (!despesasRes.error) localCache.despesas = despesasRes.data;
            if (!receitasRes.error) localCache.receitas = receitasRes.data;
            if (contasRes && !contasRes.error) localCache.contas = contasRes.data;

            saveLocal();
            console.log("Sincronização concluída com sucesso!");
            return true;
        } catch (err) {
            console.error("Erro durante a sincronização com o Supabase:", err);
            return false;
        }
    },

    // === Despesas ===
    getDespesas: () => localCache.despesas || [],
    addDespesa: (despesa) => {
        despesa.id = generateId();
        despesa.valor = parseFloat(despesa.valor);
        
        // Salva instantaneamente no cache local
        localCache.despesas.push(despesa);
        saveLocal();

        // Envia de forma assíncrona ao Supabase (segundo plano)
        DB.queueSyncAction('despesas', 'INSERT', despesa);
        DB.processSyncQueue();
        return despesa;
    },
    updateDespesa: (id, updatedDespesa) => {
        const index = localCache.despesas.findIndex(d => d.id === id);
        if (index !== -1) {
            updatedDespesa.id = id;
            updatedDespesa.valor = parseFloat(updatedDespesa.valor);
            localCache.despesas[index] = updatedDespesa;
            saveLocal();

            DB.queueSyncAction('despesas', 'UPDATE', updatedDespesa);
            DB.processSyncQueue();
        }
    },
    deleteDespesa: (id) => {
        localCache.despesas = localCache.despesas.filter(d => d.id !== id);
        saveLocal();

        DB.queueSyncAction('despesas', 'DELETE', { id });
        DB.processSyncQueue();
    },

    // === Receitas ===
    getReceitas: () => localCache.receitas || [],
    addReceita: (receita) => {
        receita.id = generateId();
        receita.valor = parseFloat(receita.valor);
        receita.qtd = parseInt(receita.qtd);
        receita.peso = receita.peso ? parseFloat(receita.peso) : 0;
        
        localCache.receitas.push(receita);
        saveLocal();

        DB.queueSyncAction('receitas', 'INSERT', receita);
        DB.processSyncQueue();
        return receita;
    },
    updateReceita: (id, updatedReceita) => {
        const index = localCache.receitas.findIndex(r => r.id === id);
        if (index !== -1) {
            updatedReceita.id = id;
            updatedReceita.valor = parseFloat(updatedReceita.valor);
            updatedReceita.qtd = parseInt(updatedReceita.qtd);
            updatedReceita.peso = updatedReceita.peso ? parseFloat(updatedReceita.peso) : 0;
            localCache.receitas[index] = updatedReceita;
            saveLocal();

            DB.queueSyncAction('receitas', 'UPDATE', updatedReceita);
            DB.processSyncQueue();
        }
    },
    deleteReceita: (id) => {
        localCache.receitas = localCache.receitas.filter(r => r.id !== id);
        saveLocal();

        DB.queueSyncAction('receitas', 'DELETE', { id });
        DB.processSyncQueue();
    },

    // === Gado ===
    getGado: () => localCache.gado || [],
    addGado: (animal) => {
        animal.id = generateId();
        animal.peso = animal.peso ? parseFloat(animal.peso) : 0;
        
        localCache.gado.push(animal);
        saveLocal();

        DB.queueSyncAction('gado', 'INSERT', animal);
        DB.processSyncQueue();
        return animal;
    },
    updateGado: (id, updatedAnimal) => {
        const index = localCache.gado.findIndex(g => g.id === id);
        if (index !== -1) {
            updatedAnimal.id = id;
            updatedAnimal.peso = updatedAnimal.peso ? parseFloat(updatedAnimal.peso) : 0;
            localCache.gado[index] = updatedAnimal;
            saveLocal();

            DB.queueSyncAction('gado', 'UPDATE', updatedAnimal);
            DB.processSyncQueue();
        }
    },
    deleteGado: (id) => {
        localCache.gado = localCache.gado.filter(g => g.id !== id);
        saveLocal();

        DB.queueSyncAction('gado', 'DELETE', { id });
        DB.processSyncQueue();
    },

    // === Bezerros ===
    getBezerros: () => localCache.bezerros || [],
    addBezerro: (bezerro) => {
        bezerro.id = generateId();
        bezerro.peso = bezerro.peso ? parseFloat(bezerro.peso) : 0;
        
        localCache.bezerros.push(bezerro);
        saveLocal();

        DB.queueSyncAction('bezerros', 'INSERT', bezerro);
        DB.processSyncQueue();
        return bezerro;
    },
    updateBezerro: (id, updatedBezerro) => {
        const index = localCache.bezerros.findIndex(b => b.id === id);
        if (index !== -1) {
            updatedBezerro.id = id;
            updatedBezerro.peso = updatedBezerro.peso ? parseFloat(updatedBezerro.peso) : 0;
            localCache.bezerros[index] = updatedBezerro;
            saveLocal();

            DB.queueSyncAction('bezerros', 'UPDATE', updatedBezerro);
            DB.processSyncQueue();
        }
    },
    deleteBezerro: (id) => {
        localCache.bezerros = localCache.bezerros.filter(b => b.id !== id);
        saveLocal();

        DB.queueSyncAction('bezerros', 'DELETE', { id });
        DB.processSyncQueue();
    },

    // === Contas (Agenda Financeira) ===
    getContas: () => localCache.contas || [],
    addConta: (conta) => {
        conta.id = generateId();
        conta.valor = parseFloat(conta.valor);
        conta.status = conta.status || 'Pendente';
        
        localCache.contas.push(conta);
        saveLocal();

        DB.queueSyncAction('contas', 'INSERT', conta);
        DB.processSyncQueue();
        return conta;
    },
    updateConta: (id, updatedConta) => {
        const index = localCache.contas.findIndex(c => c.id === id);
        if (index !== -1) {
            updatedConta.id = id;
            updatedConta.valor = parseFloat(updatedConta.valor);
            localCache.contas[index] = updatedConta;
            saveLocal();

            DB.queueSyncAction('contas', 'UPDATE', updatedConta);
            DB.processSyncQueue();
        }
    },
    deleteConta: (id) => {
        localCache.contas = localCache.contas.filter(c => c.id !== id);
        saveLocal();

        DB.queueSyncAction('contas', 'DELETE', { id });
        DB.processSyncQueue();

        // Cascading Delete: Apaga Despesas ou Receitas geradas por esta conta
        const refStr = `[REF_CONTA:${id}]`;
        const despesasRelacionadas = localCache.despesas.filter(d => d.observacoes && d.observacoes.includes(refStr));
        despesasRelacionadas.forEach(d => DB.deleteDespesa(d.id));
        
        const receitasRelacionadas = localCache.receitas.filter(r => r.observacoes && r.observacoes.includes(refStr));
        receitasRelacionadas.forEach(r => DB.deleteReceita(r.id));
    },
    quitarConta: (id, dataPagamento) => {
        const index = localCache.contas.findIndex(c => c.id === id);
        if (index === -1) return null;

        const conta = localCache.contas[index];
        if (conta.status === 'Pago') return conta;

        conta.status = 'Pago';
        saveLocal();

        DB.queueSyncAction('contas', 'UPDATE', { id, status: 'Pago' });
        DB.processSyncQueue();

        const lancamentoData = dataPagamento || new Date().toISOString().split('T')[0];
        const refTag = `\n[REF_CONTA:${id}]`;
        if (conta.tipo === 'Pagar') {
            DB.addDespesa({
                categoria: conta.categoria,
                descricao: `[PAGO] ${conta.descricao}`,
                valor: conta.valor,
                data: lancamentoData,
                observacoes: (conta.observacoes || `Quitacao da conta registrada em ${formatDate(conta.vencimento)}`) + refTag
            });
        } else {
            DB.addReceita({
                tipo: conta.categoria,
                qtd: 1,
                peso: 0,
                valor: conta.valor,
                data: lancamentoData,
                observacoes: (conta.observacoes || `Recebimento da conta registrada em ${formatDate(conta.vencimento)}`) + refTag
            });
        }

        if (conta.recorrencia && conta.recorrencia !== 'Nenhuma') {
            // Usa 12:00:00 para forçar o meio-dia e blindar contra bugs de Fuso Horário e Horário de Verão
            const proxVencimento = new Date(conta.vencimento + 'T12:00:00');
            
            if (conta.recorrencia === 'Semanal') {
                proxVencimento.setDate(proxVencimento.getDate() + 7);
            } else if (conta.recorrencia === 'Mensal') {
                proxVencimento.setMonth(proxVencimento.getMonth() + 1);
            } else if (conta.recorrencia === 'Anual') {
                proxVencimento.setFullYear(proxVencimento.getFullYear() + 1);
            }

            // Garante a extração da data sem influência de fuso UTC
            const yyyy = proxVencimento.getFullYear();
            const mm = String(proxVencimento.getMonth() + 1).padStart(2, '0');
            const dd = String(proxVencimento.getDate()).padStart(2, '0');
            const proxDataStr = `${yyyy}-${mm}-${dd}`;

            DB.addConta({
                tipo: conta.tipo,
                categoria: conta.categoria,
                descricao: conta.descricao,
                valor: conta.valor,
                vencimento: proxDataStr,
                status: 'Pendente',
                recorrencia: conta.recorrencia,
                observacoes: conta.observacoes
            });
        }

        return conta;
    }
};

window.dbReadyPromise = initDB();
window.DB = DB; // Torna o DB disponível globalmente
