import { useDroppable } from "@dnd-kit/core";
import { LeadCard } from "./LeadCard";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StageColumnProps {
  stage: any;
  leads: any[];
  totalValue: number;
  onLeadClick: (leadId: string) => void;
}

export const StageColumn = ({ stage, leads, totalValue, onLeadClick }: StageColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  return (
    <div className="flex-shrink-0 w-80">
      <Card
        ref={setNodeRef}
        className={cn(
          "h-full min-h-[600px] p-4 transition-all",
          isOver && "ring-2 ring-primary shadow-elevated"
        )}
      >
        {/* Header */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: stage.cor }}
            />
            <h3 className="font-semibold text-foreground">{stage.nome}</h3>
            <span className="ml-auto text-sm text-muted-foreground">{leads.length}</span>
          </div>
          <div className="text-xl font-bold text-primary">
            R$ {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Leads */}
        <div className="space-y-3">
          {leads.map((lead) => (
            <div key={lead.id} onClick={() => onLeadClick(lead.id)}>
              <LeadCard lead={lead} />
            </div>
          ))}
          {leads.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              Nenhum lead nesta etapa
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};
