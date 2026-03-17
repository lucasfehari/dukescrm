/**
 * WorkflowEtapas — Componente de barra de progresso por etapas
 * Design próprio do DukesFreela para agências criativas
 * Uso inspirado em: RockContent, ClickUp, ferramentas de produção criativa
 */
import "./workflow.css";

// Etapas padrão de um projeto de agência de marketing/conteúdo
export const ETAPAS_PADRAO = [
    { id: "briefing", label: "Briefing", icon: "📋" },
    { id: "criacao", label: "Criação", icon: "🎨" },
    { id: "revisao", label: "Revisão", icon: "🔍" },
    { id: "aprovacao", label: "Aprovação", icon: "✅" },
    { id: "entrega", label: "Entrega", icon: "🚀" },
];

export const ETAPAS_SOCIAL = [
    { id: "planejamento", label: "Planej.", icon: "📅" },
    { id: "redacao", label: "Redação", icon: "✍️" },
    { id: "arte", label: "Arte", icon: "🖌️" },
    { id: "revisao", label: "Revisão", icon: "🔍" },
    { id: "cliente", label: "Cliente", icon: "👤" },
];

export const ETAPAS_VIDEO = [
    { id: "roteiro", label: "Roteiro", icon: "📝" },
    { id: "gravacao", label: "Gravação", icon: "🎬" },
    { id: "edicao", label: "Edição", icon: "✂️" },
    { id: "revisao", label: "Revisão", icon: "🔍" },
    { id: "entrega", label: "Entrega", icon: "📤" },
];

export type EtapaEstado = "pending" | "done" | "active" | "rejected";

export interface Etapa {
    id: string;
    label: string;
    icon?: string;
}

export interface WorkflowEtapaState {
    etapaId: string;
    estado: EtapaEstado;
}

interface WorkflowEtapasProps {
    etapas: Etapa[];
    estados: WorkflowEtapaState[];
    onClickEtapa?: (etapaId: string, estadoAtual: EtapaEstado) => void;
    compact?: boolean;
}

