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
import { Sparkles, Loader2, Plus } from "lucide-react";
import { clientesApi, projetosApi, type Cliente } from "../../servicos/api";

// @Agent: UI/UX Designer (AUID) + Senior Programmer (ASP) + Empresário
// Serviço Avulso: cria projeto para cliente SEM contrato
// Gera automaticamente Lancamento RECEITA PENDENTE → Carteira Devedora para fechamento mensal

const formSchema = z.object({
    nome: z.string().min(1, "Descrição do serviço é obrigatória."),
    clienteId: z.string().min(1, "Selecione o cliente."),
    valorAvulso: z.number().min(0.01, "Valor deve ser positivo."),
    descricao: z.string().optional(),
    prazoEstimado: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;
type StatusProjeto = "NAO_INICIADO" | "EM_ANDAMENTO" | "IMPEDIDO" | "CONCLUIDO" | "CANCELADO";

export function ServicoAvulsoDialog({
    statusInicial,
    colunaLabel,
    colunaColor,
    onCriado,
}: {
    statusInicial: StatusProjeto;
    colunaLabel: string;
    colunaColor: string;
    onCriado: () => void;
}) {
    const [aberto, setAberto] = useState(false);
    const [carregando, setCarregando] = useState(false);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [carregandoClientes, setCarregandoClientes] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { nome: "", clienteId: "", valorAvulso: 0, descricao: "", prazoEstimado: "" },
    });

    // Carrega clientes apenas quando o modal abre
    useEffect(() => {
        if (!aberto) return;
        setCarregandoClientes(true);
        clientesApi.listar()
            .then(setClientes)
            .catch(() => toast.error("Erro ao carregar clientes."))
            .finally(() => setCarregandoClientes(false));
    }, [aberto]);

    async function onSubmit(values: FormValues) {
        setCarregando(true);
        try {
            await projetosApi.criarAvulso({
                nome: values.nome,
                clienteId: values.clienteId,
                valorAvulso: values.valorAvulso,
                status: statusInicial,
                descricao: values.descricao || undefined,
                prazoEstimado: values.prazoEstimado || undefined,
            });

            const cliente = clientes.find(c => c.id === values.clienteId);
            toast.success("Serviço Avulso criado!", {
                description: `"${values.nome}" adicionado ao Kanban e R$ ${values.valorAvulso.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} lançado na carteira devedora de ${cliente?.nome ?? "cliente"}.`,
                duration: 5000,
            });

            form.reset();
            setAberto(false);
            onCriado();
        } catch (e: any) {
            toast.error("Erro ao criar serviço avulso.", { description: e.message });
        } finally {
            setCarregando(false);
        }
    }

    return (
        <>
            {/* Botão compacto no rodapé da coluna */}
            <button
                onClick={() => setAberto(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs text-amber-500/60 border border-dashed border-amber-500/20 hover:border-amber-500/50 hover:text-amber-400 hover:bg-amber-500/5 transition-all group"
            >
                <Sparkles className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                Avulso
            </button>

            <Dialog open={aberto} onOpenChange={setAberto}>
                <DialogContent className="bg-zinc-900 border-white/10 shadow-2xl shadow-black/60 max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 rounded-lg bg-amber-500/10">
                                <Sparkles className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                                <DialogTitle className="text-zinc-100">Serviço Avulso</DialogTitle>
                                <DialogDescription>
                                    Coluna: <span className={`font-medium ${colunaColor}`}>{colunaLabel}</span>
                                    {" · "}O valor vai para a carteira devedora do cliente.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
                            <FormField control={form.control} name="nome" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descrição do Serviço *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Landing page, Logo, Consultoria..." className="border-white/10 bg-zinc-800" autoFocus {...field} />
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
                                                    <SelectValue placeholder={carregandoClientes ? "..." : "Selecionar"} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-zinc-800 border-white/10">
                                                {clientes.length === 0 && !carregandoClientes && (
                                                    <SelectItem value="none" disabled>Nenhum cliente</SelectItem>
                                                )}
                                                {clientes.map(c => (
                                                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="valorAvulso" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Valor (R$) *</FormLabel>
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
                            </div>

                            <FormField control={form.control} name="prazoEstimado" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Prazo (Opcional)</FormLabel>
                                    <FormControl>
                                        <Input type="date" className="border-white/10 bg-zinc-800 text-zinc-300" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="descricao" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Observações (Opcional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Detalhes adicionais..." className="border-white/10 bg-zinc-800" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {/* Banner informativo */}
                            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5 text-xs text-amber-300 flex gap-2">
                                <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                <span>O valor será lançado como <strong>Receita Pendente</strong> na carteira devedora do cliente, disponível para fechamento no final do mês.</span>
                            </div>

                            <Button
                                type="submit"
                                disabled={carregando || carregandoClientes}
                                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                            >
                                {carregando ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando...</>
                                ) : (
                                    <><Plus className="w-4 h-4 mr-2" />Criar Serviço Avulso</>
                                )}
                            </Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    );
}
