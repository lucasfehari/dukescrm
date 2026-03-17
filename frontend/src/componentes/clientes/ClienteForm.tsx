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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Loader2, Plus, HardDrive, FileText, FileSignature } from "lucide-react";
import { clientesApi, type Cliente } from "../../servicos/api";

const formSchema = z.object({
    nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres."),
    email: z.string().email("E-mail inválido.").optional().or(z.literal("")),
    telefone: z.string().optional(),
    documento: z.string().optional(),
    linkDrive: z.string().url("URL inválida.").optional().or(z.literal("")),
    linkBriefing: z.string().url("URL inválida.").optional().or(z.literal("")),
    observacoes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function ClienteFormContent({
    cliente,
    onSucesso,
}: {
    cliente?: Cliente | null;
    onSucesso: () => void;
}) {
    const [carregando, setCarregando] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nome: cliente?.nome || "",
            email: cliente?.email || "",
            telefone: cliente?.telefone || "",
            documento: cliente?.documento || "",
            linkDrive: cliente?.linkDrive || "",
            linkBriefing: cliente?.linkBriefing || "",
            observacoes: cliente?.observacoes || "",
        },
    });

    useEffect(() => {
        if (cliente) {
            form.reset({
                nome: cliente.nome,
                email: cliente.email || "",
                telefone: cliente.telefone || "",
                documento: cliente.documento || "",
                linkDrive: cliente.linkDrive || "",
                linkBriefing: cliente.linkBriefing || "",
                observacoes: cliente.observacoes || "",
            });
        }
    }, [cliente, form]);

    async function onSubmit(values: FormValues) {
        setCarregando(true);
        try {
            const payload = {
                ...values,
                email: values.email || undefined,
                telefone: values.telefone || undefined,
                documento: values.documento || undefined,
                linkDrive: values.linkDrive || undefined,
                linkBriefing: values.linkBriefing || undefined,
                observacoes: values.observacoes || undefined,
            };

            if (cliente) {
                await clientesApi.atualizar(cliente.id, payload);
                toast.success("Cliente atualizado!");
            } else {
                await clientesApi.criar({ ...payload, status: "ATIVO" });
                toast.success("Cliente cadastrado!", { description: `${values.nome} foi adicionado à base.` });
            }
            form.reset();
            onSucesso();
        } catch (e: any) {
            toast.error("Erro ao salvar cliente.", { description: e.message });
        } finally {
            setCarregando(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
                <Tabs defaultValue="dados" className="w-full">
                    <TabsList className="flex w-full justify-start gap-2 bg-transparent p-0 mb-6 h-auto">
                        <TabsTrigger
                            value="dados"
                            className="bg-zinc-800/60 text-zinc-400 border border-white/5 hover:bg-zinc-700 hover:text-zinc-200 data-[state=active]:bg-[#0a2e45] data-[state=active]:text-sky-100 data-[state=active]:border-sky-600/40 rounded-lg px-6 py-2.5 transition-all text-sm font-medium flex items-center gap-2 shadow-sm"
                        >
                            <Users className="w-4 h-4" /> Cliente
                        </TabsTrigger>
                        <TabsTrigger
                            value="prontuario"
                            className="bg-zinc-800/60 text-zinc-400 border border-white/5 hover:bg-zinc-700 hover:text-zinc-200 data-[state=active]:bg-[#0a2e45] data-[state=active]:text-sky-100 data-[state=active]:border-sky-600/40 rounded-lg px-6 py-2.5 transition-all text-sm font-medium flex items-center gap-2 shadow-sm"
                        >
                            <FileText className="w-4 h-4" /> Prontuário
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="dados" className="space-y-4 pt-4">
                        <FormField control={form.control} name="nome" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome / Razão Social *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Studio Digital Ltda" className="border-white/10 bg-zinc-800" autoFocus {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-3">
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>E-mail</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="contato@empresa.com" className="border-white/10 bg-zinc-800" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="telefone" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Telefone / WhatsApp</FormLabel>
                                    <FormControl>
                                        <Input placeholder="(11) 99999-9999" className="border-white/10 bg-zinc-800" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="documento" render={({ field }) => (
                            <FormItem>
                                <FormLabel>CPF / CNPJ (Opcional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="00.000.000/0001-00" className="border-white/10 bg-zinc-800" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </TabsContent>

                    <TabsContent value="prontuario" className="space-y-4 pt-4">
                        <FormField control={form.control} name="linkDrive" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2"><HardDrive className="w-4 h-4 text-blue-400" /> Link do Drive</FormLabel>
                                <FormControl>
                                    <Input type="url" placeholder="https://drive.google.com/..." className="border-white/10 bg-zinc-800" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="linkBriefing" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2"><FileSignature className="w-4 h-4 text-purple-400" /> Link do Briefing</FormLabel>
                                <FormControl>
                                    <Input type="url" placeholder="https://docs.google.com/..." className="border-white/10 bg-zinc-800" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="observacoes" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2"><FileText className="w-4 h-4 text-emerald-400" /> Observações (Anotações gerais)</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Preferências do cliente, links auxiliares, histórico detalhado..." className="min-h-[120px] border-white/10 bg-zinc-800 resize-none" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </TabsContent>
                </Tabs>

                <Button
                    type="submit"
                    disabled={carregando}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white mt-6"
                >
                    {carregando ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
                    ) : (cliente ? "Salvar Alterações" : "Cadastrar Cliente")}
                </Button>
            </form>
        </Form>
    );
}

// ── Dialog Modal ──
export function ClienteDialog({
    cliente,
    aberto,
    onOpenChange,
    onSucesso
}: {
    cliente?: Cliente | null;
    aberto: boolean;
    onOpenChange: (open: boolean) => void;
    onSucesso: () => void;
}) {
    return (
        <Dialog open={aberto} onOpenChange={onOpenChange}>
            <DialogContent className="bg-zinc-900 border-white/10 shadow-2xl shadow-black/60 max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                            <Users className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-zinc-100">{cliente ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
                            <DialogDescription>
                                {cliente ? "Atualize dados e o prontuário." : "Cadastre um novo cliente na sua base."}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <ClienteFormContent cliente={cliente} onSucesso={onSucesso} />
            </DialogContent>
        </Dialog>
    );
}

// ── Botão isolado de Novo Cliente (usado no header) ──
export function NovoClienteButton({ onClienteCriado }: { onClienteCriado?: () => void }) {
    const [aberto, setAberto] = useState(false);

    return (
        <>
            <Button
                onClick={() => setAberto(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 shadow-emerald-500/20"
            >
                <Plus className="w-4 h-4" /> Novo Cliente
            </Button>
            <ClienteDialog
                aberto={aberto}
                onOpenChange={setAberto}
                onSucesso={() => {
                    setAberto(false);
                    onClienteCriado?.();
                }}
            />
        </>
    );
}
