import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface StageManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StageManagementDialog = ({ open, onOpenChange }: StageManagementDialogProps) => {
  const queryClient = useQueryClient();
  const { company } = useAuth();
  const [newStageName, setNewStageName] = useState("");
  const [newStageColor, setNewStageColor] = useState("#8B5CF6");

  const { data: etapas } = useQuery({
    queryKey: ["etapas", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("etapas")
        .select("*")
        .eq("company_id", company.id)
        .order("ordem");
      if (error) throw error;
      return data;
    },
    enabled: !!company?.id,
  });

  const createStage = useMutation({
    mutationFn: async ({ nome, cor }: { nome: string; cor: string }) => {
      if (!company?.id) throw new Error("Empresa não encontrada");
      const maxOrdem = Math.max(...(etapas?.map((e) => e.ordem) || [0]));
      const { error } = await supabase
        .from("etapas")
        .insert({ nome, cor, ordem: maxOrdem + 1, company_id: company.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["etapas", company?.id] });
      toast.success("Etapa criada!");
      setNewStageName("");
      setNewStageColor("#8B5CF6");
    },
  });

  const deleteStage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("etapas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["etapas", company?.id] });
      toast.success("Etapa removida!");
    },
    onError: () => {
      toast.error("Não é possível remover etapas com leads");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Gerenciar Etapas do Funil</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lista de Etapas */}
          <div className="space-y-2">
            {etapas?.map((etapa) => (
              <Card key={etapa.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: etapa.cor }}
                    />
                    <span className="font-medium">{etapa.nome}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteStage.mutate(etapa.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Nova Etapa */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-medium">Adicionar Nova Etapa</h3>
              <div className="space-y-2">
                <Label>Nome da Etapa</Label>
                <Input
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  placeholder="Ex: Em análise"
                />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={newStageColor}
                    onChange={(e) => setNewStageColor(e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={newStageColor}
                    onChange={(e) => setNewStageColor(e.target.value)}
                    placeholder="#8B5CF6"
                  />
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => newStageName && createStage.mutate({ nome: newStageName, cor: newStageColor })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Etapa
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
