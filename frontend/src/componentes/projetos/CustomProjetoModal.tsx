import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import { projetosApi, type Projeto, type ComentarioProjeto } from "../../servicos/api";
import { SmartEditor } from "../ui/SmartEditor";
import {
    ETAPAS_PADRAO,
    ETAPAS_SOCIAL,
    ETAPAS_VIDEO,
    buildEstados,
    type Etapa,
    type WorkflowEtapaState
} from "./WorkflowEtapas";

// Utility
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface Props {
    projetoId: string | null;
    aberto: boolean;
    onClose: () => void;
    onProjetoAtualizado: () => void;
}

const STATUS_OPTIONS = [
    { value: "NAO_INICIADO", label: "Pendente" },
    { value: "EM_ANDAMENTO", label: "Em Execução" },
    { value: "IMPEDIDO", label: "Garantia de Qualidade" },
    { value: "CONCLUIDO", label: "Concluído" },
    { value: "CANCELADO", label: "Cancelado" },
];

function selecionarEtapas(projeto: Projeto): Etapa[] {
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

const formatCurrency = (value: number) => {
    return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
};

function calcularDiasRestantes(prazo?: string) {
    if (!prazo) return null;
    const diffTime = new Date(prazo).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

function getInitials(name?: string) {
    if (!name) return "JD";
    return name.split(" ").slice(0, 2).map((p: string) => p[0]).join("").toUpperCase();
}

export function CustomProjetoModal({ projetoId, aberto, onClose, onProjetoAtualizado }: Props) {
    const [projeto, setProjeto] = useState<Projeto | null>(null);
    const [comentarios, setComentarios] = useState<ComentarioProjeto[]>([]);
    const [novoComentario, setNovoComentario] = useState("");
    const [enviandoComentario, setEnviandoComentario] = useState(false);

    const [carregando, setCarregando] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [descricaoEdit, setDescricaoEdit] = useState("");
    const [hasChanges, setHasChanges] = useState(false);

    const [activeTab, setActiveTab] = useState<"descricao" | "briefing">("descricao");

    useEffect(() => {
        if (aberto && projetoId) {
            buscarProjetoEComentarios();
        } else {
            setProjeto(null);
            setComentarios([]);
            setDescricaoEdit("");
        }
    }, [aberto, projetoId]);

    async function buscarProjetoEComentarios() {
        if (!projetoId) return;
        setCarregando(true);
        try {
            const todos = await projetosApi.listar();
            const p = todos.find(x => x.id === projetoId);
            if (p) {
                setProjeto(p);
                setDescricaoEdit(p.descricao || "");
                setHasChanges(false);
            }

            const listaComentarios = await projetosApi.listarComentarios(projetoId);
            setComentarios(listaComentarios);
        } catch {
            toast.error("Erro ao carregar dados do projeto.");
        } finally {
            setCarregando(false);
        }
    }

    async function salvarAlteracoes() {
        if (!projeto) return;
        if (!hasChanges) {
            toast.info("Nenhuma alteração na descrição para salvar.");
            return;
        }
        setSalvando(true);
        try {
            await projetosApi.atualizar(projeto.id, { descricao: descricaoEdit });
            toast.success("Projeto atualizado com sucesso!");
            setHasChanges(false);
            onProjetoAtualizado();
        } catch {
            toast.error("Erro ao atualizar projeto.");
        } finally {
            setSalvando(false);
        }
    }

    async function atualizarStatus(novoStatus: string) {
        if (!projeto) return;
        try {
            const status = novoStatus as "NAO_INICIADO" | "EM_ANDAMENTO" | "IMPEDIDO" | "CONCLUIDO" | "CANCELADO";
            await projetosApi.moverStatus(projeto.id, status);
            setProjeto({ ...projeto, status });
            onProjetoAtualizado();
            toast.success("Status atualizado!");
        } catch {
            toast.error("Erro ao mudar status.");
        }
    }

    async function enviarComentario() {
        if (!projeto || !novoComentario.trim()) return;
        setEnviandoComentario(true);
        try {
            const com = await projetosApi.adicionarComentario(projeto.id, novoComentario.trim());
            setComentarios(prev => [...prev, com]);
            setNovoComentario("");
        } catch {
            toast.error("Erro ao enviar comentário.");
        } finally {
            setEnviandoComentario(false);
        }
    }

    async function avancarEtapaWorkflow() {
        if (!projeto) return;
        const etapas = selecionarEtapas(projeto);
        const atual = projeto.etapaAtual ?? 0;
        if (atual < etapas.length - 1) {
            try {
                await projetosApi.atualizar(projeto.id, { etapaAtual: atual + 1 });
                setProjeto({ ...projeto, etapaAtual: atual + 1 });
                onProjetoAtualizado();
                toast.success("Etapa concluída e equipe notificada!");
            } catch {
                toast.error("Erro ao avançar etapa.");
            }
        } else {
            toast.info("Projeto já está na última etapa.");
        }
    }

    async function excluirProjeto() {
        if (!projeto) return;
        if (confirm("Tem certeza que deseja excluir esta tarefa permanentemente?")) {
            try {
                await projetosApi.deletar(projeto.id);
                toast.success("Tarefa excluída.");
                onProjetoAtualizado();
                onClose();
            } catch {
                toast.error("Erro ao excluir tarefa.");
            }
        }
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (aberto) window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [aberto, onClose]);

    if (!aberto) return null;

    const vinculoOrigem = projeto
        ? (projeto.avulso ? projeto.cliente?.nome : projeto.contrato?.cliente?.nome) || "Cliente não informado"
        : "...";
    
    let etapas: Etapa[] = [];
    let estados: WorkflowEtapaState[] = [];
    if (projeto) {
        etapas = selecionarEtapas(projeto);
        estados = buildEstados(etapas, projeto.etapaAtual ?? 0);
    }
    const diasRestantes = calcularDiasRestantes(projeto?.prazoEstimado);

    return (
        <AnimatePresence>
            {aberto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-dark-950/80 backdrop-blur-md"
                    />

                    {/* Drawer Principal */}
                    <motion.main
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="relative bg-card/80 backdrop-blur-3xl w-full max-w-[1300px] rounded-custom shadow-soft border border-border overflow-hidden flex flex-col lg:flex-row h-[90vh] lg:h-[920px] max-h-screen my-auto z-10"
                        data-purpose="task-detail-container"
                    >
                        {carregando || !projeto ? (
                            <div className="flex-1 flex items-center justify-center p-12">
                                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <>
                                {/* Main Content Area */}
                                <section className="flex-1 p-6 lg:p-8 overflow-y-auto border-b lg:border-b-0 lg:border-r border-border scroll-smooth custom-scrollbar" data-purpose="task-main-info">
                                    <div className="flex items-center justify-between mb-8 text-xs font-bold uppercase tracking-widest text-zinc-500">
                                        <div className="flex items-center gap-2">
                                            <span className="hover:text-primary cursor-pointer transition-colors max-w-[150px] truncate">{vinculoOrigem}</span>
                                            <span className="text-zinc-700">/</span>
                                            <span className="text-primary truncate max-w-[150px]">{projeto.avulso ? "Avulso" : projeto.contrato?.titulo || "Projeto"}</span>
                                        </div>
                                        <button onClick={onClose} className="hover:text-white transition-colors bg-zinc-800/50 p-1.5 rounded-full">
                                            <span className="material-symbols-outlined !text-[18px]">close</span>
                                        </button>
                                    </div>

                                    <div className="mb-10">
                                        <h1 className="text-3xl font-extrabold text-white mb-4 leading-tight tracking-tight">
                                            {projeto.nome}
                                        </h1>
                                        <div className="flex flex-wrap items-center gap-4 text-xs">
                                            <span className={cn(
                                                "flex items-center gap-1.5 px-3 py-1 rounded-full border font-bold uppercase tracking-wider",
                                                projeto.status === 'CONCLUIDO' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                                projeto.status === 'EM_ANDAMENTO' ? "bg-neonCyan/10 text-neonCyan border-neonCyan/20" :
                                                projeto.status === 'IMPEDIDO' ? "bg-neonPurple/10 text-neonPurple border-neonPurple/20" :
                                                "bg-zinc-800 text-zinc-400 border-zinc-700"
                                            )}>
                                                {projeto.status === 'EM_ANDAMENTO' && <span className="w-1.5 h-1.5 rounded-full bg-neonCyan animate-pulse"></span>}
                                                {projeto.status === 'CONCLUIDO' && <span className="material-symbols-outlined !text-[12px]">check</span>}
                                                {STATUS_OPTIONS.find(o => o.value === projeto.status)?.label || projeto.status}
                                            </span>
                                            {projeto.prazoEstimado && (
                                                <div className={cn(
                                                    "flex items-center gap-2 font-bold",
                                                    (diasRestantes !== null && diasRestantes < 0) ? "text-red-400" :
                                                    (diasRestantes !== null && diasRestantes <= 3) ? "text-amber-400" : "text-zinc-400"
                                                )}>
                                                    <span className="material-symbols-outlined !text-[16px]">calendar_today</span>
                                                    <span>Prazo: {new Date(projeto.prazoEstimado).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Workflow Section */}
                                    {projeto.status !== "CANCELADO" && (
                                        <div className="mb-10" data-purpose="workflow-stepper">
                                            <div className="flex items-center justify-between mb-6">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Fluxo de Trabalho</label>
                                                <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1">
                                                    <span className="material-symbols-outlined !text-[14px]">settings</span> Configurar Etapas
                                                </button>
                                            </div>
                                            <div className="relative flex justify-between items-start">
                                                {/* Timeline connector */}
                                                <div className="absolute top-[18px] left-[5%] right-[5%] h-px bg-zinc-800 -z-0"></div>
                                                
                                                {etapas.map((etapa, idx) => {
                                                    const estado = estados[idx].estado;
                                                    const feito = estado === "done";
                                                    const ativo = estado === "active";

                                                    return (
                                                        <div key={etapa.id} className="relative z-10 flex flex-col items-center group flex-1">
                                                            <div className={cn(
                                                                "w-9 h-9 rounded-full border-2 flex items-center justify-center mb-3 transition-transform group-hover:scale-110",
                                                                feito ? "step-completed" : ativo ? "step-active" : "step-pending"
                                                            )}>
                                                                {feito ? (
                                                                    <span className="material-symbols-outlined !text-[18px]">check</span>
                                                                ) : (
                                                                    <span className="text-[11px] font-black">{String(idx + 1).padStart(2, '0')}</span>
                                                                )}
                                                            </div>
                                                            <span className={cn(
                                                                "text-[10px] font-bold uppercase tracking-tighter text-center",
                                                                ativo ? "text-white" : feito ? "text-zinc-400" : "text-zinc-600"
                                                            )}>{etapa.label}</span>
                                                            <span className={cn(
                                                                "text-[9px] font-medium mt-1 text-center",
                                                                ativo ? "text-primary" : feito ? "text-emerald-500" : "text-zinc-600"
                                                            )}>
                                                                {ativo ? "Em Andamento" : feito ? "Concluído" : "Pendente"}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            
                                            {projeto.status !== "CONCLUIDO" && (
                                                <div className="mt-8 flex justify-center">
                                                    <button onClick={avancarEtapaWorkflow} className="flex items-center gap-2 bg-primary hover:bg-brand-light text-white px-8 py-3 rounded-lg text-xs font-black tracking-widest transition-all shadow-xl shadow-primary/30 group">
                                                        <span>CONCLUIR ETAPA E NOTIFICAR PRÓXIMO</span>
                                                        <span className="material-symbols-outlined !text-[18px] group-hover:translate-x-1 transition-transform">send</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Tabs Navigation & Description */}
                                    <div className="mb-8" data-purpose="rich-text-description">
                                        <div className="flex items-center gap-8 border-b border-border mb-6">
                                            <button 
                                                onClick={() => setActiveTab("descricao")} 
                                                className={cn("pb-4 text-[11px] font-black uppercase tracking-widest transition-colors", activeTab === "descricao" ? "tab-active" : "text-zinc-500 hover:text-zinc-300")}
                                            >
                                                Descrição da Task
                                            </button>
                                            <button 
                                                onClick={() => setActiveTab("briefing")}
                                                className={cn("pb-4 text-[11px] font-black uppercase tracking-widest transition-colors", activeTab === "briefing" ? "tab-active" : "text-zinc-500 hover:text-zinc-300")}
                                            >
                                                Briefing / Materiais
                                            </button>
                                        </div>
                                        
                                        {activeTab === "descricao" && (
                                            <div className="bg-surface/50 border border-border rounded-custom p-1 min-h-[140px] text-zinc-300 leading-relaxed text-sm focus-within:border-primary/50 transition-colors">
                                                <SmartEditor
                                                    value={descricaoEdit}
                                                    onChange={(val) => {
                                                        setDescricaoEdit(val);
                                                        setHasChanges(true);
                                                    }}
                                                    placeholder="Descreva os detalhes e os requisitos da tarefa aqui..."
                                                    className="min-h-[200px] bg-transparent border-0 ring-0 focus-visible:ring-0 px-4 py-4 prose prose-invert prose-p:my-2 prose-ul:my-2"
                                                />
                                            </div>
                                        )}

                                        {activeTab === "briefing" && (
                                            <div className="bg-surface/50 border border-border rounded-custom p-6 min-h-[140px] flex items-center justify-center text-zinc-500 text-sm">
                                                Nenhum material de briefing anexado diretamente.
                                            </div>
                                        )}

                                        <div className="mt-3 flex gap-4 items-center">
                                            <span className="text-[10px] text-zinc-500 tracking-wider uppercase font-bold">
                                                {hasChanges ? <span className="text-amber-500">Alterações não salvas</span> : "Tudo salvo!"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Attachments (Mocked) */}
                                    <div className="mb-10" data-purpose="task-attachments">
                                        <div className="flex items-center justify-between mb-4">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Anexos (2)</label>
                                            <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">+ Adicionar</button>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="flex items-center p-4 bg-surface border border-border rounded-custom group hover:border-primary/50 transition-all cursor-pointer">
                                                <div className="w-10 h-10 bg-blue-500/10 text-blue-400 flex items-center justify-center rounded-lg mr-4 group-hover:bg-blue-500/20">
                                                    <span className="material-symbols-outlined">description</span>
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-xs font-bold text-zinc-200 truncate">Documentação_Requisitos.pdf</p>
                                                    <p className="text-[10px] text-zinc-500 uppercase font-medium">1.2 MB</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center p-4 bg-surface border border-border rounded-custom group hover:border-primary/50 transition-all cursor-pointer">
                                                <div className="w-10 h-10 bg-purple-500/10 text-purple-400 flex items-center justify-center rounded-lg mr-4 group-hover:bg-purple-500/20">
                                                    <span className="material-symbols-outlined">image</span>
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-xs font-bold text-zinc-200 truncate">mockup_referencia.png</p>
                                                    <p className="text-[10px] text-zinc-500 uppercase font-medium">3.4 MB</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Activity & Comments */}
                                    <div data-purpose="activity-and-comments">
                                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-6">Atividade & Comentários</label>
                                        
                                        <div className="flex gap-4 mb-8">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-purple-400 flex items-center justify-center font-black text-[11px] text-white shrink-0 shadow-lg shadow-primary/20">YOU</div>
                                            <div className="flex-1">
                                                <div className="relative">
                                                    <textarea 
                                                        value={novoComentario}
                                                        onChange={e => setNovoComentario(e.target.value)}
                                                        className="w-full bg-surface border-border rounded-custom focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm min-h-[80px] p-4 transition-all placeholder:text-zinc-600 custom-scrollbar resize-none outline-none" 
                                                        placeholder="Escreva um comentário (use @ para mencionar)..."
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter" && !e.shiftKey) {
                                                                e.preventDefault();
                                                                enviarComentario();
                                                            }
                                                        }}
                                                    />
                                                    <div className="flex justify-end mt-3">
                                                        <button 
                                                            disabled={!novoComentario.trim() || enviandoComentario}
                                                            onClick={enviarComentario}
                                                            className="flex items-center justify-center bg-primary hover:bg-brand-light text-white px-6 py-2 rounded-lg text-xs font-black tracking-widest transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                                                        >
                                                            {enviandoComentario ? "..." : "POSTAR COMENTÁRIO"}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            {comentarios.length === 0 ? (
                                                <p className="text-[11px] text-zinc-500 text-center font-bold uppercase tracking-widest border border-dashed border-border py-8 rounded-custom">Sem histórico de atividades</p>
                                            ) : (
                                                comentarios.map((com, index) => {
                                                    // Determinate colors via hash for different user initials
                                                    const initials = getInitials(com.usuario?.nome || "Sistema");
                                                    return (
                                                        <div key={com.id} className="flex gap-4">
                                                            <div className={cn(
                                                                "w-9 h-9 rounded-full flex items-center justify-center font-black text-[11px] text-white shrink-0 shadow-lg",
                                                                index % 2 === 0 ? "bg-orange-500 shadow-orange-500/20" : "bg-blue-500 shadow-blue-500/20"
                                                            )}>{initials}</div>
                                                            <div className="bg-surface border border-border p-4 rounded-custom flex-1 group">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs font-black text-white">{com.usuario?.nome || "Sistema"}</span>
                                                                        <span className="text-[10px] text-zinc-500 font-bold">• {new Date(com.criadoEm).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                                                    </div>
                                                                    <button className="opacity-0 group-hover:opacity-100 transition-opacity"><span className="material-symbols-outlined !text-sm text-zinc-500">more_horiz</span></button>
                                                                </div>
                                                                <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">
                                                                    {com.texto}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            )}
                                        </div>
                                    </div>
                                </section>

                                {/* Sidebar Panel */}
                                <aside className="w-full lg:w-[420px] bg-zinc-900/50 p-6 lg:p-8 flex flex-col gap-8 overflow-y-auto custom-scrollbar" data-purpose="project-details-panel">
                                    
                                    {/* Client & Contract */}
                                    <div className="bg-card border border-border p-6 rounded-custom shadow-sm" data-purpose="client-contract-fields">
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 mb-6">
                                            <span className="material-symbols-outlined !text-[18px]">corporate_fare</span>
                                            Cliente & Contrato
                                        </h3>
                                        <div className="grid grid-cols-1 gap-5">
                                            <div>
                                                <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Nome do Cliente</label>
                                                <p className="text-sm font-extrabold text-white">{vinculoOrigem}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Nº do Contrato / Ref</label>
                                                    <p className="text-xs font-bold text-zinc-300">
                                                        {projeto.contrato ? projeto.contrato.titulo : "Projeto Avulso"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Valor Relacionado</label>
                                                    <p className="text-xs font-black text-emerald-400">{formatCurrency(projeto.valorAvulso || 0)}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2">Contato Principal (Exemplo)</label>
                                                <div className="flex items-center gap-3 bg-surface/80 p-2 rounded-lg border border-zinc-800">
                                                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-[9px] font-black text-white">MK</div>
                                                    <div>
                                                        <p className="text-xs font-bold text-zinc-200 leading-none">Marcus Knight</p>
                                                        <p className="text-[9px] text-zinc-500 mt-1">Gerente de Contas</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Task Controls */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Status da Task</label>
                                            <select 
                                                value={projeto.status}
                                                onChange={(e) => atualizarStatus(e.target.value)}
                                                className="w-full bg-card border-border rounded-lg text-[11px] uppercase font-black tracking-wider focus:ring-2 focus:ring-primary/20 focus:border-primary py-2.5 px-3 text-zinc-200 outline-none"
                                            >
                                                {STATUS_OPTIONS.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Membros</label>
                                            <div className="flex -space-x-2.5">
                                                <div className="w-9 h-9 rounded-full border-2 border-card bg-primary flex items-center justify-center text-[10px] font-black text-white hover:z-10 transition-all cursor-pointer">
                                                    {getInitials("Produtor")}
                                                </div>
                                                <button className="w-9 h-9 rounded-full border-2 border-dashed border-zinc-700 bg-zinc-800/50 flex items-center justify-center text-zinc-500 hover:text-primary hover:border-primary transition-all">
                                                    <span className="material-symbols-outlined !text-[16px]">add</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Task Budget & Due Date */}
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="p-6 bg-gradient-to-br from-primary/20 to-purple-900/10 border border-primary/20 rounded-custom relative overflow-hidden group">
                                            <div className="relative z-10">
                                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">Orçamento da Task</label>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-3xl font-black text-white tracking-tighter">{formatCurrency(projeto.valorAvulso || 0)}</span>
                                                    <span className="text-[9px] bg-primary/30 text-primary-300 px-2 py-0.5 rounded font-black border border-primary/30 uppercase">USD</span>
                                                </div>
                                            </div>
                                            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                                <span className="material-symbols-outlined !text-8xl">payments</span>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-zinc-800/40 border border-zinc-800 rounded-custom">
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Prazo de Entrega</label>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-extrabold text-white">
                                                    {projeto.prazoEstimado ? new Date(projeto.prazoEstimado).toLocaleDateString("pt-BR", { day: '2-digit', month: 'long', year: 'numeric' }) : "Sem prazo"}
                                                </span>
                                                {(diasRestantes !== null) && (
                                                    <span className={cn(
                                                        "text-[9px] font-black px-2 py-1 rounded border uppercase",
                                                        diasRestantes < 0 ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                                        diasRestantes <= 3 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                                        "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                    )}>
                                                        {diasRestantes < 0 ? `Atrasado ${Math.abs(diasRestantes)} dias` :
                                                         diasRestantes === 0 ? "Entrega Hoje" :
                                                         `Faltam ${diasRestantes} dias`}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Other Tasks Mockup (Kept for fidelity and future implementation) */}
                                    <div className="flex flex-col gap-4" data-purpose="project-task-table">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Outras Tarefas (Exemplo)</h3>
                                            <div className="flex items-center gap-2">
                                                <button className="material-symbols-outlined !text-[16px] text-zinc-500 hover:text-white transition-colors">filter_list</button>
                                                <button className="material-symbols-outlined !text-[16px] text-zinc-500 hover:text-white transition-colors">search</button>
                                            </div>
                                        </div>
                                        <div className="bg-card/50 border border-border rounded-xl overflow-hidden">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-zinc-800/30 border-b border-border">
                                                        <th className="px-4 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Tarefa</th>
                                                        <th className="px-4 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest text-right">Valor</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-[11px] divide-y divide-border/30">
                                                    <tr className="hover:bg-primary/5 transition-colors cursor-pointer group">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                                <span className="text-zinc-200 font-bold truncate max-w-[120px]">Integração API</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-black text-zinc-300">$8.200</td>
                                                    </tr>
                                                    <tr className="hover:bg-primary/5 transition-colors cursor-pointer">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                                <span className="text-zinc-200 font-bold truncate max-w-[120px]">Auditoria Seg.</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-black text-zinc-300">$3.500</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="mt-auto space-y-5 pt-6 border-t border-border">
                                        <div className="flex flex-wrap gap-2">
                                            <span className="px-2.5 py-1 bg-zinc-800 text-zinc-500 rounded text-[9px] font-black tracking-widest">
                                                {projeto.tipoProjeto?.toUpperCase() || "PRODUÇÃO"}
                                            </span>
                                            {(diasRestantes !== null && diasRestantes <= 3) && (
                                                <span className="px-2.5 py-1 bg-red-500/10 text-red-500 rounded text-[9px] font-black tracking-widest border border-red-500/20">ALTA PRIORIDADE</span>
                                            )}
                                        </div>
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={salvarAlteracoes}
                                                disabled={!hasChanges || salvando}
                                                className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-brand-light text-white text-[11px] font-black py-3.5 rounded-lg transition-all shadow-xl shadow-primary/20 tracking-[0.1em] disabled:opacity-50"
                                            >
                                                {salvando ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
                                            </button>
                                            <button 
                                                onClick={excluirProjeto}
                                                className="w-12 h-12 flex items-center justify-center bg-surface border border-border rounded-lg text-zinc-500 hover:text-red-500 hover:border-red-500/50 transition-all"
                                                title="Excluir Projeto"
                                            >
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                    
                                </aside>
                            </>
                        )}
                    </motion.main>
                </div>
            )}
        </AnimatePresence>
    );
}
