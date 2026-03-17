// @Agent: AUID (UI/UX Designer) + ASP (Senior Programmer) + AEE (Empresário)
// Sidebar de criação de projetos premium — contrato OPCIONAL
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
    Kanban, Loader2, Plus, Sparkles, Trash2, Receipt, Package,
    Calendar, Users, FileText, ChevronDown, X, Zap, Layers
} from "lucide-react";
import {
    contratosApi, clientesApi, projetosApi, creditosApi, catalogoApi,
    type Contrato, type Cliente, type CreditoContrato, type ServicoCatalogo
} from "../../servicos/api";
import { SmartEditor } from "../ui/SmartEditor";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type StatusProjeto = "NAO_INICIADO" | "EM_ANDAMENTO" | "IMPEDIDO" | "CONCLUIDO" | "CANCELADO";

const STATUS_OPTIONS = [
    { value: "NAO_INICIADO", label: "A Iniciar", color: "text-zinc-400", dot: "bg-zinc-400" },
    { value: "EM_ANDAMENTO", label: "Em Andamento", color: "text-blue-400", dot: "bg-blue-400" },
    { value: "IMPEDIDO", label: "Impedido", color: "text-amber-400", dot: "bg-amber-400" },
    { value: "CONCLUIDO", label: "Concluído", color: "text-emerald-400", dot: "bg-emerald-400" },
    { value: "CANCELADO", label: "Cancelado", color: "text-red-400", dot: "bg-red-400" },
];

// Contrato agora é opcional — AEE: contrato opcional = mais projetos criados = mais retenção
const projetoSchema = z.object({
    nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres."),
    contratoId: z.string().optional(),
    clienteId: z.string().optional(),
    status: z.enum(["NAO_INICIADO", "EM_ANDAMENTO", "IMPEDIDO", "CONCLUIDO", "CANCELADO"]),
    descricao: z.string().optional(),
    prazoEstimado: z.string().optional(),
}).refine(
    data => data.contratoId || data.clienteId,
    { message: "Selecione um contrato ou um cliente direto.", path: ["contratoId"] }
);

type ProjetoValues = z.infer<typeof projetoSchema>;

type ItemAvulso = {
    descricao: string;
    quantidade: number;
    valorUnitario: number;
    catalogoId?: string;
};

type AvulsoValues = {
    nome: string;
    clienteId: string;
    status: StatusProjeto;
    itens: ItemAvulso[];
    prazoEstimado?: string;
    observacoes?: string;
};

const itemSchema = z.object({
    descricao: z.string().min(1, "Descreva o item."),
    quantidade: z.coerce.number().min(1, "Mín. 1"),
    valorUnitario: z.coerce.number().min(0.01, "Valor inválido"),
    catalogoId: z.string().optional(),
});

const avulsoSchema: z.ZodSchema<AvulsoValues> = z.object({
    nome: z.string().min(1, "Nome do serviço é obrigatório."),
    clienteId: z.string().min(1, "Selecione um cliente."),
    status: z.enum(["NAO_INICIADO", "EM_ANDAMENTO", "IMPEDIDO", "CONCLUIDO", "CANCELADO"]),
    itens: z.array(itemSchema).min(1, "Adicione pelo menos um item."),
    prazoEstimado: z.string().optional(),
    observacoes: z.string().optional(),
}) as z.ZodSchema<AvulsoValues>;

