import { useState, useEffect, useCallback } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion, AnimatePresence } from "framer-motion";
import {
    Clock, Loader2, AlertTriangle, CheckCircle2, XCircle,
    ArrowRight, FolderKanban, RefreshCw, Plus,
    MessageCircle, Eye, Rocket, CirclePlus, LineChart
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
    icon: React.ReactNode;
    color: string;
    bg: string;
    borderCol: string;
    glow: string;
}[] = [
    {
        key: "NAO_INICIADO",
        label: "Pendente",
        icon: <Clock className="w-4 h-4" />,
        color: "text-slate-400",
        bg: "bg-white/5",
        borderCol: "border-white/10",
        glow: "",
    },
    {
        key: "EM_ANDAMENTO",
        label: "Em Execução",
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        color: "text-neonBlue",
        bg: "bg-neonBlue/10",
        borderCol: "border-neonBlue/20",
        glow: "ring-neonBlue/40 border-neonBlue/20",
    },
    {
        key: "IMPEDIDO",
        label: "Garantia de Qualidade",
        icon: <AlertTriangle className="w-4 h-4" />,
        color: "text-neonPurple",
        bg: "bg-neonPurple/10",
        borderCol: "border-neonPurple/20",
        glow: "ring-neonPurple/40 border-neonPurple/20",
    },
    {
        key: "CONCLUIDO",
        label: "Concluído",
        icon: <CheckCircle2 className="w-4 h-4" />,
        color: "text-emerald-400",
        bg: "bg-emerald-400/10",
        borderCol: "border-emerald-400/20",
        glow: "ring-emerald-400/40 border-emerald-400/20",
    },
    {
        key: "CANCELADO",
        label: "Cancelado",
        icon: <XCircle className="w-4 h-4" />,
        color: "text-rose-500",
        bg: "bg-rose-500/10",
        borderCol: "border-rose-500/20",
        glow: "ring-rose-500/40 border-rose-500/20 glow-high",
    },
];

