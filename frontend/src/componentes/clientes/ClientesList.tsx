import { useState, useEffect, useCallback } from "react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Trash2, UserCheck, UserX, Pencil, DollarSign, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { clientesApi, financeiroApi, type Cliente, type DevedorItem } from "../../servicos/api";
import { NovoClienteButton, ClienteDialog } from "./ClienteForm";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

// @Agent: UI/UX Designer (AUID) + ASP — ClientesList integrado com API real

export function ClientesList() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);
    const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
    const [clienteParaDeletar, setClienteParaDeletar] = useState<Cliente | null>(null);
    const [deletando, setDeletando] = useState(false);

    const carregarClientes = useCallback(async () => {
        setCarregando(true);
        setErro(null);
        try {
            const dados = await clientesApi.listar();
            setClientes(dados);
        } catch (e: any) {
            setErro(e.message || "Falha ao carregar clientes.");
            toast.error("Erro ao carregar clientes", { description: e.message });
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => { carregarClientes(); }, [carregarClientes]);

    async function confirmarDeleteCliente() {
        if (!clienteParaDeletar) return;
        setDeletando(true);
        try {
            await clientesApi.deletar(clienteParaDeletar.id);
            setClientes(prev => prev.filter(c => c.id !== clienteParaDeletar.id));
            toast.success("Cliente removido.", { description: `"${clienteParaDeletar.nome}" e seus dados foram arquivados.` });
            setClienteParaDeletar(null);
        } catch (e: any) {
            toast.error("Erro ao remover cliente", { description: e.message });
        } finally {
            setDeletando(false);
        }
    }

    return (
        <Card className="w-full bg-zinc-900 border-white/10 shadow-indigo-500/10">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl text-emerald-400">Clientes</CardTitle>
                    <CardDescription>
                        {carregando ? "Carregando..." : `${clientes.length} cliente${clientes.length !== 1 ? "s" : ""} na base`}
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost" size="sm"
                        onClick={carregarClientes}
                        disabled={carregando}
                        className="text-zinc-500 hover:text-zinc-100"
                    >
                        <RefreshCw className={`w-4 h-4 ${carregando ? "animate-spin" : ""}`} />
                    </Button>
                    <CarteirasDevedorasDialog />
                    <NovoClienteButton onClienteCriado={carregarClientes} />
                </div>
            </CardHeader>
            <CardContent>
                {carregando ? (
                    <div className="flex items-center justify-center py-12 gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                        <span className="text-zinc-500 text-sm">Buscando clientes...</span>
                    </div>
                ) : erro ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <p className="text-red-400 text-sm">{erro}</p>
                        <Button variant="outline" size="sm" onClick={carregarClientes}>Tentar novamente</Button>
                    </div>
                ) : (
                    <div className="rounded-md border border-white/10">
                        <Table>
                            <TableHeader className="bg-zinc-800/50">
                                <TableRow className="border-white/10 hover:bg-transparent">
                                    <TableHead className="font-semibold text-zinc-300">Nome / Empresa</TableHead>
                                    <TableHead className="font-semibold text-zinc-300">E-mail</TableHead>
                                    <TableHead className="font-semibold text-zinc-300">Telefone</TableHead>
                                    <TableHead className="font-semibold text-zinc-300 text-center">Status</TableHead>
                                    <TableHead className="font-semibold text-zinc-300 text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clientes.map((cliente) => (
                                    <TableRow key={cliente.id} className="border-white/10 hover:bg-zinc-800/50 transition-colors">
                                        <TableCell className="font-medium text-emerald-400">{cliente.nome}</TableCell>
                                        <TableCell className="text-zinc-400">{cliente.email || "—"}</TableCell>
                                        <TableCell className="text-zinc-400">{cliente.telefone || "—"}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                className={cliente.status === "ATIVO"
                                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                    : "bg-zinc-700/50 text-zinc-400 border border-white/10"
                                                }
                                            >
                                                {cliente.status === "ATIVO"
                                                    ? <><UserCheck className="w-3 h-3 mr-1 inline" />Ativo</>
                                                    : <><UserX className="w-3 h-3 mr-1 inline" />Inativo</>
                                                }
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost" size="sm"
                                                    onClick={() => setClienteEditando(cliente)}
                                                    title="Editar / Prontuário"
                                                    className="text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10 h-7 w-7 p-0"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost" size="sm"
                                                    onClick={() => setClienteParaDeletar(cliente)}
                                                    title="Remover cliente"
                                                    className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10 h-7 w-7 p-0"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {clientes.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-zinc-500">
                                            Nenhum cliente cadastrado. Clique em "Novo Cliente" para começar!
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>

            <ClienteDialog
                cliente={clienteEditando}
                aberto={!!clienteEditando}
                onOpenChange={(open) => !open && setClienteEditando(null)}
                onSucesso={() => {
                    setClienteEditando(null);
                    carregarClientes();
                }}
            />

            {/* Diálogo de confirmação de exclusão */}
            <Dialog open={!!clienteParaDeletar} onOpenChange={(open) => !open && setClienteParaDeletar(null)}>
                <DialogContent className="bg-zinc-900 border-white/10 max-w-sm shadow-2xl shadow-black/60">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 rounded-full bg-red-500/10">
                                <Trash2 className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <DialogTitle className="text-zinc-100">Remover Cliente</DialogTitle>
                                <DialogDescription className="text-zinc-500">
                                    Esta ação arquiva o cliente e cancela seus contratos.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="bg-zinc-800/60 rounded-lg p-3 border border-white/5 mb-4">
                        <p className="text-sm text-zinc-300 font-medium">{clienteParaDeletar?.nome}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{clienteParaDeletar?.email ?? "sem e-mail"}</p>
                        <div className="mt-2 flex items-start gap-2">
                            <span className="text-[10px] text-amber-400/80 leading-relaxed">
                                ⚠️ Contratos e projetos vinculados serão cancelados e arquivados.
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            className="flex-1 border border-white/10 text-zinc-400 hover:text-zinc-100"
                            onClick={() => setClienteParaDeletar(null)}
                            disabled={deletando}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className="flex-1 bg-red-600 hover:bg-red-500 text-white"
                            onClick={confirmarDeleteCliente}
                            disabled={deletando}
                        >
                            {deletando ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Removendo...</> : "Confirmar Remoção"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

// ── COMPONENTE: Carteiras Devedoras (Fechamento/Consolidação) ─────────────
function CarteirasDevedorasDialog() {
    const [aberto, setAberto] = useState(false);
    const [itens, setItens] = useState<DevedorItem[]>([]);
    const [carregando, setCarregando] = useState(false);
    const [consolidandoId, setConsolidandoId] = useState<string | null>(null);

    const carregarPendentes = useCallback(async () => {
        setCarregando(true);
        try {
            const data = await financeiroApi.carteiraDevedora();
            setItens(data);
        } catch (e: any) {
            toast.error("Erro ao carregar carteiras", { description: e.message });
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => {
        if (aberto) carregarPendentes();
    }, [aberto, carregarPendentes]);

    // Agrupa por cliente
    const agrupado = itens.reduce((acc, item) => {
        const id = item.clienteId ?? "unknown";
        if (!acc[id]) acc[id] = { nome: item.clienteNome, total: 0, lancamentos: [] };
        acc[id].lancamentos.push(item);
        acc[id].total += Number(item.valor);
        return acc;
    }, {} as Record<string, { nome: string; total: number; lancamentos: DevedorItem[] }>);

    async function consolidarCliente(clienteId: string, lancamentoIds: string[]) {
        setConsolidandoId(clienteId);
        try {
            const res = await financeiroApi.consolidar(lancamentoIds);
            toast.success("Fatura consolidada com sucesso!", { description: `${res.count} lançamentos marcados como pagos.` });
            await carregarPendentes();
        } catch (e: any) {
            toast.error("Erro ao consolidar fatura", { description: e.message });
        } finally {
            setConsolidandoId(null);
        }
    }

    const formatCurrency = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    const keys = Object.keys(agrupado);

    return (
        <Dialog open={aberto} onOpenChange={setAberto}>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setAberto(true)}
                className="bg-zinc-800 border-amber-500/20 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 gap-2"
            >
                <DollarSign className="w-4 h-4" /> Carteiras Devedoras
            </Button>

            <DialogContent className="bg-zinc-900 border-white/10 shadow-2xl max-w-2xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-zinc-100 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-amber-400" />
                        Carteiras Devedoras (Fechamento)
                    </DialogTitle>
                    <DialogDescription>
                        Lista de todos os projetos avulsos e receitas pendentes agrupadas por cliente.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {carregando ? (
                        <div className="flex items-center justify-center py-12 gap-3">
                            <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                            <span className="text-zinc-400 text-sm">Buscando pendências...</span>
                        </div>
                    ) : keys.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                            <p className="text-zinc-500">Nenhum valor pendente.</p>
                            <p className="text-xs text-zinc-600">Todos os clientes estão com as faturas em dia!</p>
                        </div>
                    ) : (
                        keys.map(clientId => {
                            const desc = agrupado[clientId];
                            const ids = desc.lancamentos.map(l => l.id);
                            return (
                                <div key={clientId} className="bg-zinc-800/40 border border-white/5 rounded-xl p-4 space-y-3 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/10 to-transparent pointer-events-none rounded-tr-xl" />

                                    <div className="flex items-start justify-between relative z-10">
                                        <div>
                                            <h4 className="font-semibold text-zinc-100">{desc.nome}</h4>
                                            <p className="text-xs text-zinc-500">{desc.lancamentos.length} item(ns) pendente(s)</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-amber-400">{formatCurrency(desc.total)}</p>
                                            <Button
                                                size="sm"
                                                onClick={() => consolidarCliente(clientId, ids)}
                                                disabled={consolidandoId === clientId}
                                                className="mt-2 h-7 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-all"
                                            >
                                                {consolidandoId === clientId ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                                                Consolidar Pgt.
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 relative z-10 pt-2 border-t border-white/5">
                                        {desc.lancamentos.map(l => (
                                            <div key={l.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors">
                                                <div className="flex flex-col">
                                                    <span className="text-zinc-300 font-medium">{l.projetoNome} {l.avulso && <span className="text-[9px] bg-amber-500/10 text-amber-300 px-1 py-0.5 rounded ml-1">Avulso</span>}</span>
                                                    <span className="text-zinc-500 flex items-center gap-1">Vencimento: {new Date(l.dataVencimento).toLocaleDateString("pt-BR")}</span>
                                                </div>
                                                <span className="text-zinc-400">{formatCurrency(l.valor)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
