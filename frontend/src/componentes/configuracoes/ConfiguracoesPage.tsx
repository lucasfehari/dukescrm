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
import { useAuth } from "../../contextos/AuthContext";

// ── Schema do Formulário ──
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
                                className="border-white/10 bg-zinc-800 text-white"
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
                                className="border-white/10 bg-zinc-800 text-white"
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
                                className="border-white/10 bg-zinc-800 text-white"
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
                        className="flex-1 border border-white/10 text-zinc-400 hover:text-white"
                        onClick={onCancelar}
                        disabled={carregando}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        className="flex-1 bg-brand hover:bg-brand-light text-white"
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
const TABS = ["Perfil", "Agência", "Pagamentos", "Equipe", "Notificações"];

export function ConfiguracoesPage() {
    const { usuario } = useAuth();
    const [activeTab, setActiveTab] = useState("Perfil");

    // Estados da Agência (Catálogo)
    const [servicos, setServicos] = useState<ServicoCatalogo[]>([]);
    const [carregando, setCarregando] = useState(false);
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

    useEffect(() => {
        if (activeTab === "Agência" && servicos.length === 0) {
            carregar();
        }
    }, [activeTab, carregar, servicos.length]);

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
        <div className="flex flex-col h-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
            {/* Header / Tabs Navigation */}
            <nav className="flex border-b border-white/10 mb-2 overflow-x-auto no-scrollbar">
                {TABS.map((tab) => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 text-sm whitespace-nowrap transition-colors ${
                            activeTab === tab 
                            ? "font-bold border-b-2 border-brand text-brand" 
                            : "font-medium text-zinc-400 hover:text-white"
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </nav>

            {/* TAB: PERFIL */}
            {activeTab === "Perfil" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mx-auto w-full max-w-5xl">
                    {/* Left Column: Profile Card */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="glass-card rounded-2xl p-8 flex flex-col items-center text-center backdrop-blur-md">
                            <div className="relative group">
                                <div className="bg-zinc-800 bg-center bg-no-repeat aspect-square bg-cover rounded-full size-32 border-4 border-brand/20 flex items-center justify-center font-bold text-4xl text-brand" 
                                     style={usuario?.foto ? { backgroundImage: `url(${usuario.foto})` } : {}}
                                >
                                    {!usuario?.foto && (usuario?.nome?.charAt(0).toUpperCase() || "A")}
                                </div>
                                <button className="absolute bottom-0 right-0 bg-brand text-white p-2 rounded-full shadow-lg shadow-brand/20 hover:scale-110 transition-transform flex items-center justify-center border border-white/10">
                                    <span className="material-symbols-outlined text-sm">edit</span>
                                </button>
                            </div>
                            <h3 className="mt-4 text-2xl font-bold text-white">{usuario?.nome || "Alex Silva"}</h3>
                            <p className="text-brand font-medium text-sm">Administrador</p>
                            
                            <div className="mt-6 w-full flex flex-col gap-2">
                                <div className="flex justify-between text-sm py-2 border-b border-white/5">
                                    <span className="text-zinc-500">Plano</span>
                                    <span className="font-bold text-brand-light bg-brand/10 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border border-brand/20 shadow-[0_0_10px_rgba(131,17,212,0.1)]">PREMIUM</span>
                                </div>
                                <div className="flex justify-between text-sm py-2 border-b border-white/5">
                                    <span className="text-zinc-500">ID</span>
                                    <span className="text-zinc-300 font-mono">#{usuario?.id?.substring(0,6) || "882910"}</span>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card rounded-2xl p-6 backdrop-blur-md">
                            <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-brand text-[20px]">security</span>
                                Segurança
                            </h4>
                            <button className="w-full text-left p-3 rounded-lg hover:bg-white/5 transition-colors flex items-center justify-between group border border-transparent hover:border-white/5">
                                <span className="text-sm tracking-wide text-zinc-300 group-hover:text-white">Alterar Senha</span>
                                <span className="material-symbols-outlined text-zinc-500 group-hover:text-brand transition-colors text-[18px]">chevron_right</span>
                            </button>
                            <button className="w-full text-left p-3 rounded-lg hover:bg-white/5 transition-colors flex items-center justify-between group border border-transparent hover:border-white/5">
                                <span className="text-sm tracking-wide text-zinc-300 group-hover:text-white">Autenticação 2FA</span>
                                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">ATIVADO</span>
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Form Sections */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="glass-card rounded-2xl p-6 backdrop-blur-md border border-white/10">
                            <h2 className="text-xl font-bold text-white mb-6">Informações da Conta</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Nome Completo</label>
                                    <input 
                                        className="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-2.5 focus:border-brand focus:ring-1 focus:ring-brand outline-none text-zinc-200 transition-all placeholder:text-zinc-600 shadow-inner" 
                                        type="text" 
                                        defaultValue={usuario?.nome || "Alex Silva"}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">E-mail</label>
                                    <input 
                                        className="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-2.5 focus:border-brand focus:ring-1 focus:ring-brand outline-none text-zinc-200 transition-all placeholder:text-zinc-600 shadow-inner" 
                                        type="email" 
                                        defaultValue={usuario?.email || "alex.silva@dukes.com"}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Telefone</label>
                                    <input 
                                        className="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-2.5 focus:border-brand focus:ring-1 focus:ring-brand outline-none text-zinc-200 transition-all placeholder:text-zinc-600 shadow-inner" 
                                        type="text" 
                                        defaultValue="+55 (11) 98877-6655"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Idioma</label>
                                    <select className="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-2.5 focus:border-brand focus:ring-1 focus:ring-brand outline-none text-zinc-200 transition-all shadow-inner appearance-none cursor-pointer">
                                        <option className="bg-dark-800">Português (BR)</option>
                                        <option className="bg-dark-800">English (US)</option>
                                        <option className="bg-dark-800">Español</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end gap-3">
                                <button className="px-6 py-2.5 rounded-xl font-bold text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent">
                                    Descartar
                                </button>
                                <button className="px-6 py-2.5 bg-brand text-white rounded-xl font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-brand/20 border border-brand-light/30">
                                    Salvar Alterações
                                </button>
                            </div>
                        </div>

                        {/* Team Members Preview */}
                        <div className="glass-card rounded-2xl p-6 backdrop-blur-md">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Equipe Recente</h2>
                                <button className="text-brand text-xs font-bold hover:underline opacity-80 hover:opacity-100 uppercase tracking-wider" onClick={() => setActiveTab("Equipe")}>Ver Todos</button>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3.5 rounded-xl bg-dark-900/40 border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-full bg-indigo-500/20 flex items-center justify-center font-bold text-indigo-400 text-sm border border-indigo-500/30">MC</div>
                                        <div>
                                            <p className="text-sm font-bold text-white">Marina Costa</p>
                                            <p className="text-xs text-zinc-500">Gerente de Projetos</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">ONLINE</span>
                                </div>
                                <div className="flex items-center justify-between p-3.5 rounded-xl bg-dark-900/40 border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-full bg-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 text-sm border border-emerald-500/30">RS</div>
                                        <div>
                                            <p className="text-sm font-bold text-white">Ricardo Santos</p>
                                            <p className="text-xs text-zinc-500">Designer Senior</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">AUSENTE</span>
                                </div>
                                <button className="w-full py-3.5 border border-dashed border-white/10 rounded-xl text-zinc-400 hover:border-brand/40 hover:text-brand transition-all flex items-center justify-center gap-2 hover:bg-brand/5">
                                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                                    <span className="text-sm font-bold">Convidar Membro</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: AGÊNCIA */}
            {activeTab === "Agência" && (
                <div className="space-y-6 mx-auto w-full max-w-5xl">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="glass-card border-white/10 backdrop-blur-md">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-brand/10 border border-brand/20 shadow-[0_0_10px_rgba(131,17,212,0.1)]">
                                    <Package className="w-5 h-5 text-brand" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Total Serviços</p>
                                    <p className="text-2xl font-bold text-white">{servicos.length}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="glass-card border-white/10 backdrop-blur-md">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
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
                        <Card className="glass-card border-white/10 backdrop-blur-md">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                        <Settings className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg text-indigo-400">Dados do Estúdio</CardTitle>
                                        <CardDescription className="text-zinc-500">Identidade para propostas e relatórios.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Nome do Estúdio</label>
                                    <Input
                                        placeholder="Dukes Freela / Seu Estúdio"
                                        className="bg-dark-900/50 border-white/10 text-white rounded-xl focus-visible:ring-brand focus-visible:border-brand"
                                        value={localStorage.getItem("dk:studio_nome") || ""}
                                        onChange={(e) => localStorage.setItem("dk:studio_nome", e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">URL do Logo</label>
                                    <Input
                                        placeholder="https://exemplo.com/logo.png"
                                        className="bg-dark-900/50 border-white/10 text-white rounded-xl focus-visible:ring-brand focus-visible:border-brand"
                                        value={localStorage.getItem("dk:studio_logo") || ""}
                                        onChange={(e) => localStorage.setItem("dk:studio_logo", e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Cor Primária (Hex)</label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="#8311d4"
                                            className="bg-dark-900/50 border-white/10 text-white font-mono rounded-xl focus-visible:ring-brand focus-visible:border-brand"
                                            value={localStorage.getItem("dk:studio_cor") || "#8311d4"}
                                            onChange={(e) => localStorage.setItem("dk:studio_cor", e.target.value)}
                                        />
                                        <div
                                            className="w-10 h-10 rounded-xl border border-white/20 shadow-inner"
                                            style={{ backgroundColor: localStorage.getItem("dk:studio_cor") || "#8311d4" }}
                                        />
                                    </div>
                                </div>
                                <Button className="w-full bg-brand hover:bg-brand-light mt-2 rounded-xl text-white font-bold tracking-wide shadow-lg shadow-brand/20 border border-brand-light/30 transition-all" onClick={() => toast.success("Configurações salvas localmente!")}>
                                    Salvar Identidade
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="glass-card border-white/10 backdrop-blur-md overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-brand/10 to-transparent pointer-events-none" />
                            <CardHeader>
                                <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                                    Preview no Relatório
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center h-[calc(100%-80px)] text-center p-6 relative z-10">
                                <div className="w-20 h-20 rounded-2xl bg-dark-900/80 border border-white/10 flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                                    {localStorage.getItem("dk:studio_logo") ? (
                                        <img src={localStorage.getItem("dk:studio_logo")!} className="w-12 h-12 object-contain" />
                                    ) : (
                                        <Sparkles className="w-8 h-8 text-brand opacity-60" />
                                    )}
                                </div>
                                <h4 className="text-2xl font-bold text-white tracking-tight">{localStorage.getItem("dk:studio_nome") || "Nome do Estúdio"}</h4>
                                <p className="text-sm text-zinc-500 mt-2 max-w-[200px] leading-relaxed">Estes dados serão aplicados automaticamente aos PDFs gerados.</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabela de Catálogo */}
                    <Card className="glass-card border-white/10 backdrop-blur-md">
                        <CardHeader className="pb-3 border-b border-white/5 bg-dark-900/20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-brand/10 border border-brand/20 shadow-[0_0_10px_rgba(131,17,212,0.1)]">
                                        <Tag className="w-5 h-5 text-brand" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg text-white">Catálogo de Serviços</CardTitle>
                                        <CardDescription className="text-zinc-500">
                                            Listagem de serviços para propostas e orçamentos.
                                        </CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="ghost" size="sm"
                                        onClick={carregar}
                                        disabled={carregando}
                                        className="text-zinc-400 hover:text-white rounded-xl border border-transparent hover:border-white/10 bg-dark-900/50 hover:bg-white/5"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${carregando ? "animate-spin" : ""}`} />
                                    </Button>
                                    <Button
                                        onClick={() => { setServicoEditando(null); setDialogAberto(true); }}
                                        className="bg-brand hover:bg-brand-light text-white font-bold rounded-xl shadow-lg shadow-brand/20 border border-brand-light/30 transition-all gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> Novo Serviço
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {carregando ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3 text-brand">
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                    <span className="text-zinc-500 text-sm font-medium">Sincronizando catálogo...</span>
                                </div>
                            ) : (
                                <div className="overflow-x-auto min-h-[300px]">
                                    <Table className="w-full">
                                        <TableHeader className="bg-dark-900/60">
                                            <TableRow className="border-white/5 hover:bg-transparent">
                                                <TableHead className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] py-4">Serviço</TableHead>
                                                <TableHead className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] py-4">Descrição</TableHead>
                                                <TableHead className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] py-4 text-right">Valor Padrão</TableHead>
                                                <TableHead className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] py-4 text-center">Status</TableHead>
                                                <TableHead className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] py-4 text-center">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="divide-y divide-white/5">
                                            {servicos.map(s => (
                                                <TableRow key={s.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center">
                                                                <Package className="w-4 h-4 text-brand" />
                                                            </div>
                                                            <span className="font-bold text-zinc-200 group-hover:text-white transition-colors">{s.nome}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-zinc-500 text-sm max-w-[250px] truncate py-4">
                                                        {s.descricao || <span className="text-zinc-600 italic font-light">sem descrição</span>}
                                                    </TableCell>
                                                    <TableCell className="text-right py-4">
                                                        <span className="flex items-center justify-end gap-1 text-emerald-400 font-bold tracking-wide">
                                                            <DollarSign className="w-3 h-3 opacity-70" />
                                                            {Number(s.valorPadrao).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center py-4">
                                                        <button
                                                            onClick={() => toggleStatus(s)}
                                                            className="focus:outline-none"
                                                            title={s.status === "ATIVO" ? "Clique para desativar" : "Clique para ativar"}
                                                        >
                                                            <Badge className={
                                                                s.status === "ATIVO"
                                                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold"
                                                                    : "bg-zinc-800/80 text-zinc-400 border border-white/10 cursor-pointer hover:bg-zinc-700/50 px-2.5 py-1 text-[11px] font-bold"
                                                            }>
                                                                {s.status === "ATIVO"
                                                                    ? <><ToggleRight className="w-3.5 h-3.5 mr-1 inline" />Ativo</>
                                                                    : <><ToggleLeft className="w-3.5 h-3.5 mr-1 inline" />Inativo</>
                                                                }
                                                            </Badge>
                                                        </button>
                                                    </TableCell>
                                                    <TableCell className="text-center py-4">
                                                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="ghost" size="sm"
                                                                onClick={() => abrirEdicao(s)}
                                                                title="Editar serviço"
                                                                className="text-zinc-400 hover:text-brand hover:bg-brand/10 rounded-lg h-8 w-8 p-0"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost" size="sm"
                                                                onClick={() => removerServico(s.id, s.nome)}
                                                                disabled={removendo === s.id}
                                                                title="Remover serviço"
                                                                className="text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg h-8 w-8 p-0"
                                                            >
                                                                {removendo === s.id
                                                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                                                    : <Trash2 className="w-4 h-4" />
                                                                }
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {servicos.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-32 text-center">
                                                        <div className="flex flex-col items-center gap-3 text-zinc-600">
                                                            <span className="material-symbols-outlined text-[32px] opacity-50">package_2</span>
                                                            <div>
                                                                <p className="text-sm font-medium">Nenhum serviço mapeado.</p>
                                                                <p className="text-xs mt-1">Clique em "Novo Serviço" para começar seu catálogo.</p>
                                                            </div>
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

                    {/* Modal Criar/Editar Serviço */}
                    <Dialog open={dialogAberto} onOpenChange={(open) => !open && fecharDialog()}>
                        <DialogContent className="bg-dark-900 border-white/10 shadow-2xl shadow-black max-w-md backdrop-blur-3xl sm:rounded-2xl">
                            <DialogHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2.5 rounded-xl bg-brand/10 border border-brand/20 shadow-inner">
                                        <Tag className="w-5 h-5 text-brand" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-white text-lg">
                                            {servicoEditando ? "Editar Serviço" : "Novo Serviço"}
                                        </DialogTitle>
                                        <DialogDescription className="text-zinc-400 mt-1">
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
            )}

            {/* TAB: OUTROS (Placeholders) */}
            {["Pagamentos", "Equipe", "Notificações"].includes(activeTab) && (
                <div className="flex-1 flex flex-col items-center justify-center h-[50vh] text-center max-w-md mx-auto animate-in fade-in zoom-in-95 duration-500 opacity-60">
                    <div className="w-20 h-20 rounded-full bg-dark-900 border border-white/5 flex items-center justify-center mb-6 shadow-inner relative">
                        <div className="absolute inset-0 rounded-full bg-brand/5 animate-pulse"></div>
                        <span className="material-symbols-outlined text-[32px] text-zinc-600">
                            {activeTab === "Pagamentos" ? "payments" : activeTab === "Equipe" ? "group" : "notifications"}
                        </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Aba {activeTab} em Breve</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">
                        Este módulo está sendo desenvolvido em uma branch separada. As opções estarão disponíveis na próxima atualização do Studio OS Premium.
                    </p>
                </div>
            )}
        </div>
    );
}
