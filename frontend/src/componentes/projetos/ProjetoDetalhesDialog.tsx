import { useState, useEffect } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Clock, Loader2, AlertTriangle, CheckCircle2,
    XCircle, FolderKanban, Sparkles,
    Save, Trash2, CalendarDays, User, FileText
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { projetosApi, type Projeto } from "../../servicos/api";
import { SmartEditor } from "../ui/SmartEditor";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// @Agent: UI/UX Designer (AUID) + ASP — Detalhes do Projeto "Tipo Trello"

interface Props {
    projetoId: string | null;
    aberto: boolean;
    onClose: () => void;
    onProjetoAtualizado: () => void;
}

const STATUS_OPTIONS = [
    { value: "NAO_INICIADO", label: "A Iniciar", icon: <Clock className="w-3.5 h-3.5" />, color: "text-zinc-500", bg: "bg-zinc-500/10 border-zinc-500/20" },
    { value: "EM_ANDAMENTO", label: "Em Andamento", icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { value: "IMPEDIDO", label: "Impedido", icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    { value: "CONCLUIDO", label: "Concluído", icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { value: "CANCELADO", label: "Cancelado", icon: <XCircle className="w-3.5 h-3.5" />, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
];

export function ProjetoDetalhesDialog({ projetoId, aberto, onClose, onProjetoAtualizado }: Props) {
    const [projeto, setProjeto] = useState<Projeto | null>(null);
    const [carregando, setCarregando] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [descricaoEdit, setDescricaoEdit] = useState("");
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (aberto && projetoId) {
            buscarProjeto();
        } else {
            setProjeto(null);
            setDescricaoEdit("");
        }
    }, [aberto, projetoId]);

    async function buscarProjeto() {
        if (!projetoId) return;
        setCarregando(true);
        try {
            // Reutilizando listar e filtrando (ou criar endpoint getById se necessário)
            // Por enquanto, o listar do backend retorna todos, vou filtrar no front.
            const todos = await projetosApi.listar();
            const p = todos.find(x => x.id === projetoId);
            if (p) {
                setProjeto(p);
                setDescricaoEdit(p.descricao || "");
                setHasChanges(false);
            }
        } catch (e: any) {
            toast.error("Erro ao carregar projeto.");
        } finally {
            setCarregando(false);
        }
    }

    async function salvarDescricao() {
        if (!projeto) return;
        setSalvando(true);
        try {
            await projetosApi.atualizar(projeto.id, { descricao: descricaoEdit });
            toast.success("Descrição atualizada!");
            setHasChanges(false);
            onProjetoAtualizado();
        } catch (e: any) {
            toast.error("Erro ao atualizar descrição.");
        } finally {
            setSalvando(false);
        }
    }

    async function atualizarStatus(novoStatus: string) {
        if (!projeto) return;
        try {
            await projetosApi.moverStatus(projeto.id, novoStatus);
            setProjeto({ ...projeto, status: novoStatus });
            onProjetoAtualizado();
            toast.success("Status atualizado!");
        } catch (e: any) {
            toast.error("Erro ao mudar status.");
        }
    }

    if (!projeto && carregando) {
        return (
            <Dialog open={aberto} onOpenChange={onClose}>
                <DialogContent className="bg-zinc-900 border-white/10 flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                </DialogContent>
            </Dialog>
        );
    }

    if (!projeto) return null;

    const statusObj = STATUS_OPTIONS.find(s => s.value === projeto.status) || STATUS_OPTIONS[0];

    return (
        <Dialog open={aberto} onOpenChange={onClose}>
            <DialogContent className="bg-zinc-900 border-white/10 shadow-2xl shadow-black/60 max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
                <DialogHeader className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${projeto.avulso ? "bg-amber-500/10" : "bg-indigo-500/10"}`}>
                                {projeto.avulso ? <Sparkles className="w-6 h-6 text-amber-500" /> : <FolderKanban className="w-6 h-6 text-indigo-400" />}
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-zinc-100 leading-tight">
                                    {projeto.nome}
                                </DialogTitle>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                                        na lista <Badge variant="outline" className="text-[10px] py-0 border-white/10 bg-zinc-800">{statusObj.label}</Badge>
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <Select value={projeto.status} onValueChange={atualizarStatus}>
                                <SelectTrigger className={`h-8 border-white/10 bg-zinc-800 text-xs w-[140px] ${statusObj.color}`}>
                                    <div className="flex items-center gap-2">
                                        {statusObj.icon}
                                        <SelectValue />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-white/10">
                                    {STATUS_OPTIONS.map(s => (
                                        <SelectItem key={s.value} value={s.value} className={s.color}>
                                            <div className="flex items-center gap-2">
                                                {s.icon} {s.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
                    {/* Conteúdo Principal (3/4) */}
                    <div className="md:col-span-3 space-y-6">

                        {/* Descrição / Detalhes */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Descrição e Notas
                                </h3>
                                {hasChanges && (
                                    <Button
                                        size="sm"
                                        onClick={salvarDescricao}
                                        disabled={salvando}
                                        className="h-7 bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 text-xs"
                                    >
                                        {salvando ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                        Salvar Alterações
                                    </Button>
                                )}
                            </div>

                            <SmartEditor
                                value={descricaoEdit}
                                onChange={(val) => {
                                    setDescricaoEdit(val);
                                    setHasChanges(true);
                                }}
                                placeholder="Adicione uma descrição detalhada, links de assets, referências do Trello..."
                                className="min-h-[200px]"
                            />
                        </div>

                    </div>

                    {/* Barra Lateral (1/4) */}
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Contexto</h4>

                            <div className="space-y-3">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-zinc-500 flex items-center gap-1.5 uppercase font-bold">
                                        <User className="w-3 h-3" /> Cliente
                                    </span>
                                    <p className="text-sm text-zinc-200 font-medium">
                                        {projeto.cliente?.nome || projeto.contrato?.cliente?.nome || "Não definido"}
                                    </p>
                                </div>

                                {!projeto.avulso && projeto.contrato && (
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] text-zinc-500 flex items-center gap-1.5 uppercase font-bold">
                                            <FileText className="w-3 h-3" /> Contrato
                                        </span>
                                        <p className="text-sm text-zinc-200 truncate">
                                            {projeto.contrato.titulo}
                                        </p>
                                    </div>
                                )}

                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-zinc-500 flex items-center gap-1.5 uppercase font-bold">
                                        <CalendarDays className="w-3 h-3" /> Prazo
                                    </span>
                                    <p className="text-sm text-zinc-200">
                                        {projeto.prazoEstimado ? new Date(projeto.prazoEstimado).toLocaleDateString("pt-BR") : "Sem prazo"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-white/5">
                            <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Ações</h4>
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-2 h-9 border-white/5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 group"
                                onClick={() => {
                                    if (confirm("Deseja realmente excluir este projeto?")) {
                                        projetosApi.deletar(projeto.id).then(() => {
                                            toast.success("Projeto excluído.");
                                            onProjetoAtualizado();
                                            onClose();
                                        });
                                    }
                                }}
                            >
                                <Trash2 className="w-4 h-4" />
                                <span className="text-xs">Excluir Projeto</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
