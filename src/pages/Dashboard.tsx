import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, DollarSign, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList } from "recharts";
import { useAuth } from "@/contexts/AuthContext";

const COLORS = ["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

export default function Dashboard() {
  const { company } = useAuth();

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

  const { data: leads } = useQuery({
    queryKey: ["leads", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("company_id", company.id);
      if (error) throw error;
      return data;
    },
    enabled: !!company?.id,
  });

  const leadsGerados = leads?.length || 0;
  const receitaFechada = leads?.filter((l) => {
    const etapaFechada = etapas?.find((e) => e.id === l.etapa_id && e.nome === "Negócio Fechado");
    return etapaFechada;
  }).reduce((sum, l) => sum + Number(l.valor || 0), 0) || 0;

  const receitaNegociacao = leads?.filter((l) => {
    const etapaNegociacao = etapas?.find((e) => e.id === l.etapa_id && e.nome === "Negociando");
    return etapaNegociacao;
  }).reduce((sum, l) => sum + Number(l.valor || 0), 0) || 0;

  const negociosPerdidos = leads?.filter((l) => {
    const etapaPerdida = etapas?.find((e) => e.id === l.etapa_id && e.nome === "Negócio Perdido");
    return etapaPerdida;
  }) || [];

  const receitaPerdida = negociosPerdidos.reduce((sum, l) => sum + Number(l.valor || 0), 0);

  const taxaConversao = leadsGerados > 0
    ? ((leads?.filter((l) => etapas?.find((e) => e.id === l.etapa_id && e.nome === "Negócio Fechado")).length || 0) / leadsGerados * 100).toFixed(1)
    : "0.0";

  // Dados para gráfico de origem
  const origemData = leads?.reduce((acc: any[], lead) => {
    const origem = lead.origem || "Não informado";
    const existing = acc.find((item) => item.name === origem);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: origem, value: 1 });
    }
    return acc;
  }, []) || [];

  // Dados para gráfico de funil (apenas etapas ativas, sem Negócio Perdido)
  const funilData = etapas
    ?.filter((etapa) => etapa.nome !== "Negócio Perdido")
    ?.map((etapa) => ({
      name: etapa.nome,
      value: leads?.filter((l) => l.etapa_id === etapa.id).length || 0,
      fill: etapa.cor,
    })) || [];

  return (
    <div className="space-y-6">

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Leads Gerados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{leadsGerados}</div>
            <p className="text-xs text-muted-foreground">no período selecionado</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{taxaConversao}%</div>
            <p className="text-xs text-muted-foreground">Novo → Fechado</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Gerada</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              R$ {receitaFechada.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">negócios fechados</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Em Negociação</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              R$ {receitaNegociacao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">valor potencial</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Funil de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <FunnelChart>
                <Tooltip />
                <Funnel dataKey="value" data={funilData}>
                  <LabelList 
                    position="inside" 
                    fill="#fff" 
                    stroke="none" 
                    content={({ x, y, width, height, value, name }: any) => {
                      const centerX = Number(x) + Number(width) / 2;
                      const centerY = Number(y) + Number(height) / 2;
                      return (
                        <g>
                          <text 
                            x={centerX} 
                            y={centerY - 8} 
                            fill="#fff" 
                            textAnchor="middle" 
                            dominantBaseline="middle"
                            fontSize="18"
                            fontWeight="bold"
                          >
                            {value}
                          </text>
                          <text 
                            x={centerX} 
                            y={centerY + 12} 
                            fill="#fff" 
                            textAnchor="middle" 
                            dominantBaseline="middle"
                            fontSize="12"
                          >
                            {name}
                          </text>
                        </g>
                      );
                    }}
                  />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Origem dos Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={origemData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {origemData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Negócios Perdidos */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Negócios Perdidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Quantidade</p>
              <div className="text-3xl font-bold text-destructive">{negociosPerdidos.length}</div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Valor Total Perdido</p>
              <div className="text-3xl font-bold text-destructive">
                R$ {receitaPerdida.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
