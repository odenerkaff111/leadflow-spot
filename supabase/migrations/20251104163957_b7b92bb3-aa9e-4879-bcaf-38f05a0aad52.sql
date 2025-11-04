-- Fase 1: Autenticação + Multi-tenant

-- 1. Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'agent', 'viewer');

-- 2. Criar tabela de empresas
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Criar tabela de profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Criar tabela de roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, company_id, role)
);

-- 5. Adicionar company_id às tabelas existentes
ALTER TABLE public.leads ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.etapas ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.notas ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.etiquetas ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.campos_personalizados ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- 6. Criar índices para performance
CREATE INDEX idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_company_id ON public.user_roles(company_id);
CREATE INDEX idx_leads_company_id ON public.leads(company_id);
CREATE INDEX idx_etapas_company_id ON public.etapas(company_id);

-- 7. Function para verificar role (security definer)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _company_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND role = _role
  )
$$;

-- 8. Function para verificar se usuário pertence à empresa
CREATE OR REPLACE FUNCTION public.user_in_company(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND company_id = _company_id
  )
$$;

-- 9. Function para criar profile automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- 10. Trigger para criar profile ao criar usuário
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 11. Trigger para atualizar updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Enable RLS em todas as tabelas
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 13. RLS Policies para companies
CREATE POLICY "Usuários podem ver suas empresas"
  ON public.companies FOR SELECT
  TO authenticated
  USING (public.user_in_company(auth.uid(), id));

CREATE POLICY "Owners podem atualizar suas empresas"
  ON public.companies FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), id, 'owner'))
  WITH CHECK (public.has_role(auth.uid(), id, 'owner'));

-- 14. RLS Policies para profiles
CREATE POLICY "Usuários podem ver profiles da mesma empresa"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.user_in_company(auth.uid(), company_id));

CREATE POLICY "Usuários podem atualizar seu próprio profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 15. RLS Policies para user_roles
CREATE POLICY "Usuários podem ver roles da mesma empresa"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.user_in_company(auth.uid(), company_id));

CREATE POLICY "Owners podem gerenciar roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), company_id, 'owner'))
  WITH CHECK (public.has_role(auth.uid(), company_id, 'owner'));

-- 16. Atualizar RLS policies das tabelas existentes para multi-tenant
DROP POLICY IF EXISTS "Permitir acesso público a leads" ON public.leads;
DROP POLICY IF EXISTS "Permitir acesso público a etapas" ON public.etapas;
DROP POLICY IF EXISTS "Permitir acesso público a notas" ON public.notas;
DROP POLICY IF EXISTS "Permitir acesso público a etiquetas" ON public.etiquetas;
DROP POLICY IF EXISTS "Permitir acesso público a campos" ON public.campos_personalizados;

CREATE POLICY "Usuários podem ver leads da empresa"
  ON public.leads FOR SELECT
  TO authenticated
  USING (public.user_in_company(auth.uid(), company_id));

CREATE POLICY "Usuários podem criar leads na empresa"
  ON public.leads FOR INSERT
  TO authenticated
  WITH CHECK (public.user_in_company(auth.uid(), company_id));

CREATE POLICY "Usuários podem atualizar leads da empresa"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (public.user_in_company(auth.uid(), company_id))
  WITH CHECK (public.user_in_company(auth.uid(), company_id));

CREATE POLICY "Usuários podem deletar leads da empresa"
  ON public.leads FOR DELETE
  TO authenticated
  USING (public.user_in_company(auth.uid(), company_id));

CREATE POLICY "Usuários podem ver etapas da empresa"
  ON public.etapas FOR SELECT
  TO authenticated
  USING (public.user_in_company(auth.uid(), company_id));

CREATE POLICY "Admins podem gerenciar etapas"
  ON public.etapas FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), company_id, 'admin') OR public.has_role(auth.uid(), company_id, 'owner'))
  WITH CHECK (public.has_role(auth.uid(), company_id, 'admin') OR public.has_role(auth.uid(), company_id, 'owner'));

CREATE POLICY "Usuários podem ver notas da empresa"
  ON public.notas FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = notas.lead_id
        AND public.user_in_company(auth.uid(), leads.company_id)
    )
  );

CREATE POLICY "Usuários podem criar notas na empresa"
  ON public.notas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = notas.lead_id
        AND public.user_in_company(auth.uid(), leads.company_id)
    )
  );

CREATE POLICY "Usuários podem atualizar notas da empresa"
  ON public.notas FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = notas.lead_id
        AND public.user_in_company(auth.uid(), leads.company_id)
    )
  );

CREATE POLICY "Usuários podem deletar notas da empresa"
  ON public.notas FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = notas.lead_id
        AND public.user_in_company(auth.uid(), leads.company_id)
    )
  );

CREATE POLICY "Usuários podem gerenciar etiquetas da empresa"
  ON public.etiquetas FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = etiquetas.lead_id
        AND public.user_in_company(auth.uid(), leads.company_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = etiquetas.lead_id
        AND public.user_in_company(auth.uid(), leads.company_id)
    )
  );

CREATE POLICY "Usuários podem gerenciar campos da empresa"
  ON public.campos_personalizados FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = campos_personalizados.lead_id
        AND public.user_in_company(auth.uid(), leads.company_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = campos_personalizados.lead_id
        AND public.user_in_company(auth.uid(), leads.company_id)
    )
  );