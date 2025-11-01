import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, DollarSign, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B"];

export default function Dashboard() {

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
      const { data, error } = await supabase
        .from("leads")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const leadsGerados = leads?.length || 0;
  const receitaFechada = leads?.filter((l) => {
    const etapaFechada = etapas?.find((e) => e.id === l.etapa_id && e.nome === "Negócio fechado");
    return etapaFechada;
  }).reduce((sum, l) => sum + Number(l.valor || 0), 0) || 0;

  const receitaNegociacao = leads?.filter((l) => {
    const etapaNegociacao = etapas?.find((e) => e.id === l.etapa_id && e.nome === "Em negociação");
    return etapaNegociacao;
  }).reduce((sum, l) => sum + Number(l.valor || 0), 0) || 0;

  const taxaConversao = leadsGerados > 0
    ? ((leads?.filter((l) => etapas?.find((e) => e.id === l.etapa_id && e.nome === "Negócio fechado")).length || 0) / leadsGerados * 100).toFixed(1)
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

  // Dados para gráfico de funil
  const funilData = etapas?.map((etapa) => ({
    name: etapa.nome,
    leads: leads?.filter((l) => l.etapa_id === etapa.id).length || 0,
    valor: leads?.filter((l) => l.etapa_id === etapa.id).reduce((sum, l) => sum + Number(l.valor || 0), 0) || 0,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Acompanhe suas métricas e performance</p>
        </div>
      </div>

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
              <BarChart data={funilData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="leads" fill="#8B5CF6" name="Leads" />
              </BarChart>
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
    </div>
  );
}
