import { useState, useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    X, Check, Briefcase, Trash2, Loader2, Sparkles, Receipt,
    Paperclip, Image as ImageIcon, Plus, Filter, Search, Send
} from "lucide-react";
import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

import {
    contratosApi, clientesApi, projetosApi, creditosApi,
    type Contrato, type Cliente, type CreditoContrato
} from "../../servicos/api";
import { SmartEditor } from "../ui/SmartEditor";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// ------ SCHEMAS ------
const baseProjetoSchema = z.object({
    nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
    modalidade: z.enum(["CONTRATO", "AVULSO"]),
    contratoId: z.string().optional(),
    clienteId: z.string().optional(),
    status: z.string(),
    prazoEstimado: z.string().optional(),
    descricao: z.string().optional(),
    itensAvulsos: z.array(z.object({
        descricao: z.string(),
        quantidade: z.number(),
        valorUnitario: z.number()
    })).optional()
});

const projetoSchema = baseProjetoSchema.refine(
    (data) => {
        if (data.modalidade === "CONTRATO" && !data.contratoId) return false;
        if (data.modalidade === "AVULSO" && !data.clienteId) return false;
        return true;
    },
    { message: "Selecione o Cliente ou Contrato correspondente.", path: ["clienteId"] }
);

type ProjetoFormValues = z.infer<typeof projetoSchema>;

