import { useState, useEffect, useCallback } from "react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { financeiroApi, type Lancamento, type ResumoFinanceiro } from "../../servicos/api";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    PENDENTE: { label: "Pendente", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    PAGO: { label: "Paga", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
    ATRASADO: { label: "Atrasada", color: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
    CANCELADO: { label: "Cancelada", color: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" },
};

const formatMoeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Group launches by month to build the chart curve
function agruparPorMes(lancamentos: Lancamento[]) {
    const grupos: Record<string, { mes: string; receitas: number; despesas: number; rawMes: string }> = {};
    lancamentos.forEach(l => {
        const key = l.mesReferencia;
        if (!grupos[key]) {
            const [, mes] = key.split("-");
            const nomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
            grupos[key] = { mes: nomes[parseInt(mes) - 1], rawMes: key, receitas: 0, despesas: 0 };
        }
        if (l.tipo === "RECEITA" && l.status === "PAGO") grupos[key].receitas += l.valor;
        if (l.tipo === "DESPESA" && l.status === "PAGO") grupos[key].despesas += l.valor;
    });
    
    // Sort array chronologically based on rawMes
    return Object.values(grupos).sort((a,b) => a.rawMes.localeCompare(b.rawMes)).slice(-6);
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-dark-950/90 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl">
                <p className="text-[11px] font-bold text-slate-400 mb-3 uppercase tracking-widest">{label}</p>
                {payload.map((p: any) => (
                    <div key={p.name} className="flex items-center justify-between gap-6 mt-1">
                        <span className="text-sm font-medium text-white flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{backgroundColor: p.color}}></div>
                            {p.name === "receitas" ? "Entradas" : "Saídas"}
                        </span>
                        <span className="text-sm font-bold" style={{ color: p.color }}>
                            {formatMoeda(p.value)}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

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
    ).slice(0, 10);

    return (
        <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header Redesign */}
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-6 border-b border-white/5 gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Gestão Financeira</h2>
                    <p className="text-slate-500 text-sm mt-1">Acompanhe sua receita e faturas pendentes.</p>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64 group">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg group-focus-within:text-brand transition-colors">search</span>
                        <input 
                            className="w-full pl-10 pr-4 py-2.5 glass border-white/5 rounded-xl text-sm focus:ring-brand focus:border-brand outline-none text-white placeholder:text-slate-600 transition-all shadow-inner" 
                            placeholder="Buscar fatura..." 
                            type="text"
                        />
                    </div>
                    <button onClick={carregar} className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl glass border border-white/5 text-slate-500 hover:text-white transition-all hover:bg-white/5" title="Atualizar">
                        <span className="material-symbols-outlined text-[20px]">{carregando ? "sync" : "refresh"}</span>
                    </button>
                    <div className="shrink-0 w-10 h-10 rounded-full bg-cover bg-center border-2 border-brand/50 ring-2 ring-black cursor-pointer hidden sm:block" style={{backgroundImage: "url('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150')"}}></div>
                </div>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Receita Bruta */}
                <div className="glass p-6 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-500" />
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <span className="text-slate-400 text-sm font-medium">Receita Bruta</span>
                        <span className="material-symbols-outlined text-emerald-400 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">trending_up</span>
                    </div>
                    <div className="flex flex-col relative z-10">
                        {carregando ? <div className="h-8 w-1/2 bg-white/5 rounded animate-pulse"></div> : (
                            <span className="text-2xl font-black text-white">{resumo ? formatMoeda(resumo.totalReceitas) : "—"}</span>
                        )}
                        <span className="text-emerald-400 text-xs font-bold mt-2 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">arrow_upward</span> +12.5% vs ano passado</span>
                    </div>
                </div>

                {/* Lucro Líquido */}
                <div className="glass p-6 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-brand/20 transition-all duration-500" />
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <span className="text-slate-400 text-sm font-medium">Lucro Líquido</span>
                        <span className="material-symbols-outlined text-brand bg-brand/10 p-2 rounded-xl border border-brand/20">account_balance_wallet</span>
                    </div>
                    <div className="flex flex-col relative z-10">
                        {carregando ? <div className="h-8 w-1/2 bg-white/5 rounded animate-pulse"></div> : (
                            <span className="text-2xl font-black text-white">{resumo ? formatMoeda(resumo.saldoLiquido) : "—"}</span>
                        )}
                        <span className="text-brand text-xs font-bold mt-2 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">balance</span> Visão Consolidada</span>
                    </div>
                </div>

                {/* A Receber */}
                <div className="glass p-6 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-amber-500/20 transition-all duration-500" />
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <span className="text-slate-400 text-sm font-medium">A Receber</span>
                        <span className="material-symbols-outlined text-amber-500 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">receipt_long</span>
                    </div>
                    <div className="flex flex-col relative z-10">
                        {carregando ? <div className="h-8 w-1/2 bg-white/5 rounded animate-pulse"></div> : (
                            <span className="text-2xl font-black text-white">{resumo ? formatMoeda(resumo.pendentes) : "—"}</span>
                        )}
                        <span className="text-slate-400 text-xs font-bold mt-2 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">pending_actions</span> Previsto p/ recebimento</span>
                    </div>
                </div>

                {/* Despesas */}
                <div className="glass p-6 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-rose-500/20 transition-all duration-500" />
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <span className="text-slate-400 text-sm font-medium">Despesas Fixas</span>
                        <span className="material-symbols-outlined text-rose-500 bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">credit_card</span>
                    </div>
                    <div className="flex flex-col relative z-10">
                        {carregando ? <div className="h-8 w-1/2 bg-white/5 rounded animate-pulse"></div> : (
                            <span className="text-2xl font-black text-white">{resumo ? formatMoeda(resumo.totalDespesas) : "—"}</span>
                        )}
                        <span className="text-rose-400 text-xs font-bold mt-2 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">arrow_downward</span> Custo Operacional</span>
                    </div>
                </div>
            </div>

            {/* Cash Flow and Actions Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Cash Flow Chart */}
                <div className="lg:col-span-2 glass p-6 rounded-2xl border border-white/5 shadow-2xl flex flex-col h-[400px]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-white">Fluxo de Caixa Mensal</h3>
                            <p className="text-xs text-slate-500 mt-1">Comparativo de retenção e evasão financeira.</p>
                        </div>
                        <div className="flex items-center gap-4 bg-dark-950/50 px-4 py-2 rounded-full border border-white/5">
                            <span className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><div className="w-2.5 h-2.5 rounded-full bg-brand shadow-[0_0_10px_rgba(131,17,212,0.6)]"></div> Entradas</span>
                            <span className="w-px h-3 bg-white/10"></span>
                            <span className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]"></div> Saídas</span>
                        </div>
                    </div>
                    
                    <div className="flex-1 min-h-0 w-full relative">
                        {carregando ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                                <Loader2 className="w-8 h-8 animate-spin text-brand" />
                                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest animate-pulse">Compilando Gráficos...</span>
                            </div>
                        ) : dadosGrafico.length === 0 ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest border border-dashed border-white/10 px-8 py-4 rounded-xl">Sem histórico financeiro.</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dadosGrafico} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8311d4" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#8311d4" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                    <XAxis 
                                        dataKey="mes" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }} 
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }}
                                        tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                                        dx={-10}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)', strokeWidth: 1 }} />
                                    <Area type="monotone" dataKey="receitas" stroke="#8311d4" strokeWidth={3} fillOpacity={1} fill="url(#colorReceitas)" activeDot={{ r: 6, strokeWidth: 0, fill: '#8311d4', style: {filter: 'drop-shadow(0px 0px 8px rgba(131,17,212,0.8))'} }} />
                                    <Area type="monotone" dataKey="despesas" stroke="#f43f5e" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorDespesas)" activeDot={{ r: 4, strokeWidth: 0, fill: '#f43f5e' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Quick Actions & Filters */}
                <div className="glass p-6 rounded-2xl border border-white/5 shadow-2xl flex flex-col space-y-8 h-[400px]">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-6">Ações Rápidas</h3>
                        <button className="w-full flex items-center justify-center gap-3 bg-brand hover:bg-brand-light text-[#12050e] py-3.5 rounded-xl font-black shadow-[0_0_20px_rgba(131,17,212,0.2)] hover:shadow-[0_0_30px_rgba(131,17,212,0.4)] transition-all">
                            <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: "'FILL' 1"}}>add_card</span>
                            Emitir Nova Fatura
                        </button>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex-1 flex flex-col">
                        <p className="text-sm font-bold mb-5 text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-400 text-[18px]">tune</span>
                            Filtros Avançados
                        </p>
                        
                        <div className="space-y-5">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2 tracking-wider ml-1">Cliente Vinculado</label>
                                <select className="w-full bg-dark-900/50 border border-white/5 rounded-xl text-sm focus:ring-1 focus:ring-brand py-2.5 px-4 appearance-none text-white outline-none cursor-pointer shadow-inner">
                                    <option>Todos os clientes</option>
                                    <option>Tech Nova Labs</option>
                                    <option>Studio Pixel</option>
                                    <option>Logos Corp</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2 tracking-wider ml-1">Status Pagamento</label>
                                <div className="flex flex-wrap gap-2">
                                    <button className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">Paga</button>
                                    <button className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 transition-colors">Pendente</button>
                                    <button className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 transition-colors">Atrasada</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Invoices Table */}
            <div className="glass rounded-2xl border border-white/5 shadow-2xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-dark-950/30">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            Faturas Recentes
                            {carregando && <Loader2 className="w-4 h-4 animate-spin text-brand inline ml-2" />}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">Histórico completo de transações e recibos.</p>
                    </div>
                    <button className="text-brand text-xs font-bold uppercase tracking-widest hover:text-brand-light flex items-center gap-1 group transition-colors px-4 py-2 rounded-xl bg-brand/5 border border-brand/10 hover:bg-brand/10">
                        Ver Relatório Completo <span className="material-symbols-outlined text-[14px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-dark-900/40">
                                <th className="px-8 py-5">Fatura</th>
                                <th className="px-8 py-5">Cliente / Descrição</th>
                                <th className="px-8 py-5">Data Emissão</th>
                                <th className="px-8 py-5 text-right">Valor Líquido</th>
                                <th className="px-8 py-5 text-center">Status</th>
                                <th className="px-8 py-5 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 bg-dark-950/20">
                            {carregando ? (
                                <tr>
                                    <td colSpan={6} className="h-[200px]">
                                        <div className="flex flex-col items-center justify-center opacity-50">
                                            <Loader2 className="w-6 h-6 animate-spin text-slate-500 mb-2" />
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lendo registros...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : recentes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="h-[200px]">
                                        <div className="flex flex-col items-center justify-center opacity-50">
                                            <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">receipt_long</span>
                                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Nenhuma fatura encontrada</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                recentes.map((l) => {
                                    const metaStatus = STATUS_MAP[l.status] || STATUS_MAP.PENDENTE;
                                    // Generate a pseudo-ID specifically for the UI as Faturas usually have INV tags
                                    const mockInvId = `#INV-2026-${String(l.id).padStart(3, '0').slice(-3)}`;
                                    
                                    // Extract initials from client name/description to generate the Avatar block
                                    const initials = l.descricao.substring(0,2).toUpperCase();
                                    
                                    return (
                                        <tr key={l.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-white group-hover:text-brand transition-colors cursor-pointer">{mockInvId}</span>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest mt-1 ${l.tipo === "RECEITA" ? "text-emerald-500" : "text-rose-500"}`}>
                                                        {l.tipo === "RECEITA" ? "Recebimento" : "Custo"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black bg-dark-900 border border-white/5`}>
                                                        {initials}
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-300 line-clamp-1">{l.descricao}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-sm text-slate-400 font-medium">
                                                {new Date(l.dataVencimento).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-8 py-5 text-right font-black text-sm text-white">
                                                {formatMoeda(l.valor)}
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${metaStatus.color}`}>
                                                    {metaStatus.label}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button className="w-8 h-8 rounded-full flex items-center justify-center bg-transparent hover:bg-white/10 text-slate-500 hover:text-white transition-colors border border-transparent hover:border-white/10 group-hover:opacity-100 opacity-0 focus:opacity-100 outline-none">
                                                    <span className="material-symbols-outlined text-[18px]">more_vert</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                
                <div className="p-5 bg-dark-950/50 border-t border-white/5 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    <span>Mostrando {recentes.length} de {lancamentos.length || 0} registros totais</span>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/5 disabled:opacity-30 disabled:hover:bg-transparent" disabled>
                            Anterior
                        </button>
                        <button className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-white hover:bg-white/10 transition-colors shadow-sm">
                            Próximo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