const fmt = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/* ──────────── CustomSelect premium ──────────── */
function CustomSelect({ value, onChange, options, placeholder, disabled, className }: any) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find((o: any) => o.value === value);

    return (
        <div ref={ref} className="relative w-full">
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen(!open)}
                className={cn(
                    "flex items-center justify-between w-full px-3 h-9 text-sm bg-zinc-800/60 border border-white/8 rounded-xl outline-none text-left transition-all",
                    "hover:border-white/20 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20",
                    !selectedOption && "text-zinc-500",
                    selectedOption && "text-zinc-200",
                    disabled && "opacity-50 cursor-not-allowed",
                    className
                )}
            >
                <span className="truncate flex-1 flex items-center gap-2">
                    {selectedOption?.dot && (
                        <span className={cn("w-2 h-2 rounded-full flex-shrink-0", selectedOption.dot)} />
                    )}
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={cn("w-3.5 h-3.5 text-zinc-500 shrink-0 ml-2 transition-transform", open && "rotate-180")} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.12 }}
                        className="absolute z-50 top-full mt-1.5 w-full min-w-[200px] bg-zinc-800 border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden py-1 max-h-60 overflow-y-auto custom-scrollbar"
                    >
                        {options.length === 0 ? (
                            <div className="px-3 py-2.5 text-xs text-zinc-500 text-center">
                                Nenhuma opção disponível
                            </div>
                        ) : (
                            options.map((opt: any) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => { onChange(opt.value); setOpen(false); }}
                                    className={cn(
                                        "w-full text-left px-3 py-2 text-sm hover:bg-zinc-700/60 transition-colors flex items-center gap-2.5",
                                        value === opt.value ? "bg-indigo-500/10 text-indigo-300" : "text-zinc-300"
                                    )}
                                >
                                    {opt.dot && <span className={cn("w-2 h-2 rounded-full flex-shrink-0", opt.dot)} />}
                                    {opt.label}
                                    {value === opt.value && (
                                        <span className="ml-auto text-indigo-400 text-xs">✓</span>
                                    )}
                                </button>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ──────── Campo de Propriedade (linha Notion-style) ──────── */
function PropRow({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3 py-2 group hover:bg-white/[0.02] rounded-lg px-2 -mx-2 transition-colors">
            <div className="w-[130px] flex-shrink-0 flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-wider mt-2.5">
                <span className="text-zinc-600">{icon}</span>
                {label}
            </div>
            <div className="flex-1 min-w-0">{children}</div>
        </div>
    );
}

/* ──────────── Aba: Projeto com Contrato ──────────── */
function AbaProjetoNormal({
    statusInicial,
    contratos,
    clientes,
    carregando: carregandoDados,
    clientePreSelecionado,
    onSucesso,
}: {
    statusInicial: StatusProjeto;
    contratos: Contrato[];
    clientes: Cliente[];
    carregando: boolean;
    clientePreSelecionado?: string;
    onSucesso: () => void;
}) {
    const [salvando, setSalvando] = useState(false);
    const [creditos, setCreditos] = useState<CreditoContrato[]>([]);
    const [creditoSelecionado, setCreditoSelecionado] = useState<string | null>(null);
    const [tipoSelecionado, setTipoSelecionado] = useState<string | null>(null);
    const [buscandoCreditos, setBuscandoCreditos] = useState(false);

    const form = useForm<ProjetoValues>({
        resolver: zodResolver(projetoSchema),
        defaultValues: {
            nome: "",
            contratoId: "",
            clienteId: clientePreSelecionado ?? "",
            status: statusInicial,
            descricao: "",
            prazoEstimado: "",
        },
    });

    const contratoIdWatch = form.watch("contratoId");
    const semContrato = !contratoIdWatch;

    const buscarCreditos = useCallback(async (cid: string) => {
        if (!cid) { setCreditos([]); return; }
        setBuscandoCreditos(true);
        try {
            const data = await creditosApi.listarPorContrato(cid);
            setCreditos(data);
        } catch {
            setCreditos([]);
        } finally {
            setBuscandoCreditos(false);
        }
    }, []);

    useEffect(() => { buscarCreditos(contratoIdWatch || ""); }, [contratoIdWatch, buscarCreditos]);
    useEffect(() => { form.setValue("status", statusInicial); }, [statusInicial, form]);
    // Se vier cliente pré-selecionado (da página de Clientes), mantém sem contrato
    useEffect(() => {
        if (clientePreSelecionado) {
            form.setValue("clienteId", clientePreSelecionado);
            form.setValue("contratoId", "");
        }
    }, [clientePreSelecionado, form]);

    // Ao trocar de contrato, limpa cliente e vice-versa
    function handleContratoChange(val: string) {
        form.setValue("contratoId", val);
        if (val) form.setValue("clienteId", "");
        setCreditoSelecionado(null);
        setTipoSelecionado(null);
    }

    function handleClienteChange(val: string) {
        form.setValue("clienteId", val);
        if (val) form.setValue("contratoId", "");
        setCreditoSelecionado(null);
        setTipoSelecionado(null);
    }

    function selecionarCredito(credito: CreditoContrato) {
        if (credito.quantidadeDisponivel <= 0) return;
        if (creditoSelecionado === credito.id) {
            setCreditoSelecionado(null);
            setTipoSelecionado(null);
        } else {
            setCreditoSelecionado(credito.id);
            setTipoSelecionado(credito.nome);
        }
    }

    async function onSubmit(values: ProjetoValues) {
        setSalvando(true);
        try {
            await projetosApi.criar({
                nome: values.nome,
                contratoId: values.contratoId || undefined,
                clienteId: values.clienteId || undefined,
                creditoId: creditoSelecionado ?? undefined,
                tipoProjeto: tipoSelecionado ?? undefined,
                status: values.status,
                descricao: values.descricao || undefined,
                prazoEstimado: values.prazoEstimado || undefined,
            });
            const msg = tipoSelecionado
                ? `"${values.nome}" criado — 1 ${tipoSelecionado} descontado.`
                : `"${values.nome}" adicionado ao Kanban.`;
            toast.success("Projeto criado!", { description: msg });
            form.reset();
            setCreditoSelecionado(null);
            setTipoSelecionado(null);
            onSucesso();
        } catch (e: any) {
            toast.error("Erro ao criar projeto.", { description: e.message });
        } finally {
            setSalvando(false);
        }
    }

    const contratoOptions = [
        { value: "", label: "Sem contrato" },
        ...contratos.map(c => ({
            value: c.id,
            label: `${c.titulo}${c.cliente ? ` — ${c.cliente.nome}` : ""}`,
        })),
    ];

    const clienteOptions = clientes.map(c => ({
        value: c.id,
        label: `${c.nome}${c.documento ? ` (${c.documento})` : ""}`,
    }));

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">

            {/* Título */}
            <div className="flex-shrink-0 px-8 pt-8 pb-5">
                <input
                    placeholder="Nome do projeto..."
                    className="w-full text-3xl font-black bg-transparent border-0 ring-0 outline-none px-0 h-auto placeholder:text-zinc-700 text-zinc-100 focus:placeholder:opacity-0 transition-all"
                    autoFocus
                    {...form.register("nome")}
                />
                {form.formState.errors.nome && (
                    <span className="text-red-400 text-xs mt-1 block">
                        {form.formState.errors.nome.message}
                    </span>
                )}
            </div>

            {/* Separador */}
            <div className="px-8 mb-1">
                <div className="h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
            </div>

            {/* Propriedades */}
            <div className="flex-shrink-0 px-8 py-3 space-y-0.5">

                {/* Contrato (opcional) */}
                <PropRow label="Contrato" icon={<Receipt className="w-3.5 h-3.5" />}>
                    <Controller
                        control={form.control}
                        name="contratoId"
                        render={({ field }) => (
                            <CustomSelect
                                value={field.value}
                                onChange={handleContratoChange}
                                options={contratoOptions}
                                placeholder={carregandoDados ? "Carregando..." : "Sem contrato"}
                                disabled={carregandoDados}
                            />
                        )}
                    />
                    {form.formState.errors.contratoId && (
                        <span className="text-red-400 text-[10px] mt-1 block">
                            {form.formState.errors.contratoId.message}
                        </span>
                    )}
                </PropRow>

                {/* Cliente direto — aparece quando sem contrato */}
                {semContrato && (
                    <PropRow label="Cliente" icon={<Users className="w-3.5 h-3.5" />}>
                        <Controller
                            control={form.control}
                            name="clienteId"
                            render={({ field }) => (
                                <CustomSelect
                                    value={field.value}
                                    onChange={handleClienteChange}
                                    options={clienteOptions}
                                    placeholder={carregandoDados ? "Carregando..." : "Selecionar cliente..."}
                                    disabled={carregandoDados}
                                />
                            )}
                        />
                    </PropRow>
                )}

                <PropRow label="Status" icon={<Loader2 className="w-3.5 h-3.5" />}>
                    <Controller
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <CustomSelect
                                value={field.value}
                                onChange={field.onChange}
                                options={STATUS_OPTIONS}
                            />
                        )}
                    />
                </PropRow>

                <PropRow label="Prazo" icon={<Calendar className="w-3.5 h-3.5" />}>
                    <input
                        type="date"
                        className="w-full bg-zinc-800/60 border border-white/8 rounded-xl px-3 h-9 text-sm text-zinc-300 hover:border-white/20 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        {...form.register("prazoEstimado")}
                    />
                </PropRow>
            </div>

            {/* Créditos do contrato */}
            <AnimatePresence>
                {contratoIdWatch && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="flex-shrink-0 px-8 py-3 overflow-hidden"
                    >
                        <div className="flex items-center gap-2 mb-2.5">
                            <Package className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                Créditos do Contrato
                            </span>
                            {buscandoCreditos && <Loader2 className="w-3 h-3 animate-spin text-zinc-600" />}
                            <span className="text-[10px] text-zinc-600 ml-1">(opcional)</span>
                        </div>
                        {!buscandoCreditos && creditos.length === 0 && (
                            <p className="text-[11px] text-zinc-600">Nenhum pacote cadastrado.</p>
                        )}
                        {creditos.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {creditos.map(c => {
                                    const esgotado = c.quantidadeDisponivel <= 0;
                                    const selecionado = creditoSelecionado === c.id;
                                    const quase = !esgotado && c.quantidadeDisponivel <= Math.ceil(c.quantidadeTotal * 0.25);

                                    return (
                                        <button
                                            key={c.id}
                                            type="button"
                                            disabled={esgotado}
                                            onClick={() => selecionarCredito(c)}
                                            className={cn(
                                                "flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-semibold transition-all",
                                                esgotado && "border-zinc-800 text-zinc-700 cursor-not-allowed",
                                                selecionado && "border-indigo-500 bg-indigo-500/10 text-indigo-300",
                                                quase && !selecionado && "border-amber-500/30 text-amber-500/60 hover:border-amber-500/50 cursor-pointer",
                                                !esgotado && !selecionado && !quase && "border-emerald-500/20 text-emerald-500/60 hover:border-emerald-500/40 cursor-pointer"
                                            )}
                                        >
                                            {c.nome}
                                            <span className="opacity-50">{c.quantidadeDisponivel}/{c.quantidadeTotal}</span>
                                            {selecionado && <span className="text-indigo-400">✓</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-8 mb-1">
                <div className="h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
            </div>

            {/* Corpo — Rich text */}
            <div className="flex-1 px-8 py-4 overflow-y-auto custom-scrollbar flex flex-col min-h-[200px]">
                <Controller
                    control={form.control}
                    name="descricao"
                    render={({ field }) => (
                        <SmartEditor
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Briefing, referências, anotações..."
                            className="bg-transparent text-zinc-300 h-full min-h-[200px]"
                        />
                    )}
                />
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-white/5 bg-zinc-900/60 flex justify-end gap-2.5">
                <button
                    type="button"
                    onClick={onSucesso}
                    className="text-zinc-400 hover:text-white hover:bg-white/5 font-medium rounded-xl h-9 px-5 text-sm transition-all"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={salvando || carregandoDados}
                    className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold rounded-xl h-9 px-6 text-sm transition-all active:scale-95 shadow-lg shadow-indigo-500/25 flex items-center gap-2 disabled:opacity-50"
                >
                    {salvando ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Salvando...</span></>
                    ) : (
                        <><Plus className="w-3.5 h-3.5" /><span>Criar Projeto</span></>
                    )}
                </button>
            </div>
        </form>
    );
}

/* ──────────── Aba: Serviço Avulso ──────────── */
function AbaServicoAvulso({
    statusInicial,
    clientes,
    carregando: carregandoClientes,
    onSucesso,
}: {
    statusInicial: StatusProjeto;
    clientes: Cliente[];
    carregando: boolean;
    onSucesso: () => void;
}) {
    const [salvando, setSalvando] = useState(false);

    const form = useForm<AvulsoValues>({
        defaultValues: {
            nome: "",
            clienteId: "",
            status: statusInicial,
            itens: [{ descricao: "", quantidade: 1, valorUnitario: 0 }],
            prazoEstimado: "",
            observacoes: "",
        },
    });

    const { fields, append, remove } = useFieldArray({ control: form.control, name: "itens" });
    const itensWatch = form.watch("itens");

    const totalGeral = itensWatch.reduce(
        (acc, item) => acc + (Number(item.quantidade) || 0) * (Number(item.valorUnitario) || 0),
        0
    );

    useEffect(() => { form.setValue("status", statusInicial); }, [statusInicial, form]);

    async function onSubmit(values: AvulsoValues) {
        const parsed = avulsoSchema.safeParse(values);
        if (!parsed.success) {
            toast.error("Dados inválidos", { description: parsed.error.issues[0]?.message });
            return;
        }
        if (totalGeral <= 0) {
            toast.error("Total deve ser maior que zero.");
            return;
        }
        setSalvando(true);
        try {
            const descricaoDetalhada = values.itens
                .map(i => `• ${i.descricao}: ${i.quantidade}x ${fmt(Number(i.valorUnitario))} = ${fmt(Number(i.quantidade) * Number(i.valorUnitario))}`)
                .join("\n");

            const descricaoFinal = values.observacoes
                ? `${descricaoDetalhada}\n\nObservações: ${values.observacoes}`
                : descricaoDetalhada;

            await projetosApi.criarAvulso({
                nome: values.nome,
                clienteId: values.clienteId,
                valorAvulso: totalGeral,
                status: values.status,
                descricao: descricaoFinal,
                servicos: values.itens.map(i => ({
                    nome: i.descricao,
                    valor: Number(i.quantidade) * Number(i.valorUnitario),
                    catalogoId: i.catalogoId || undefined,
                })),
                prazoEstimado: values.prazoEstimado || undefined,
            });

            const cliente = clientes.find(c => c.id === values.clienteId);
            toast.success("Serviço Avulso criado!", {
                description: `${fmt(totalGeral)} lançado na carteira de ${cliente?.nome ?? "cliente"}.`,
                duration: 5000,
            });
            form.reset();
            onSucesso();
        } catch (e: any) {
            toast.error("Erro ao criar serviço avulso.", { description: e.message });
        } finally {
            setSalvando(false);
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">

            {/* Título */}
            <div className="flex-shrink-0 px-8 pt-8 pb-5">
                <div className="flex items-center gap-2 mb-3">
                    <span className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                    </span>
                    <span className="text-xs font-bold text-amber-400/70 uppercase tracking-wider">Serviço Avulso</span>
                </div>
                <input
                    placeholder="Nome do serviço..."
                    className="w-full text-3xl font-black bg-transparent border-0 ring-0 outline-none px-0 h-auto placeholder:text-zinc-700 text-zinc-100"
                    autoFocus
                    {...form.register("nome")}
                />
            </div>

            <div className="px-8 mb-1">
                <div className="h-px bg-gradient-to-r from-amber-500/20 via-white/5 to-transparent" />
            </div>

            {/* Propriedades */}
            <div className="flex-shrink-0 px-8 py-3 space-y-0.5">
                <PropRow label="Cliente" icon={<Users className="w-3.5 h-3.5" />}>
                    <Controller
                        control={form.control}
                        name="clienteId"
                        render={({ field }) => (
                            <CustomSelect
                                value={field.value}
                                onChange={field.onChange}
                                options={clientes.map(c => ({
                                    value: c.id,
                                    label: `${c.nome}${c.documento ? ` (${c.documento})` : ""}`,
                                }))}
                                placeholder={carregandoClientes ? "Carregando..." : "Selecionar cliente..."}
                                disabled={carregandoClientes}
                            />
                        )}
                    />
                </PropRow>

                <PropRow label="Status" icon={<Loader2 className="w-3.5 h-3.5" />}>
                    <Controller
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <CustomSelect
                                value={field.value}
                                onChange={field.onChange}
                                options={STATUS_OPTIONS}
                            />
                        )}
                    />
                </PropRow>

                <PropRow label="Prazo" icon={<Calendar className="w-3.5 h-3.5" />}>
                    <input
                        type="date"
                        className="w-full bg-zinc-800/60 border border-white/8 rounded-xl px-3 h-9 text-sm text-zinc-300 hover:border-white/20 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                        {...form.register("prazoEstimado")}
                    />
                </PropRow>
            </div>

            <div className="px-8 mb-1">
                <div className="h-px bg-gradient-to-r from-amber-500/20 via-white/5 to-transparent" />
            </div>

            {/* Itens */}
            <div className="flex-1 px-8 py-4 overflow-y-auto custom-scrollbar space-y-4">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        Itens do Serviço
                    </h3>
                    <button
                        type="button"
                        onClick={() => append({ descricao: "", quantidade: 1, valorUnitario: 0 })}
                        className="h-7 px-3 rounded-lg text-[11px] border border-white/10 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 transition-all flex items-center gap-1 font-medium"
                    >
                        <Plus className="w-3 h-3" /> Adicionar
                    </button>
                </div>

                <div className="space-y-2.5">
                    {fields.map((field, index) => (
                        <motion.div
                            key={field.id}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-2.5 items-start p-3 rounded-xl border border-white/6 bg-zinc-900/60 hover:border-white/10 transition-all"
                        >
                            <div className="flex-1">
                                <input
                                    {...form.register(`itens.${index}.descricao` as const)}
                                    placeholder="Descrição do item"
                                    className="w-full bg-transparent border-b border-white/10 pb-1 text-sm text-zinc-200 focus:border-amber-500/60 outline-none mb-2 placeholder:text-zinc-600 transition-colors"
                                />
                            </div>
                            <div className="w-16">
                                <input
                                    type="number"
                                    {...form.register(`itens.${index}.quantidade` as const)}
                                    placeholder="Qtd"
                                    className="w-full bg-transparent border-b border-white/10 pb-1 text-sm text-zinc-200 focus:border-amber-500/60 outline-none mb-2 text-center placeholder:text-zinc-600 transition-colors"
                                />
                            </div>
                            <div className="w-28">
                                <input
                                    type="number"
                                    step="0.01"
                                    {...form.register(`itens.${index}.valorUnitario` as const)}
                                    placeholder="Valor Un."
                                    className="w-full bg-transparent border-b border-white/10 pb-1 text-sm text-zinc-200 focus:border-amber-500/60 outline-none mb-2 text-right placeholder:text-zinc-600 transition-colors"
                                />
                            </div>
                            {fields.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="p-1.5 text-red-500/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all mt-0.5"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Total */}
                {totalGeral > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-end"
                    >
                        <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <span className="text-xs text-amber-400/60 font-medium">Total: </span>
                            <span className="text-sm font-black text-amber-400">{fmt(totalGeral)}</span>
                        </div>
                    </motion.div>
                )}

                {/* Banner */}
                <div className="rounded-xl bg-amber-500/5 border border-amber-500/15 px-3.5 py-3 flex gap-2.5 text-xs text-amber-300/70">
                    <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400/60" />
                    <span>Será lançado como <strong>Receita Pendente</strong> na carteira devedora do cliente.</span>
                </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-white/5 bg-zinc-900/60 flex justify-end gap-2.5">
                <button
                    type="button"
                    onClick={onSucesso}
                    className="text-zinc-400 hover:text-white hover:bg-white/5 font-medium rounded-xl h-9 px-5 text-sm transition-all"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={salvando || carregandoClientes || totalGeral <= 0}
                    className="relative overflow-hidden bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-bold rounded-xl h-9 px-6 text-sm transition-all active:scale-95 shadow-lg shadow-amber-500/20 flex items-center gap-2 disabled:opacity-40"
                >
                    {salvando ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Lançando...</span></>
                    ) : (
                        <><Sparkles className="w-3.5 h-3.5" /><span>Lançar {totalGeral > 0 ? `· ${fmt(totalGeral)}` : ""}</span></>
                    )}
                </button>
            </div>
        </form>
    );
}

/* ──────────── Tabs customizadas ──────────── */
export function CustomTabs({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (v: string) => void }) {
    const tabs = [
        { id: "projeto", label: "Projeto", icon: <Kanban className="w-3.5 h-3.5" /> },
        { id: "avulso", label: "Serviço Avulso", icon: <Sparkles className="w-3.5 h-3.5" />, color: "text-amber-400" },
    ];

    return (
        <div className="flex mx-6 my-2 h-10 items-center p-1 w-fit rounded-xl bg-zinc-800/60 border border-white/8 relative">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                        "relative flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors z-10 h-full",
                        activeTab === tab.id ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                    )}
                >
                    {activeTab === tab.id && (
                        <motion.div
                            layoutId="tab-pill"
                            className="absolute inset-0 bg-zinc-700 rounded-lg border border-white/10 shadow-sm"
                            initial={false}
                            transition={{ type: "spring", stiffness: 450, damping: 32 }}
                        />
                    )}
                    <span className={cn("relative z-10 flex items-center gap-1.5", tab.color && activeTab === tab.id ? tab.color : "")}>
                        {tab.icon}
                        {tab.label}
                    </span>
                </button>
            ))}
        </div>
    );
}

