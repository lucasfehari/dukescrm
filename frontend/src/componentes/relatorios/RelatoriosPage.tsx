import { useState, useEffect, useCallback, useMemo } from "react";
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip
} from "recharts";
import { Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { relatoriosApi, type RelatorioMensalCliente, type RelatorioClienteItem } from "../../servicos/api";
import { RelatorioClienteModal } from "./RelatorioClienteModal";

const moeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function mesHoje() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const COLORS = ['#ec5b13', '#f97316', '#fb923c', '#fdba74', '#fed7aa'];

const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-dark-950/90 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl">
                <p className="text-xs font-bold text-white mb-1">{payload[0].name}</p>
                <p className="text-sm font-black" style={{ color: payload[0].payload.fill }}>
                    {moeda(payload[0].value)}
                </p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Margem de Receita</p>
            </div>
        );
    }
    return null;
};

export function RelatoriosPage() {
    const [mes, setMes] = useState(mesHoje());
    const [dados, setDados] = useState<RelatorioMensalCliente | null>(null);
    const [carregando, setCarregando] = useState(false);
    const [exportando, setExportando] = useState(false);
    const [modalAberto, setModalAberto] = useState(false);
    const [clienteSnapshot, setClienteSnapshot] = useState<RelatorioClienteItem | null>(null);

    const buscar = useCallback(async () => {
        setCarregando(true);
        try {
            const res = await relatoriosApi.mensalPorCliente(mes);
            setDados(res);
        } catch (e: any) {
            toast.error("Erro ao gerar relatório", { description: e.message });
        } finally {
            setCarregando(false);
        }
    }, [mes]);

    useEffect(() => { buscar(); }, [buscar]);

    async function exportarCsv() {
        setExportando(true);
        try {
            await relatoriosApi.downloadCsv(mes);
            toast.success("Relatório exportado!", { description: `relatorio-${mes}.csv` });
        } catch (e: any) {
            toast.error("Erro ao exportar", { description: e.message });
        } finally {
            setExportando(false);
        }
    }

    // Prepare Top 4 Revenue distinct items for the PIE Chart
    const pieData = useMemo(() => {
        if (!dados) return [];
        const top = [...dados.clientes]
            .filter(c => c.receita > 0)
            .sort((a, b) => b.receita - a.receita)
            .slice(0, 4)
            .map((c, i) => ({
                name: c.cliente.split(' ')[0], // First Name
                value: c.receita,
                fill: COLORS[i % COLORS.length]
            }));
            
        // Se houver mais, agrupar o restante em 'Outros' (Opcional, mas para manter o design focado, deixamos apenas os top)
        return top;
        
    }, [dados]);
    
    // Calculates total to show in the center of the Donut
    const pieTotal = useMemo(() => pieData.reduce((acc, curr) => acc + curr.value, 0), [pieData]);

    return (
        <div className="flex-1 flex flex-col h-[calc(100vh-2rem)] sm:h-[calc(100vh-4rem)] -mx-4 sm:-mx-8 -mt-6 sm:-mt-8 -mb-4 sm:-mb-8 z-10 w-[calc(100%+2rem)] sm:w-[calc(100%+4rem)] overflow-hidden relative bg-dark-950">
            {/* Header Sticky */}
            <header className="sticky top-0 z-20 flex flex-col sm:flex-row items-start sm:items-center justify-between px-8 py-6 border-b border-white/5 bg-dark-950/80 backdrop-blur-xl gap-4 shrink-0">
                <div className="flex items-center gap-4">
                    <h2 className="text-white text-xl font-black tracking-tight">Relatórios e Análises</h2>
                    <span className="px-3 py-1 rounded-full bg-brand/10 text-brand text-[10px] font-black uppercase tracking-widest">{mes}</span>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="relative group flex-1 sm:w-64 hidden md:block">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg group-focus-within:text-brand transition-colors">search</span>
                        <input className="w-full bg-dark-900 border border-white/5 rounded-xl text-sm focus:ring-1 focus:ring-brand pl-10 pr-4 py-2.5 outline-none text-white placeholder:text-slate-500 shadow-inner transition-all" placeholder="Buscar métrica..." type="text"/>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={exportarCsv} disabled={exportando || !dados} className="flex items-center gap-2 px-5 py-2.5 bg-brand hover:bg-brand-light text-[#12050e] rounded-xl text-sm font-black transition-all shadow-[0_0_15px_rgba(131,17,212,0.3)] hover:shadow-[0_0_20px_rgba(131,17,212,0.5)]">
                            {exportando ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="material-symbols-outlined text-[18px]">download</span>}
                            Exportar
                        </button>
                        <button className="p-2.5 bg-white/5 border border-white/5 text-slate-300 rounded-xl hover:bg-white/10 transition-colors hidden sm:block">
                            <Share2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Scrollable Dashboard Content */}
            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 custom-scrollbar">
                
                {/* Export Options & Filters (Local Data Filter) */}
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div className="flex gap-2 p-1 rounded-xl bg-dark-900 border border-white/5">
                        <input 
                           type="month" 
                           value={mes} 
                           onChange={e => setMes(e.target.value)}
                           className="bg-transparent text-white px-3 py-1.5 text-sm font-bold border-none outline-none cursor-pointer focus:ring-0 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-1.5 px-4 py-2 bg-white/5 text-slate-300 border border-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
                            <span className="material-symbols-outlined text-sm text-rose-400">picture_as_pdf</span> PDF
                        </button>
                        <button onClick={exportarCsv} disabled={exportando || !dados} className="flex items-center gap-1.5 px-4 py-2 bg-white/5 text-slate-300 border border-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
                            <span className="material-symbols-outlined text-sm text-emerald-400">csv</span> CSV
                        </button>
                    </div>
                </div>

                {/* KPI Cards (Mapping Real API Data to Visual Mock) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-2xl border border-white/5 bg-dark-900/50 hover:bg-white/5 transition-all group glass relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-full blur-[40px] pointer-events-none transition-all duration-500" />
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <span className="material-symbols-outlined text-brand p-2 bg-brand/10 border border-brand/20 rounded-xl">trending_up</span>
                            <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-0.5 border border-emerald-500/20 px-2 py-0.5 rounded bg-emerald-500/5">
                                Real
                            </span>
                        </div>
                        <p className="text-slate-500 text-[10px] uppercase tracking-widest font-black mb-1 relative z-10">Receita Total do Período</p>
                        {carregando ? (
                            <div className="h-8 w-1/2 bg-white/5 animate-pulse rounded my-1" />
                        ) : (
                            <h3 className="text-3xl font-black text-white relative z-10">{moeda(dados?.totalReceita || 0)}</h3>
                        )}
                        <p className="text-[10px] text-slate-500 font-bold mt-2 relative z-10">Mês referência: {mes}</p>
                    </div>

                    <div className="p-6 rounded-2xl border border-white/5 bg-dark-900/50 hover:bg-white/5 transition-all group glass relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] pointer-events-none transition-all duration-500" />
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <span className="material-symbols-outlined text-amber-500 p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">timer</span>
                            <span className="text-rose-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-0.5 border border-rose-500/20 px-2 py-0.5 rounded bg-rose-500/5">
                                Pendente
                            </span>
                        </div>
                        <p className="text-slate-500 text-[10px] uppercase tracking-widest font-black mb-1 relative z-10">Faturas Pendentes</p>
                        {carregando ? (
                            <div className="h-8 w-1/2 bg-white/5 animate-pulse rounded my-1" />
                        ) : (
                            <h3 className="text-3xl font-black text-amber-500 relative z-10">{moeda(dados?.totalPendente || 0)}</h3>
                        )}
                        <div className="w-full bg-dark-950 border border-white/5 h-1.5 rounded-full mt-4 overflow-hidden relative z-10">
                            <div className="bg-amber-500 h-full rounded-full" style={{width: `${dados?.totalPendente ? (dados.totalReceita / (dados.totalReceita + dados.totalPendente) * 100) : 100}%`}}></div>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl border border-white/5 bg-dark-900/50 hover:bg-white/5 transition-all group glass relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none transition-all duration-500" />
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <span className="material-symbols-outlined text-emerald-400 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">group</span>
                            <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-0.5 border border-emerald-500/20 px-2 py-0.5 rounded bg-emerald-500/5">
                                Base
                            </span>
                        </div>
                        <p className="text-slate-500 text-[10px] uppercase tracking-widest font-black mb-1 relative z-10">Clientes Ativos</p>
                        {carregando ? (
                            <div className="h-8 w-1/4 bg-white/5 animate-pulse rounded my-1" />
                        ) : (
                            <h3 className="text-3xl font-black text-white relative z-10">{dados?.totalClientes || 0}</h3>
                        )}
                        <div className="flex gap-1 mt-4 relative z-10">
                            {[1,2,3,4,5].map(star => (
                                <span key={star} className="material-symbols-outlined text-emerald-400 text-sm" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Distribuição de Serviços (Pie Chart) */}
                    <div className="p-6 rounded-2xl border border-white/5 bg-dark-900/50 glass hover:bg-white/5 transition-colors">
                        <h4 className="text-lg font-bold mb-6 text-white tracking-tight">Distribuição da Receita</h4>
                        
                        {carregando ? (
                            <div className="flex flex-col items-center justify-center h-48">
                                <Loader2 className="w-8 h-8 animate-spin text-brand" />
                            </div>
                        ) : pieData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 border border-dashed border-white/10 rounded-xl">
                                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Nenhum dado financeiro no mês</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-around flex-wrap gap-8">
                                <div className="relative w-48 h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <RechartsTooltip content={<CustomPieTooltip />} />
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={65} // Makes it a donut
                                                outerRadius={85}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} style={{filter: `drop-shadow(0px 0px 8px ${entry.fill}80)`}} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-lg font-black text-white">{moeda(pieTotal).split(',')[0]}</span>
                                        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Total Top 4</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {pieData.map((entry, index) => {
                                        const perc = ((entry.value / pieTotal) * 100).toFixed(0);
                                        return (
                                            <div key={index} className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full" style={{backgroundColor: entry.fill, boxShadow: `0 0 10px ${entry.fill}80`}}></div>
                                                <div className="flex-1 min-w-[120px] flex justify-between gap-4">
                                                    <span className="text-xs font-bold text-slate-400">{entry.name}</span>
                                                    <span className="text-xs font-black text-white">{perc}%</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Simulação: Carga de Trabalho -> Volume de Entregas por Cliente */}
                    <div className="p-6 rounded-2xl border border-white/5 bg-dark-900/50 glass hover:bg-white/5 transition-colors">
                        <h4 className="text-lg font-bold mb-6 text-white tracking-tight">Volume de Entregas</h4>
                        
                        {carregando ? (
                             <div className="flex flex-col items-center justify-center h-48">
                                <Loader2 className="w-8 h-8 animate-spin text-brand" />
                            </div>
                        ) : (!dados || dados.clientes.length === 0) ? (
                            <div className="flex flex-col items-center justify-center h-48 border border-dashed border-white/10 rounded-xl">
                                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Nenhum projeto no período</span>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {dados.clientes
                                    .filter(c => c.projetosTotal > 0)
                                    .sort((a,b) => b.projetosEntregues - a.projetosEntregues)
                                    .slice(0, 4)
                                    .map((c, i) => {
                                        const perc = c.projetosTotal > 0 ? (c.projetosEntregues / c.projetosTotal) * 100 : 0;
                                        return (
                                            <div key={i} className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-bold text-white text-xs">{c.cliente.split(' ')[0]} <span className="font-normal text-slate-500">({c.projetosEntregues}/{c.projetosTotal} entregues)</span></span>
                                                    <span className="text-brand font-black text-xs">{perc.toFixed(0)}% Ocupação</span>
                                                </div>
                                                <div className="w-full bg-dark-950 border border-white/5 h-2 rounded-full overflow-hidden">
                                                    <div className="bg-brand h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(131,17,212,0.8)]" style={{width: `${perc}%`}}></div>
                                                </div>
                                            </div>
                                        );
                                    })
                                }
                            </div>
                        )}
                    </div>
                </div>

                {/* Ranking de Lucratividade (Tabela Analítica) */}
                <div className="p-6 rounded-2xl border border-white/5 bg-dark-900/50 glass hover:bg-white/5 transition-colors">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-lg font-bold text-white tracking-tight">Análise Holística de Lucratividade</h4>
                        <button className="text-brand text-xs font-black uppercase tracking-widest hover:text-brand-light transition-colors">Ver todos</button>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/10 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                    <th className="pb-4 pt-2">Cliente / Operação</th>
                                    <th className="pb-4 pt-2">Receita Bruta</th>
                                    <th className="pb-4 pt-2 text-center">Entrega</th>
                                    <th className="pb-4 pt-2 text-center">Status</th>
                                    <th className="pb-4 pt-2 text-right">Saldo Líquido</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {carregando ? (
                                    <tr><td colSpan={5} className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-slate-500 mx-auto"/></td></tr>
                                ) : !dados || dados.clientes.length === 0 ? (
                                    <tr><td colSpan={5} className="py-12 text-center text-xs font-bold uppercase tracking-widest text-slate-500">Nenhum dado financeiro no mês</td></tr>
                                ) : (
                                    dados?.clientes.map((c) => {
                                        const avatarInitial = c.cliente.substring(0, 2).toUpperCase();
                                        const isLucrativo = c.saldo >= 0;
                                        
                                        // Mock percentage margin logic
                                        const isFullyDelivered = c.projetosEntregues === c.projetosTotal && c.projetosTotal > 0;
                                        
                                        return (
                                            <tr key={c.clienteId} className="group hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => {
                                                setClienteSnapshot(c);
                                                setModalAberto(true);
                                            }}>
                                                <td className="py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="size-10 rounded-xl bg-dark-950 border border-white/10 flex items-center justify-center text-white font-black text-[10px]">
                                                            {avatarInitial}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-white group-hover:text-brand transition-colors">{c.cliente}</p>
                                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{c.contratosAtivos} Contrato(s) Vinculado(s)</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-5 text-sm font-black text-white">{moeda(c.receita)}</td>
                                                <td className="py-5 text-center">
                                                    <span className={`px-2 py-1 ${isFullyDelivered ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-brand/10 text-brand border-brand/20"} text-[9px] font-black uppercase tracking-widest rounded border`}>
                                                        {isFullyDelivered ? '100%' : `${c.projetosEntregues}/${c.projetosTotal} proj `}
                                                    </span>
                                                </td>
                                                <td className="py-5 text-center">
                                                    <span className={`px-2 py-1 ${ c.pendente === 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-500"} text-[9px] font-black uppercase tracking-widest rounded border-transparent`}>
                                                        {c.pendente === 0 ? "Liquidado" : "Pendente"}
                                                    </span>
                                                </td>
                                                <td className={`py-5 text-right font-black text-sm ${isLucrativo ? "text-emerald-400" : "text-rose-500"}`}>
                                                    {moeda(c.saldo)}
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal de Relatório Premium Details Popup */}
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
