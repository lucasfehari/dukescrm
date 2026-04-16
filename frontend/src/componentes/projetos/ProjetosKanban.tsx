import { useState, useEffect, useCallback } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2, ArrowRight, FolderKanban, RefreshCw, Plus,
    MessageCircle, Eye, Rocket, CirclePlus
} from "lucide-react";
import { toast } from "sonner";
import { projetosApi, type Projeto } from "../../servicos/api";
import { NovoProjetoModal } from "./NovoProjetoModal";
import { CustomProjetoModal } from "./CustomProjetoModal";
import {
    ETAPAS_PADRAO,
    ETAPAS_SOCIAL,
    ETAPAS_VIDEO,
    buildEstados,
} from "./WorkflowEtapas";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type StatusProjeto = "NAO_INICIADO" | "EM_ANDAMENTO" | "IMPEDIDO" | "CONCLUIDO" | "CANCELADO";

const COLUNAS: {
    key: StatusProjeto;
    label: string;
    subLabel: string;
    color: string;
    bg: string;
    borderCol: string;
}[] = [
    {
        key: "NAO_INICIADO",
        label: "Pending Sync",
        subLabel: "Pendente",
        color: "text-slate-400",
        bg: "bg-white/5",
        borderCol: "border-white/10",
    },
    {
        key: "EM_ANDAMENTO",
        label: "Active Build",
        subLabel: "Em Execução",
        color: "text-neonBlue",
        bg: "bg-neonBlue/10",
        borderCol: "border-neonBlue/20",
    },
    {
        key: "IMPEDIDO",
        label: "Quality Assurance",
        subLabel: "Garantia de Qualidade",
        color: "text-neonPurple",
        bg: "bg-neonPurple/10",
        borderCol: "border-neonPurple/20",
    },
    {
        key: "CONCLUIDO",
        label: "Completed",
        subLabel: "Concluído",
        color: "text-emerald-400",
        bg: "bg-emerald-400/10",
        borderCol: "border-emerald-400/20",
    },
    {
        key: "CANCELADO",
        label: "Archived",
        subLabel: "Cancelados",
        color: "text-slate-500",
        bg: "bg-slate-500/10",
        borderCol: "border-slate-500/20",
    },
];

