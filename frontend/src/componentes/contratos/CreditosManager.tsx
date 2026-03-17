// @Agent: AUID + ASP — Gerenciador de Créditos por Contrato
// Exibe os pacotes de serviços do contrato (ex: 20 estáticos, 10 carrosséis)
// Permite adicionar e remover pacotes, mostrando barra de progresso de uso

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Loader2, Package, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { creditosApi, type CreditoContrato } from "../../servicos/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
    contratoId: string;
    contratoTitulo?: string;
}

// Badge de status do crédito por porcentagem de uso
function StatusBadge({ pct }: { pct: number }) {
    if (pct >= 100) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium">Esgotado</span>;
    if (pct >= 75) return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">Quase esgotado</span>;
    return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">Disponível</span>;
}

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function CreditosManager({ contratoId, contratoTitulo }: Props) {
    const [creditos, setCreditos] = useState<CreditoContrato[]>([]);
    const [carregando, setCarregando] = useState(false);
    const [aberto, setAberto] = useState(false);
    const [adicionando, setAdicionando] = useState(false);
    const [salvando, setSalvando] = useState(false);

    // Form state inline
    const [nome, setNome] = useState("");
    const [quantidade, setQuantidade] = useState<number>(1);
    const [valorUnit, setValorUnit] = useState<number>(0);

    const carregar = useCallback(async () => {
        if (!aberto) return;
        setCarregando(true);
        try {
            const data = await creditosApi.listarPorContrato(contratoId);
            setCreditos(data);
        } catch {
            // silently fail — contrato pode ainda não ter créditos
        } finally {
            setCarregando(false);
        }
    }, [contratoId, aberto]);

    useEffect(() => { carregar(); }, [carregar]);

    async function handleAdicionar() {
        if (!nome.trim() || quantidade < 1 || valorUnit < 0) {
            toast.error("Preencha todos os campos corretamente.");
            return;
        }
        setSalvando(true);
        try {
            await creditosApi.criar({ contratoId, nome: nome.trim(), quantidadeTotal: quantidade, valorUnitario: valorUnit });
            toast.success(`Pacote "${nome}" adicionado!`);
            setNome(""); setQuantidade(1); setValorUnit(0);
            setAdicionando(false);
            await carregar();
        } catch (e: any) {
            toast.error("Erro ao adicionar crédito.", { description: e.message });
        } finally {
            setSalvando(false);
        }
    }

    async function handleDeletar(id: string, nomePacote: string) {
        try {
            await creditosApi.deletar(id);
            toast.success(`Pacote "${nomePacote}" removido.`);
            await carregar();
        } catch (e: any) {
            toast.error("Não foi possível remover.", { description: e.message });
        }
    }

    return (
        <div className="border border-white/10 rounded-xl overflow-hidden">
            {/* Header colapsável */}
            <button
                onClick={() => setAberto(p => !p)}
                className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900 hover:bg-zinc-800 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-medium text-white">
                        Créditos do Contrato
                    </span>
                    {creditos.length > 0 && (
                        <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
                            {creditos.length} pacote{creditos.length !== 1 ? "s" : ""}
                        </span>
                    )}
                </div>
                {aberto ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
            </button>

            {aberto && (
                <div className="p-4 space-y-3 bg-zinc-900/50">
                    {carregando ? (
                        <div className="flex items-center gap-2 text-zinc-500 text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" /> Carregando créditos...
                        </div>
                    ) : creditos.length === 0 ? (
                        <p className="text-zinc-500 text-xs">
                            Nenhum pacote cadastrado. Adicione tipos de serviço (ex: Carrossel, Estático).
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {creditos.map(c => {
                                const pct = c.quantidadeTotal > 0 ? (c.quantidadeUsada / c.quantidadeTotal) * 100 : 0;
                                return (
                                    <div key={c.id} className="bg-zinc-800 rounded-lg p-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-white">{c.nome}</span>
                                                <StatusBadge pct={pct} />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-zinc-400">
                                                    {fmt(c.valorUnitario)} / un.
                                                </span>
                                                <button
                                                    onClick={() => handleDeletar(c.id, c.nome)}
                                                    className="text-zinc-600 hover:text-red-400 transition-colors"
                                                    title="Remover pacote"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : "bg-indigo-500"}`}
                                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-xs text-zinc-500">
                                                <span>{c.quantidadeUsada} usados</span>
                                                <span className="text-emerald-400 font-medium">{c.quantidadeDisponivel} disponíveis / {c.quantidadeTotal} total</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Form inline para adicionar novo pacote */}
                    {adicionando ? (
                        <div className="border border-white/10 rounded-lg p-3 space-y-3 bg-zinc-800">
                            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Novo Pacote</p>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="col-span-3">
                                    <Input
                                        placeholder="Tipo de serviço (ex: Carrossel, Estático, Vídeo)"
                                        value={nome}
                                        onChange={e => setNome(e.target.value)}
                                        className="border-white/10 bg-zinc-900 text-sm h-8"
                                    />
                                </div>
                                <div>
                                    <Input
                                        type="number"
                                        placeholder="Qtd"
                                        min={1}
                                        value={quantidade}
                                        onChange={e => setQuantidade(Number(e.target.value))}
                                        className="border-white/10 bg-zinc-900 text-sm h-8"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Input
                                        type="number"
                                        placeholder="Valor unitário (R$)"
                                        min={0}
                                        step={0.01}
                                        value={valorUnit}
                                        onChange={e => setValorUnit(Number(e.target.value))}
                                        className="border-white/10 bg-zinc-900 text-sm h-8"
                                    />
                                </div>
                            </div>
                            {nome && quantidade > 0 && (
                                <p className="text-xs text-zinc-500">
                                    Total do pacote: <span className="text-indigo-400 font-medium">{fmt(quantidade * valorUnit)}</span>
                                </p>
                            )}
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={handleAdicionar}
                                    disabled={salvando}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white h-7 text-xs"
                                >
                                    {salvando ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                                    Salvar
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => { setAdicionando(false); setNome(""); setQuantidade(1); setValorUnit(0); }}
                                    className="h-7 text-xs text-zinc-400"
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setAdicionando(true)}
                            className="w-full border-dashed border-white/20 text-zinc-400 hover:text-white hover:border-white/40 h-8 text-xs"
                        >
                            <Plus className="w-3 h-3 mr-1" />
                            Adicionar Pacote de Crédito
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
