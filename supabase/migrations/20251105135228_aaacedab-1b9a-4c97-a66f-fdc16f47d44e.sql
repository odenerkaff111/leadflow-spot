-- Adiciona política de INSERT para permitir criação de empresas
CREATE POLICY "Usuários autenticados podem criar empresas"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);