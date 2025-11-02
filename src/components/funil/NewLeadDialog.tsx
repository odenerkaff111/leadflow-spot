import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface NewLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  etapas: any[];
}

export const NewLeadDialog = ({ open, onOpenChange, etapas }: NewLeadDialogProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    valor: "",
    origem: "Facebook Marketplace",
    etapa_id: etapas[0]?.id || "",
  });

  const createLead = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("leads").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead criado com sucesso!");
      onOpenChange(false);
      setFormData({
        nome: "",
        email: "",
        telefone: "",
        valor: "",
        origem: "Facebook Marketplace",
        etapa_id: etapas[0]?.id || "",
      });
    },
    onError: () => {
      toast.error("Erro ao criar lead");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome) {
      toast.error("Nome é obrigatório");
      return;
    }
    
    // Converter valor vazio para null ou 0
    const dataToSubmit = {
      ...formData,
      valor: formData.valor === "" ? 0 : Number(formData.valor),
    };
    
    createLead.mutate(dataToSubmit);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Nome completo"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
            />
          </div>

          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <Label htmlFor="valor">Valor do Negócio (R$)</Label>
            <Input
              id="valor"
              type="number"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="origem">Origem dos Leads</Label>
            <Select
              value={formData.origem}
              onValueChange={(value) => setFormData({ ...formData, origem: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Facebook Marketplace">Facebook Marketplace</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="Shopee">Shopee</SelectItem>
                <SelectItem value="Mercado Livre">Mercado Livre</SelectItem>
                <SelectItem value="Tiktok Shop">Tiktok Shop</SelectItem>
                <SelectItem value="Site">Site</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="etapa">Etapa Inicial</Label>
            <Select
              value={formData.etapa_id}
              onValueChange={(value) => setFormData({ ...formData, etapa_id: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {etapas.map((etapa) => (
                  <SelectItem key={etapa.id} value={etapa.id}>
                    {etapa.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Criar Lead</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
