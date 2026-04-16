import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { contratosApi, type Contrato } from "../../servicos/api";
import { NovoContratoDialog } from "./ContratoForm";
import { CreditosManager } from "./CreditosManager";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_BADGE: Record<string, string> = {
    RASCUNHO: "bg-zinc-700/10 text-zinc-400 border-zinc-700/20",
    ENVIADO: "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]",
    ASSINADO: "bg-sky-500/10 text-sky-400 border-sky-500/20 shadow-[0_0_10px_rgba(14,165,233,0.1)]",
    ATIVO: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
    EM_ANDAMENTO: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    PAUSADO: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    VENCIDO: "bg-orange-500/10 text-orange-500 border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.1)]",
    CANCELADO: "bg-red-500/10 text-red-400 border-red-500/20",
    FINALIZADO: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const STATUS_LABEL: Record<string, string> = {
    RASCUNHO: "Rascunho",
    ENVIADO: "Enviado",
    ASSINADO: "Aguardando",
    ATIVO: "Ativo",
    EM_ANDAMENTO: "Em Andamento",
    PAUSADO: "Pausado",
    VENCIDO: "A Vencer",
    CANCELADO: "Cancelado",
    FINALIZADO: "Concluído",
};

function fmtDate(dt?: string | null) {
    if (!dt) return "—";
    const date = new Date(dt);
    return date.toLocaleDateString("pt-BR", { day: '2-digit', month: 'short', year: 'numeric' }).replace(" de ", " ");
}

export function ContratosList({ refreshKey }: { refreshKey?: number }) {
    const [contratos, setContratos] = useState<Contrato[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const carregar = useCallback(async () => {
        setCarregando(true);
        try {
            const dados = await contratosApi.listar();
            setContratos(dados);
        } catch (e: any) {
            toast.error("Erro ao carregar contratos", { description: e.message });
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => { carregar(); }, [carregar, refreshKey]);

    async function deletar(id: string, titulo: string) {
        if (!confirm(`Remover o contrato "${titulo}"?`)) return;
        try {
            await contratosApi.deletar(id);
            setContratos(prev => prev.filter(c => c.id !== id));
            toast.success("Contrato removido com sucesso.");
        } catch (e: any) {
            toast.error("Erro ao remover contrato", { description: e.message });
        }
    }

    const filteredContratos = contratos.filter(c => 
        c.titulo.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (c.cliente?.nome || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const valorTotal = contratos.reduce((acc, c) => acc + c.valorTotal, 0);
    const ativos = contratos.filter(c => ["ATIVO", "ASSINADO", "EM_ANDAMENTO"].includes(c.status)).length;
    const aVencer = contratos.filter(c => c.status === "VENCIDO" || (c.fimEm && new Date(c.fimEm).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000)).length;

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <div className="flex flex-col h-full space-y-8 pb-10">
            {/* Header Section */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Gestão de Contratos</h1>
                    <p className="text-sm text-zinc-400">Gerencie os acordos legais e financeiros da sua agência.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-brand transition-colors text-[20px]">search</span>
                        <input 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 w-72 rounded-xl border border-white/10 bg-dark-900/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-brand/50 text-sm text-zinc-200 placeholder:text-zinc-500 transition-all" 
                            placeholder="Buscar cliente ou contrato..." 
                            type="text"
                        />
                    </div>
                    
                    <button onClick={carregar} className="p-2 rounded-xl bg-dark-900/50 border border-white/10 text-zinc-400 hover:text-white transition-colors flex items-center justify-center">
                        <span className={`material-symbols-outlined text-[20px] ${carregando ? 'animate-spin' : ''}`}>refresh</span>
                    </button>
                    
                    <NovoContratoDialog onContratoCriado={carregar} />
                </div>
            </header>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card 1 */}
                <div className="p-6 rounded-2xl glass-card backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand/10 rounded-full blur-2xl group-hover:bg-brand/20 transition-all duration-500"></div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 bg-brand/10 rounded-xl text-brand border border-brand/20 shadow-[0_0_15px_rgba(131,17,212,0.15)]">
                            <span className="material-symbols-outlined text-xl">task_alt</span>
                        </div>
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">+{ativos > 0 ? '12%' : '0%'}</span>
                    </div>
                    <p className="text-sm font-medium text-zinc-400">Contratos Ativos</p>
                    <p className="text-3xl font-bold mt-1 text-white">{carregando ? "..." : ativos}</p>
                </div>

                {/* Card 2 */}
                <div className="p-6 rounded-2xl glass-card backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand/10 rounded-full blur-2xl group-hover:bg-brand/20 transition-all duration-500"></div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 bg-brand/10 rounded-xl text-brand border border-brand/20 shadow-[0_0_15px_rgba(131,17,212,0.15)]">
                            <span className="material-symbols-outlined text-xl">payments</span>
                        </div>
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">Alta</span>
                    </div>
                    <p className="text-sm font-medium text-zinc-400">Valor Total</p>
                    <p className="text-3xl font-bold mt-1 text-white">
                        {carregando ? "..." : `R$ ${(valorTotal / 1000).toFixed(1)}K`}
                    </p>
                </div>

                {/* Card 3 */}
                <div className="p-6 rounded-2xl glass-card backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand/10 rounded-full blur-2xl group-hover:bg-brand/20 transition-all duration-500"></div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 bg-brand/10 rounded-xl text-brand border border-brand/20 shadow-[0_0_15px_rgba(131,17,212,0.15)]">
                            <span className="material-symbols-outlined text-xl">timer</span>
                        </div>
                        <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">Próximos 30d</span>
                    </div>
                    <p className="text-sm font-medium text-zinc-400">A Vencer</p>
                    <p className="text-3xl font-bold mt-1 text-white">{carregando ? "..." : aVencer}</p>
                </div>

                {/* Card 4 */}
                <div className="p-6 rounded-2xl glass-card backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand/10 rounded-full blur-2xl group-hover:bg-brand/20 transition-all duration-500"></div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 bg-brand/10 rounded-xl text-brand border border-brand/20 shadow-[0_0_15px_rgba(131,17,212,0.15)]">
                            <span className="material-symbols-outlined text-xl">loop</span>
                        </div>
                        <span className="text-xs font-bold text-brand bg-brand/10 px-2.5 py-1 rounded-full border border-brand/20">Meta: 90%</span>
                    </div>
                    <p className="text-sm font-medium text-zinc-400">Taxa de Renovação</p>
                    <p className="text-3xl font-bold mt-1 text-white">94.2%</p>
                </div>
            </div>

            {/* Main Table Section */}
            <div className="glass-card rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
                <div className="p-6 flex items-center justify-between border-b border-white/5 bg-dark-900/20">
                    <h3 className="font-bold text-lg text-white">Listagem de Contratos</h3>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/5 hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-[16px]">filter_list</span>
                            Filtros
                        </button>
                        <button className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/5 hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-[16px]">file_download</span>
                            Exportar CSV
                        </button>
                    </div>
                </div>
                
                <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-dark-900/60 text-zinc-400 uppercase text-[10px] tracking-widest font-bold">
                                <th className="px-6 py-4 rounded-tl-xl w-[30%]">Contrato / Cliente</th>
                                <th className="px-6 py-4">Data Início</th>
                                <th className="px-6 py-4">Data Término</th>
                                <th className="px-6 py-4">Valor Total</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-center rounded-tr-xl">Ações</th>
                            </tr>
                        </thead>
                        <motion.tbody 
                            className="divide-y divide-white/5"
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                        >
                            {carregando ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <span className="material-symbols-outlined animate-spin text-3xl text-brand">progress_activity</span>
                                            <p className="text-sm">Buscando contratos no banco de dados...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredContratos.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <span className="material-symbols-outlined text-4xl text-zinc-700">description_empty</span>
                                            <p className="text-sm">Nenhum contrato encontrado para a sua busca.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredContratos.map((c) => (
                                    <AnimatePresence key={`row-${c.id}`} mode="sync">
                                        <motion.tr 
                                            variants={itemVariants}
                                            className={`hover:bg-white/[0.02] transition-colors group cursor-pointer ${expandedId === c.id ? 'bg-white/[0.02]' : ''}`}
                                            onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand font-bold shadow-inner">
                                                        {c.titulo.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-zinc-200 group-hover:text-brand-light transition-colors">{c.titulo}</p>
                                                        <p className="text-xs text-zinc-500">{c.cliente?.nome || "Cliente Removido"}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-zinc-300">{fmtDate(c.inicioEm)}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-zinc-500">{fmtDate(c.fimEm)}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-emerald-400 tracking-wide">
                                                R$ {c.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${STATUS_BADGE[c.status] || STATUS_BADGE.RASCUNHO}`}>
                                                    {STATUS_LABEL[c.status] || c.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === c.id ? null : c.id); }}
                                                        className="p-2 hover:bg-brand/20 text-zinc-400 hover:text-brand rounded-lg transition-colors" 
                                                        title="Ver Detalhes e Créditos"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">package</span>
                                                    </button>
                                                    <button 
                                                        className="p-2 hover:bg-blue-500/20 text-zinc-400 hover:text-blue-400 rounded-lg transition-colors" 
                                                        title="Baixar PDF"
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); deletar(c.id, c.titulo); }}
                                                        className="p-2 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg transition-colors" 
                                                        title="Remover"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                        {expandedId === c.id && (
                                            <motion.tr
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="border-b border-white/5 bg-dark-900/40 relative overflow-hidden"
                                            >
                                                <td colSpan={6} className="p-0 relative">
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand"></div>
                                                    <div className="px-10 py-6">
                                                        <CreditosManager contratoId={c.id} contratoTitulo={c.titulo} />
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        )}
                                    </AnimatePresence>
                                ))
                            )}
                        </motion.tbody>
                    </table>
                </div>

                {/* Pagination (Mocked for visual match) */}
                <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-dark-900/30">
                    <p className="text-sm text-zinc-500">
                        Mostrando {filteredContratos.length > 0 ? 1 : 0} a {filteredContratos.length} de {filteredContratos.length} contratos
                    </p>
                    <div className="flex gap-2">
                        <button className="p-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors disabled:opacity-50 text-zinc-400" disabled>
                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                        </button>
                        <button className="px-3.5 py-1 rounded-lg bg-brand text-white text-sm font-bold shadow-lg shadow-brand/20">1</button>
                        <button className="px-3.5 py-1 rounded-lg hover:bg-white/5 text-zinc-400 text-sm font-bold transition-colors border border-transparent hover:border-white/10">2</button>
                        <button className="px-3.5 py-1 rounded-lg hover:bg-white/5 text-zinc-400 text-sm font-bold transition-colors border border-transparent hover:border-white/10">3</button>
                        <button className="p-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-zinc-400">
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Recently Updated / Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-card rounded-2xl p-6 backdrop-blur-md">
                    <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-brand text-[20px]">history</span>
                        Histórico de Atividades
                    </h3>
                    
                    <div className="space-y-5">
                        <div className="flex items-start gap-4">
                            <div className="w-1 h-12 bg-brand/30 rounded-full mt-1"></div>
                            <div>
                                <p className="text-sm text-zinc-300">
                                    <span className="font-bold text-white">Mariana Silva</span> alterou o status do contrato <span className="text-brand font-medium">Luxe Fashion Lab</span> para "A Vencer".
                                </p>
                                <p className="text-xs text-zinc-500 mt-1.5 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">schedule</span> há 2 horas
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-1 h-12 bg-blue-500/30 rounded-full mt-1"></div>
                            <div>
                                <p className="text-sm text-zinc-300">
                                    <span className="font-bold text-white">João Paulo</span> fez o upload de uma nova versão do contrato <span className="text-blue-400 font-medium">Tech Core Solutions</span>.
                                </p>
                                <p className="text-xs text-zinc-500 mt-1.5 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">schedule</span> há 5 horas
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-1 h-12 bg-emerald-500/30 rounded-full mt-1"></div>
                            <div>
                                <p className="text-sm text-zinc-300">
                                    <span className="font-bold text-white">Sistema</span> enviou lembrete automático de renovação para <span className="text-emerald-400 font-medium">Eco Vibe Living</span>.
                                </p>
                                <p className="text-xs text-zinc-500 mt-1.5 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">schedule</span> Ontem, 14:30
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="bg-gradient-to-br from-brand to-brand-dark rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-2xl shadow-brand/30 border border-brand-light/20">
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="relative z-10">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/20">
                            <span className="material-symbols-outlined text-white">auto_awesome</span>
                        </div>
                        <h4 className="font-bold text-xl mb-2 text-white">Renovação Inteligente</h4>
                        <p className="text-white/80 text-sm mb-6 leading-relaxed">
                            Faltam 8 contratos para renovar este mês. Otimize sua receita identificando oportunidades de upsell antes da expiração.
                        </p>
                        <button className="w-full py-3 bg-white text-brand rounded-xl font-bold hover:bg-zinc-100 transition-colors shadow-lg shadow-black/20 group">
                            <span className="flex items-center justify-center gap-2">
                                Ver Insights
                                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </span>
                        </button>
                    </div>
                    <div className="mt-8 flex items-start gap-2.5 text-white/70 text-xs bg-black/20 p-3 rounded-lg backdrop-blur-sm">
                        <span className="material-symbols-outlined text-[16px] text-yellow-400 shrink-0">tips_and_updates</span>
                        <span className="leading-snug">Dica: Contratos anuais têm 20% mais retenção do que os mensais.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

