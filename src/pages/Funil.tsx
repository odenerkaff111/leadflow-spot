import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners } from "@dnd-kit/core";
import { StageColumn } from "@/components/funil/StageColumn";
import { LeadCard } from "@/components/funil/LeadCard";
import { LeadDetail } from "@/components/funil/LeadDetail";
import { NewLeadDialog } from "@/components/funil/NewLeadDialog";
import { StageManagementDialog } from "@/components/funil/StageManagementDialog";
import { Button } from "@/components/ui/button";
import { Plus, Settings } from "lucide-react";
import { toast } from "sonner";

export default function Funil() {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [newLeadDialogOpen, setNewLeadDialogOpen] = useState(false);
  const [stageManagementOpen, setStageManagementOpen] = useState(false);

  const { data: etapas } = useQuery({
    queryKey: ["etapas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("etapas").select("*").order("ordem");
      if (error) throw error;
      return data;
    },
  });

  const { data: leads } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*");
      if (error) throw error;
      return data;
    },
  });

  const moveLead = useMutation({
    mutationFn: async ({ leadId, newEtapaId }: { leadId: string; newEtapaId: string }) => {
      const { error } = await supabase.from("leads").update({ etapa_id: newEtapaId }).eq("id", leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead movido com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao mover lead");
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const leadId = active.id as string;
    const newEtapaId = over.id as string;

    moveLead.mutate({ leadId, newEtapaId });
  };

  const activeLead = leads?.find((lead) => lead.id === activeId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Funil de Vendas</h1>
          <p className="text-muted-foreground">Gerencie seus leads e negociações</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStageManagementOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Gerenciar Etapas
          </Button>
          <Button onClick={() => setNewLeadDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {etapas?.map((etapa) => {
            const stageLeads = leads?.filter((lead) => lead.etapa_id === etapa.id) || [];
            const totalValue = stageLeads.reduce((sum, lead) => sum + Number(lead.valor || 0), 0);

            return (
              <StageColumn
                key={etapa.id}
                stage={etapa}
                leads={stageLeads}
                totalValue={totalValue}
                onLeadClick={setSelectedLeadId}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeLead ? <LeadCard lead={activeLead} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      {/* Dialogs */}
      <NewLeadDialog
        open={newLeadDialogOpen}
        onOpenChange={setNewLeadDialogOpen}
        etapas={etapas || []}
      />

      <StageManagementDialog
        open={stageManagementOpen}
        onOpenChange={setStageManagementOpen}
      />

      {selectedLeadId && (
        <LeadDetail leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} />
      )}
    </div>
  );
}
