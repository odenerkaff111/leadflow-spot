import { useDraggable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { Mail, Phone, DollarSign, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadCardProps {
  lead: any;
  isDragging?: boolean;
  onClick?: () => void;
}

export const LeadCard = ({ lead, isDragging = false, onClick }: LeadCardProps) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: lead.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={cn(
        "p-4 cursor-pointer hover:shadow-elevated transition-all",
        isDragging && "opacity-50 rotate-3 scale-105"
      )}
    >
      <div className="flex gap-2">
        {/* Drag Handle */}
        <div 
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing flex-shrink-0 flex items-start pt-1 hover:text-primary transition-colors"
        >
          <GripVertical className="h-5 w-5" />
        </div>
        {/* Content */}
        <div className="space-y-2 flex-1">
          <h4 className="font-semibold text-foreground">{lead.nome}</h4>
          
          {lead.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
          
          {lead.telefone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{lead.telefone}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-1 text-sm font-semibold text-success">
              <DollarSign className="h-4 w-4" />
              <span>R$ {Number(lead.valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
            {lead.origem && (
              <span className="text-xs px-2 py-1 rounded-full bg-accent text-accent-foreground">
                {lead.origem}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