export function WorkflowEtapas({ etapas, estados, onClickEtapa, compact = false }: WorkflowEtapasProps) {
    const totalDone = estados.filter(e => e.estado === "done").length;
    const pct = etapas.length > 0 ? Math.round((totalDone / etapas.length) * 100) : 0;

    function getEstado(etapaId: string): EtapaEstado {
        return estados.find(e => e.etapaId === etapaId)?.estado ?? "pending";
    }

    return (
        <div>
            {/* Barra de progresso linear fina + percentual */}
            {!compact && (
                <div className="flex items-center gap-2 mb-2">
                    <div className="mini-progress-bar flex-1">
                        <div className="mini-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-zinc-500 font-semibold tabular-nums w-7 text-right">{pct}%</span>
                </div>
            )}

            {/* Bolinhas das etapas */}
            <div className="workflow-bar">
                {etapas.map(etapa => {
                    const estado = getEstado(etapa.id);
                    return (
                        <button
                            key={etapa.id}
                            type="button"
                            className={`workflow-step ${estado}`}
                            onClick={() => onClickEtapa?.(etapa.id, estado)}
                            title={etapa.label}
                        >
                            <div className="workflow-dot">
                                {estado === "done" && <span>✓</span>}
                                {estado === "active" && <span style={{ fontSize: "9px" }}>●</span>}
                                {estado === "rejected" && <span>✕</span>}
                                {estado === "pending" && etapa.icon && (
                                    <span style={{ fontSize: "10px", opacity: 0.5 }}>{etapa.icon}</span>
                                )}
                            </div>
                            {!compact && <span className="workflow-label">{etapa.label}</span>}
                            {/* Tooltip no modo compact */}
                            {compact && (
                                <div className="workflow-step-tooltip">{etapa.label}</div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * WorkflowEtapasCard — Versão de cartão completo (painel lateral / modal)
 * Usado quando se quer exibir o workflow com mais detalhes e interação
 */
interface WorkflowEtapasCardProps {
    etapas: Etapa[];
    estados: WorkflowEtapaState[];
    onAvancar: (etapaId: string) => void;
    onRejeitarEtapa: (etapaId: string) => void;
}

export function WorkflowEtapasCard({ etapas, estados, onAvancar, onRejeitarEtapa }: WorkflowEtapasCardProps) {
    const totalDone = estados.filter(e => e.estado === "done").length;
    const pct = etapas.length > 0 ? Math.round((totalDone / etapas.length) * 100) : 0;

    function getEstado(etapaId: string): EtapaEstado {
        return estados.find(e => e.etapaId === etapaId)?.estado ?? "pending";
    }

    return (
        <div
            style={{
                background: "hsl(240 10% 11%)",
                border: "1px solid color-mix(in srgb, white 8%, transparent)",
                borderRadius: "14px",
                padding: "1rem 1.25rem",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "hsl(240 5% 50%)" }}>
                    Workflow de Produção
                </p>
                <span
                    style={{
                        fontSize: "12px", fontWeight: 700,
                        color: pct === 100 ? "hsl(155 65% 60%)" : "hsl(239 84% 78%)",
                    }}
                >
                    {pct}% concluído
                </span>
            </div>

            {/* Barra larga */}
            <div className="mini-progress-bar" style={{ height: "5px", marginBottom: "1.25rem" }}>
                <div className="mini-progress-fill" style={{ width: `${pct}%` }} />
            </div>

            {/* Lista de etapas */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {etapas.map((etapa, i) => {
                    const estado = getEstado(etapa.id);
                    const ativo = estado === "active";
                    const feito = estado === "done";
                    const rejeitado = estado === "rejected";

                    return (
                        <div
                            key={etapa.id}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "8px 10px",
                                borderRadius: "9px",
                                background: ativo
                                    ? "hsl(239 84% 67% / 0.08)"
                                    : "transparent",
                                border: `1px solid ${ativo
                                    ? "hsl(239 84% 67% / 0.25)"
                                    : "transparent"}`,
                                transition: "all 0.2s",
                            }}
                        >
                            {/* Número + ícone */}
                            <div
                                className={`workflow-dot ${estado === "active" ? "active" : estado === "done" ? "done" : estado === "rejected" ? "rejected" : ""}`}
                                style={{ flexShrink: 0 }}
                            >
                                {feito && <span style={{ fontSize: "12px" }}>✓</span>}
                                {ativo && <span style={{ fontSize: "9px" }}>●</span>}
                                {rejeitado && <span style={{ fontSize: "12px" }}>✕</span>}
                                {!feito && !ativo && !rejeitado && (
                                    <span style={{ fontSize: "10px", color: "hsl(240 5% 40%)" }}>{i + 1}</span>
                                )}
                            </div>

                            {/* Label */}
                            <div style={{ flex: 1 }}>
                                <p
                                    style={{
                                        fontSize: "13px",
                                        fontWeight: ativo ? 700 : 500,
                                        color: feito
                                            ? "hsl(239 84% 78%)"
                                            : ativo
                                                ? "hsl(239 84% 88%)"
                                                : rejeitado
                                                    ? "hsl(0 75% 65%)"
                                                    : "hsl(240 5% 50%)",
                                        margin: 0,
                                    }}
                                >
                                    {etapa.icon} {etapa.label}
                                </p>
                                {ativo && (
                                    <p style={{ fontSize: "10px", color: "hsl(239 84% 65%)", margin: "1px 0 0" }}>
                                        Em andamento
                                    </p>
                                )}
                                {feito && (
                                    <p style={{ fontSize: "10px", color: "hsl(155 65% 55%)", margin: "1px 0 0" }}>
                                        Concluída
                                    </p>
                                )}
                                {rejeitado && (
                                    <p style={{ fontSize: "10px", color: "hsl(0 75% 60%)", margin: "1px 0 0" }}>
                                        Rejeitada — aguardando revisão
                                    </p>
                                )}
                            </div>

                            {/* Ações */}
                            {(ativo || estado === "pending") && (
                                <div style={{ display: "flex", gap: "6px" }}>
                                    {ativo && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => onAvancar(etapa.id)}
                                                style={{
                                                    fontSize: "10px", fontWeight: 700,
                                                    padding: "3px 10px", borderRadius: "6px",
                                                    background: "hsl(239 84% 67%)",
                                                    color: "white",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    transition: "opacity 0.15s",
                                                }}
                                                onMouseOver={e => (e.currentTarget.style.opacity = "0.85")}
                                                onMouseOut={e => (e.currentTarget.style.opacity = "1")}
                                            >
                                                Avançar ›
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onRejeitarEtapa(etapa.id)}
                                                style={{
                                                    fontSize: "10px", fontWeight: 600,
                                                    padding: "3px 10px", borderRadius: "6px",
                                                    background: "hsl(0 75% 55% / 0.15)",
                                                    color: "hsl(0 75% 65%)",
                                                    border: "1px solid hsl(0 75% 55% / 0.3)",
                                                    cursor: "pointer",
                                                    transition: "opacity 0.15s",
                                                }}
                                            >
                                                Rejeitar
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * Utilitário: constrói a lista de WorkflowEtapaState a partir do índice atual
 */
export function buildEstados(etapas: Etapa[], etapaAtualIdx: number, rejeitadaId?: string): WorkflowEtapaState[] {
    return etapas.map((e, i) => {
        if (rejeitadaId && e.id === rejeitadaId) return { etapaId: e.id, estado: "rejected" };
        if (i < etapaAtualIdx) return { etapaId: e.id, estado: "done" };
        if (i === etapaAtualIdx) return { etapaId: e.id, estado: "active" };
        return { etapaId: e.id, estado: "pending" };
    });
}
