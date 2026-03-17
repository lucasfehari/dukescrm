import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FileText, Loader2, Plus, CalendarDays, RefreshCw } from "lucide-react";
import { clientesApi, contratosApi, type Cliente } from "../../servicos/api";
import { addMonths, format } from "date-fns";

// @Agent: UI/UX Designer (AUID) + ASP — Modal de Criação de Contratos Premium
// Padrão unificado com Dialog premium — igual ao Kanban + Datas + Renovação Rápida

type FormRaw = {
    titulo: string;
    clienteId: string;
    valorTotal: number;
    status: "RASCUNHO" | "ENVIADO" | "ASSINADO" | "ATIVO" | "EM_ANDAMENTO" | "PAUSADO" | "VENCIDO" | "CANCELADO" | "FINALIZADO";
    descricao?: string;
    inicioEm?: string;
    fimEm?: string;
};

const formSchema = z.object({
    titulo: z.string().min(3, "Título deve ter pelo menos 3 caracteres."),
    clienteId: z.string().min(1, "Selecione um cliente."),
    valorTotal: z.number({ invalid_type_error: "Digite um valor válido." }).positive("Valor deve ser positivo."),
    status: z.enum(["RASCUNHO", "ENVIADO", "ASSINADO", "ATIVO", "EM_ANDAMENTO", "PAUSADO", "VENCIDO", "CANCELADO", "FINALIZADO"]),
    descricao: z.string().optional(),
    inicioEm: z.string().optional(),
    fimEm: z.string().optional(),
});

type FormValues = FormRaw;

const STATUS_OPTIONS = [
    { value: "RASCUNHO", label: "📝 Rascunho", color: "text-zinc-400" },
    { value: "ENVIADO", label: "📤 Enviado", color: "text-blue-400" },
    { value: "ASSINADO", label: "✍️ Assinado", color: "text-sky-400" },
    { value: "ATIVO", label: "✅ Ativo", color: "text-emerald-400" },
    { value: "EM_ANDAMENTO", label: "⚡ Em Andamento", color: "text-indigo-400" },
    { value: "PAUSADO", label: "⏸️ Pausado", color: "text-amber-400" },
    { value: "VENCIDO", label: "⚠️ Vencido", color: "text-orange-400" },
    { value: "CANCELADO", label: "❌ Cancelado", color: "text-red-400" },
    { value: "FINALIZADO", label: "🏁 Finalizado", color: "text-purple-400" },
];

// Converte strings de data para o formato input type="date" (YYYY-MM-DD)
function toDateInput(dt?: string | null): string {
    if (!dt) return "";
    return dt.substring(0, 10);
}

// Converte para ISO para enviar ao backend
function toISO(dt: string): string | undefined {
    if (!dt) return undefined;
    return new Date(dt).toISOString();
}

