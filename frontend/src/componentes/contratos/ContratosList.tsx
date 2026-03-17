import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, ArrowUpRight, RefreshCw, Trash2, Loader2, Package, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { contratosApi, type Contrato } from "../../servicos/api";
import { NovoContratoDialog } from "./ContratoForm";
import { CreditosManager } from "./CreditosManager";

// @Agent: UI/UX Designer (AUID) + ASP — ContratosList integrado com API real

const STATUS_BADGE: Record<string, string> = {
    RASCUNHO: "bg-zinc-700/50 text-zinc-300 border-zinc-700",
    ENVIADO: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    ASSINADO: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    ATIVO: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    EM_ANDAMENTO: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    PAUSADO: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    VENCIDO: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    CANCELADO: "bg-red-500/10 text-red-400 border-red-500/20",
    FINALIZADO: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const STATUS_LABEL: Record<string, string> = {
    RASCUNHO: "📝 Rascunho",
    ENVIADO: "📤 Enviado",
    ASSINADO: "✍️ Assinado",
    ATIVO: "✅ Ativo",
    EM_ANDAMENTO: "⚡ Em Andamento",
    PAUSADO: "⏸️ Pausado",
    VENCIDO: "⚠️ Vencido",
    CANCELADO: "❌ Cancelado",
    FINALIZADO: "🏁 Finalizado",
};

function fmtDate(dt?: string | null) {
    if (!dt) return null;
    return new Date(dt).toLocaleDateString("pt-BR");
}

export function ContratosList({ refreshKey }: { refreshKey?: number }) {
    const [contratos, setContratos] = useState<Contrato[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const carregar = useCallback(async () => {
        setCarregando(true);
        try {
            const dados = await contratosApi.listar();
            setContratos(dados);
        } catch (e: any) {
            toast.error("Erro ao carregar contratos", { description: e.message });
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => { carregar(); }, [carregar, refreshKey]);

    async function deletar(id: string, titulo: string) {
        if (!confirm(`Remover o contrato "${titulo}"?`)) return;
        try {
            await contratosApi.deletar(id);
            setContratos(prev => prev.filter(c => c.id !== id));
            toast.success("Contrato removido.");
        } catch (e: any) {
            toast.error("Erro ao remover contrato", { description: e.message });
        }
    }

    const valorTotal = contratos.reduce((acc, c) => acc + c.valorTotal, 0);

    return (
        <div className="space-y-4">
            {/* Stats rápidas */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="bg-zinc-900 border-white/10">
                    <CardContent className="p-4">
                        <p className="text-xs text-zinc-500 uppercase tracking-wide">Total de Contratos</p>
                        <p className="text-3xl font-bold text-zinc-100 mt-1">{carregando ? "..." : contratos.length}</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-white/10">
                    <CardContent className="p-4">
                        <p className="text-xs text-zinc-500 uppercase tracking-wide">Valor em Carteira</p>
                        <p className="text-3xl font-bold text-emerald-400 mt-1">
                            {carregando ? "..." : `R$ ${valorTotal.toLocaleString("pt-BR")}`}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabela */}
            <Card className="bg-zinc-900 border-white/10">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10">
                                <FileText className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <CardTitle className="text-lg text-emerald-400">Contratos</CardTitle>
                                <CardDescription>
                                    {carregando ? "Carregando..." : `${contratos.length} contrato${contratos.length !== 1 ? "s" : ""}`}
                                </CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={carregar} disabled={carregando}
                                className="text-zinc-500 hover:text-zinc-100">
                                <RefreshCw className={`w-4 h-4 ${carregando ? "animate-spin" : ""}`} />
                            </Button>
                            <NovoContratoDialog onContratoCriado={carregar} />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {carregando ? (
                        <div className="flex items-center justify-center py-10 gap-3">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                            <span className="text-zinc-500 text-sm">Buscando contratos...</span>
                        </div>
                    ) : (
                        <div className="rounded-md border border-white/10">
                            <Table>
                                <TableHeader className="bg-zinc-800/50">
                                    <TableRow className="border-white/10 hover:bg-transparent">
                                        <TableHead className="text-zinc-300 font-semibold">Título</TableHead>
                                        <TableHead className="text-zinc-300 font-semibold">Cliente</TableHead>
                                        <TableHead className="text-zinc-300 font-semibold">Validade</TableHead>
                                        <TableHead className="text-zinc-300 font-semibold text-right">Valor</TableHead>
                                        <TableHead className="text-zinc-300 font-semibold text-center">Status</TableHead>
                                        <TableHead className="text-zinc-300 font-semibold text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {contratos.map(c => (
                                        <>
                                            <TableRow key={c.id} className="border-white/10 hover:bg-zinc-800/50 transition-colors group cursor-pointer" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                                                <TableCell className="font-medium text-zinc-100 flex items-center gap-2">
                                                    {c.titulo}
                                                    <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </TableCell>
                                                <TableCell className="text-zinc-400">{c.cliente?.nome ?? "—"}</TableCell>
                                                <TableCell className="text-zinc-400 text-sm">
                                                    {fmtDate(c.inicioEm) ? (
                                                        <span className="flex flex-col">
                                                            <span className="text-[10px] text-zinc-600">Início: {fmtDate(c.inicioEm)}</span>
                                                            {fmtDate(c.fimEm) && <span className="text-[10px] text-zinc-500">Fim: {fmtDate(c.fimEm)}</span>}
                                                        </span>
                                                    ) : <span className="text-zinc-600">—</span>}
                                                </TableCell>
                                                <TableCell className="text-emerald-400 font-semibold text-right">
                                                    R$ {c.valorTotal.toLocaleString("pt-BR")}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge className={`${STATUS_BADGE[c.status]} border text-xs`}>
                                                        {STATUS_LABEL[c.status] ?? c.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost" size="sm"
                                                            onClick={e => { e.stopPropagation(); setExpandedId(expandedId === c.id ? null : c.id); }}
                                                            className="text-zinc-500 hover:text-indigo-400 hover:bg-indigo-400/10 h-7 w-7 p-0"
                                                            title="Gerenciar créditos"
                                                        >
                                                            <Package className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost" size="sm"
                                                            onClick={e => { e.stopPropagation(); deletar(c.id, c.titulo); }}
                                                            className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10 h-7 w-7 p-0"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <ChevronDown className={`w-3.5 h-3.5 text-zinc-600 transition-transform ${expandedId === c.id ? "rotate-180" : ""}`} />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                            {expandedId === c.id && (
                                                <TableRow key={`${c.id}-creditos`} className="border-white/10 bg-zinc-800/20">
                                                    <TableCell colSpan={5} className="py-3 px-4">
                                                        <CreditosManager contratoId={c.id} contratoTitulo={c.titulo} />
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </>
                                    ))}
                                    {contratos.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-20 text-center text-zinc-500">
                                                Nenhum contrato cadastrado. Use o formulário ao lado!
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