export function NovoProjetoModal({
    isOpen,
    onClose,
    onProjetoCriado,
    statusInicial = "NAO_INICIADO"
}: {
    isOpen: boolean;
    onClose: () => void;
    onProjetoCriado: () => void;
    statusInicial?: string;
}) {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [contratos, setContratos] = useState<Contrato[]>([]);
    const [creditos, setCreditos] = useState<CreditoContrato[]>([]);
    const [carregandoDados, setCarregandoDados] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [creditoSelecionado, setCreditoSelecionado] = useState<string | null>(null);

    const form = useForm<ProjetoFormValues>({
        resolver: zodResolver(projetoSchema),
        defaultValues: {
            nome: "",
            modalidade: "CONTRATO",
            contratoId: "",
            clienteId: "",
            status: statusInicial === "NAO_INICIADO" ? "Backlog" : statusInicial === "EM_ANDAMENTO" ? "In Progress" : statusInicial === "CONCLUIDO" ? "Completed" : "Backlog",
            prazoEstimado: "",
            descricao: "",
            itensAvulsos: [{ descricao: "", quantidade: 1, valorUnitario: 0 }]
        }
    });

    const { fields: itensAvulsosFields, append: appendItem, remove: removeItem } = useFieldArray({
        control: form.control,
        name: "itensAvulsos" as never
    });

    const modalidadeW = form.watch("modalidade");
    const contratoIdW = form.watch("contratoId");
    const itensAvulsosW = form.watch("itensAvulsos") || [];

    const totalAvulso = itensAvulsosW.reduce(
        (acc, item) => acc + (Number(item.quantidade) || 0) * (Number(item.valorUnitario) || 0),
        0
    );

    useEffect(() => {
        if (!isOpen) return;
        setCarregandoDados(true);
        Promise.all([clientesApi.listar(), contratosApi.listar()])
            .then(([cl, co]) => {
                setClientes(cl);
                setContratos(co);
            })
            .catch(() => toast.error("Erro ao carregar dados."))
            .finally(() => setCarregandoDados(false));
    }, [isOpen]);

    useEffect(() => {
        if (contratoIdW && modalidadeW === "CONTRATO") {
            creditosApi.listarPorContrato(contratoIdW)
                .then(setCreditos)
                .catch(() => setCreditos([]));
        } else {
            setCreditos([]);
            setCreditoSelecionado(null);
        }
    }, [contratoIdW, modalidadeW]);

    async function onSubmit(data: ProjetoFormValues) {
        setSalvando(true);
        try {
            const finalStatus = data.status === "Backlog" ? "NAO_INICIADO" : data.status === "In Progress" ? "EM_ANDAMENTO" : data.status === "Completed" ? "CONCLUIDO" : "NAO_INICIADO";
            
            if (data.modalidade === "CONTRATO") {
                await projetosApi.criar({
                    nome: data.nome,
                    contratoId: data.contratoId,
                    creditoId: creditoSelecionado || undefined,
                    status: finalStatus,
                    descricao: data.descricao,
                    prazoEstimado: data.prazoEstimado || undefined,
                });
            } else {
                if (totalAvulso <= 0) {
                    toast.error("O valor total do serviço avulso deve ser maior que zero.");
                    setSalvando(false);
                    return;
                }
                const descricaoDetalhada = (data.itensAvulsos || [])
                    .map(i => `• ${i.descricao}: ${i.quantidade}x R$ ${Number(i.valorUnitario).toFixed(2)} = R$ ${(Number(i.quantidade) * Number(i.valorUnitario)).toFixed(2)}`)
                    .join("\n");
                const descricaoFinal = data.descricao ? `${descricaoDetalhada}\n\nObservações:\n${data.descricao}` : descricaoDetalhada;

                await projetosApi.criarAvulso({
                    nome: data.nome,
                    clienteId: data.clienteId!,
                    valorAvulso: totalAvulso,
                    status: finalStatus,
                    descricao: descricaoFinal,
                    servicos: data.itensAvulsos?.map(i => ({ nome: i.descricao, valor: Number(i.quantidade) * Number(i.valorUnitario) })),
                    prazoEstimado: data.prazoEstimado || undefined,
                });
            }
            toast.success("Projeto criado com sucesso!");
            form.reset();
            onProjetoCriado();
            onClose();
        } catch (e: any) {
            toast.error("Erro ao criar projeto", { description: e.message });
        } finally {
            setSalvando(false);
        }
    }

    if (!isOpen) return null;

    const clienteVinculado = dataClienteParaContrato(contratoIdW, contratos);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 font-sans" style={{ backgroundColor: '#0a0a0a', color: '#e5e7eb' }}>
                    <style>{`
                        .modal-scrollbar::-webkit-scrollbar { width: 6px; }
                        .modal-scrollbar::-webkit-scrollbar-track { background: #1e1e1e; }
                        .modal-scrollbar::-webkit-scrollbar-thumb { background: #333333; border-radius: 10px; }
                        .modal-scrollbar::-webkit-scrollbar-thumb:hover { background: #8311d4; }
                    `}</style>
                    <motion.main
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 10 }}
                        className="bg-[#1e1e1e] w-full max-w-[1400px] rounded-[8px] shadow-2xl border border-[#333333] overflow-hidden flex flex-col lg:flex-row h-[90vh] lg:h-[921px]"
                    >
                        {/* Seção Principal Esquerda */}
                        <section className="flex-1 p-6 overflow-y-auto border-b lg:border-b-0 lg:border-r border-[#333333] modal-scrollbar">
                            <div className="flex items-center justify-between mb-6 text-sm text-gray-400">
                                <div className="flex items-center gap-2">
                                    <span className="hover:text-white cursor-pointer transition-colors">Workspace</span>
                                    <span>/</span>
                                    <span className="text-[#8311d4] font-medium">Novo Projeto</span>
                                </div>
                                <button type="button" onClick={onClose} className="hover:text-white transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="mb-8 relative">
                                <input
                                    {...form.register("nome")}
                                    placeholder="Implement Real-time Data Visualization Dashboard"
                                    autoFocus
                                    className="w-full text-3xl font-extrabold text-white mb-2 leading-tight bg-transparent outline-none placeholder:text-gray-600 border-b border-transparent focus:border-[#333333]"
                                />
                                {form.formState.errors.nome && <span className="text-red-400 text-xs mt-1 block mb-2">{form.formState.errors.nome.message}</span>}

                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-900/30 text-green-400 rounded-full border border-green-800/50 text-[11px] font-bold uppercase tracking-wider cursor-pointer group relative">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                                        {modalidadeW}
                                        {/* Dropdown de modalidade improvisado na badge */}
                                        <div className="hidden group-hover:flex absolute top-full left-0 mt-2 bg-[#1e1e1e] border border-[#333333] rounded-[8px] shadow-xl flex-col p-1 z-50 min-w-[120px]">
                                            <button type="button" onClick={() => form.setValue("modalidade", "CONTRATO")} className="text-left px-3 py-1.5 text-xs text-white hover:bg-[#8311d4] rounded">Contrato</button>
                                            <button type="button" onClick={() => form.setValue("modalidade", "AVULSO")} className="text-left px-3 py-1.5 text-xs text-white hover:bg-[#8311d4] rounded">Avulso</button>
                                        </div>
                                    </div>
                                    <span className="text-gray-500 italic">Created just now by System User</span>
                                </div>
                            </div>

                            <div className="mb-10">
                                <div className="flex items-center gap-6 border-b border-[#333333] mb-4">
                                    <button type="button" className="pb-3 text-xs font-bold uppercase tracking-wider text-white border-b-2 border-[#8311d4]">DESCRIÇÃO DA TASK</button>
                                    <button type="button" className="pb-3 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-300 transition-colors">BRIEFING DO PROJETO</button>
                                </div>
                                <div className="bg-[#121212] border border-[#333333] rounded-[8px] p-4 min-h-[120px] text-gray-300 leading-relaxed text-sm">
                                    <Controller
                                        control={form.control}
                                        name="descricao"
                                        render={({ field }) => (
                                            <SmartEditor
                                                value={field.value || ""}
                                                onChange={field.onChange}
                                                placeholder="The dashboard needs to display live telemetry data from the core engine... (Use o editor)"
                                                className="h-full min-h-[120px] text-gray-300 border-none bg-transparent"
                                            />
                                        )}
                                    />
                                </div>
                                <div className="mt-2 flex gap-2">
                                    <button type="button" className="text-xs text-[#8311d4] font-semibold hover:underline">Edit Content</button>
                                </div>
                            </div>

                            <div className="mb-10">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Attachments (2)</label>
                                    <button type="button" className="text-xs text-[#8311d4] font-semibold hover:underline">+ Add</button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="flex items-center p-3 bg-[#121212] border border-[#333333] rounded-[8px] group hover:border-[#8311d4] transition-colors cursor-pointer">
                                        <div className="w-8 h-8 bg-blue-900/20 text-blue-400 flex items-center justify-center rounded mr-3">
                                            <Paperclip className="w-5 h-5"/>
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-xs font-medium text-white truncate">dashboard_v2_final.pdf</p>
                                            <p className="text-[10px] text-gray-500 uppercase">2.4 MB</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center p-3 bg-[#121212] border border-[#333333] rounded-[8px] group hover:border-[#8311d4] transition-colors cursor-pointer">
                                        <div className="w-8 h-8 bg-purple-900/20 text-purple-400 flex items-center justify-center rounded mr-3">
                                            <ImageIcon className="w-5 h-5"/>
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-xs font-medium text-white truncate">ui_mockup_dark.png</p>
                                            <p className="text-[10px] text-gray-500 uppercase">1.1 MB</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">Activity & Comments</label>
                                <div className="flex gap-3 mb-6">
                                    <div className="w-8 h-8 rounded-full bg-[#8311d4] flex items-center justify-center font-bold text-[10px] shrink-0 text-white">JD</div>
                                    <div className="flex-1 relative">
                                        <textarea className="w-full bg-[#121212] border border-[#333333] rounded-[8px] focus:ring-1 focus:ring-[#8311d4] focus:border-[#8311d4] text-sm min-h-[60px] p-2 outline-none" placeholder="Write a comment...">@</textarea>
                                        
                                        <div className="flex justify-end mt-2">
                                            <button type="button" className="bg-[#8311d4] hover:bg-opacity-90 text-white px-4 py-1.5 rounded-[8px] text-xs font-bold transition-all">POST COMMENT</button>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-bold text-white text-[10px] shrink-0">AR</div>
                                        <div className="bg-[#121212]/50 p-3 rounded-[8px] border border-[#333333] flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-white">Alex Rivera</span>
                                                <span className="text-[10px] text-gray-500">1 hour ago</span>
                                            </div>
                                            <p className="text-xs text-gray-300">I've uploaded the updated D3.js implementation guide.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Sidebar Direita */}
                        <aside className="w-full lg:w-[480px] bg-[#121212]/30 p-6 flex flex-col gap-6 overflow-y-auto modal-scrollbar">
                            <div className="grid grid-cols-1 gap-4 bg-[#1e1e1e]/40 p-4 rounded-[8px] border border-[#333333]/50">
                                <h3 className="text-xs font-black uppercase tracking-widest text-[#8311d4] flex items-center gap-2 mb-1">
                                    <Briefcase className="w-4 h-4 text-sm" />
                                    Client & Contract
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {modalidadeW === "CONTRATO" ? (
                                        <>
                                            <div className="col-span-2">
                                                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Contract Number</label>
                                                <select
                                                    {...form.register("contratoId")}
                                                    className="w-full bg-[#1e1e1e] border border-[#333333] rounded-[8px] text-sm text-white py-2 px-3 outline-none focus:border-[#8311d4] transition-all appearance-none"
                                                >
                                                    <option value="">Select Contract...</option>
                                                    {contratos.map(c => <option key={c.id} value={c.id}>{c.titulo} - {c.cliente?.nome}</option>)}
                                                </select>
                                                {form.formState.errors.clienteId && <span className="text-red-400 text-xs mt-1 block">{form.formState.errors.clienteId.message}</span>}
                                            </div>
                                            <div className="col-span-1">
                                                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Client Name</label>
                                                <p className="text-sm font-semibold text-white truncate">{clienteVinculado || "Unknown"}</p>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="col-span-2">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Client Name</label>
                                            <select
                                                {...form.register("clienteId")}
                                                className="w-full bg-[#1e1e1e] border border-[#333333] rounded-[8px] text-sm text-white py-2 px-3 outline-none focus:border-[#8311d4] transition-all appearance-none"
                                            >
                                                <option value="">Select Client...</option>
                                                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                            </select>
                                            {form.formState.errors.clienteId && <span className="text-red-400 text-xs mt-1 block">{form.formState.errors.clienteId.message}</span>}
                                        </div>
                                    )}
                                    
                                    <div className="col-span-1">
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Key Contact</label>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[8px] font-bold text-white">MK</div>
                                            <span className="text-xs text-gray-300">Marcus Knight</span>
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Total Project Value</label>
                                        <p className="text-sm font-black text-green-400">$158,000.00</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Task Status</label>
                                    <select {...form.register("status")} className="w-full bg-[#1e1e1e] border border-[#333333] rounded-[8px] text-xs text-white focus:ring-1 focus:border-[#8311d4] py-2 px-3 outline-none appearance-none">
                                        <option value="Backlog">Backlog</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Review">Review</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Members</label>
                                    <div className="flex -space-x-2">
                                        <div className="w-8 h-8 rounded-full border-2 border-[#1e1e1e] bg-[#8311d4] text-white flex items-center justify-center text-[10px] font-bold z-20 relative">JD</div>
                                        <div className="w-8 h-8 rounded-full border-2 border-[#1e1e1e] bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold z-10 relative">SK</div>
                                        <button type="button" className="w-8 h-8 rounded-full border-2 border-dashed border-gray-600 bg-[#1e1e1e] flex items-center justify-center text-gray-500 hover:text-[#8311d4] transition-colors z-0 relative">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-2">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Tags / Est. Prazo</label>
                                <div className="flex flex-wrap gap-1.5 items-center">
                                    <span className="px-2 py-0.5 bg-[#333333] border border-transparent rounded text-[9px] font-bold text-gray-400 uppercase tracking-wider">Frontend</span>
                                    <span className="px-2 py-0.5 bg-[#333333] border border-transparent rounded text-[9px] font-bold text-gray-400 uppercase tracking-wider">High-Priority</span>
                                    <input type="date" {...form.register("prazoEstimado")} className="bg-[#333333] border border-transparent text-[9px] font-bold text-gray-400 uppercase tracking-wider rounded py-[2px] px-2 outline-none css-date-icon-invert" />
                                    <button type="button" className="w-5 h-5 rounded border border-dashed border-gray-600 bg-[#1e1e1e] flex items-center justify-center text-gray-500 hover:text-[#8311d4] transition-colors hover:border-[#8311d4]">
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 bg-[#8311d4]/10 border border-[#8311d4]/20 rounded-[8px] relative overflow-hidden">
                                <div className="relative z-10">
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-[#8311d4] mb-1">Current Task Budget</label>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-black text-white">{modalidadeW === "AVULSO" ? `R$ ${totalAvulso.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "$4,500.00"}</span>
                                        <span className="text-[9px] bg-[#8311d4] text-white px-1.5 py-0.5 rounded font-bold">{modalidadeW === "AVULSO" ? "BRL" : "USD"}</span>
                                    </div>
                                </div>
                                <div className="absolute -right-2 -bottom-2 opacity-5 text-6xl text-[#8311d4] font-serif font-black">
                                    $
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Other Project Tasks</h3>
                                    <div className="flex items-center gap-2">
                                        {modalidadeW === "AVULSO" && (
                                            <button type="button" onClick={() => appendItem({ descricao: "", quantidade: 1, valorUnitario: 0 })} className="text-[10px] text-[#8311d4] font-bold hover:underline">
                                                + ADD ITEM
                                            </button>
                                        )}
                                        <Filter className="w-4 h-4 text-gray-500 hover:text-white transition-colors cursor-pointer" />
                                        <Search className="w-4 h-4 text-gray-500 hover:text-white transition-colors cursor-pointer" />
                                    </div>
                                </div>
                                <div className="bg-[#1e1e1e] border border-[#333333] rounded-[8px] overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-[#121212]/50 border-b border-[#333333]">
                                                <th className="px-3 py-2 text-[9px] font-black text-gray-500 uppercase">Task Name</th>
                                                <th className="px-3 py-2 text-[9px] font-black text-gray-500 uppercase">Owner</th>
                                                <th className="px-3 py-2 text-[9px] font-black text-gray-500 uppercase text-right">Value</th>
                                                {modalidadeW === "AVULSO" && <th className="px-2 w-8"></th>}
                                            </tr>
                                        </thead>
                                        <tbody className="text-[11px] divide-y divide-[#333333]/50">
                                            {modalidadeW === "AVULSO" ? (
                                                itensAvulsosFields.map((field, index) => (
                                                    <tr key={field.id} className="hover:bg-white/5 transition-colors group">
                                                        <td className="px-3 py-2.5">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"></span>
                                                                <input {...form.register(`itensAvulsos.${index}.descricao` as const)} placeholder="Task/Item name" className="bg-transparent text-white outline-none w-full border-b border-transparent focus:border-[#8311d4] max-w-[120px]" />
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2.5">
                                                            <input {...form.register(`itensAvulsos.${index}.quantidade` as const, { valueAsNumber: true })} type="number" className="bg-[#121212] w-12 text-center px-1.5 py-0.5 rounded text-[9px] text-white border border-[#333333] outline-none" />
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right font-bold text-gray-300">
                                                            <input {...form.register(`itensAvulsos.${index}.valorUnitario` as const, { valueAsNumber: true })} type="number" step="0.01" className="bg-transparent text-right w-16 outline-none border-b border-transparent focus:border-[#8311d4]" />
                                                        </td>
                                                        <td className="px-2 text-center text-gray-500 hover:text-red-400">
                                                            <button type="button" onClick={() => removeItem(index)}><Trash2 className="w-3.5 h-3.5"/></button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <>
                                                    <tr className="hover:bg-white/5 transition-colors cursor-pointer group">
                                                        <td className="px-3 py-2.5">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                                <span className="text-white font-medium truncate max-w-[120px]">API Integration</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2.5"><span className="bg-[#121212] px-1.5 py-0.5 rounded text-[9px] text-white">SK</span></td>
                                                        <td className="px-3 py-2.5 text-right font-bold text-gray-300">$8,200</td>
                                                    </tr>
                                                    <tr className="hover:bg-white/5 transition-colors cursor-pointer">
                                                        <td className="px-3 py-2.5">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                                                                <span className="text-white font-medium truncate max-w-[120px]">Security Audit</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2.5"><span className="bg-[#121212] px-1.5 py-0.5 rounded text-[9px] text-white">JD</span></td>
                                                        <td className="px-3 py-2.5 text-right font-bold text-gray-300">$3,500</td>
                                                    </tr>
                                                    <tr className="hover:bg-white/5 transition-colors cursor-pointer">
                                                        <td className="px-3 py-2.5">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                                                                <span className="text-white font-medium truncate max-w-[120px]">User Documentation</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2.5"><span className="bg-[#121212] px-1.5 py-0.5 rounded text-[9px] text-white">AR</span></td>
                                                        <td className="px-3 py-2.5 text-right font-bold text-gray-300">$1,800</td>
                                                    </tr>
                                                </>
                                            )}
                                        </tbody>
                                        <tfoot className="bg-[#121212]/30">
                                            <tr>
                                                <td className="px-3 py-2 text-[9px] font-bold text-gray-500 uppercase" colSpan={2}>Total Allocated</td>
                                                <td className="px-3 py-2 text-right text-[11px] font-black text-white">{modalidadeW === "AVULSO" ? `R$ ${totalAvulso.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "$18,000"}</td>
                                                {modalidadeW === "AVULSO" && <td></td>}
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-[#333333]">
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    <span className="px-2 py-0.5 bg-[#333333] rounded text-[9px] font-bold text-gray-400 uppercase tracking-wider">FRONTEND</span>
                                    <span className="px-2 py-0.5 bg-[#333333] rounded text-[9px] font-bold text-gray-400 uppercase tracking-wider">HIGH-PRIORITY</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={form.handleSubmit(onSubmit)}
                                        disabled={carregandoDados || salvando}
                                        className="flex-1 bg-[#8311d4] text-white text-xs font-black py-2.5 rounded-[8px] hover:brightness-110 transition-all shadow-lg shadow-[#8311d4]/20 flex items-center justify-center gap-2 uppercase"
                                    >
                                        {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                        {salvando ? "Salvando..." : "SAVE ALL CHANGES"}
                                    </button>
                                    <button type="button" onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-[#1e1e1e] border border-[#333333] rounded-[8px] text-gray-500 hover:text-red-400 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </aside>
                    </motion.main>
                </div>
            )}
        </AnimatePresence>
    );
}

function dataClienteParaContrato(contratoId?: string, contratos?: Contrato[]) {
    if (!contratoId || !contratos) return null;
    const cont = contratos.find(c => c.id === contratoId);
    return cont?.cliente?.nome || null;
}
