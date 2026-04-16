import { useState, useEffect, useCallback } from "react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, RefreshCw, Trash2, Pencil, DollarSign, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { clientesApi, financeiroApi, type Cliente, type DevedorItem } from "../../servicos/api";
import { NovoClienteButton, ClienteDialog } from "./ClienteForm";

export function ClientesList() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);
    const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
    const [clienteParaDeletar, setClienteParaDeletar] = useState<Cliente | null>(null);
    const [deletando, setDeletando] = useState(false);
    
    // Quick View Drawer State
    const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);

    const carregarClientes = useCallback(async () => {
        setCarregando(true);
        setErro(null);
        try {
            const dados = await clientesApi.listar();
            setClientes(dados);
        } catch (e: any) {
            setErro(e.message || "Falha ao carregar clientes.");
            toast.error("Erro ao carregar clientes", { description: e.message });
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => { carregarClientes(); }, [carregarClientes]);

    async function confirmarDeleteCliente() {
        if (!clienteParaDeletar) return;
        setDeletando(true);
        try {
            await clientesApi.deletar(clienteParaDeletar.id);
            setClientes(prev => prev.filter(c => c.id !== clienteParaDeletar.id));
            toast.success("Cliente removido.", { description: `"${clienteParaDeletar.nome}" arquivado.` });
            setClienteParaDeletar(null);
            if (clienteSelecionado?.id === clienteParaDeletar.id) {
                setClienteSelecionado(null);
            }
        } catch (e: any) {
            toast.error("Erro ao remover cliente", { description: e.message });
        } finally {
            setDeletando(false);
        }
    }

    const ativosCount = clientes.filter(c => c.status === "ATIVO").length;
    const inativosCount = clientes.length - ativosCount;

    // Helper functions para simular dados premium do CRM
    const getHealthColor = (id: string) => {
        const charCode = id.charCodeAt(id.length - 1) || 0;
        if (charCode % 3 === 0) return { bg: "bg-emerald-500", text: "text-emerald-400", bgSoft: "bg-emerald-500/10", label: "Ótima", shadow: "shadow-[0_0_15px_rgba(16,185,129,0.3)]" };
        if (charCode % 3 === 1) return { bg: "bg-amber-500", text: "text-amber-400", bgSoft: "bg-amber-500/10", label: "Regular", shadow: "shadow-[0_0_15px_rgba(245,158,11,0.3)]" };
        return { bg: "bg-red-500", text: "text-red-400", bgSoft: "bg-red-500/10", label: "Alerta", shadow: "shadow-[0_0_15px_rgba(239,68,68,0.3)]" };
    };

    const getSimulatedMRR = (id: string) => {
        const num = (id.charCodeAt(0) * 1000) % 15000 + 1500;
        return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <div className="w-full flex-1 flex flex-col h-full overflow-y-auto no-scrollbar pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-white mb-2">Gestão de Clientes</h2>
                    <p className="text-zinc-400 max-w-md">Gerencie suas contas de alto valor com inteligência preditiva e análise de saúde em tempo real.</p>
                </div>
                <div className="flex gap-3 items-center flex-wrap">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[18px]">search</span>
                        <input className="bg-dark-900/60 border border-white/10 text-sm rounded-xl pl-10 pr-4 py-2.5 w-64 focus:border-brand focus:ring-1 focus:ring-brand text-white placeholder:text-zinc-600 transition-all shadow-inner" placeholder="Buscar clientes..." type="text"/>
                    </div>
                    <select className="bg-dark-900/60 border border-white/10 text-sm rounded-xl px-4 py-2.5 text-zinc-400 focus:border-brand focus:ring-1 focus:ring-brand cursor-pointer hover:bg-white/5 transition-colors appearance-none shadow-inner">
                        <option>Valor de Conta</option>
                        <option>High Ticket</option>
                        <option>Mid Tier</option>
                    </select>
                    <select className="bg-dark-900/60 border border-white/10 text-sm rounded-xl px-4 py-2.5 text-zinc-400 focus:border-brand focus:ring-1 focus:ring-brand cursor-pointer hover:bg-white/5 transition-colors appearance-none shadow-inner">
                        <option>Setor</option>
                        <option>Tecnologia</option>
                        <option>Finanças</option>
                    </select>
                    
                    <CarteirasDevedorasDialog />
                    <NovoClienteButton onClienteCriado={carregarClientes} />
                    
                    <Button
                        variant="ghost" size="sm"
                        onClick={carregarClientes}
                        disabled={carregando}
                        className="text-zinc-400 hover:text-white border border-white/10 bg-dark-900/60 h-10 px-4 rounded-xl"
                    >
                        <RefreshCw className={`w-4 h-4 ${carregando ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            {/* KPI Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="glass-card rounded-2xl p-6 border-l-2 border-l-brand/50 hover:border-l-brand transition-all duration-300 shadow-lg glow-hover">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Total de Clientes</span>
                        <span className="material-symbols-outlined text-brand text-[24px]">group</span>
                    </div>
                    <div className="flex items-end gap-3">
                        <span className="text-4xl font-black text-white">{clientes.length}</span>
                        <span className="text-emerald-400 text-xs font-bold pb-1 flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[14px]">trending_up</span> +12%
                        </span>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <span className="text-[10px] font-bold text-zinc-400 bg-dark-900/80 px-2 py-0.5 rounded border border-white/5">Ativos: {ativosCount}</span>
                        <span className="text-[10px] font-bold text-zinc-400 bg-dark-900/80 px-2 py-0.5 rounded border border-white/5">Inativos: {inativosCount}</span>
                    </div>
                </div>

                <div className="glass-card rounded-2xl p-6 border-l-2 border-l-emerald-500/50 hover:border-l-emerald-500 transition-all duration-300 shadow-lg glow-hover">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">LTV Médio</span>
                        <span className="material-symbols-outlined text-emerald-400 text-[24px]">monetization_on</span>
                    </div>
                    <div className="flex items-end gap-3">
                        <span className="text-4xl font-black text-white">R$ 42.800</span>
                        <span className="text-emerald-400 text-xs font-bold pb-1 flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[14px]">trending_up</span> +5.4%
                        </span>
                    </div>
                    <div className="mt-4 w-full h-1.5 bg-dark-900/80 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-emerald-400 w-3/4 shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                    </div>
                </div>

                <div className="glass-card rounded-2xl p-6 border-l-2 border-l-amber-500/50 hover:border-l-amber-500 transition-all duration-300 shadow-lg glow-hover">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Churn Rate</span>
                        <span className="material-symbols-outlined text-amber-400 text-[24px]">analytics</span>
                    </div>
                    <div className="flex items-end gap-3">
                        <span className="text-4xl font-black text-white">2.4%</span>
                        <span className="text-amber-400 text-xs font-bold pb-1 flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[14px]">trending_down</span> -0.8%
                        </span>
                    </div>
                    <div className="mt-4 text-[10px] font-bold text-zinc-500">Benchmark da Indústria: 4.5%</div>
                </div>
            </div>

            {/* Main Intelligence Table */}
            <div className="glass-card rounded-2xl overflow-hidden shadow-2xl border border-white/10 backdrop-blur-md">
                {carregando ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-brand" />
                        <span className="text-zinc-500 font-medium">Buscando inteligência de contas...</span>
                    </div>
                ) : erro ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <p className="text-red-400">{erro}</p>
                        <Button variant="outline" onClick={carregarClientes} className="border-white/10">Tentar novamente</Button>
                    </div>
                ) : (
                    <Table className="w-full text-left border-collapse">
                        <TableHeader className="bg-dark-900/60 border-b border-white/10">
                            <TableRow className="border-none hover:bg-transparent">
                                <TableHead className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Empresa</TableHead>
                                <TableHead className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Contato / E-mail</TableHead>
                                <TableHead className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Saúde</TableHead>
                                <TableHead className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Projetos Ativos</TableHead>
                                <TableHead className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Valor Mensal (MRR)</TableHead>
                                <TableHead className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-white/5">
                            <AnimatePresence>
                                {clientes.map((cliente, idx) => {
                                    const health = getHealthColor(cliente.id);
                                    // Row Styling mapping based on health status if desired. We use regular hover.
                                    return (
                                        <motion.tr 
                                            key={cliente.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ duration: 0.2, delay: idx * 0.05 }}
                                            className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                                            onClick={() => setClienteSelecionado(cliente)}
                                        >
                                            <TableCell className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-dark-900/80 flex items-center justify-center border border-white/10 text-brand group-hover:border-brand/40 group-hover:shadow-[0_0_15px_rgba(131,17,212,0.2)] transition-all">
                                                        <span className="material-symbols-outlined text-[20px]">dataset</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white group-hover:text-brand-light transition-colors">{cliente.nome}</p>
                                                        <p className="text-[10px] font-medium text-zinc-500">{cliente.documento ? `Doc: ${cliente.documento}` : "Enterprise"}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-[10px] font-bold text-indigo-400">
                                                        {cliente.nome.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-zinc-300">{cliente.telefone || "Sem telefone"}</span>
                                                        <span className="text-[10px] text-zinc-500">{cliente.email || "Sem e-mail"}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-5">
                                                {cliente.status === "ATIVO" ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${health.bg} ${health.shadow}`}></div>
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${health.text} px-2.5 py-1 rounded-lg ${health.bgSoft} border border-white/5`}>{health.label}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-zinc-600"></div>
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-2.5 py-1 rounded-lg bg-zinc-800/50 border border-white/5">Inativo</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="px-6 py-5">
                                                {cliente.status === "ATIVO" ? (
                                                    <div className="flex -space-x-2">
                                                        <div className="w-7 h-7 rounded-full bg-dark-900 border-2 border-[#12050e] flex items-center justify-center text-[10px] font-bold text-brand z-20">UI</div>
                                                        <div className="w-7 h-7 rounded-full bg-dark-900 border-2 border-[#12050e] flex items-center justify-center text-[10px] font-bold text-amber-400 z-10">DEV</div>
                                                        <div className="w-7 h-7 rounded-full bg-dark-900 border-2 border-[#12050e] flex items-center justify-center text-[10px] font-bold text-zinc-500 z-0">+1</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-zinc-600 italic">Nenhum projeto</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="px-6 py-5">
                                                <span className="text-sm font-bold text-white">{getSimulatedMRR(cliente.id)}</span>
                                            </TableCell>
                                            <TableCell className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex justify-end gap-1 opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost" size="sm"
                                                        onClick={(e) => { e.stopPropagation(); setClienteEditando(cliente); }}
                                                        className="text-zinc-400 hover:text-brand hover:bg-brand/10 h-8 w-8 p-0 rounded-lg"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost" size="sm"
                                                        onClick={(e) => { e.stopPropagation(); setClienteParaDeletar(cliente); }}
                                                        className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10 h-8 w-8 p-0 rounded-lg"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </motion.tr>
                                    );
                                })}
                            </AnimatePresence>
                            {clientes.length === 0 && !carregando && (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-20 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <span className="material-symbols-outlined text-[48px] text-zinc-700">group_off</span>
                                            <p className="text-zinc-400 font-medium">Nenhum cliente de elite encontrado.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Quick View Drawer */}
            <AnimatePresence>
                {clienteSelecionado && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setClienteSelecionado(null)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                        />
                        <motion.div 
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed top-0 right-0 w-96 max-w-[90vw] h-screen glass-card !rounded-none !bg-dark-950/95 border-l border-white/10 z-50 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
                        >
                            {/* Drawer Header */}
                            <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shadow-[0_0_15px_rgba(131,17,212,0.15)]">
                                        <span className="material-symbols-outlined text-[24px]">dataset</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white truncate max-w-[180px]">{clienteSelecionado.nome}</h3>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Client Quick View</p>
                                    </div>
                                </div>
                                <button 
                                    className="p-2 text-zinc-500 hover:text-white transition-colors hover:bg-white/5 rounded-full"
                                    onClick={() => setClienteSelecionado(null)}
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="p-8 space-y-10 overflow-y-auto no-scrollbar flex-1 pb-24">
                                {/* Financial Summary */}
                                <section>
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand mb-6 flex items-center gap-2">
                                        <span className="w-4 h-[2px] bg-brand rounded-full"></span> Resumo Financeiro
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-dark-900/40 border border-white/5 p-4 rounded-2xl">
                                            <p className="text-[10px] font-bold text-zinc-500 mb-1">MRR Atual</p>
                                            <p className="text-lg font-black text-white">{getSimulatedMRR(clienteSelecionado.id)}</p>
                                        </div>
                                        <div className="bg-dark-900/40 border border-white/5 p-4 rounded-2xl">
                                            <p className="text-[10px] font-bold text-zinc-500 mb-1">LTV Total</p>
                                            <p className="text-lg font-black text-white">R$ 150k</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex justify-between items-center">
                                        <span className="text-xs font-bold text-emerald-400">Status de Pagamento</span>
                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Em dia</span>
                                    </div>
                                </section>

                                {/* Project History */}
                                <section>
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand mb-6 flex items-center gap-2">
                                        <span className="w-4 h-[2px] bg-brand rounded-full"></span> Histórico de Projetos
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="flex gap-4 items-start group">
                                            <div className="w-1.5 h-10 bg-emerald-400/20 rounded-full group-hover:bg-emerald-400 transition-colors shadow-[0_0_10px_rgba(52,211,153,0.2)]"></div>
                                            <div>
                                                <p className="text-xs font-bold text-white">Redesign Hub de Dados</p>
                                                <p className="text-[10px] text-zinc-500 mt-0.5">Concluído em Jul/23</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 items-start group">
                                            <div className="w-1.5 h-10 bg-brand/20 rounded-full group-hover:bg-brand transition-colors shadow-[0_0_10px_rgba(131,17,212,0.2)]"></div>
                                            <div>
                                                <p className="text-xs font-bold text-white">Mobile Onboarding Flow</p>
                                                <p className="text-[10px] text-zinc-500 mt-0.5">Em andamento (75%)</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 items-start group opacity-40">
                                            <div className="w-1.5 h-10 bg-zinc-700 rounded-full"></div>
                                            <div>
                                                <p className="text-xs font-bold text-zinc-300">Web Dashboard V2</p>
                                                <p className="text-[10px] text-zinc-600 mt-0.5">Previsto para Set/24</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Next Tasks */}
                                <section>
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand mb-6 flex items-center gap-2">
                                        <span className="w-4 h-[2px] bg-brand rounded-full"></span> Próximas Tasks
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="p-3.5 bg-dark-900 border border-white/5 rounded-xl flex items-center gap-3 shadow-inner hover:border-white/10 transition-colors">
                                            <span className="material-symbols-outlined text-amber-400 text-[20px]">event</span>
                                            <div className="flex-1">
                                                <p className="text-[11px] font-bold text-white">Review Mensal Strategy</p>
                                                <p className="text-[9px] font-medium text-zinc-500 mt-0.5">Amanhã às 14:00</p>
                                            </div>
                                        </div>
                                        <div className="p-3.5 bg-dark-900 border border-white/5 rounded-xl flex items-center gap-3 shadow-inner hover:border-white/10 transition-colors">
                                            <span className="material-symbols-outlined text-brand text-[20px]">description</span>
                                            <div className="flex-1">
                                                <p className="text-[11px] font-bold text-white">Enviar Orçamento V2</p>
                                                <p className="text-[9px] font-medium text-zinc-500 mt-0.5">Quinta-feira</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <button 
                                    className="w-full py-4 border border-brand/20 text-brand hover:bg-brand/10 hover:border-brand/40 rounded-2xl font-black text-xs uppercase tracking-widest transition-all mt-4"
                                    onClick={() => { setClienteSelecionado(null); setClienteEditando(clienteSelecionado); }}
                                >
                                    Visualizar Módulo Completo
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <ClienteDialog
                cliente={clienteEditando}
                aberto={!!clienteEditando}
                onOpenChange={(open) => !open && setClienteEditando(null)}
                onSucesso={() => {
                    setClienteEditando(null);
                    carregarClientes();
                }}
            />

            {/* Diálogo de confirmação de exclusão */}
            <Dialog open={!!clienteParaDeletar} onOpenChange={(open) => !open && setClienteParaDeletar(null)}>
                <DialogContent className="bg-dark-900 border-white/10 max-w-sm shadow-2xl glass-card backdrop-blur-3xl sm:rounded-2xl">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 shadow-inner">
                                <Trash2 className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <DialogTitle className="text-white text-lg font-bold">Remover Cliente</DialogTitle>
                                <DialogDescription className="text-zinc-400 mt-1">
                                    Esta ação arquiva o cliente e seus vínculos.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="bg-dark-900/60 rounded-xl p-4 border border-white/5 mb-4 shadow-inner">
                        <p className="text-sm text-zinc-200 font-bold">{clienteParaDeletar?.nome}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{clienteParaDeletar?.email ?? "sem e-mail"}</p>
                        <div className="mt-4 flex items-start gap-2 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                            <span className="text-[10px] font-bold text-amber-400/80 leading-relaxed uppercase tracking-wide">
                                ⚠️ Projetos vinculados serão arquivados.
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            className="flex-1 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl"
                            onClick={() => setClienteParaDeletar(null)}
                            disabled={deletando}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className="flex-1 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all"
                            onClick={confirmarDeleteCliente}
                            disabled={deletando}
                        >
                            {deletando ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Removendo...</> : "Confirmar Remoção"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ── COMPONENTE: Carteiras Devedoras (Fechamento/Consolidação) ─────────────
// Mantido com estilos atualizados para o glass-card
function CarteirasDevedorasDialog() {
    const [aberto, setAberto] = useState(false);
    const [itens, setItens] = useState<DevedorItem[]>([]);
    const [carregando, setCarregando] = useState(false);
    const [consolidandoId, setConsolidandoId] = useState<string | null>(null);

    const carregarPendentes = useCallback(async () => {
        setCarregando(true);
        try {
            const data = await financeiroApi.carteiraDevedora();
            setItens(data);
        } catch (e: any) {
            toast.error("Erro ao carregar carteiras", { description: e.message });
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => {
        if (aberto) carregarPendentes();
    }, [aberto, carregarPendentes]);

    const agrupado = itens.reduce((acc, item) => {
        const id = item.clienteId ?? "unknown";
        if (!acc[id]) acc[id] = { nome: item.clienteNome, total: 0, lancamentos: [] };
        acc[id].lancamentos.push(item);
        acc[id].total += Number(item.valor);
        return acc;
    }, {} as Record<string, { nome: string; total: number; lancamentos: DevedorItem[] }>);

    async function consolidarCliente(clienteId: string, lancamentoIds: string[]) {
        setConsolidandoId(clienteId);
        try {
            const res = await financeiroApi.consolidar(lancamentoIds);
            toast.success("Fatura consolidada com sucesso!", { description: `${res.count} lançamentos marcados como pagos.` });
            await carregarPendentes();
        } catch (e: any) {
            toast.error("Erro ao consolidar fatura", { description: e.message });
        } finally {
            setConsolidandoId(null);
        }
    }

    const formatCurrency = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const keys = Object.keys(agrupado);

    return (
        <Dialog open={aberto} onOpenChange={setAberto}>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setAberto(true)}
                className="bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20 hover:text-amber-400 gap-2 h-10 px-4 rounded-xl shadow-[0_0_10px_rgba(245,158,11,0.1)] transition-all"
            >
                <DollarSign className="w-4 h-4" /> Carteiras Devedoras
            </Button>

            <DialogContent className="glass-card bg-dark-900 border-white/10 shadow-2xl max-w-2xl max-h-[85vh] flex flex-col sm:rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-white text-xl font-bold flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-inner">
                            <DollarSign className="w-5 h-5 text-amber-400" />
                        </div>
                        Fechamento de Faturas
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Projetos avulsos e receitas pendentes agrupadas por cliente.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                    {carregando ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                            <span className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Buscando pendências...</span>
                        </div>
                    ) : keys.length === 0 ? (
                        <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl glass-card">
                            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4 opacity-80" />
                            <p className="text-white font-bold text-lg">Nenhum valor pendente.</p>
                            <p className="text-sm text-zinc-500 mt-1">Todas as faturas consolidadas!</p>
                        </div>
                    ) : (
                        keys.map(clientId => {
                            const desc = agrupado[clientId];
                            const ids = desc.lancamentos.map(l => l.id);
                            return (
                                <div key={clientId} className="bg-dark-900/60 border border-white/5 rounded-2xl p-5 space-y-3 relative overflow-hidden group shadow-inner">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent pointer-events-none rounded-tr-2xl" />

                                    <div className="flex items-start justify-between relative z-10">
                                        <div>
                                            <h4 className="font-bold text-white text-lg">{desc.nome}</h4>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-0.5">{desc.lancamentos.length} fatura(s)</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.2)]">{formatCurrency(desc.total)}</p>
                                            <Button
                                                size="sm"
                                                onClick={() => consolidarCliente(clientId, ids)}
                                                disabled={consolidandoId === clientId}
                                                className="mt-3 h-8 bg-amber-500 hover:bg-amber-400 text-[#12050e] font-black text-[10px] uppercase tracking-widest transition-all rounded-lg shadow-lg"
                                            >
                                                {consolidandoId === clientId ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />}
                                                Consolidar Faturas
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2 relative z-10 pt-3 border-t border-white/5">
                                        {desc.lancamentos.map(l => (
                                            <div key={l.id} className="flex items-center justify-between text-xs px-3 py-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors border border-transparent hover:border-white/5">
                                                <div className="flex flex-col">
                                                    <span className="text-zinc-200 font-bold">{l.projetoNome} {l.avulso && <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded ml-2 uppercase tracking-wide">Avulso</span>}</span>
                                                    <span className="text-[10px] font-medium text-zinc-500 mt-0.5" title={l.dataVencimento}>Vence em: {new Date(l.dataVencimento).toLocaleDateString("pt-BR")}</span>
                                                </div>
                                                <span className="text-zinc-300 font-bold bg-dark-900 px-2 py-1 rounded shadow-inner">{formatCurrency(l.valor)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