// ── Formulário interno
function ContratoFormContent({
    onSucesso,
}: {
    onSucesso: () => void;
}) {
    const [carregando, setCarregando] = useState(false);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [carregandoClientes, setCarregandoClientes] = useState(true);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { titulo: "", clienteId: "", valorTotal: 0, status: "RASCUNHO", descricao: "", inicioEm: "", fimEm: "" },
    });

    useEffect(() => {
        clientesApi.listar()
            .then(setClientes)
            .catch(() => toast.error("Erro ao carregar clientes."))
            .finally(() => setCarregandoClientes(false));
    }, []);

    // Atalho renovação rápida: soma X meses a partir do fimEm atual ou hoje
    function renovar(meses: number) {
        const fimAtual = form.getValues("fimEm");
        const base = fimAtual ? new Date(fimAtual) : new Date();
        const novoFim = addMonths(base, meses);
        const novoFimStr = format(novoFim, "yyyy-MM-dd");
        form.setValue("fimEm", novoFimStr, { shouldDirty: true });
        // Se não tiver início, define como hoje
        if (!form.getValues("inicioEm")) {
            form.setValue("inicioEm", format(new Date(), "yyyy-MM-dd"), { shouldDirty: true });
        }
    }

    async function onSubmit(values: FormValues) {
        setCarregando(true);
        try {
            await contratosApi.criar({
                titulo: values.titulo,
                clienteId: values.clienteId,
                valorTotal: values.valorTotal,
                status: values.status,
                descricao: values.descricao || undefined,
                inicioEm: toISO(values.inicioEm ?? ""),
                fimEm: toISO(values.fimEm ?? ""),
            });
            toast.success("Contrato criado!", {
                description: `"${values.titulo}" foi salvo com sucesso.`,
            });
            form.reset();
            onSucesso();
        } catch (e: any) {
            toast.error("Erro ao criar contrato.", { description: e.message });
        } finally {
            setCarregando(false);
        }
    }

    const fimEmValue = form.watch("fimEm");

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
                <FormField control={form.control} name="titulo" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Título do Contrato *</FormLabel>
                        <FormControl>
                            <Input placeholder="Ex: Social Media — Mensal" className="border-white/10 bg-zinc-800" autoFocus {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="clienteId" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cliente *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={carregandoClientes}>
                                <FormControl>
                                    <SelectTrigger className="border-white/10 bg-zinc-800">
                                        <SelectValue placeholder={carregandoClientes ? "Carregando..." : "Selecionar"} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-zinc-800 border-white/10">
                                    {clientes.length === 0 && !carregandoClientes && (
                                        <SelectItem value="none" disabled>Nenhum cliente cadastrado</SelectItem>
                                    )}
                                    {clientes.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className="border-white/10 bg-zinc-800">
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-zinc-800 border-white/10">
                                    {STATUS_OPTIONS.map(s => (
                                        <SelectItem key={s.value} value={s.value} className={s.color}>{s.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <FormField control={form.control} name="valorTotal" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Valor Total (R$) *</FormLabel>
                        <FormControl>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                className="border-white/10 bg-zinc-800"
                                {...field}
                                onChange={e => field.onChange(e.target.valueAsNumber)}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                {/* Datas: Início e Fim */}
                <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="inicioEm" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-1.5">
                                <CalendarDays className="w-3.5 h-3.5 text-zinc-400" />
                                Início do Contrato
                            </FormLabel>
                            <FormControl>
                                <Input
                                    type="date"
                                    className="border-white/10 bg-zinc-800 text-zinc-100"
                                    value={toDateInput(field.value)}
                                    onChange={e => field.onChange(e.target.value)}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <FormField control={form.control} name="fimEm" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-1.5">
                                <CalendarDays className="w-3.5 h-3.5 text-zinc-400" />
                                Validade / Fim
                            </FormLabel>
                            <FormControl>
                                <Input
                                    type="date"
                                    className="border-white/10 bg-zinc-800 text-zinc-100"
                                    value={toDateInput(field.value)}
                                    onChange={e => field.onChange(e.target.value)}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                {/* Atalhos de Renovação Rápida */}
                <div className="space-y-2">
                    <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                        <RefreshCw className="w-3 h-3" />
                        Renovação Rápida {fimEmValue ? `(a partir de ${new Date(fimEmValue).toLocaleDateString("pt-BR")})` : "(a partir de hoje)"}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                        {[1, 3, 6, 12].map(meses => (
                            <button
                                key={meses}
                                type="button"
                                onClick={() => renovar(meses)}
                                className="px-3 py-1 rounded-full text-xs font-medium border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all"
                            >
                                +{meses} {meses === 1 ? "mês" : "meses"}
                            </button>
                        ))}
                    </div>
                </div>

                <FormField control={form.control} name="descricao" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Descrição (Opcional)</FormLabel>
                        <FormControl>
                            <Input placeholder="Escopo e detalhes do contrato..." className="border-white/10 bg-zinc-800" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <Button
                    type="submit"
                    disabled={carregando || carregandoClientes}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white"
                >
                    {carregando ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
                    ) : "Salvar Contrato"}
                </Button>
            </form>
        </Form>
    );
}

// ── Dialog Modal — botão "Novo Contrato" no header da tela
export function NovoContratoDialog({ onContratoCriado }: { onContratoCriado?: () => void }) {
    const [aberto, setAberto] = useState(false);

    function handleSucesso() {
        setAberto(false);
        onContratoCriado?.();
    }

    return (
        <>
            <Button
                onClick={() => setAberto(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white gap-2 shadow-blue-500/20"
            >
                <Plus className="w-4 h-4" /> Novo Contrato
            </Button>

            <Dialog open={aberto} onOpenChange={setAberto}>
                <DialogContent className="bg-zinc-900 border-white/10 shadow-2xl shadow-black/60 max-w-lg">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <FileText className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <DialogTitle className="text-zinc-100">Novo Contrato</DialogTitle>
                                <DialogDescription>Vincule um serviço a um cliente cadastrado.</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <ContratoFormContent onSucesso={handleSucesso} />
                </DialogContent>
            </Dialog>
        </>
    );
}
