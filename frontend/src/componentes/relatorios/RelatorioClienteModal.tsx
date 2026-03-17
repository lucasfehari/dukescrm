import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Printer, Tag, CheckCircle2,
    FileText, Minus,
} from "lucide-react";
import type { RelatorioClienteItem } from "../../servicos/api";

// @Agent: UI/UX Designer (AUID) + Empresário
// Relatório de Fechamento Premium — para envio ao cliente via impressão/PDF

const moeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function mesLabel(mes: string) {
    const [ano, m] = mes.split("-");
    const nomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    return `${nomes[parseInt(m) - 1]} de ${ano}`;
}

interface Props {
    cliente: RelatorioClienteItem;
    mesReferencia: string;
    aberto: boolean;
    onClose: () => void;
    /** Nome e dados do estúdio (vindos de Configurações) */
    estudio?: {
        nome: string;
        email?: string;
        telefone?: string;
        logoUrl?: string;
        corPrimaria?: string;
    };
}

export function RelatorioClienteModal({ cliente, mesReferencia, aberto, onClose, estudio }: Props) {
    const [desconto, setDesconto] = useState<number>(0);
    const [tipoDesconto, setTipoDesconto] = useState<"valor" | "percentual">("valor");
    const printRef = useRef<HTMLDivElement>(null);

    const nomeEstudio = estudio?.nome ?? localStorage.getItem("dk:studio_nome") ?? "DukesFreela Estúdio";
    const emailEstudio = estudio?.email ?? "";
    const telEstudio = estudio?.telefone ?? "";
    const logoEstudio = estudio?.logoUrl ?? localStorage.getItem("dk:studio_logo") ?? "";
    const cor = estudio?.corPrimaria ?? localStorage.getItem("dk:studio_cor") ?? "#6366f1"; // indigo padrão

    // Cálculo
    const bruto = cliente.receita + cliente.pendente;
    const valorDesconto = tipoDesconto === "percentual"
        ? bruto * (desconto / 100)
        : desconto;
    const totalFinal = Math.max(0, bruto - valorDesconto);
    const dataGeracao = new Date().toLocaleDateString("pt-BR", { dateStyle: "long" });

    function imprimir() {
        const conteudo = printRef.current;
        if (!conteudo) return;

        const popupWin = window.open("", "_blank", "width=900,height=700");
        if (!popupWin) return;

        const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Relatório de Fechamento — ${cliente.cliente}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            background: #ffffff;
            color: #18181b;
            padding: 48px;
            font-size: 14px;
            line-height: 1.6;
        }
        .header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            padding-bottom: 32px;
            border-bottom: 3px solid ${cor};
            margin-bottom: 36px;
        }
        .logo-area { display: flex; align-items: center; gap: 16px; }
        .logo-badge {
            width: 52px; height: 52px;
            background: ${cor};
            border-radius: 14px;
            display: flex; align-items: center; justify-content: center;
            font-size: 22px; font-weight: 900; color: #fff; letter-spacing: -1px;
        }
        .studio-name { font-size: 22px; font-weight: 700; color: #18181b; }
        .studio-contact { font-size: 12px; color: #71717a; margin-top: 4px; }
        .doc-info { text-align: right; }
        .doc-title { font-size: 13px; font-weight: 600; color: ${cor}; text-transform: uppercase; letter-spacing: 2px; }
        .doc-meta { font-size: 12px; color: #71717a; margin-top: 4px; }

        .section-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #a1a1aa;
            margin-bottom: 16px;
        }
        .client-card {
            background: #f4f4f5;
            border-radius: 12px;
            padding: 20px 24px;
            margin-bottom: 32px;
            display: flex;
            align-items: center;
            gap: 20px;
        }
        .client-avatar {
            width: 48px; height: 48px;
            background: ${cor}22;
            border: 2px solid ${cor}55;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 20px; font-weight: 700; color: ${cor};
            flex-shrink: 0;
        }
        .client-name { font-size: 20px; font-weight: 700; color: #18181b; }
        .client-email { font-size: 12px; color: #71717a; }

        .grid-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 32px;
        }
        .stat-card {
            background: #fafafa;
            border: 1px solid #e4e4e7;
            border-radius: 10px;
            padding: 16px;
        }
        .stat-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #a1a1aa; margin-bottom: 8px; }
        .stat-value { font-size: 22px; font-weight: 700; color: #18181b; }

        table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
        th {
            background: ${cor}15;
            color: ${cor};
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            padding: 10px 16px;
            text-align: left;
        }
        th:last-child { text-align: right; }
        td { padding: 12px 16px; border-bottom: 1px solid #f4f4f5; font-size: 13px; }
        td:last-child { text-align: right; font-weight: 600; }
        tr:last-child td { border-bottom: none; }

        .totais {
            background: #fafafa;
            border: 1px solid #e4e4e7;
            border-radius: 12px;
            padding: 20px 24px;
            margin-bottom: 32px;
        }
        .totais-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
        .totais-row.subtotal { border-top: 1px dashed #e4e4e7; margin-top: 8px; padding-top: 14px; }
        .totais-row.final {
            border-top: 2px solid ${cor};
            margin-top: 8px;
            padding-top: 14px;
            font-size: 18px;
            font-weight: 700;
        }
        .totais-row.final .val { color: ${cor}; }
        .totais-label { color: #71717a; }
        .desconto-val { color: #ef4444; }

        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e4e4e7;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            font-size: 11px;
            color: #a1a1aa;
        }
        .footer-brand { font-weight: 600; color: ${cor}; }
        .footer-note { text-align: right; }
        .status-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 99px;
            font-size: 11px;
            font-weight: 600;
        }
        .badge-pago { background: #dcfce7; color: #16a34a; }
        .badge-pendente { background: #fef9c3; color: #ca8a04; }

        @media print {
            body { padding: 24px; }
            @page { margin: 1cm; }
        }
    </style>
</head>
<body>
    <!-- CABEÇALHO -->
    <div class="header">
        <div class="logo-area">
            ${logoEstudio ? `<img src="${logoEstudio}" style="max-height: 52px; width: auto; object-contain: contain;" />` : `<div class="logo-badge">${nomeEstudio.charAt(0)}</div>`}
            <div>
                <div class="studio-name">${nomeEstudio}</div>
                <div class="studio-contact">${[emailEstudio, telEstudio].filter(Boolean).join(" · ")}</div>
            </div>
        </div>
        <div class="doc-info">
            <div class="doc-title">Relatório de Fechamento</div>
            <div class="doc-meta">${mesLabel(mesReferencia)}</div>
            <div class="doc-meta" style="margin-top:4px; color: #a1a1aa; font-size:11px">Gerado em ${dataGeracao}</div>
        </div>
    </div>

    <!-- CLIENTE -->
    <div style="margin-bottom:8px" class="section-title">Para</div>
    <div class="client-card">
        <div class="client-avatar">${cliente.cliente.charAt(0).toUpperCase()}</div>
        <div>
            <div class="client-name">${cliente.cliente}</div>
            <div class="client-email">${cliente.email ?? ""}</div>
        </div>
    </div>

    <!-- STATS -->
    <div class="section-title">Resumo do Período</div>
    <div class="grid-stats">
        <div class="stat-card">
            <div class="stat-label">Contratos Ativos</div>
            <div class="stat-value">${cliente.contratosAtivos}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Projetos Entregues</div>
            <div class="stat-value">${cliente.projetosEntregues}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Em Andamento</div>
            <div class="stat-value">${cliente.projetosEmAndamento}</div>
        </div>
    </div>

    <!-- TABELA FINANCEIRA -->
    <div class="section-title">Detalhamento Financeiro</div>
    <table>
        <thead>
            <tr>
                <th>Descrição</th>
                <th>Status</th>
                <th>Valor</th>
            </tr>
        </thead>
        <tbody>
            ${cliente.receita > 0 ? `
            <tr>
                <td>Serviços prestados — ${mesLabel(mesReferencia)}</td>
                <td><span class="status-badge badge-pago">Pago</span></td>
                <td>${moeda(cliente.receita)}</td>
            </tr>` : ""}
            ${cliente.pendente > 0 ? `
            <tr>
                <td>Saldo a receber — ${mesLabel(mesReferencia)}</td>
                <td><span class="status-badge badge-pendente">Pendente</span></td>
                <td>${moeda(cliente.pendente)}</td>
            </tr>` : ""}
        </tbody>
    </table>

    <!-- TOTAIS -->
    <div class="totais">
        <div class="totais-row">
            <span class="totais-label">Subtotal (Pago)</span>
            <span>${moeda(cliente.receita)}</span>
        </div>
        ${cliente.pendente > 0 ? `
        <div class="totais-row">
            <span class="totais-label">Saldo Pendente</span>
            <span>${moeda(cliente.pendente)}</span>
        </div>` : ""}
        ${valorDesconto > 0 ? `
        <div class="totais-row subtotal">
            <span class="totais-label">Valor Bruto</span>
            <span>${moeda(bruto)}</span>
        </div>
        <div class="totais-row">
            <span class="totais-label">Desconto (${tipoDesconto === "percentual" ? desconto + "%" : "Valor fixo"})</span>
            <span class="desconto-val">− ${moeda(valorDesconto)}</span>
        </div>` : ""}
        <div class="totais-row final">
            <span>Total Final</span>
            <span class="val">${moeda(totalFinal)}</span>
        </div>
    </div>

    <!-- RODAPÉ -->
    <div class="footer">
        <div>
            <div class="footer-brand">${nomeEstudio}</div>
            <div style="margin-top:4px">Agradecemos pela confiança e parceria. 🙌</div>
        </div>
        <div class="footer-note">
            <div>Documento gerado pelo sistema interno</div>
            <div style="margin-top:2px; color: #d4d4d8;">${dataGeracao}</div>
        </div>
    </div>

    <script>
        window.onload = function() {
            window.print();
        };
    </script>
</body>
</html>`;

        popupWin.document.write(html);
        popupWin.document.close();
    }

    return (
        <Dialog open={aberto} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-zinc-900 border-white/10 shadow-2xl shadow-black/60 max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-violet-500/10">
                                <FileText className="w-5 h-5 text-violet-400" />
                            </div>
                            <div>
                                <DialogTitle className="text-zinc-100 text-lg">
                                    Relatório de Fechamento
                                </DialogTitle>
                                <p className="text-xs text-zinc-500 mt-0.5">{mesLabel(mesReferencia)} · {cliente.cliente}</p>
                            </div>
                        </div>
                        <Button
                            onClick={imprimir}
                            className="gap-2 bg-violet-600 hover:bg-violet-500 text-white"
                        >
                            <Printer className="w-4 h-4" />
                            Imprimir / PDF
                        </Button>
                    </div>
                </DialogHeader>

                {/* ── Preview do Relatório ── */}
                <div ref={printRef} className="mt-4 space-y-6">

                    {/* Cabeçalho do estúdio */}
                    <div className="flex items-center justify-between pb-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            {logoEstudio ? (
                                <img src={logoEstudio} className="max-h-12 w-auto object-contain" alt="Logo" />
                            ) : (
                                <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-xl font-black text-white">
                                    {nomeEstudio.charAt(0)}
                                </div>
                            )}
                            <div>
                                <p className="font-bold text-zinc-100 text-lg">{nomeEstudio}</p>
                                <p className="text-xs text-zinc-500">{[emailEstudio, telEstudio].filter(Boolean).join(" · ")}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-violet-400 font-bold uppercase tracking-widest">Relatório de Fechamento</p>
                            <p className="text-sm text-zinc-300 font-medium">{mesLabel(mesReferencia)}</p>
                        </div>
                    </div>

                    {/* Info do Cliente */}
                    <div className="bg-zinc-800/60 rounded-xl p-4 flex items-center gap-4 border border-white/5">
                        <div className="w-12 h-12 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-xl font-bold text-violet-400">
                            {cliente.cliente.charAt(0)}
                        </div>
                        <div>
                            <p className="font-bold text-zinc-100 text-lg">{cliente.cliente}</p>
                            <p className="text-xs text-zinc-500">{cliente.email ?? "—"}</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: "Contratos Ativos", value: cliente.contratosAtivos, color: "indigo" },
                            { label: "Entregues", value: cliente.projetosEntregues, color: "emerald" },
                            { label: "Em Andamento", value: cliente.projetosEmAndamento, color: "blue" },
                        ].map(s => (
                            <div key={s.label} className="bg-zinc-800/60 rounded-xl p-4 border border-white/5 text-center">
                                <p className={`text-2xl font-bold text-${s.color}-400`}>{s.value}</p>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wide mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Tabela Financeira */}
                    <div>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3">Detalhamento</p>
                        <div className="rounded-xl border border-white/10 overflow-hidden">
                            {cliente.receita > 0 && (
                                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        Serviços prestados — {mesLabel(mesReferencia)}
                                    </div>
                                    <span className="font-semibold text-emerald-400">{moeda(cliente.receita)}</span>
                                </div>
                            )}
                            {cliente.pendente > 0 && (
                                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                                        <FileText className="w-4 h-4 text-amber-400" />
                                        Saldo a receber
                                    </div>
                                    <span className="font-semibold text-amber-400">{moeda(cliente.pendente)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Campo de Desconto */}
                    <div>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5" /> Desconto (Opcional)
                        </p>
                        <div className="flex items-center gap-3 bg-zinc-800/40 border border-white/5 rounded-xl p-4">
                            <div className="flex gap-1 p-0.5 bg-zinc-800 rounded-lg flex-shrink-0">
                                <button
                                    onClick={() => setTipoDesconto("valor")}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${tipoDesconto === "valor" ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-zinc-100"}`}
                                >
                                    R$
                                </button>
                                <button
                                    onClick={() => setTipoDesconto("percentual")}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${tipoDesconto === "percentual" ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-zinc-100"}`}
                                >
                                    %
                                </button>
                            </div>
                            <Input
                                type="number"
                                min={0}
                                max={tipoDesconto === "percentual" ? 100 : bruto}
                                step={tipoDesconto === "percentual" ? 1 : 10}
                                value={desconto || ""}
                                onChange={e => setDesconto(parseFloat(e.target.value) || 0)}
                                placeholder={tipoDesconto === "valor" ? "0,00" : "0"}
                                className="border-white/10 bg-zinc-800 flex-1"
                            />
                            {desconto > 0 && (
                                <div className="flex items-center gap-1 text-sm text-red-400 flex-shrink-0">
                                    <Minus className="w-3.5 h-3.5" />
                                    {moeda(valorDesconto)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Totais */}
                    <div className="bg-zinc-800/40 rounded-xl border border-white/5 overflow-hidden">
                        <div className="px-5 py-3 flex justify-between text-sm border-b border-white/5">
                            <span className="text-zinc-500">Subtotal</span>
                            <span className="text-zinc-300">{moeda(bruto)}</span>
                        </div>
                        {valorDesconto > 0 && (
                            <div className="px-5 py-3 flex justify-between text-sm border-b border-white/5">
                                <span className="text-zinc-500">
                                    Desconto ({tipoDesconto === "percentual" ? `${desconto}%` : "Valor fixo"})
                                </span>
                                <span className="text-red-400 font-medium">− {moeda(valorDesconto)}</span>
                            </div>
                        )}
                        <div className="px-5 py-4 flex justify-between items-center bg-violet-500/5 border-t border-violet-500/20">
                            <span className="font-semibold text-zinc-200">Total Final</span>
                            <span className="text-2xl font-bold text-violet-400">{moeda(totalFinal)}</span>
                        </div>
                    </div>

                    {/* Rodapé preview */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-zinc-600">
                        <span className="text-violet-400 font-medium">{nomeEstudio}</span>
                        <span>Gerado em {dataGeracao}</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
