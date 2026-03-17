import { useState, useEffect, useCallback } from "react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import {
    Users, FileText, Kanban, TrendingUp, TrendingDown,
    Clock, AlertTriangle,
    CircleDollarSign, Target, Activity, RefreshCw,
    AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { dashboardApi, type DashboardResumo } from "../../servicos/api";


// @Agent: UI/UX Designer (AUID) + Empresário — Dashboard Executivo com dados REAIS da API

const moeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

const CustomAreaTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
        return (
            <div className="bg-zinc-900 border border-white/10 rounded-xl p-3 shadow-2xl min-w-[160px]">
                <p className="text-xs text-zinc-400 mb-2 font-medium">{label}</p>
                {payload.map((p: any) => (
                    <p key={p.name} className="text-xs" style={{ color: p.stroke ?? p.fill }}>
                        {p.name === "receita" ? "Receita: " : "Despesas: "}{moeda(p.value)}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

function SkeletonCard() {
    return (
        <Card className="bg-zinc-900 border-white/10">
            <CardContent className="p-5">
                <div className="h-3 w-24 bg-zinc-800 rounded animate-pulse mb-4" />
                <div className="h-8 w-20 bg-zinc-800 rounded animate-pulse" />
            </CardContent>
        </Card>
    );
}

export function DashboardPrincipal() {
    const [dados, setDados] = useState<DashboardResumo | null>(null);
    const [carregando, setCarregando] = useState(true);

    const carregar = useCallback(async () => {
        setCarregando(true);
        try {
            const res = await dashboardApi.resumo();
            setDados(res);
        } catch (e: any) {
            toast.error("Erro ao carregar dashboard", { description: e.message });
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => { carregar(); }, [carregar]);

    const temAlerta = dados && dados.contratosVencendo.length > 0;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div />
                <Button variant="ghost" size="sm" onClick={carregar} disabled={carregando} className="text-zinc-500 hover:text-zinc-100 gap-1.5">
                    <RefreshCw className={`w-3.5 h-3.5 ${carregando ? "animate-spin" : ""}`} />
                    Atualizar
                </Button>
            </div>

            {/* ── KPI Grid ── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {carregando ? (
                    Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                ) : dados ? (
                    <>
                        {/* Receita do Mês */}
                        <Card className="bg-zinc-900 border bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20 relative overflow-hidden">
                            <div className="absolute -top-6 -right-6 w-24 h-24 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Receita do Mês</p>
                                    <div className="p-2 rounded-lg bg-emerald-500/10"><TrendingUp className="w-4 h-4 text-emerald-400" /></div>
                                </div>
                                <p className="text-2xl font-bold text-emerald-400">{moeda(dados.financeiro.receita)}</p>
                                <p className="text-xs text-zinc-600 mt-1">Pendente: {moeda(dados.financeiro.pendente)}</p>
                            </CardContent>
                        </Card>

                        {/* Contratos Ativos */}
                        <Card className="bg-zinc-900 border bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20 relative overflow-hidden">
                            <div className="absolute -top-6 -right-6 w-24 h-24 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Contratos Ativos</p>
                                    <div className="p-2 rounded-lg bg-indigo-500/10"><FileText className="w-4 h-4 text-indigo-400" /></div>
                                </div>
                                <div className="flex items-end gap-2">
                                    <p className="text-2xl font-bold text-indigo-400">{dados.contratos.ativos}</p>
                                    {dados.contratos.vencidos > 0 && (
                                        <span className="text-xs text-red-400 mb-1 flex items-center gap-0.5">
                                            <TrendingDown className="w-3 h-3" />{dados.contratos.vencidos} vencido{dados.contratos.vencidos > 1 ? "s" : ""}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-zinc-600 mt-1">{dados.contratos.total} no total</p>
                            </CardContent>
                        </Card>

                        {/* Projetos */}
                        <Card className="bg-zinc-900 border bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20 relative overflow-hidden">
                            <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Em Andamento</p>
                                    <div className="p-2 rounded-lg bg-blue-500/10"><Kanban className="w-4 h-4 text-blue-400" /></div>
                                </div>
                                <div className="flex items-end gap-2">
                                    <p className="text-2xl font-bold text-blue-400">{dados.projetos.emAndamento}</p>
                                    {dados.projetos.impedidos > 0 && (
                                        <span className="text-xs text-amber-400 mb-1 flex items-center gap-0.5">
                                            <AlertTriangle className="w-3 h-3" />{dados.projetos.impedidos} impedido{dados.projetos.impedidos > 1 ? "s" : ""}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-zinc-600 mt-1">{dados.projetos.concluidos} concluídos</p>
                            </CardContent>
                        </Card>

                        {/* Clientes */}
                        <Card className="bg-zinc-900 border bg-gradient-to-br from-violet-500/10 to-transparent border-violet-500/20 relative overflow-hidden">
                            <div className="absolute -top-6 -right-6 w-24 h-24 bg-violet-500/15 rounded-full blur-2xl pointer-events-none" />
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Clientes na Base</p>
                                    <div className="p-2 rounded-lg bg-violet-500/10"><Users className="w-4 h-4 text-violet-400" /></div>
                                </div>
                                <p className="text-2xl font-bold text-violet-400">{dados.totalClientes}</p>
                                <p className="text-xs text-zinc-600 mt-1">Financeiro: {moeda(dados.financeiro.saldo)}</p>
                            </CardContent>
                        </Card>
                    </>
                ) : null}
            </div>

            {/* ── Alert de Contratos Vencendo ── */}
            {temAlerta && dados && (
                <Card className="bg-amber-500/5 border-amber-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-amber-300 mb-2">
                                    {dados.contratosVencendo.length} contrato{dados.contratosVencendo.length > 1 ? "s" : ""} vencendo em breve
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {dados.contratosVencendo.map(c => (
                                        <span key={c.id} className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">
                                            {c.cliente} — {c.titulo}
                                            {c.diasRestantes !== null && (
                                                <span className="ml-1 text-amber-500">({c.diasRestantes}d)</span>
                                            )}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── Gráfico + Distribuição ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <Card className="xl:col-span-2 bg-zinc-900 border-white/10">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-base font-semibold text-zinc-100">Receita vs Despesas</h3>
                                <p className="text-xs text-zinc-500">Últimos 6 meses — dados reais</p>
                            </div>
                            <CircleDollarSign className="w-4 h-4 text-emerald-400" />
                        </div>
                        {carregando ? (
                            <div className="h-[200px] bg-zinc-800/50 rounded-lg animate-pulse" />
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={dados?.receitaUltimos6Meses ?? []} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gReceita" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gDesp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                    <XAxis dataKey="mes" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v / 1000}k`} />
                                    <Tooltip content={<CustomAreaTooltip />} />
                                    <Area type="monotone" dataKey="despesas" stroke="#ef4444" strokeWidth={1.5} fill="url(#gDesp)" name="despesas" />
                                    <Area type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={2} fill="url(#gReceita)" name="receita" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Mini status de projetos */}
                <Card className="bg-zinc-900 border-white/10">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <Target className="w-4 h-4 text-indigo-400" />
                            <h3 className="text-base font-semibold text-zinc-100">Status Projetos</h3>
                        </div>
                        {carregando ? (
                            <div className="space-y-3">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="h-6 bg-zinc-800 rounded animate-pulse" />
                                ))}
                            </div>
                        ) : dados ? (
                            <div className="space-y-3">
                                {Object.entries(dados.projetos.porStatus).map(([status, count]) => (
                                    <div key={status} className="flex items-center justify-between">
                                        <span className="text-xs text-zinc-400">{status.replace("_", " ")}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-500 rounded-full transition-all"
                                                    style={{ width: `${Math.round((count / dados.projetos.total) * 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-semibold text-zinc-200 w-4 text-right">{count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </CardContent>
                </Card>
            </div>

            {/* ── Atividade Recente ── */}
            <Card className="bg-zinc-900 border-white/10">
                <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-base font-semibold text-zinc-100">Atividade Recente</h3>
                    </div>
                    {carregando ? (
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-10 bg-zinc-800 rounded animate-pulse" />
                            ))}
                        </div>
                    ) : dados && dados.atividadeRecente.length > 0 ? (
                        <div className="space-y-3">
                            {dados.atividadeRecente.map(a => (
                                <div key={a.id} className="flex items-start gap-3">
                                    <div className="mt-0.5 p-1.5 rounded-md bg-zinc-800 flex-shrink-0">
                                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-zinc-300">
                                            <span className="font-medium text-indigo-300">{a.usuario}</span>
                                            {" "}{a.acao} em {a.entidade}
                                        </p>
                                        <p className="text-[10px] text-zinc-600 mt-0.5">
                                            {new Date(a.criadoEm).toLocaleString("pt-BR")}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-zinc-600 text-center py-6">Nenhuma atividade registrada ainda.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
