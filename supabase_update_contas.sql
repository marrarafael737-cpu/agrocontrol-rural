-- AgroControl Rural - Atualização: Tabela de Contas e Alertas Financeiros
-- Copie e cole este script no Editor SQL (SQL Editor) do seu painel do Supabase e clique em "Run".

CREATE TABLE IF NOT EXISTS public.contas (
    id TEXT PRIMARY KEY,
    tipo TEXT NOT NULL, -- 'Pagar' ou 'Receber'
    categoria TEXT NOT NULL,
    descricao TEXT NOT NULL,
    valor NUMERIC NOT NULL,
    vencimento DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pendente', -- 'Pendente' ou 'Pago'
    recorrencia TEXT DEFAULT 'Nenhuma', -- 'Nenhuma', 'Semanal', 'Mensal', 'Anual'
    observacoes TEXT,
    user_id UUID NOT NULL DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS) para segurança
ALTER TABLE public.contas ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso para a tabela 'contas'
CREATE POLICY "Usuários podem ver apenas suas próprias contas" ON public.contas
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias contas" ON public.contas
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias contas" ON public.contas
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias contas" ON public.contas
    FOR DELETE TO authenticated USING (auth.uid() = user_id);
