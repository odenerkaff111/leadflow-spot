import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const companySchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(100),
  slug: z
    .string()
    .min(2, "Slug deve ter no mínimo 2 caracteres")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
});

const Onboarding = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [slug, setSlug] = useState("");

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleCompanyNameChange = (value: string) => {
    setCompanyName(value);
    if (!slug || slug === generateSlug(companyName)) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      companySchema.parse({ name: companyName, slug });

      // Create company
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .insert({
          name: companyName,
          slug,
          owner_id: user?.id,
        })
        .select()
        .single();

      if (companyError) {
        if (companyError.code === "23505") {
          toast.error("Este slug já está em uso. Tente outro.");
        } else {
          toast.error("Erro ao criar empresa: " + companyError.message);
        }
        setLoading(false);
        return;
      }

      // Update profile with company_id
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ company_id: company.id })
        .eq("id", user?.id);

      if (profileError) {
        toast.error("Erro ao atualizar perfil: " + profileError.message);
        setLoading(false);
        return;
      }

      // Create owner role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: user?.id,
          company_id: company.id,
          role: "owner",
        });

      if (roleError) {
        toast.error("Erro ao criar role: " + roleError.message);
        setLoading(false);
        return;
      }

      // Create default stages
      const defaultStages = [
        { nome: "Novo Lead", ordem: 1, cor: "#8B5CF6" },
        { nome: "Contato Inicial", ordem: 2, cor: "#06B6D4" },
        { nome: "Proposta Enviada", ordem: 3, cor: "#F59E0B" },
        { nome: "Negociação", ordem: 4, cor: "#10B981" },
        { nome: "Fechado", ordem: 5, cor: "#22C55E" },
      ];

      const { error: stagesError } = await supabase
        .from("etapas")
        .insert(
          defaultStages.map((stage) => ({
            ...stage,
            company_id: company.id,
          }))
        );

      if (stagesError) {
        console.error("Erro ao criar etapas padrão:", stagesError);
      }

      await refreshProfile();
      toast.success("Empresa criada com sucesso!");
      navigate("/");
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      } else {
        toast.error("Erro ao criar empresa");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Criar sua Empresa</CardTitle>
          <CardDescription>
            Configure sua empresa para começar a usar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Nome da Empresa</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => handleCompanyNameChange(e.target.value)}
                placeholder="Minha Empresa"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL amigável)</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="minha-empresa"
                required
              />
              <p className="text-xs text-muted-foreground">
                Este será usado na URL da sua empresa
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando..." : "Criar Empresa"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