function formatarPrazo(date?: string) {
    if (!date) return null;
    const d = new Date(date);
    const hoje = new Date();
    const diff = Math.ceil((d.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    const meses = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = meses[d.getMonth()];
    
    return {
        texto: `${mes} ${dia}`,
        urgente: diff >= 0 && diff <= 3,
        vencido: diff < 0,
        diff
    };
}

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function selecionarEtapas(projeto: Projeto) {
    const tipo = projeto.tipoWorkflow ?? (
        projeto.tipoProjeto?.toLowerCase().includes("vídeo") ||
        projeto.tipoProjeto?.toLowerCase().includes("video") ||
        projeto.tipoProjeto?.toLowerCase().includes("reels")
            ? "video"
            : projeto.tipoProjeto?.toLowerCase().includes("post") ||
              projeto.tipoProjeto?.toLowerCase().includes("carrossel") ||
              projeto.tipoProjeto?.toLowerCase().includes("story")
                ? "social"
                : "padrao"
    );
    if (tipo === "video") return ETAPAS_VIDEO;
    if (tipo === "social") return ETAPAS_SOCIAL;
    return ETAPAS_PADRAO;
}

/* ───────────────────────── MOCK IMAGES PREVIEWS ───────────────────────── */
const PREVIEWS = [
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=600&auto=format&fit=crop"
];

function getHashIndex(id: string, max: number) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % max;
}

/* ───────────────────────── CARD ───────────────────────── */
function ProjetoCard({
    projeto,
    onMover,
    onClick,
    isDragging,
}: {
    projeto: Projeto;
    onMover: (id: string, status: StatusProjeto) => void;
    onClick: () => void;
    isDragging?: boolean;
}) {
    const proxima = COLUNAS[COLUNAS.findIndex(c => c.key === projeto.status) + 1];
    const prazo = formatarPrazo(projeto.prazoEstimado);
    const etapas = selecionarEtapas(projeto);
    const etapaIdx = projeto.etapaAtual ?? 0;
    const isUrgente = prazo?.urgente || prazo?.vencido;
    const isAvulso = projeto.avulso;
    
    const previewUrl = PREVIEWS[getHashIndex(projeto.id, PREVIEWS.length)];
    const progressPerc = Math.round((etapaIdx / (etapas.length - 1 || 1)) * 100);
    const progressColor = isUrgente ? "text-rose-500" : (projeto.status === "EM_ANDAMENTO" ? "text-neonCyan bg-neonCyan" : "text-primary bg-primary");
    const progressColorText = isUrgente ? "text-rose-500" : (projeto.status === "EM_ANDAMENTO" ? "text-neonCyan" : "text-primary");

    return (
        <article
            draggable
            onDragStart={(e: React.DragEvent<HTMLElement>) => {
                e.dataTransfer.setData("application/projeto-id", projeto.id);
                e.dataTransfer.effectAllowed = "move";
                setTimeout(() => {
                    const el = document.getElementById(`projeto-${projeto.id}`);
                    if (el) el.classList.add("opacity-40");
                }, 0);
            }}
            onDragEnd={() => {
                const el = document.getElementById(`projeto-${projeto.id}`);
                if (el) el.classList.remove("opacity-40");
            }}
            id={`projeto-${projeto.id}`}
            className={cn(
                "glass-card p-5 rounded-custom relative group overflow-hidden cursor-grab active:cursor-grabbing",
                isUrgente && "glow-high",
                isDragging && "opacity-30 border-dashed border-indigo-500/40"
            )}
            onClick={onClick}
        >
            {isUrgente && (
                <div className="absolute top-3 right-3 flex gap-2 z-10">
                    <div className="w-2 h-2 rounded-full bg-rose-500 pulse-urgency shadow-[0_0_10px_rgba(244,63,94,0.8)]" title="Urgent: High Priority"></div>
                </div>
            )}
            
            {/* Imagem Preview Layer */}
            <div className={cn(
                "relative rounded-lg overflow-hidden mb-4 group-hover:ring-2 transition-all",
                isUrgente ? "ring-rose-500/50" : (projeto.status === "EM_ANDAMENTO" ? "ring-neonBlue/50" : "ring-primary/50")
            )}>
                <img src={previewUrl} alt="Task Preview" className="w-full h-36 object-cover scale-105 group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                
                {prazo && (
                    <div className={cn(
                        "absolute top-2 right-2 px-2 py-1 rounded bg-dark-950/80 backdrop-blur-md border border-white/10 text-[9px] font-bold flex items-center gap-1 z-20",
                        prazo.vencido ? "text-rose-500" : "text-white"
                    )}>
                        <span className="material-symbols-outlined text-[10px]">event</span>
                        {prazo.texto}
                    </div>
                )}
                
                {/* Overlay Ações Hover */}
                <div className="action-overlay absolute inset-0 bg-dark-950/60 backdrop-blur-sm flex items-center justify-center gap-3">
                    <button className="w-10 h-10 bg-white/10 hover:bg-brand rounded-full flex items-center justify-center transition-colors shadow-xl text-white" title="Discussão">
                        <MessageCircle className="w-5 h-5"/>
                    </button>
                    <button className="w-10 h-10 bg-white/10 hover:bg-brand rounded-full flex items-center justify-center transition-colors shadow-xl text-white" title="Visualizar">
                        <Eye className="w-5 h-5"/>
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
                <span className={cn(
                    "text-[9px] font-black px-2 py-0.5 rounded-sm border uppercase tracking-tighter",
                    isAvulso ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-neonBlue/10 text-neonBlue border-neonBlue/20"
                )}>
                    {isAvulso ? "Avulso" : "Agency"}
                </span>
                <span className={cn(
                    "text-[9px] font-black px-2 py-0.5 rounded-sm border uppercase tracking-tighter",
                    isUrgente ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-primary/10 text-primary border-primary/20",
                )}>
                    {isUrgente ? "High Priority" : (projeto.tipoProjeto || "Task")}
                </span>
            </div>

            <h4 className="font-bold text-sm mb-4 text-slate-100 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                {projeto.nome}
            </h4>

            {projeto.status !== "CANCELADO" && (
                <div className="space-y-3 mb-4 mt-auto">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                        <span>Execution Progress</span>
                        <span className={progressColorText}>{progressPerc}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                         <div className={cn("h-full progress-glow transition-all duration-700", progressColor)} style={{width: `${progressPerc}%`}}></div>
                    </div>
                    <div className="text-[9px] font-medium text-slate-500 tracking-wide mt-1">
                        Estágio: <span className="font-bold text-slate-300">{etapas[etapaIdx]?.label || "Pendente"}</span>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-[10px] font-bold text-white shadow-xl ring-2 ring-primary/20">JD</div>
                        <span className="absolute -top-1 -right-1 material-symbols-outlined text-[10px] bg-primary text-white p-0.5 rounded-full" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
                    </div>
                    {proxima && projeto.status !== "CONCLUIDO" && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onMover(projeto.id, proxima.key); }}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-full w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white transition-all ml-1"
                            title="Avançar Etapa"
                        >
                            <ArrowRight className="w-3 h-3" />
                        </button>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mb-0.5">Valuation</p>
                    <span className="text-sm font-black text-emerald-400">{projeto.valorAvulso ? fmt(projeto.valorAvulso) : "$0"}</span>
                </div>
            </div>
            
            {projeto.status === "CONCLUIDO" && (
                 <div className="absolute top-2 right-2 px-2 py-1 rounded bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-[9px] font-bold text-emerald-400 flex items-center gap-1 z-20 shadow-xl shadow-emerald-500/20">
                     <Rocket className="w-3 h-3" /> Entregue
                 </div>
            )}
        </article>
    );
}

/* ───────────────────────── COLUNA ───────────────────────── */
function KanbanColumn({
    coluna,
    projetosDaColuna,
    movendo,
    moverProjeto,
    setProjetoSelecionado,
    setModalDetalhesAberto,
    abrirModalNovo,
}: {
    coluna: typeof COLUNAS[0];
    projetosDaColuna: Projeto[];
    movendo: string | null;
    moverProjeto: (id: string, status: StatusProjeto) => void;
    setProjetoSelecionado: (id: string) => void;
    setModalDetalhesAberto: (val: boolean) => void;
    abrirModalNovo: (status: StatusProjeto) => void;
}) {
    const [dragOver, setDragOver] = useState(false);
    
    const valorColuna = projetosDaColuna.reduce((acc, p) => acc + (p.valorAvulso || 0), 0);

    return (
        <div
            className="w-[340px] flex flex-col h-full shrink-0"
            data-purpose="kanban-column"
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
                e.preventDefault();
                setDragOver(false);
                const projetoId = e.dataTransfer.getData("application/projeto-id");
                if (projetoId) moverProjeto(projetoId, coluna.key);
            }}
        >
            <div className="flex items-center justify-between mb-6 px-4">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className={cn("uppercase text-[11px] font-black tracking-[0.2em]", coluna.color)}>
                            {coluna.label}
                        </span>
                        <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full border", 
                            coluna.bg, coluna.borderCol, coluna.color
                        )}>
                            {projetosDaColuna.length}
                        </span>
                    </div>
                    {valorColuna > 0 ? (
                        <span className="text-xs font-bold text-emerald-400/80 mt-1">
                            {fmt(valorColuna)} Valuation
                        </span>
                    ) : (
                        <span className="text-xs font-bold text-slate-500 mt-1">
                            {coluna.subLabel}
                        </span>
                    )}
                </div>
                {coluna.key !== "CONCLUIDO" && coluna.key !== "CANCELADO" && (
                    <button 
                        onClick={() => abrirModalNovo(coluna.key)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-slate-500 hover:text-white bg-white/5"
                    >
                        <Plus className="w-5 h-5"/>
                    </button>
                )}
            </div>
            
            <div className={cn(
                "flex-1 overflow-y-auto space-y-5 pr-4 kanban-column custom-scrollbar relative",
                dragOver && "before:absolute before:inset-0 before:bg-white/5 before:border-2 before:border-dashed before:border-primary/40 before:rounded-custom before:z-50"
            )}>
                <AnimatePresence>
                    {projetosDaColuna.map(projeto => (
                        <motion.div key={projeto.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                            <ProjetoCard
                                projeto={projeto}
                                onMover={moverProjeto}
                                onClick={() => {
                                    setProjetoSelecionado(projeto.id);
                                    setModalDetalhesAberto(true);
                                }}
                                isDragging={movendo === projeto.id}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
                
                {projetosDaColuna.length === 0 && !dragOver && (
                    <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-custom text-slate-600 opacity-50 bg-white/5">
                        <FolderKanban className="w-6 h-6 mb-2 text-slate-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Sem Tarefas</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export function ProjetosKanban() {
    const [projetos, setProjetos] = useState<Projeto[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [movendo, setMovendo] = useState<string | null>(null);
    const [projetoSelecionado, setProjetoSelecionado] = useState<string | null>(null);
    const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
    
    const [modalNovoAberto, setModalNovoAberto] = useState(false);
    const [statusParaNovo, setStatusParaNovo] = useState<StatusProjeto>("NAO_INICIADO");

    function abrirModalNovo(status: StatusProjeto) {
        setStatusParaNovo(status);
        setModalNovoAberto(true);
    }

    const carregarProjetos = useCallback(async () => {
        setCarregando(true);
        try {
            const dados = await projetosApi.listar();
            setProjetos(dados);
        } catch (e) {
            const errMsg = e instanceof Error ? e.message : "Erro desconhecido";
            toast.error("Erro ao carregar projetos", { description: errMsg });
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => { carregarProjetos(); }, [carregarProjetos]);

    async function moverProjeto(id: string, novoStatus: StatusProjeto) {
        const projetoAntes = projetos.find(p => p.id === id);
        if (!projetoAntes || projetoAntes.status === novoStatus) return;

        setMovendo(id);
        setProjetos(prev => prev.map(p => p.id === id ? { ...p, status: novoStatus } : p));
        try {
            await projetosApi.moverStatus(id, novoStatus);
            const col = COLUNAS.find(c => c.key === novoStatus)!;
            toast.success("Projeto movido!", { description: `Agora em: ${col.label}` });
        } catch (e) {
            await carregarProjetos();
            const errMsg = e instanceof Error ? e.message : "Erro desconhecido";
            toast.error("Erro ao mover projeto", { description: errMsg });
        } finally {
            setMovendo(null);
        }
    }

    if (carregando) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-4 h-full">
                <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-brand/20 border border-brand/30 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-brand" />
                    </div>
                </div>
                <span className="text-slate-500 text-xs font-black uppercase tracking-widest animate-pulse">
                    Loading Command Center...
                </span>
            </div>
        );
    }

    const totalPipeline = projetos.reduce((acc, p) => acc + (p.valorAvulso || 0), 0) || 248500;
    const disputas = projetos.filter(p => p.status === 'IMPEDIDO').length;

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] sm:h-[calc(100vh-4rem)] -mx-4 sm:-mx-8 -mt-6 sm:-mt-8 -mb-4 sm:-mb-8 z-10 w-[calc(100%+2rem)] sm:w-[calc(100%+4rem)] overflow-hidden relative bg-dark-950">
            {/* Header Redesign matching Mockup */}
            <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 shrink-0 glass" data-purpose="board-header">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Production Dashboard</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Active Sprint</span>
                            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">{projetos.length} Tasks Remaining</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={carregarProjetos} className="flex items-center gap-2 px-3 py-2 text-sm bg-white/5 hover:bg-white/10 rounded-custom border border-white/10 transition-all text-slate-300">
                        <RefreshCw className="w-4 h-4"/>
                    </button>
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Focus Mode</span>
                        <button className="w-8 h-4 bg-slate-700 rounded-full relative transition-all shadow-inner">
                            <div className="absolute left-1 top-1 w-2 h-2 bg-white rounded-full"></div>
                        </button>
                    </div>
                    <button onClick={() => abrirModalNovo("NAO_INICIADO")} className="flex items-center gap-2 px-5 py-2 text-sm bg-gradient-to-r from-primary to-neonPurple hover:brightness-110 rounded-custom font-bold shadow-lg shadow-primary/20 transition-all text-white">
                        <span className="material-symbols-outlined text-lg">add</span>
                        <span>Initiate Task</span>
                    </button>
                </div>
            </header>

            {/* Stats Overview */}
            <section className="px-8 pt-8 grid grid-cols-4 gap-6 shrink-0">
                <div className="glass p-5 rounded-custom border-l-4 border-l-neonBlue hover:bg-white/5 transition-all">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Pipe Value</p>
                    <div className="flex items-end justify-between">
                        <h3 className="text-2xl font-black text-white">{fmt(totalPipeline)}</h3>
                        <span className="text-emerald-400 text-xs font-bold">+12% vs LW</span>
                    </div>
                </div>
                <div className="glass p-5 rounded-custom border-l-4 border-l-neonPurple hover:bg-white/5 transition-all">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Delivered Scope</p>
                    <div className="flex items-end justify-between">
                        <h3 className="text-2xl font-black text-white">{projetos.filter(p=>p.status==="CONCLUIDO").length}<span className="text-sm font-normal text-slate-400 ml-1">tasks</span></h3>
                        <span className="text-slate-400 text-xs font-bold">100% Target</span>
                    </div>
                </div>
                <div className="glass p-5 rounded-custom border-l-4 border-l-neonCyan hover:bg-white/5 transition-all">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Agency Capacity</p>
                    <div className="flex items-end justify-between">
                        <h3 className="text-2xl font-black text-white">92<span className="text-sm font-normal text-slate-400 ml-1">%</span></h3>
                        <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-neonCyan w-[92%] progress-glow"></div>
                        </div>
                    </div>
                </div>
                <div className="glass p-5 rounded-custom border-l-4 border-l-rose-500 hover:bg-white/5 transition-all">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Open Disputes</p>
                    <div className="flex items-end justify-between">
                        <h3 className="text-2xl font-black text-white">{String(disputas).padStart(2,'0')}</h3>
                        {disputas > 0 ? (
                            <span className="text-rose-400 text-xs font-bold px-2 py-0.5 bg-rose-500/10 rounded-full">High Alert</span>
                        ) : (
                            <span className="text-emerald-400 text-xs font-bold px-2 py-0.5 bg-emerald-500/10 rounded-full">Safe</span>
                        )}
                    </div>
                </div>
            </section>

            {/* KanbanBoard */}
            <section className="flex-1 overflow-x-auto p-8 custom-scrollbar" data-purpose="kanban-view">
                <div className="flex gap-8 h-full min-w-max pb-8">
                    {COLUNAS.map(col => {
                        // Ocultamos a coluna Cancelados normalmente até se precisar
                        if (col.key === "CANCELADO") return null;
                        const projetosDaColuna = projetos.filter(p => p.status === col.key);
                        return (
                            <KanbanColumn
                                key={col.key}
                                coluna={col}
                                projetosDaColuna={projetosDaColuna}
                                movendo={movendo}
                                moverProjeto={moverProjeto}
                                setProjetoSelecionado={setProjetoSelecionado}
                                setModalDetalhesAberto={setModalDetalhesAberto}
                                abrirModalNovo={abrirModalNovo}
                            />
                        );
                    })}
                    
                    {/* Add New Pipeline Stage */}
                    <div className="w-[340px] flex flex-col h-full border-2 border-dashed border-white/5 rounded-custom items-center justify-center text-slate-500 hover:text-slate-200 hover:border-primary/40 hover:bg-white/5 transition-all cursor-pointer group shrink-0" onClick={() => toast("Stages customizados na v2.0!")}>
                        <span className="material-symbols-outlined text-3xl mb-3 group-hover:scale-110 transition-transform">add_circle</span>
                        <span className="text-xs font-black uppercase tracking-[0.2em]">New Pipeline Stage</span>
                    </div>
                </div>
            </section>

            <CustomProjetoModal
                projetoId={projetoSelecionado}
                aberto={modalDetalhesAberto}
                onClose={() => setModalDetalhesAberto(false)}
                onProjetoAtualizado={carregarProjetos}
            />

            <NovoProjetoModal
                isOpen={modalNovoAberto}
                onClose={() => setModalNovoAberto(false)}
                onProjetoCriado={carregarProjetos}
                statusInicial={statusParaNovo}
            />
        </div>
    );
}
