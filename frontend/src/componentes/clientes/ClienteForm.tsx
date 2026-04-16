import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, UploadCloud } from "lucide-react";
import { clientesApi, uploadsApi, type Cliente } from "../../servicos/api";

const formSchema = z.object({
    nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres."),
    email: z.string().email("E-mail inválido.").optional().or(z.literal("")),
    telefone: z.string().optional(),
    documento: z.string().optional(),
    linkDrive: z.string().url("URL inválida.").optional().or(z.literal("")),
    linkBriefing: z.string().url("URL inválida.").optional().or(z.literal("")),
    observacoes: z.string().optional(),
    saude: z.enum(["OTIMA", "REGULAR", "ALERTA"]),
    mrrEstimado: z.number().optional(),
    logoUrl: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

function ClienteFormContent({
    cliente,
    onSucesso,
    onCancel,
}: {
    cliente?: Cliente | null;
    onSucesso: () => void;
    onCancel: () => void;
}) {
    const [carregando, setCarregando] = useState(false);
    const [step, setStep] = useState(1);
    
    // Upload de Imagem State
    const [logoPreview, setLogoPreview] = useState<string | null>(cliente?.logoUrl || null);
    const [logoFile, setLogoFile] = useState<File | null>(null);

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
            saude: cliente?.saude || "OTIMA",
            mrrEstimado: cliente?.mrrEstimado || undefined,
            logoUrl: cliente?.logoUrl || "",
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
                saude: cliente.saude || "OTIMA",
                mrrEstimado: cliente.mrrEstimado || undefined,
                logoUrl: cliente.logoUrl || "",
            });
            setLogoPreview(cliente.logoUrl || null);
            setStep(1); // Reset step when client changes
        }
    }, [cliente, form]);

    async function advanceStep() {
        const ok = await form.trigger(["nome", "email", "telefone", "documento"]);
        if (ok) {
            setStep(2);
        }
    }

    async function onSubmit(values: FormValues) {
        setCarregando(true);
        try {
            let finalLogoUrl = values.logoUrl;
            
            // Firing Multer Upload Interally if File exists
            if (logoFile) {
                finalLogoUrl = await uploadsApi.enviarArquivo(logoFile);
            }

            const payload = {
                ...values,
                email: values.email || undefined,
                telefone: values.telefone || undefined,
                documento: values.documento || undefined,
                linkDrive: values.linkDrive || undefined,
                linkBriefing: values.linkBriefing || undefined,
                observacoes: values.observacoes || undefined,
                logoUrl: finalLogoUrl,
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full max-h-[85vh]">
                {/* Header & Stepper */}
                <div className="p-8 pb-4 shrink-0">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-white uppercase">{cliente ? "Editar Cliente" : "Novo Cliente"}</h2>
                            <p className="text-zinc-500 text-sm mt-1">{cliente ? "Atualize os dados e contratos desta parceria." : "Configure o perfil e parâmetros da nova parceria."}</p>
                        </div>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors focus:outline-none"
                        >
                            <span className="material-symbols-outlined text-zinc-400">close</span>
                        </button>
                    </div>

                    {/* Horizontal Stepper */}
                    <div className="relative flex items-center justify-center gap-16 px-2 lg:gap-32">
                        <div className="absolute top-1/2 left-1/4 right-1/4 h-0.5 bg-white/5 -translate-y-1/2 z-0 hidden sm:block"></div>

                        {/* Step 1 */}
                        <div className="relative z-10 flex flex-col items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-lg ${step >= 1 ? "bg-brand text-[#12050e] shadow-[0_0_15px_rgba(131,17,212,0.4)]" : "bg-dark-900 border border-white/10 text-zinc-500"}`}>
                                01
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${step >= 1 ? "text-brand" : "text-zinc-500"}`}>Identidade</span>
                        </div>

                        {/* Step 2 */}
                        <div className="relative z-10 flex flex-col items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-lg ${step >= 2 ? "bg-brand text-[#12050e] shadow-[0_0_15px_rgba(131,17,212,0.4)]" : "bg-dark-900 border border-white/10 text-zinc-500"}`}>
                                02
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${step >= 2 ? "text-brand" : "text-zinc-500"}`}>Prontuário</span>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-10 custom-scrollbar">
                    {step === 1 && (
                        <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                            {/* Section 1: Business Identity */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                <div className="lg:col-span-4">
                                    <h3 className="text-lg font-bold text-white mb-2">Identidade</h3>
                                    <p className="text-zinc-500 text-sm leading-relaxed">Defina a marca e os dados corporativos do cliente.</p>

                                    <div className="mt-6 group relative cursor-pointer" onClick={() => document.getElementById("logo-upload")?.click()}>
                                        <input 
                                            type="file" 
                                            id="logo-upload" 
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setLogoFile(file);
                                                    setLogoPreview(URL.createObjectURL(file));
                                                }
                                            }}
                                        />
                                        <div className="aspect-square w-full sm:w-48 lg:w-full rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 bg-dark-900/50 hover:bg-dark-900 hover:border-brand/40 transition-all duration-300 overflow-hidden">
                                            {logoPreview ? (
                                                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                                            ) : (
                                                <>
                                                    <UploadCloud className="w-10 h-10 text-zinc-600 group-hover:text-brand transition-colors" />
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-brand transition-colors text-center px-4">Upload da Logo<br/>(1:1 Ratio)</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="lg:col-span-8 space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="nome" render={({ field }) => (
                                            <FormItem className="sm:col-span-2">
                                                <FormLabel className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Nome da Empresa / Razão Social *</FormLabel>
                                                <FormControl>
                                                    <Input className="bg-dark-900/50 border-white/10 rounded-xl px-4 py-6 focus-visible:ring-brand focus-visible:border-brand transition-all text-sm placeholder:text-zinc-600 shadow-inner" placeholder="Ex: Studio Phoenix" autoFocus {...field} />
                                                </FormControl>
                                                <FormMessage className="text-xs text-red-400" />
                                            </FormItem>
                                        )} />

                                        <FormField control={form.control} name="documento" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">CNPJ / CPF</FormLabel>
                                                <FormControl>
                                                    <Input className="bg-dark-900/50 border-white/10 rounded-xl px-4 py-6 focus-visible:ring-brand focus-visible:border-brand transition-all text-sm placeholder:text-zinc-600 shadow-inner" placeholder="00.000.000/0001-00" {...field} />
                                                </FormControl>
                                                <FormMessage className="text-xs text-red-400" />
                                            </FormItem>
                                        )} />
                                        
                                        <FormField control={form.control} name="saude" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 ml-1">Status de Saúde <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span></FormLabel>
                                                <FormControl>
                                                    <select 
                                                        className="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-4 focus-visible:ring-brand focus-visible:border-brand transition-all text-sm placeholder:text-zinc-600 shadow-inner text-white appearance-none" 
                                                        {...field}
                                                    >
                                                        <option value="OTIMA">Ótima (Operação Estável)</option>
                                                        <option value="REGULAR">Regular (Atenção)</option>
                                                        <option value="ALERTA">Alerta (Risco de Inadimplência/Churn)</option>
                                                    </select>
                                                </FormControl>
                                                <FormMessage className="text-xs text-red-400" />
                                            </FormItem>
                                        )} />
                                    </div>
                                </div>
                            </div>

                            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-10"></div>

                            {/* Section 2: Primary Contact */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                <div className="lg:col-span-4">
                                    <h3 className="text-lg font-bold text-white mb-2">Contato Principal</h3>
                                    <p className="text-zinc-500 text-sm leading-relaxed">A pessoa responsável pela comunicação direta e aprovações.</p>
                                </div>
                                <div className="lg:col-span-8 space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="email" render={({ field }) => (
                                            <FormItem className="sm:col-span-2">
                                                <FormLabel className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">E-mail de Contato</FormLabel>
                                                <FormControl>
                                                    <Input type="email" className="bg-dark-900/50 border-white/10 rounded-xl px-4 py-6 focus-visible:ring-brand focus-visible:border-brand transition-all text-sm placeholder:text-zinc-600 shadow-inner" placeholder="contato@cliente.com" {...field} />
                                                </FormControl>
                                                <FormMessage className="text-xs text-red-400" />
                                            </FormItem>
                                        )} />

                                        <FormField control={form.control} name="telefone" render={({ field }) => (
                                            <FormItem className="sm:col-span-2">
                                                <FormLabel className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Telefone / WhatsApp</FormLabel>
                                                <FormControl>
                                                    <Input className="bg-dark-900/50 border-white/10 rounded-xl px-4 py-6 focus-visible:ring-brand focus-visible:border-brand transition-all text-sm placeholder:text-zinc-600 shadow-inner" placeholder="+55 (00) 00000-0000" {...field} />
                                                </FormControl>
                                                <FormMessage className="text-xs text-red-400" />
                                            </FormItem>
                                        )} />
                                    </div>
                                </div>
                            </div>

                            {/* Success Indicator */}
                            <div className="bg-brand/5 border border-brand/20 rounded-2xl p-6 flex items-start gap-4 mt-10">
                                <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center shrink-0 border border-brand/20">
                                    <span className="material-symbols-outlined text-brand" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white">Próxima Etapa: Prontuário</h4>
                                    <p className="text-zinc-500 text-xs mt-1 leading-relaxed">No próximo passo, você anexará os links do Drive, Briefing e outras informações de onboarding.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                            {/* Section 3: Prontuário */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                <div className="lg:col-span-4">
                                    <h3 className="text-lg font-bold text-white mb-2">Prontuário e Links</h3>
                                    <p className="text-zinc-500 text-sm leading-relaxed">Anexe os diretórios raízes deste cliente para rápido acesso futuro pelo time.</p>
                                </div>
                                <div className="lg:col-span-8 space-y-6">
                                    <div className="grid grid-cols-1 gap-6">
                                        <FormField control={form.control} name="linkDrive" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-[16px] text-blue-400">cloud</span>
                                                    Link do Google Drive
                                                </FormLabel>
                                                <FormControl>
                                                    <Input type="url" className="bg-dark-900/50 border-white/10 rounded-xl px-4 py-6 focus-visible:ring-brand focus-visible:border-brand transition-all text-sm placeholder:text-zinc-600 shadow-inner" placeholder="https://drive.google.com/..." {...field} />
                                                </FormControl>
                                                <FormMessage className="text-xs text-red-400" />
                                            </FormItem>
                                        )} />

                                        <FormField control={form.control} name="linkBriefing" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-[16px] text-purple-400">draw</span>
                                                    Link do Briefing
                                                </FormLabel>
                                                <FormControl>
                                                    <Input type="url" className="bg-dark-900/50 border-white/10 rounded-xl px-4 py-6 focus-visible:ring-brand focus-visible:border-brand transition-all text-sm placeholder:text-zinc-600 shadow-inner" placeholder="https://docs.google.com/..." {...field} />
                                                </FormControl>
                                                <FormMessage className="text-xs text-red-400" />
                                            </FormItem>
                                        )} />

                                        <FormField control={form.control} name="observacoes" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-[16px] text-emerald-400">text_snippet</span>
                                                    Observações Internas
                                                </FormLabel>
                                                <FormControl>
                                                    <Textarea className="bg-dark-900/50 border-white/10 rounded-xl px-4 py-4 min-h-[150px] focus-visible:ring-brand focus-visible:border-brand transition-all text-sm placeholder:text-zinc-600 shadow-inner resize-none" placeholder="Anotações de escopo, preferências do cliente, etc..." {...field} />
                                                </FormControl>
                                                <FormMessage className="text-xs text-red-400" />
                                            </FormItem>
                                        )} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-8 py-6 border-t border-white/10 flex items-center justify-between bg-dark-950/50 shrink-0">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-zinc-500 hover:text-white hover:bg-white/5 transition-all focus:outline-none"
                    >
                        Cancelar
                    </button>
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => step === 2 && setStep(1)}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold border transition-all focus:outline-none ${step === 2 ? "border-white/10 text-white hover:bg-white/5" : "border-white/5 text-zinc-600 opacity-50 cursor-not-allowed"}`}
                            disabled={step === 1}
                        >
                            Voltar
                        </button>

                        {step === 1 ? (
                            <button
                                type="button"
                                onClick={advanceStep}
                                className="px-8 py-3 rounded-xl text-sm font-black text-[#12050e] bg-brand hover:bg-brand-light shadow-[0_0_20px_rgba(131,17,212,0.3)] transition-all flex items-center gap-2 focus:outline-none"
                            >
                                Próximo <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={carregando}
                                className="px-8 py-3 rounded-xl text-sm font-black text-[#12050e] bg-gradient-to-br from-emerald-400 to-emerald-500 hover:brightness-110 shadow-[0_0_20px_rgba(52,211,153,0.3)] transition-all flex items-center gap-2 focus:outline-none"
                            >
                                {carregando ? <><Loader2 className="w-5 h-5 animate-spin" /> Salvando...</> : "Salvar Cliente"}
                            </button>
                        )}
                    </div>
                </div>
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
            {/* The Dialog component automatically provides an overlay in Shadcn UI. 
               We remove default close button logic via CSS to match mockup exactly. 
               All inner paddings are removed with p-0 */}
            <DialogContent className="glass-card max-w-4xl max-h-[921px] rounded-[2rem] p-0 overflow-hidden shadow-2xl shadow-brand/10 border-white/10 [&>button]:hidden sm:rounded-[2rem] bg-dark-950/95 backdrop-blur-3xl">
                {/* No <DialogHeader> element used explicitly to give us full layout control */}
                <ClienteFormContent
                    cliente={cliente}
                    onSucesso={onSucesso}
                    onCancel={() => onOpenChange(false)}
                />
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
                className="bg-brand hover:bg-brand-light text-white font-bold gap-2 shadow-[0_0_15px_rgba(131,17,212,0.2)] rounded-xl border border-brand-light/20 transition-all px-5"
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
