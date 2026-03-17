import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
    Settings, Plus, Pencil, Trash2, Loader2, Package, RefreshCw,
    Tag, DollarSign, ToggleLeft, ToggleRight, Sparkles
} from "lucide-react";
import { catalogoApi, type ServicoCatalogo } from "../../servicos/api";

// @Agent: UI/UX Designer (AUID) + ASP — Tela de Configurações — Catálogo de Serviços

const servicoSchema = z.object({
    nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres."),
    descricao: z.string().optional(),
    valorPadrao: z.number({ message: "Digite um valor válido." }).min(0, "Valor não pode ser negativo."),
});
type ServicoFormValues = z.infer<typeof servicoSchema>;

// ── Formulário de Criação/Edição de Serviço ──
function ServicoForm({
    servico,
    onSucesso,
    onCancelar,
}: {
    servico?: ServicoCatalogo | null;
    onSucesso: () => void;
    onCancelar: () => void;
}) {
    const [carregando, setCarregando] = useState(false);
    const isEdit = !!servico;

    const form = useForm<ServicoFormValues>({
        resolver: zodResolver(servicoSchema),
        defaultValues: {
            nome: servico?.nome ?? "",
            descricao: servico?.descricao ?? "",
            valorPadrao: servico?.valorPadrao ?? 0,
        },
    });

    async function onSubmit(values: ServicoFormValues) {
        setCarregando(true);
        try {
            if (isEdit && servico) {
                await catalogoApi.atualizar(servico.id, values);
                toast.success("Serviço atualizado!");
            } else {
                await catalogoApi.criar({ nome: values.nome, descricao: values.descricao, valorPadrao: values.valorPadrao });
                toast.success("Serviço criado!", { description: `"${values.nome}" adicionado ao catálogo.` });
            }
            onSucesso();
        } catch (e: any) {
            toast.error("Erro ao salvar serviço.", { description: e.message });
        } finally {
            setCarregando(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="nome" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nome do Serviço *</FormLabel>
                        <FormControl>
                            <Input
                                placeholder="Ex: Post Estático, Carrossel, Reels..."
                                className="border-white/10 bg-zinc-800"
                                autoFocus
                                {...field}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="descricao" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Descrição (Opcional)</FormLabel>
                        <FormControl>
                            <Input
                                placeholder="Descrição breve do serviço..."
                                className="border-white/10 bg-zinc-800"
                                {...field}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="valorPadrao" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Valor Padrão (R$) *</FormLabel>
                        <FormControl>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                className="border-white/10 bg-zinc-800"
                                {...field}
                                onChange={e => field.onChange(e.target.valueAsNumber)}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <div className="flex gap-2 pt-1">
                    <Button
                        type="button"
                        variant="ghost"
                        className="flex-1 border border-white/10 text-zinc-400 hover:text-zinc-100"
                        onClick={onCancelar}
                        disabled={carregando}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white"
                        disabled={carregando}
                    >
                        {carregando
                            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
                            : isEdit ? "Salvar Alterações" : "Criar Serviço"
                        }
                    </Button>
                </div>
            </form>
        </Form>
    );
}

// ── Tela Principal de Configurações ──
export function ConfiguracoesPage() {
    const [servicos, setServicos] = useState<ServicoCatalogo[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [dialogAberto, setDialogAberto] = useState(false);
    const [servicoEditando, setServicoEditando] = useState<ServicoCatalogo | null>(null);
    const [removendo, setRemovendo] = useState<string | null>(null);

    const carregar = useCallback(async () => {
        setCarregando(true);
        try {
            const dados = await catalogoApi.listar();
            setServicos(dados);
        } catch (e: any) {
            toast.error("Erro ao carregar catálogo", { description: e.message });
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => { carregar(); }, [carregar]);

    async function toggleStatus(servico: ServicoCatalogo) {
        const novoStatus = servico.status === "ATIVO" ? "INATIVO" : "ATIVO";
        try {
            await catalogoApi.atualizar(servico.id, { status: novoStatus });
            setServicos(prev => prev.map(s => s.id === servico.id ? { ...s, status: novoStatus } : s));
            toast.success(`Serviço ${novoStatus === "ATIVO" ? "ativado" : "desativado"}.`);
        } catch (e: any) {
            toast.error("Erro ao alterar status.", { description: e.message });
        }
    }

    async function removerServico(id: string, nome: string) {
        if (!confirm(`Desativar o serviço "${nome}"?`)) return;
        setRemovendo(id);
        try {
            await catalogoApi.deletar(id);
            setServicos(prev => prev.filter(s => s.id !== id));
            toast.success("Serviço removido do catálogo.");
        } catch (e: any) {
            toast.error("Erro ao remover serviço.", { description: e.message });
        } finally {
            setRemovendo(null);
        }
    }

    function abrirEdicao(servico: ServicoCatalogo) {
        setServicoEditando(servico);
        setDialogAberto(true);
    }

    function fecharDialog() {
        setDialogAberto(false);
        setServicoEditando(null);
    }

    const totalAtivos = servicos.filter(s => s.status === "ATIVO").length;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header da Tela */}
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                    <Settings className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-100">Configurações</h1>
                    <p className="text-sm text-zinc-500">Gerencie o catálogo de serviços e as opções do sistema.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-zinc-900 border-white/10">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/10">
                            <Package className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Total Serviços</p>
                            <p className="text-2xl font-bold text-zinc-100">{servicos.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-white/10">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                            <ToggleRight className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Ativos</p>
                            <p className="text-2xl font-bold text-emerald-400">{totalAtivos}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Configurações do Estúdio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-zinc-900 border-white/10">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-500/10">
                                <Settings className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <CardTitle className="text-lg text-indigo-400">Dados do Estúdio</CardTitle>
                                <CardDescription>Identidade que aparecerá nos relatórios de fechamento.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Nome do Estúdio</label>
                            <Input
                                placeholder="Dukes Freela / Seu Estúdio"
                                className="bg-zinc-800 border-white/5"
                                value={localStorage.getItem("dk:studio_nome") || ""}
                                onChange={(e) => {
                                    localStorage.setItem("dk:studio_nome", e.target.value);
                                    // Hack simples para forçar re-render ou apenas persistir
                                }}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">URL do Logo (transparente preferível)</label>
                            <Input
                                placeholder="https://exemplo.com/logo.png"
                                className="bg-zinc-800 border-white/5"
                                value={localStorage.getItem("dk:studio_logo") || ""}
                                onChange={(e) => localStorage.setItem("dk:studio_logo", e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Cor Primária (Hex)</label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="#6366f1"
                                    className="bg-zinc-800 border-white/5 font-mono"
                                    value={localStorage.getItem("dk:studio_cor") || "#6366f1"}
                                    onChange={(e) => localStorage.setItem("dk:studio_cor", e.target.value)}
                                />
                                <div
                                    className="w-10 h-10 rounded-lg border border-white/10"
                                    style={{ backgroundColor: localStorage.getItem("dk:studio_cor") || "#6366f1" }}
                                />
                            </div>
                        </div>
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-500 mt-2" onClick={() => toast.success("Configurações salvas localmente!")}>
                            Salvar Identidade
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-white/10 overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
                    <CardHeader>
                        <CardTitle className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Preview no Relatório</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-center p-6">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center mb-4">
                            {localStorage.getItem("dk:studio_logo") ? (
                                <img src={localStorage.getItem("dk:studio_logo")!} className="w-10 h-10 object-contain" />
                            ) : (
                                <Sparkles className="w-8 h-8 text-indigo-500/20" />
                            )}
                        </div>
                        <h4 className="text-xl font-bold text-zinc-100">{localStorage.getItem("dk:studio_nome") || "Nome do Estúdio"}</h4>
                        <p className="text-xs text-zinc-500 mt-2 max-w-[200px]">Estes dados serão aplicados automaticamente aos PDFs e relatórios gerados.</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabela de Catálogo */}
            <Card className="bg-zinc-900 border-white/10">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-500/10">
                                <Tag className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <CardTitle className="text-lg text-indigo-400">Catálogo de Serviços</CardTitle>
                                <CardDescription>
                                    Serviços disponíveis para projetos avulsos e orçamentos rápidos.
                                </CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost" size="sm"
                                onClick={carregar}
                                disabled={carregando}
                                className="text-zinc-500 hover:text-zinc-100"
                            >
                                <RefreshCw className={`w-4 h-4 ${carregando ? "animate-spin" : ""}`} />
                            </Button>
                            <Button
                                onClick={() => { setServicoEditando(null); setDialogAberto(true); }}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
                            >
                                <Plus className="w-4 h-4" /> Novo Serviço
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {carregando ? (
                        <div className="flex items-center justify-center py-12 gap-3">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                            <span className="text-zinc-500 text-sm">Carregando catálogo...</span>
                        </div>
                    ) : (
                        <div className="rounded-md border border-white/10">
                            <Table>
                                <TableHeader className="bg-zinc-800/50">
                                    <TableRow className="border-white/10 hover:bg-transparent">
                                        <TableHead className="text-zinc-300 font-semibold">Serviço</TableHead>
                                        <TableHead className="text-zinc-300 font-semibold">Descrição</TableHead>
                                        <TableHead className="text-zinc-300 font-semibold text-right">Valor Padrão</TableHead>
                                        <TableHead className="text-zinc-300 font-semibold text-center">Status</TableHead>
                                        <TableHead className="text-zinc-300 font-semibold text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {servicos.map(s => (
                                        <TableRow key={s.id} className="border-white/10 hover:bg-zinc-800/30 transition-colors">
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                                        <Package className="w-3.5 h-3.5 text-indigo-400" />
                                                    </div>
                                                    <span className="font-medium text-zinc-100">{s.nome}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-zinc-500 text-sm max-w-[200px] truncate">
                                                {s.descricao || <span className="text-zinc-700 italic">sem descrição</span>}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="flex items-center justify-end gap-1 text-emerald-400 font-semibold">
                                                    <DollarSign className="w-3 h-3" />
                                                    {Number(s.valorPadrao).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <button
                                                    onClick={() => toggleStatus(s)}
                                                    className="focus:outline-none"
                                                    title={s.status === "ATIVO" ? "Clique para desativar" : "Clique para ativar"}
                                                >
                                                    <Badge className={
                                                        s.status === "ATIVO"
                                                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/20"
                                                            : "bg-zinc-700/50 text-zinc-400 border border-zinc-600 cursor-pointer hover:bg-zinc-600/50"
                                                    }>
                                                        {s.status === "ATIVO"
                                                            ? <><ToggleRight className="w-3 h-3 mr-1 inline" />Ativo</>
                                                            : <><ToggleLeft className="w-3 h-3 mr-1 inline" />Inativo</>
                                                        }
                                                    </Badge>
                                                </button>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost" size="sm"
                                                        onClick={() => abrirEdicao(s)}
                                                        title="Editar serviço"
                                                        className="text-zinc-400 hover:text-indigo-400 hover:bg-indigo-400/10 h-7 w-7 p-0"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost" size="sm"
                                                        onClick={() => removerServico(s.id, s.nome)}
                                                        disabled={removendo === s.id}
                                                        title="Remover serviço"
                                                        className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10 h-7 w-7 p-0"
                                                    >
                                                        {removendo === s.id
                                                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            : <Trash2 className="w-3.5 h-3.5" />
                                                        }
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {servicos.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                <div className="flex flex-col items-center gap-2 text-zinc-600">
                                                    <Package className="w-8 h-8 opacity-30" />
                                                    <p className="text-sm">Nenhum serviço no catálogo.</p>
                                                    <p className="text-xs">Clique em "Novo Serviço" para adicionar.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal Criar/Editar */}
            <Dialog open={dialogAberto} onOpenChange={(open) => !open && fecharDialog()}>
                <DialogContent className="bg-zinc-900 border-white/10 shadow-2xl shadow-black/60 max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 rounded-lg bg-indigo-500/10">
                                <Tag className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <DialogTitle className="text-zinc-100">
                                    {servicoEditando ? "Editar Serviço" : "Novo Serviço"}
                                </DialogTitle>
                                <DialogDescription>
                                    {servicoEditando
                                        ? "Altere os dados do serviço no catálogo."
                                        : "Adicione um serviço ao catálogo para uso em projetos avulsos."}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <ServicoForm
                        servico={servicoEditando}
                        onSucesso={() => { fecharDialog(); carregar(); }}
                        onCancelar={fecharDialog}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