/* ──────────── Sidebar Principal ──────────── */
export function NovoProjetoDialog({
    statusInicial,
    colunaLabel,
    colunaColor,
    onProjetoCriado,
    forceOpen,
    onOpenChange,
    clientePreSelecionado,
}: {
    statusInicial: StatusProjeto;
    colunaLabel: string;
    colunaColor: string;
    onProjetoCriado: () => void;
    forceOpen?: boolean;
    onOpenChange?: (val: boolean) => void;
    clientePreSelecionado?: string;
}) {
    const [aberto, setAberto] = useState(false);
    const [activeTab, setActiveTab] = useState("projeto");
    const [contratos, setContratos] = useState<Contrato[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [catalogos, setCatalogos] = useState<ServicoCatalogo[]>([]);
    const [carregando, setCarregando] = useState(false);

    const isOpen = forceOpen !== undefined ? forceOpen : aberto;

    function setIsOpen(val: boolean) {
        if (forceOpen !== undefined) {
            onOpenChange?.(val);
        } else {
            setAberto(val);
        }
    }

    useEffect(() => {
        if (!isOpen) return;
        setCarregando(true);
        Promise.all([
            contratosApi.listar(),
            clientesApi.listar(),
            catalogoApi.listar(),
        ]).then(([c, cl, cat]) => {
            setContratos(c);
            setClientes(cl);
            setCatalogos(cat);
        }).catch(() => toast.error("Erro ao carregar dados."))
            .finally(() => setCarregando(false));
    }, [isOpen]);

    function handleSucesso() {
        setIsOpen(false);
        onProjetoCriado();
    }

    // Badge da coluna destino
    const COLUNA_COLORS: Record<string, string> = {
        "text-zinc-400": "bg-zinc-500/15 text-zinc-400 border-zinc-500/25",
        "text-blue-400": "bg-blue-500/15 text-blue-400 border-blue-500/25",
        "text-amber-400": "bg-amber-500/15 text-amber-400 border-amber-500/25",
        "text-emerald-400": "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
        "text-red-400": "bg-red-500/15 text-red-400 border-red-500/25",
    };
    const badgeCls = COLUNA_COLORS[colunaColor] ?? "bg-zinc-500/15 text-zinc-400 border-zinc-500/25";

    return (
        <>
            {/* Botão da coluna — visível apenas quando não é controlled externamente */}
            {forceOpen === undefined && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs text-zinc-500 border border-dashed border-white/10 hover:border-indigo-500/40 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all group mt-1"
                >
                    <Plus className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                    Novo
                </button>
            )}

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-black/65 backdrop-blur-[6px]"
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ x: "100%", opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: "100%", opacity: 0 }}
                            transition={{ type: "spring", stiffness: 320, damping: 32 }}
                            className="relative w-full max-w-[680px] bg-[#0f0f11] border-l border-white/8 shadow-2xl h-full flex flex-col overflow-hidden"
                        >
                            {/* Glow de fundo do panel */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

                            {/* Header */}
                            <div className="flex-shrink-0 border-b border-white/6 bg-zinc-900/40 backdrop-blur-sm">
                                <div className="flex items-center justify-between px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {/* Ícone animado */}
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-emerald-500/20 border border-white/10 flex items-center justify-center shadow-inner">
                                                <Zap className="w-5 h-5 text-indigo-400" />
                                            </div>
                                            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0f0f11] animate-pulse" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-black text-zinc-100 tracking-tight">
                                                Novo Arquivo
                                            </h2>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-[11px] text-zinc-500">Salvar em:</span>
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full border text-[10px] font-bold",
                                                    badgeCls
                                                )}>
                                                    {colunaLabel}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="w-8 h-8 rounded-xl text-zinc-500 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Tabs */}
                                <CustomTabs activeTab={activeTab} setActiveTab={setActiveTab} />
                            </div>

                            {/* Conteúdo */}
                            <div className="flex-1 overflow-hidden flex flex-col">
                                <AnimatePresence mode="wait">
                                    {activeTab === "projeto" && (
                                        <motion.div
                                            key="projeto"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            transition={{ duration: 0.18 }}
                                            className="h-full overflow-hidden flex flex-col"
                                        >
                                            <AbaProjetoNormal
                                                statusInicial={statusInicial}
                                                contratos={contratos}
                                                clientes={clientes}
                                                carregando={carregando}
                                                clientePreSelecionado={clientePreSelecionado}
                                                onSucesso={handleSucesso}
                                            />
                                        </motion.div>
                                    )}
                                    {activeTab === "avulso" && (
                                        <motion.div
                                            key="avulso"
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ duration: 0.18 }}
                                            className="h-full overflow-hidden flex flex-col"
                                        >
                                            <AbaServicoAvulso
                                                statusInicial={statusInicial}
                                                clientes={clientes}
                                                carregando={carregando}
                                                onSucesso={handleSucesso}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
