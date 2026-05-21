-- AgroControl Rural - Banco de Dados Supabase
-- Copie e cole este script no Editor SQL (SQL Editor) do seu painel do Supabase e clique em "Run".

-- 1. Tabela de Gado (Rebanho)
CREATE TABLE IF NOT EXISTS public.gado (
    id TEXT PRIMARY KEY, -- Mantemos TEXT para compatibilidade com IDs do frontend
    brinco TEXT NOT NULL,
    lote TEXT,
    sexo TEXT NOT NULL,
    nascimento DATE,
    peso NUMERIC DEFAULT 0,
    situacao TEXT DEFAULT 'Ativo no Pasto',
    user_id UUID NOT NULL DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Bezerros (Nascimentos)
CREATE TABLE IF NOT EXISTS public.bezerros (
    id TEXT PRIMARY KEY,
    mae TEXT DEFAULT 'Não identificada',
    data DATE NOT NULL,
    sexo TEXT NOT NULL,
    peso NUMERIC DEFAULT 0,
    observacoes TEXT,
    user_id UUID NOT NULL DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Despesas
CREATE TABLE IF NOT EXISTS public.despesas (
    id TEXT PRIMARY KEY,
    categoria TEXT NOT NULL,
    descricao TEXT NOT NULL,
    valor NUMERIC NOT NULL,
    data DATE NOT NULL,
    observacoes TEXT,
    user_id UUID NOT NULL DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Receitas
CREATE TABLE IF NOT EXISTS public.receitas (
    id TEXT PRIMARY KEY,
    tipo TEXT NOT NULL,
    qtd INTEGER NOT NULL DEFAULT 1,
    peso NUMERIC DEFAULT 0,
    valor NUMERIC NOT NULL,
    data DATE NOT NULL,
    observacoes TEXT,
    user_id UUID NOT NULL DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Habilitar Row Level Security (RLS) para segurança
ALTER TABLE public.gado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bezerros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de Acesso para a tabela 'gado'
CREATE POLICY "Usuários podem ver apenas seu próprio gado" ON public.gado
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seu próprio gado" ON public.gado
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio gado" ON public.gado
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seu próprio gado" ON public.gado
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 7. Políticas de Acesso para a tabela 'bezerros'
CREATE POLICY "Usuários podem ver apenas seus bezerros" ON public.bezerros
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus bezerros" ON public.bezerros
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus bezerros" ON public.bezerros
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus bezerros" ON public.bezerros
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 8. Políticas de Acesso para a tabela 'despesas'
CREATE POLICY "Usuários podem ver apenas suas despesas" ON public.despesas
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas despesas" ON public.despesas
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas despesas" ON public.despesas
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas despesas" ON public.despesas
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 9. Políticas de Acesso para a tabela 'receitas'
CREATE POLICY "Usuários podem ver apenas suas receitas" ON public.receitas
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas receitas" ON public.receitas
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas receitas" ON public.receitas
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas receitas" ON public.receitas
    FOR DELETE TO authenticated USING (auth.uid() = user_id);