function formatarPrazo(date?: string) {
    if (!date) return null;
    const d = new Date(date);
    const hoje = new Date();
    const diff = Math.ceil((d.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    const meses = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = meses[d.getMonth()];
    
    return {
        texto: `${dia} ${mes}`,
        urgente: diff >= 0 && diff <= 3,
        vencido: diff < 0,
        diff
    };
}

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

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
    const coluna = COLUNAS.find(c => c.key === projeto.status)!;
    const proxima = COLUNAS[COLUNAS.findIndex(c => c.key === projeto.status) + 1];

    const prazo = formatarPrazo(projeto.prazoEstimado);
    const etapas = selecionarEtapas(projeto);
    const etapaIdx = projeto.etapaAtual ?? 0;
    const estados = buildEstados(etapas, etapaIdx);

    const isUrgente = prazo?.urgente || prazo?.vencido;
    const isAvulso = projeto.avulso;
    const tipoLabel = isAvulso ? "Avulso" : projeto.tipoProjeto || "Projeto";

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
                "glass-card p-6 rounded-custom relative group overflow-hidden cursor-grab active:cursor-grabbing",
                isUrgente && "glow-high border-rose-500/20",
                !isUrgente && coluna.glow,
                isDragging && "opacity-30 border-dashed border-indigo-500/40"
            )}
            onClick={onClick}
        >
            {isUrgente && (
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                    <div className="w-2 h-2 rounded-full bg-rose-500 pulse-urgency shadow-[0_0_12px_rgba(244,63,94,0.6)]"></div>
                </div>
            )}
            
            {/* Imagem / Ícone Header */}
            <div className={cn(
                "relative rounded-xl overflow-hidden mb-5 group-hover:ring-2 transition-all duration-500",
                isUrgente ? "ring-rose-500/40" : (coluna.key === 'EM_ANDAMENTO' ? 'ring-neonBlue/40' : (coluna.key === 'IMPEDIDO' ? 'ring-neonPurple/40' : 'ring-primary/40'))
            )}>
                {/* Fallback Icon Container Instead of Image */}
                <div className={cn(
                    "w-full h-32 flex items-center justify-center rounded-xl relative",
                    isAvulso ? "bg-amber-500/10 border border-amber-500/20" : "bg-slate-900 border border-white/5"
                )}>
                    <span className={cn(
                        "material-symbols-outlined text-4xl", 
                        isAvulso ? "text-amber-500/40" : "text-slate-700"
                    )}>
                        {isAvulso ? "payments" : "article"}
                    </span>
                </div>
                
                {prazo && (
                    <div className={cn(
                        "absolute top-3 right-3 px-2.5 py-1.5 rounded-lg bg-dark-950/80 backdrop-blur-xl border border-white/10 text-[10px] font-black flex items-center gap-1.5 shadow-2xl",
                        prazo.vencido ? "text-rose-500" : (coluna.key === 'EM_ANDAMENTO' ? 'text-neonCyan' : 'text-primary')
                    )}>
                        <span className="material-symbols-outlined text-[12px]">calendar_month</span>
                        <span className="uppercase">Entrega: {prazo.texto}</span>
                    </div>
                )}
                <div className="action-overlay absolute inset-0 bg-dark-950/70 backdrop-blur-sm flex items-center justify-center gap-4">
                    <button className={cn("w-12 h-12 bg-white/10 rounded-full flex items-center justify-center transition-all shadow-2xl hover:text-white", coluna.key === 'EM_ANDAMENTO' ? 'hover:bg-neonBlue' : 'hover:bg-primary')} title="Discussão">
                        <MessageCircle className="w-5 h-5"/>
                    </button>
                    <button className={cn("w-12 h-12 bg-white/10 rounded-full flex items-center justify-center transition-all shadow-2xl hover:text-white", coluna.key === 'EM_ANDAMENTO' ? 'hover:bg-neonBlue' : 'hover:bg-primary')} title="Visualizar">
                        <Eye className="w-5 h-5"/>
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                <span className={cn(
                    "text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider",
                    isAvulso ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-neonBlue/10 text-neonBlue border-neonBlue/20"
                )}>
                    {tipoLabel}
                </span>
                <span className={cn(
                    "text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider",
                    isUrgente ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-primary/10 text-primary border-primary/20",
                    coluna.key === 'EM_ANDAMENTO' && !isUrgente ? "bg-neonCyan/10 text-neonCyan border-neonCyan/20" : ""
                )}>
                    {isUrgente ? "Alta Prioridade" : coluna.label}
                </span>
            </div>

            <h4 className="font-bold text-[15px] leading-tight mb-5 text-slate-100 group-hover:text-primary transition-colors line-clamp-2">
                {projeto.nome}
            </h4>

            {projeto.status !== "CANCELADO" && (
                <div className="space-y-4 mb-5">
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        <span className="flex items-center gap-2">Etapas do Workflow: <span className={cn(
                            coluna.key === "NAO_INICIADO" ? "text-slate-400" :
                            coluna.key === "EM_ANDAMENTO" ? "text-neonCyan" :
                            coluna.key === "IMPEDIDO" ? "text-neonPurple" : "text-emerald-400"
                        )}>{etapas[etapaIdx]?.label || "Pendente"}</span></span>
                    </div>
                    <div className="flex gap-1.5 items-center">
                        {etapas.map((_, i) => {
                            const est = estados[i]?.estado;
                            const isAtiva = est === "done" || est === "active";
                            const colorClass = coluna.key === "EM_ANDAMENTO" ? "text-neonCyan bg-neonCyan/40" : (coluna.key === "IMPEDIDO" ? "text-neonPurple bg-neonPurple/40" : "text-primary bg-primary/40");
                            
                            return (
                                <div key={i} className="flex-1 flex gap-1.5 items-center">
                                    <div className={cn(
                                        "workflow-step-bullet shrink-0", 
                                        isAtiva ? cn("active", colorClass.split(" ")[0]) : ""
                                    )}></div>
                                    {i < etapas.length - 1 && (
                                        <div className="flex-1 h-0.5 rounded-full relative overflow-hidden bg-white/5">
                                            {isAtiva && <div className={cn("absolute inset-0", colorClass.split(" ")[1])}></div>}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between pt-5 border-t border-white/5 mt-auto">
                <div className="flex items-center space-x-[-8px]">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-[10px] font-black z-10 shadow-lg" title="Usuário Atribuído">
                        JD
                    </div>
                </div>
                {proxima && projeto.status !== "CONCLUIDO" && (
                    <div className="flex items-center gap-2 text-right">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Próximo na Fila</span>
                            <span className={cn(
                                "text-[8px] font-bold uppercase",
                                proxima.key === 'CONCLUIDO' ? 'text-emerald-400' : 'text-neonPurple'
                            )}>{proxima.label}</span>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onMover(projeto.id, proxima.key); }}
                            className={cn(
                                "w-6 h-6 rounded-full border opacity-70 hover:opacity-100 transition-opacity flex items-center justify-center",
                                proxima.key === 'CONCLUIDO' ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-neonPurple/40 bg-neonPurple/10'
                            )}
                        >
                            <ArrowRight className={cn("w-3 h-3", proxima.key === 'CONCLUIDO' ? "text-emerald-400" : "text-neonPurple")} />
                        </button>
                    </div>
                )}
                {projeto.status === "CONCLUIDO" && (
                     <div className="flex items-center gap-2 text-right">
                         <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                            <Rocket className="w-3.5 h-3.5 text-emerald-400"/>
                        </div>
                     </div>
                )}
            </div>
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
    
    // Calcula valor da coluna 
    const valorColuna = projetosDaColuna.reduce((acc, p) => acc + (p.valorAvulso || 0), 0);
    // Em Produção você usaria o valor real dos contratos se necessário, aqui usamos o Avulso como mockup

    return (
        <div
            className="w-[360px] flex flex-col h-full shrink-0"
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
            <div className="flex items-center justify-between mb-8 px-4">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className={cn("uppercase text-[11px] font-black tracking-[0.25em]", coluna.color)}>
                            {coluna.label}
                        </span>
                        <span className={cn(
                            "text-[10px] font-black px-2 py-0.5 rounded-full border", 
                            coluna.bg, coluna.borderCol, coluna.color
                        )}>
                            {projetosDaColuna.length}
                        </span>
                    </div>
                    {valorColuna > 0 && (
                        <span className="text-xs font-bold text-emerald-400/80 mt-1">
                            Vlr: {fmt(valorColuna)}
                        </span>
                    )}
                </div>
                <button 
                    onClick={() => abrirModalNovo(coluna.key)}
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-slate-500 hover:text-white"
                >
                    <Plus className="w-5 h-5"/>
                </button>
            </div>
            
            <div className={cn(
                "flex-1 overflow-y-auto space-y-6 pr-4 kanban-column custom-scrollbar relative",
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
                    <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-custom text-slate-600 opacity-50">
                        <FolderKanban className="w-6 h-6 mb-2" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Sem Tarefas</span>
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
    
    // Controle do Modal Global de Novo Projeto
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
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                    <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-xl" />
                </div>
                <span className="text-slate-400 text-sm font-bold uppercase tracking-wider animate-pulse">
                    Carregando Comando...
                </span>
            </div>
        );
    }

    // Calculos Header
    const totalPipeline = projetos.reduce((acc, p) => acc + (p.valorAvulso || 0), 0) || 248500; // Mock se n tiver nada
    const disputas = projetos.filter(p => p.status === 'IMPEDIDO').length;

    return (
        <div className="flex flex-col h-full -mx-4 sm:-mx-8 -my-8 z-10 w-[calc(100%+2rem)] sm:w-[calc(100%+4rem)] overflow-hidden relative">
            {/* Glowing Background Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[120px] mix-blend-screen"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-neonBlue/10 blur-[100px] mix-blend-screen"></div>
            </div>

            {/* BEGIN: TopHeader Substituindo App Header para o Kanban */}
            <header className="relative z-10 h-20 border-b border-white/5 flex items-center justify-between px-10 shrink-0 glass" data-purpose="board-header">
                <div className="flex items-center gap-8">
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Dashboard de Produção</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Kanban Ativo</span>
                            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">{projetos.length} Tarefas</span>
                        </div>
                    </div>
                    <div className="h-8 w-px bg-white/10 mx-2"></div>
                    <div className="flex -space-x-2">
                        <div className="w-9 h-9 rounded-full border-2 border-dark-950 ring-1 ring-white/10 bg-neonBlue flex items-center justify-center text-white text-[10px] font-bold z-20">JD</div>
                        <div className="w-9 h-9 rounded-full border-2 border-dark-950 ring-1 ring-white/10 bg-primary flex items-center justify-center text-white text-[10px] font-bold z-10">MR</div>
                        <div className="w-9 h-9 rounded-full border-2 border-dark-950 ring-1 ring-white/10 bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400 z-0">+8</div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={carregarProjetos} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-slate-500 hover:text-white" title="Atualizar">
                        <RefreshCw className="w-4 h-4"/>
                    </button>
                    <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Modo Foco</span>
                        <button className="w-8 h-4 bg-slate-700 rounded-full relative transition-all">
                            <div className="absolute left-1 top-1 w-2 h-2 bg-white rounded-full"></div>
                        </button>
                    </div>
                    <button className="flex items-center gap-2 px-5 py-2.5 text-sm bg-white/5 hover:bg-white/10 rounded-custom border border-white/10 transition-all opacity-50 cursor-not-allowed">
                        <LineChart className="w-4 h-4" />
                        <span className="font-bold text-slate-200">Análises</span>
                    </button>
                    <button onClick={() => abrirModalNovo("NAO_INICIADO")} className="flex items-center gap-2 px-6 py-2.5 text-sm bg-primary hover:bg-brand-light rounded-custom font-black shadow-xl shadow-primary/25 transition-all">
                        <span className="material-symbols-outlined !text-[18px]">add</span>
                        <span>Nova Tarefa</span>
                    </button>
                </div>
            </header>

            {/* BEGIN: Stats Overview */}
            <section className="px-10 pt-10 grid grid-cols-4 gap-6 shrink-0">
                <div className="glass p-6 rounded-custom border-l-4 border-l-neonBlue">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">Valor Total do Pipeline</p>
                    <div className="flex items-end justify-between">
                        <h3 className="text-2xl font-black text-white">{fmt(totalPipeline)}</h3>
                        <span className="text-emerald-400 text-xs font-bold">Ativo</span>
                    </div>
                </div>
                <div className="glass p-6 rounded-custom border-l-4 border-l-neonPurple">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">Tarefas Concluídas</p>
                    <div className="flex items-end justify-between">
                        <h3 className="text-2xl font-black text-white">{projetos.filter(p=>p.status==="CONCLUIDO").length}<span className="text-sm font-normal text-slate-400 ml-1">t</span></h3>
                        <span className="text-slate-400 text-xs font-bold">Done</span>
                    </div>
                </div>
                <div className="glass p-6 rounded-custom border-l-4 border-l-neonCyan">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">Capacidade da Agência</p>
                    <div className="flex items-end justify-between">
                        <h3 className="text-2xl font-black text-white">92<span className="text-sm font-normal text-slate-400 ml-1">%</span></h3>
                        <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-neonCyan w-[92%] progress-glow"></div>
                        </div>
                    </div>
                </div>
                <div className="glass p-6 rounded-custom border-l-4 border-l-rose-500">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">Disputas Abertas</p>
                    <div className="flex items-end justify-between">
                        <h3 className="text-2xl font-black text-white">{String(disputas).padStart(2,'0')}</h3>
                        {disputas > 0 ? (
                            <span className="text-rose-400 text-[10px] font-black px-2 py-0.5 bg-rose-500/10 rounded-full border border-rose-500/20 uppercase">Alerta Alto</span>
                        ) : (
                           <span className="text-emerald-400 text-[10px] font-black px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 uppercase">Limpo</span>
                        )}
                    </div>
                </div>
            </section>

            {/* BEGIN: KanbanBoard with full scroll */}
            <section className="flex-1 overflow-x-auto p-10 custom-scrollbar" data-purpose="kanban-view">
                <div className="flex gap-10 h-full min-w-max">
                    {COLUNAS.map(col => {
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
                    
                    {/* Add New Column (Decorative) */}
                    <div className="w-[360px] flex flex-col h-full border-2 border-dashed border-white/5 rounded-custom items-center justify-center text-slate-600 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group shrink-0" onClick={() => toast("Criação de estágios em breve!")}>
                        <CirclePlus className="w-10 h-10 mb-3 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-[0.3em]">Novo Estágio</span>
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
