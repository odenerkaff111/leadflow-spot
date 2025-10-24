-- Criar tabela de etapas do funil
CREATE TABLE public.etapas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ordem INTEGER NOT NULL,
  cor TEXT DEFAULT '#8B5CF6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir etapas padrão
INSERT INTO public.etapas (nome, ordem, cor) VALUES
  ('Novo lead', 1, '#8B5CF6'),
  ('Em negociação', 2, '#3B82F6'),
  ('Negócio fechado', 3, '#10B981'),
  ('Recuperação', 4, '#F59E0B');

-- Criar tabela de leads
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  valor NUMERIC DEFAULT 0,
  etapa_id UUID REFERENCES public.etapas(id) ON DELETE SET NULL,
  origem TEXT DEFAULT 'tráfego',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de notas
CREATE TABLE public.notas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de campos personalizados
CREATE TABLE public.campos_personalizados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  chave TEXT NOT NULL,
  valor TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de etiquetas
CREATE TABLE public.etiquetas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  etiqueta TEXT NOT NULL,
  cor TEXT DEFAULT '#8B5CF6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.etapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campos_personalizados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etiquetas ENABLE ROW LEVEL SECURITY;

-- Políticas para acesso público (CRM B2C simples sem autenticação por enquanto)
CREATE POLICY "Permitir acesso público a etapas" ON public.etapas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso público a leads" ON public.leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso público a notas" ON public.notas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso público a campos" ON public.campos_personalizados FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso público a etiquetas" ON public.etiquetas FOR ALL USING (true) WITH CHECK (true);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para melhor performance
CREATE INDEX idx_leads_etapa ON public.leads(etapa_id);
CREATE INDEX idx_notas_lead ON public.notas(lead_id);
CREATE INDEX idx_campos_lead ON public.campos_personalizados(lead_id);
CREATE INDEX idx_etiquetas_lead ON public.etiquetas(lead_id);