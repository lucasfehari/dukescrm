import { useState, useEffect, useCallback } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    BarChart2, Download, RefreshCw, Loader2, Users,
    FileText, CheckCircle2, TrendingUp, AlertCircle, Eye
} from "lucide-react";
import { toast } from "sonner";
import { relatoriosApi, clientesApi, type RelatorioMensalCliente, type Cliente, type RelatorioClienteItem } from "../../servicos/api";
import { RelatorioClienteModal } from "./RelatorioClienteModal";

// @Agent: UI/UX Designer (AUID) + Empresário — Relatórios Mensais por Cliente

const moeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function mesHoje() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function mesLabel(mes: string) {
    const [ano, m] = mes.split("-");
    const nomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${nomes[parseInt(m) - 1]}/${ano}`;
}

const CustomTooltio = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
        return (
            <div className="bg-zinc-900 border border-white/10 rounded-lg p-3 shadow-xl text-xs">
                <p className="text-zinc-400 font-medium mb-1">{label}</p>
                {payload.map((p: any) => (
                    <p key={p.name} style={{ color: p.fill }}>{p.name}: {moeda(p.value)}</p>
                ))}
            </div>
        );
    }
    return null;
};

export function RelatoriosPage() {
    const [mes, setMes] = useState(mesHoje());
    const [clienteId, setClienteId] = useState("");
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [dados, setDados] = useState<RelatorioMensalCliente | null>(null);
    const [carregando, setCarregando] = useState(false);
    const [exportando, setExportando] = useState(false);
    const [modalAberto, setModalAberto] = useState(false);
    const [clienteSnapshot, setClienteSnapshot] = useState<RelatorioClienteItem | null>(null);

    // Carregar lista de clientes para o filtro
    useEffect(() => {
        clientesApi.listar().then(setClientes).catch(() => { });
    }, []);

    const buscar = useCallback(async () => {
        setCarregando(true);
        try {
            const res = await relatoriosApi.mensalPorCliente(mes, clienteId || undefined);
            setDados(res);
        } catch (e: any) {
            toast.error("Erro ao gerar relatório", { description: e.message });
        } finally {
            setCarregando(false);
        }
    }, [mes, clienteId]);

    // Carrega automaticamente no mount
    useEffect(() => { buscar(); }, [buscar]);

    async function exportarCsv() {
        setExportando(true);
        try {
            await relatoriosApi.downloadCsv(mes, clienteId || undefined);
            toast.success("Relatório exportado!", { description: `relatorio-${mes}.csv` });
        } catch (e: any) {
            toast.error("Erro ao exportar", { description: e.message });
        } finally {
            setExportando(false);
        }
    }

    // Dados para o gráfico de barras
    const chartData = dados?.clientes
        .filter(c => c.receita > 0 || c.pendente > 0)
        .sort((a, b) => b.receita - a.receita)
        .slice(0, 8)
        .map(c => ({
            nome: c.cliente.split(" ")[0], // Primeiro nome
            Receita: c.receita,
            Pendente: c.pendente,
        })) ?? [];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                    <BarChart2 className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-100">Relatórios</h1>
                    <p className="text-sm text-zinc-500">Análise mensal consolidada por cliente.</p>
                </div>
            </div>

            {/* Filtros */}
            <Card className="bg-zinc-900 border-white/10">
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-zinc-500 uppercase tracking-wide font-semibold">Mês</label>
                            <Input
                                type="month"
                                value={mes}
                                onChange={e => setMes(e.target.value)}
                                className="border-white/10 bg-zinc-800 w-40 text-sm"
                            />
                        </div>
                        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                            <label className="text-[10px] text-zinc-500 uppercase tracking-wide font-semibold">Filtrar por Cliente</label>
                            <select
                                value={clienteId}
                                onChange={e => setClienteId(e.target.value)}
                                className="rounded-md border border-white/10 bg-zinc-800 text-sm text-zinc-300 px-3 py-2 h-9 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="">Todos os clientes</option>
                                {clientes.map(c => (
                                    <option key={c.id} value={c.id}>{c.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-2 mt-5">
                            <Button
                                onClick={buscar}
                                disabled={carregando}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
                            >
                                {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                Gerar
                            </Button>
                            <Button
                                onClick={exportarCsv}
                                disabled={exportando || !dados}
                                variant="outline"
                                className="border-white/10 text-zinc-400 hover:text-zinc-100 gap-2"
                            >
                                {exportando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                CSV
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* KPI Sumário */}
            {dados && !carregando && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-zinc-900 border-white/10">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-violet-500/10"><Users className="w-5 h-5 text-violet-400" /></div>
                            <div>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Clientes</p>
                                <p className="text-2xl font-bold text-violet-400">{dados.totalClientes}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-zinc-900 border-white/10">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10"><TrendingUp className="w-5 h-5 text-emerald-400" /></div>
                            <div>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Receita Total</p>
                                <p className="text-lg font-bold text-emerald-400">{moeda(dados.totalReceita)}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-zinc-900 border-white/10">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/10"><AlertCircle className="w-5 h-5 text-amber-400" /></div>
                            <div>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Pendente</p>
                                <p className="text-lg font-bold text-amber-400">{moeda(dados.totalPendente)}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-zinc-900 border-white/10">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-500/10"><FileText className="w-5 h-5 text-indigo-400" /></div>
                            <div>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Período</p>
                                <p className="text-lg font-bold text-indigo-400">{mesLabel(dados.mesReferencia)}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Gráfico de Barras por Cliente */}
            {chartData.length > 0 && !carregando && (
                <Card className="bg-zinc-900 border-white/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base text-zinc-100">Receita vs Pendente por Cliente</CardTitle>
                        <CardDescription>Top 8 clientes do período</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                <XAxis dataKey="nome" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v / 1000}k`} />
                                <Tooltip content={<CustomTooltio />} />
                                <Legend wrapperStyle={{ fontSize: "11px", color: "#71717a" }} />
                                <Bar dataKey="Receita" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Pendente" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Tabela Detalhada */}
            <Card className="bg-zinc-900 border-white/10">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-violet-400">Detalhamento por Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                    {carregando ? (
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-10 bg-zinc-800 rounded animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-md border border-white/10">
                            <Table>
                                <TableHeader className="bg-zinc-800/50">
                                    <TableRow className="border-white/10 hover:bg-transparent">
                                        <TableHead className="text-zinc-300 font-semibold">Cliente</TableHead>
                                        <TableHead className="text-zinc-300 font-semibold text-center">Contratos</TableHead>
                                        <TableHead className="text-zinc-300 font-semibold text-center">Projetos</TableHead>
                                        <TableHead className="text-zinc-300 font-semibold text-center">Entregues</TableHead>
                                        <TableHead className="text-zinc-300 font-semibold text-right">Receita</TableHead>
                                        <TableHead className="text-zinc-300 font-semibold text-right">Pendente</TableHead>
                                        <TableHead className="text-zinc-300 font-semibold text-right">Saldo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dados?.clientes.map(c => (
                                        <TableRow key={c.clienteId} className="border-white/10 hover:bg-zinc-800/30">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-zinc-500 hover:text-violet-400"
                                                        onClick={() => {
                                                            setClienteSnapshot(c);
                                                            setModalAberto(true);
                                                        }}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <div>
                                                        <p className="font-medium text-zinc-100 text-sm">{c.cliente}</p>
                                                        {c.email && <p className="text-xs text-zinc-500">{c.email}</p>}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="inline-flex items-center gap-1 text-xs text-indigo-400">
                                                    <FileText className="w-3 h-3" />{c.contratosAtivos}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center text-zinc-400 text-sm">{c.projetosTotal}</TableCell>
                                            <TableCell className="text-center">
                                                <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                                                    <CheckCircle2 className="w-3 h-3" />{c.projetosEntregues}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-emerald-400 text-sm">{moeda(c.receita)}</TableCell>
                                            <TableCell className="text-right text-amber-400 text-sm">
                                                {c.pendente > 0 ? moeda(c.pendente) : <span className="text-zinc-600">—</span>}
                                            </TableCell>
                                            <TableCell className={`text-right font-semibold text-sm ${c.saldo >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                                {moeda(c.saldo)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!dados || dados.clientes.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-zinc-600">
                                                Nenhum dado encontrado para este período.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal de Relatório Premium */}
            {clienteSnapshot && (
                <RelatorioClienteModal
                    aberto={modalAberto}
                    onClose={() => setModalAberto(false)}
                    cliente={clienteSnapshot}
                    mesReferencia={mes}
                />
            )}
        </div>
    );
}
