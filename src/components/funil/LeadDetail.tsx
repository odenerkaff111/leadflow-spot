import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Save, Trash2, Tag, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LeadDetailProps {
  leadId: string;
  onClose: () => void;
}

export const LeadDetail = ({ leadId, onClose }: LeadDetailProps) => {
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [leadData, setLeadData] = useState<any>({});
  const [newNota, setNewNota] = useState("");
  const [newEtiqueta, setNewEtiqueta] = useState("");
  const [newCampoChave, setNewCampoChave] = useState("");
  const [newCampoValor, setNewCampoValor] = useState("");

  const { data: lead } = useQuery({
    queryKey: ["lead", leadId],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").eq("id", leadId).single();
      if (error) throw error;
      setLeadData(data);
      return data;
    },
  });

  const { data: notas } = useQuery({
    queryKey: ["notas", leadId],
    queryFn: async () => {
      const { data, error } = await supabase.from("notas").select("*").eq("lead_id", leadId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: etiquetas } = useQuery({
    queryKey: ["etiquetas", leadId],
    queryFn: async () => {
      const { data, error } = await supabase.from("etiquetas").select("*").eq("lead_id", leadId);
      if (error) throw error;
      return data;
    },
  });

  const { data: campos } = useQuery({
    queryKey: ["campos", leadId],
    queryFn: async () => {
      const { data, error } = await supabase.from("campos_personalizados").select("*").eq("lead_id", leadId);
      if (error) throw error;
      return data;
    },
  });

  const updateLead = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("leads").update(data).eq("id", leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setEditMode(false);
      toast.success("Lead atualizado!");
    },
  });

  const addNota = useMutation({
    mutationFn: async (conteudo: string) => {
      const { error } = await supabase.from("notas").insert({ lead_id: leadId, conteudo });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notas", leadId] });
      setNewNota("");
      toast.success("Nota adicionada!");
    },
  });

  const addEtiqueta = useMutation({
    mutationFn: async (etiqueta: string) => {
      const { error } = await supabase.from("etiquetas").insert({ lead_id: leadId, etiqueta });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["etiquetas", leadId] });
      setNewEtiqueta("");
      toast.success("Etiqueta adicionada!");
    },
  });

  const deleteEtiqueta = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("etiquetas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["etiquetas", leadId] });
      toast.success("Etiqueta removida!");
    },
  });

  const addCampo = useMutation({
    mutationFn: async ({ chave, valor }: { chave: string; valor: string }) => {
      const { error } = await supabase.from("campos_personalizados").insert({ lead_id: leadId, chave, valor });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campos", leadId] });
      setNewCampoChave("");
      setNewCampoValor("");
      toast.success("Campo adicionado!");
    },
  });

  const deleteCampo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("campos_personalizados").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campos", leadId] });
      toast.success("Campo removido!");
    },
  });

  return (
    <Sheet open={!!leadId} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detalhes do Lead</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Informações Básicas</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => (editMode ? updateLead.mutate(leadData) : setEditMode(true))}
              >
                <Save className="mr-2 h-4 w-4" />
                {editMode ? "Salvar" : "Editar"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={editMode ? leadData.nome : lead?.nome}
                  onChange={(e) => setLeadData({ ...leadData, nome: e.target.value })}
                  disabled={!editMode}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={editMode ? leadData.email : lead?.email}
                  onChange={(e) => setLeadData({ ...leadData, email: e.target.value })}
                  disabled={!editMode}
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={editMode ? leadData.telefone : lead?.telefone}
                  onChange={(e) => setLeadData({ ...leadData, telefone: e.target.value })}
                  disabled={!editMode}
                />
              </div>
              <div>
                <Label>Valor do Negócio (R$)</Label>
                <Input
                  type="number"
                  value={editMode ? leadData.valor : lead?.valor}
                  onChange={(e) => setLeadData({ ...leadData, valor: e.target.value })}
                  disabled={!editMode}
                />
              </div>
              <div>
                <Label>Origem</Label>
                <Input
                  value={editMode ? leadData.origem : lead?.origem}
                  onChange={(e) => setLeadData({ ...leadData, origem: e.target.value })}
                  disabled={!editMode}
                  placeholder="Ex: Instagram, Indicação, Tráfego"
                />
              </div>
            </CardContent>
          </Card>

          {/* Etiquetas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Etiquetas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {etiquetas?.map((et) => (
                  <Badge key={et.id} variant="secondary" className="gap-2">
                    {et.etiqueta}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => deleteEtiqueta.mutate(et.id)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Nova etiqueta"
                  value={newEtiqueta}
                  onChange={(e) => setNewEtiqueta(e.target.value)}
                />
                <Button
                  size="icon"
                  onClick={() => newEtiqueta && addEtiqueta.mutate(newEtiqueta)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Campos Personalizados */}
          <Card>
            <CardHeader>
              <CardTitle>Campos Personalizados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {campos?.map((campo) => (
                <div key={campo.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{campo.chave}</p>
                    <p className="text-sm text-muted-foreground">{campo.valor}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteCampo.mutate(campo.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Separator />
              <div className="space-y-2">
                <Input
                  placeholder="Nome do campo"
                  value={newCampoChave}
                  onChange={(e) => setNewCampoChave(e.target.value)}
                />
                <Input
                  placeholder="Valor"
                  value={newCampoValor}
                  onChange={(e) => setNewCampoValor(e.target.value)}
                />
                <Button
                  className="w-full"
                  onClick={() => newCampoChave && addCampo.mutate({ chave: newCampoChave, valor: newCampoValor })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Campo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Notas e Histórico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {notas?.map((nota) => (
                  <div key={nota.id} className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">{nota.conteudo}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(nota.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-2">
                <Textarea
                  placeholder="Adicionar uma nota..."
                  value={newNota}
                  onChange={(e) => setNewNota(e.target.value)}
                  rows={3}
                />
                <Button
                  className="w-full"
                  onClick={() => newNota && addNota.mutate(newNota)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Nota
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
};
