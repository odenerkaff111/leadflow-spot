-- Corrigir política RLS para criação de empresas
-- A política de INSERT deve permitir que usuários criem empresas onde eles são o owner

-- Primeiro, remover a política problemática
DROP POLICY IF EXISTS "Usuários autenticados podem criar empresas" ON public.companies;

-- Criar nova política correta para INSERT
CREATE POLICY "Usuários podem criar suas próprias empresas" 
ON public.companies 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Também vamos verificar se a política de SELECT está correta
DROP POLICY IF EXISTS "Usuários podem ver suas empresas" ON public.companies;

CREATE POLICY "Usuários podem ver empresas onde fazem parte"
ON public.companies
FOR SELECT
TO authenticated
USING (user_in_company(auth.uid(), id));