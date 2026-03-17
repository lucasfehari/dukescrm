import { useState, useEffect, useCallback } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Wallet, Clock, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { financeiroApi, type Lancamento, type ResumoFinanceiro } from "../../servicos/api";

// @Agent: UI/UX Designer (AUID) + ASP — FinanceiroDashboard integrado com fetch real

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    PENDENTE: { label: "Pendente", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    PAGO: { label: "Pago", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    ATRASADO: { label: "Atrasado", color: "bg-red-500/10 text-red-400 border-red-500/20" },
    CANCELADO: { label: "Cancelado", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
};

const moeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface KpiCardProps {
    label: string; value: string; icon: React.ReactNode; trend?: string; color: string; loading?: boolean;
}

function KpiCard({ label, value, icon, trend, color, loading }: KpiCardProps) {
    const textColor = color.replace("bg-", "text-").replace("/10", "");
    return (
        <Card className="bg-zinc-900 border-white/10 overflow-hidden relative">
            <div className={`absolute top-0 right-0 w-24 h-24 ${color} rounded-full blur-[40px] opacity-30 pointer-events-none`} />
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">{label}</p>
                        {loading ? (
                            <div className="h-8 w-28 bg-zinc-800 rounded animate-pulse mt-1" />
                        ) : (
                            <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
                        )}
                        {trend && <p className="text-xs text-zinc-500 mt-1">{trend}</p>}
                    </div>
                    <div className={`p-2.5 rounded-lg ${color}`}>{icon}</div>
                </div>
            </CardContent>
        </Card>
    );
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-zinc-900 border border-white/10 rounded-lg p-3 shadow-xl">
                <p className="text-sm font-semibold text-zinc-300 mb-2">{label}</p>
                {payload.map((p: any) => (
                    <p key={p.name} className="text-xs" style={{ color: p.color }}>
                        {p.name === "receitas" ? "Receitas" : "Despesas"}: {moeda(p.value)}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// Agrupa lançamentos por mês para o gráfico
function agruparPorMes(lancamentos: Lancamento[]) {
    const grupos: Record<string, { mes: string; receitas: number; despesas: number }> = {};
    lancamentos.forEach(l => {
        const key = l.mesReferencia;
        if (!grupos[key]) {
            const [ano, mes] = key.split("-");
            const nomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
            grupos[key] = { mes: `${nomes[parseInt(mes) - 1]}/${ano.slice(2)}`, receitas: 0, despesas: 0 };
        }
        if (l.tipo === "RECEITA") grupos[key].receitas += l.valor;
        else grupos[key].despesas += l.valor;
    });
    return Object.values(grupos).slice(-6);
}

export function FinanceiroDashboard() {
    const [resumo, setResumo] = useState<ResumoFinanceiro | null>(null);
    const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
    const [carregando, setCarregando] = useState(true);

    const carregar = useCallback(async () => {
        setCarregando(true);
        try {
            const [resumoData, lancamentosData] = await Promise.all([
                financeiroApi.resumo(),
                financeiroApi.listar(),
            ]);
            setResumo(resumoData);
            setLancamentos(lancamentosData);
        } catch (e: any) {
            toast.error("Erro ao carregar financeiro", { description: e.message });
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => { carregar(); }, [carregar]);

    const dadosGrafico = agruparPorMes(lancamentos);
    const recentes = [...lancamentos].sort(
        (a, b) => new Date(b.dataVencimento).getTime() - new Date(a.dataVencimento).getTime()
    ).slice(0, 8);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">

            {/* Header com refresh */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-zinc-100">Financeiro</h2>
                    <p className="text-xs text-zinc-500">Visão consolidada de receitas, despesas e saldo</p>
                </div>
                <Button variant="ghost" size="sm" onClick={carregar} disabled={carregando}
                    className="text-zinc-500 hover:text-zinc-100">
                    <RefreshCw className={`w-4 h-4 ${carregando ? "animate-spin" : ""}`} />
                </Button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <KpiCard
                    label="Receitas (Pagas)" loading={carregando}
                    value={resumo ? moeda(resumo.totalReceitas) : "—"}
                    icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
                    color="bg-emerald-500/10" trend="Lançamentos com status PAGO"
                />
                <KpiCard
                    label="Despesas (Pagas)" loading={carregando}
                    value={resumo ? moeda(resumo.totalDespesas) : "—"}
                    icon={<TrendingDown className="w-4 h-4 text-red-400" />}
                    color="bg-red-500/10"
                />
                <KpiCard
                    label="Saldo Líquido" loading={carregando}
                    value={resumo ? moeda(resumo.saldoLiquido) : "—"}
                    icon={<Wallet className="w-4 h-4 text-indigo-400" />}
                    color="bg-indigo-500/10" trend="Receitas − Despesas"
                />
                <KpiCard
                    label="A Receber" loading={carregando}
                    value={resumo ? moeda(resumo.pendentes) : "—"}
                    icon={<Clock className="w-4 h-4 text-amber-400" />}
                    color="bg-amber-500/10"
                    trend={resumo ? `${resumo.totalLancamentos} lançamentos` : undefined}
                />
            </div>

            {/* Gráfico de Barras */}
            <Card className="bg-zinc-900 border-white/10">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-base font-semibold text-zinc-100">Fluxo de Caixa</h3>
                            <p className="text-xs text-zinc-500">Receitas vs Despesas — Últimos 6 meses</p>
                        </div>
                    </div>
                    {carregando ? (
                        <div className="flex items-center justify-center h-[220px] gap-3">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                            <span className="text-zinc-500 text-sm">Carregando dados...</span>
                        </div>
                    ) : dadosGrafico.length === 0 ? (
                        <div className="flex items-center justify-center h-[220px]">
                            <p className="text-zinc-500 text-sm">Nenhum lançamento encontrado. Cadastre lançamentos financeiros!</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={dadosGrafico} barGap={4} barCategoryGap="30%">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="mes" tick={{ fill: "#71717a", fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis
                                    tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false}
                                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                                <Legend formatter={(v) => <span className="text-xs text-zinc-400">{v === "receitas" ? "Receitas" : "Despesas"}</span>} />
                                <Bar dataKey="receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* Tabela de Lançamentos Recentes */}
            <Card className="bg-zinc-900 border-white/10">
                <CardContent className="p-6">
                    <h3 className="text-base font-semibold text-zinc-100 mb-4">
                        Lançamentos Recentes
                        {!carregando && <span className="text-xs text-zinc-500 font-normal ml-2">({lancamentos.length} total)</span>}
                    </h3>
                    {carregando ? (
                        <div className="flex items-center justify-center py-8 gap-3">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                            <span className="text-zinc-500 text-sm">Carregando lançamentos...</span>
                        </div>
                    ) : (
                        <div className="rounded-md border border-white/10">
                            <Table>
                                <TableHeader className="bg-zinc-800/50">
                                    <TableRow className="border-white/10 hover:bg-transparent">
                                        <TableHead className="text-zinc-300 font-semibold">Descrição</TableHead>
                                        <TableHead className="text-zinc-300 font-semibold text-center">Tipo</TableHead>
                                        <TableHead className="text-zinc-300 font-semibold text-right">Valor</TableHead>
                                        <TableHead className="text-zinc-300 font-semibold text-center">Status</TableHead>
                                        <TableHead className="text-zinc-300 font-semibold text-center">Vencimento</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentes.map((l) => (
                                        <TableRow key={l.id} className="border-white/10 hover:bg-zinc-800/40 transition-colors">
                                            <TableCell className="text-zinc-200 text-sm">{l.descricao}</TableCell>
                                            <TableCell className="text-center">
                                                <span className={`text-xs font-medium ${l.tipo === "RECEITA" ? "text-emerald-400" : "text-red-400"}`}>
                                                    {l.tipo === "RECEITA" ? "↑ Receita" : "↓ Despesa"}
                                                </span>
                                            </TableCell>
                                            <TableCell className={`text-right font-semibold ${l.tipo === "RECEITA" ? "text-emerald-400" : "text-red-400"}`}>
                                                {l.tipo === "DESPESA" ? "− " : "+ "}{moeda(l.valor)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className={`${(STATUS_MAP[l.status] ?? STATUS_MAP.PENDENTE).color} border text-xs`}>
                                                    {(STATUS_MAP[l.status] ?? STATUS_MAP.PENDENTE).label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-zinc-500 text-center text-sm">
                                                {new Date(l.dataVencimento).toLocaleDateString("pt-BR")}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {recentes.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-20 text-center text-zinc-500">
                                                Nenhum lançamento cadastrado ainda.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>
    );
}
