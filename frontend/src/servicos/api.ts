// @Agent: Senior Programmer (ASP) — Camada de API centralizada para o frontend

const API_BASE = "/api";

function getToken(): string | null {
    return localStorage.getItem("dukes:token");
}

function headers() {
    const token = getToken();
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

async function handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.erro || body?.message || `Erro ${res.status}`);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
}

// ── CLIENTES ──────────────────────────────────────────────────
export const clientesApi = {
    listar: () =>
        fetch(`${API_BASE}/clientes`, { headers: headers() }).then(r => handleResponse<Cliente[]>(r)),

    criar: (dados: Omit<Cliente, "id" | "criadoEm" | "deletadoEm">) =>
        fetch(`${API_BASE}/clientes`, {
            method: "POST",
            headers: headers(),
            body: JSON.stringify(dados),
        }).then(r => handleResponse<Cliente>(r)),

    atualizar: (id: string, dados: Partial<Cliente>) =>
        fetch(`${API_BASE}/clientes/${id}`, {
            method: "PUT",
            headers: headers(),
            body: JSON.stringify(dados),
        }).then(r => handleResponse<Cliente>(r)),

    deletar: (id: string) =>
        fetch(`${API_BASE}/clientes/${id}`, { method: "DELETE", headers: headers() })
            .then(r => handleResponse<void>(r)),
};

// ── CONTRATOS ──────────────────────────────────────────────────
export const contratosApi = {
    listar: () =>
        fetch(`${API_BASE}/contratos`, { headers: headers() }).then(r => handleResponse<Contrato[]>(r)),

    criar: (dados: ContratoCreate) =>
        fetch(`${API_BASE}/contratos`, {
            method: "POST",
            headers: headers(),
            body: JSON.stringify(dados),
        }).then(r => handleResponse<Contrato>(r)),

    atualizar: (id: string, dados: Partial<ContratoCreate>) =>
        fetch(`${API_BASE}/contratos/${id}`, {
            method: "PUT",
            headers: headers(),
            body: JSON.stringify(dados),
        }).then(r => handleResponse<Contrato>(r)),

    deletar: (id: string) =>
        fetch(`${API_BASE}/contratos/${id}`, { method: "DELETE", headers: headers() })
            .then(r => handleResponse<void>(r)),
};

// ── PROJETOS ───────────────────────────────────────────────────
export const projetosApi = {
    listar: (contratoId?: string) => {
        const url = contratoId
            ? `${API_BASE}/projetos?contratoId=${contratoId}`
            : `${API_BASE}/projetos`;
        return fetch(url, { headers: headers() }).then(r => handleResponse<Projeto[]>(r));
    },

    criar: (dados: ProjetoCreate) =>
        fetch(`${API_BASE}/projetos`, {
            method: "POST",
            headers: headers(),
            body: JSON.stringify(dados),
        }).then(r => handleResponse<Projeto>(r)),

    criarAvulso: (dados: ServicoAvulsoCreate) =>
        fetch(`${API_BASE}/projetos`, {
            method: "POST",
            headers: headers(),
            body: JSON.stringify({ ...dados, avulso: true }),
        }).then(r => handleResponse<Projeto>(r)),

    moverStatus: (id: string, status: string) =>
        fetch(`${API_BASE}/projetos/${id}/status`, {
            method: "PATCH",
            headers: headers(),
            body: JSON.stringify({ status }),
        }).then(r => handleResponse<Projeto>(r)),

    atualizar: (id: string, dados: Partial<Projeto>) =>
        fetch(`${API_BASE}/projetos/${id}`, {
            method: "PATCH",
            headers: headers(),
            body: JSON.stringify(dados),
        }).then(r => handleResponse<Projeto>(r)),

    deletar: (id: string) =>
        fetch(`${API_BASE}/projetos/${id}`, { method: "DELETE", headers: headers() })
            .then(r => handleResponse<void>(r)),

    adicionarComentario: (id: string, texto: string) =>
        fetch(`${API_BASE}/projetos/${id}/comentarios`, {
            method: "POST",
            headers: headers(),
            body: JSON.stringify({ texto }),
        }).then(r => handleResponse<ComentarioProjeto>(r)),

    listarComentarios: (id: string) =>
        fetch(`${API_BASE}/projetos/${id}/comentarios`, { headers: headers() })
            .then(r => handleResponse<ComentarioProjeto[]>(r)),
};

// ── FINANCEIRO ─────────────────────────────────────────────────
export const financeiroApi = {
    listar: (filtros?: { tipo?: string; status?: string; mesReferencia?: string }) => {
        const params = new URLSearchParams();
        if (filtros?.tipo) params.append("tipo", filtros.tipo);
        if (filtros?.status) params.append("status", filtros.status);
        if (filtros?.mesReferencia) params.append("mesReferencia", filtros.mesReferencia);
        const url = `${API_BASE}/financeiro${params.toString() ? `?${params}` : ""}`;
        return fetch(url, { headers: headers() }).then(r => handleResponse<Lancamento[]>(r));
    },

    resumo: (mesReferencia?: string) => {
        const url = mesReferencia
            ? `${API_BASE}/financeiro/resumo?mesReferencia=${mesReferencia}`
            : `${API_BASE}/financeiro/resumo`;
        return fetch(url, { headers: headers() }).then(r => handleResponse<ResumoFinanceiro>(r));
    },

    carteiraDevedora: () =>
        fetch(`${API_BASE}/financeiro/carteira-devedora`, { headers: headers() })
            .then(r => handleResponse<DevedorItem[]>(r)),

    consolidar: (lancamentoIds: string[]) =>
        fetch(`${API_BASE}/financeiro/consolidar`, {
            method: "POST",
            headers: headers(),
            body: JSON.stringify({ lancamentoIds }),
        }).then(r => handleResponse<{ count: number }>(r)),
};

// ── CRÉDITOS ────────────────────────────────────────────────────
// Pacotes de serviços vinculados a um contrato (ex: 20 estáticos, 10 carrosséis)
export const creditosApi = {
    listarPorContrato: (contratoId: string) =>
        fetch(`${API_BASE}/creditos/contrato/${contratoId}`, { headers: headers() })
            .then(r => handleResponse<CreditoContrato[]>(r)),

    criar: (dados: CreditoContratoCreate) =>
        fetch(`${API_BASE}/creditos`, {
            method: "POST",
            headers: headers(),
            body: JSON.stringify(dados),
        }).then(r => handleResponse<CreditoContrato>(r)),

    deletar: (id: string) =>
        fetch(`${API_BASE}/creditos/${id}`, { method: "DELETE", headers: headers() })
            .then(r => handleResponse<void>(r)),
};

// ── CATÁLOGO DE SERVIÇOS ────────────────────────────────────────
export const catalogoApi = {
    listar: () =>
        fetch(`${API_BASE}/catalogo`, { headers: headers() }).then(r => handleResponse<ServicoCatalogo[]>(r)),

    criar: (dados: Omit<ServicoCatalogo, "id" | "status">) =>
        fetch(`${API_BASE}/catalogo`, {
            method: "POST",
            headers: headers(),
            body: JSON.stringify(dados),
        }).then(r => handleResponse<ServicoCatalogo>(r)),

    atualizar: (id: string, dados: Partial<ServicoCatalogo>) =>
        fetch(`${API_BASE}/catalogo/${id}`, {
            method: "PUT",
            headers: headers(),
            body: JSON.stringify(dados),
        }).then(r => handleResponse<ServicoCatalogo>(r)),

    deletar: (id: string) =>
        fetch(`${API_BASE}/catalogo/${id}`, { method: "DELETE", headers: headers() })
            .then(r => handleResponse<void>(r)),
};

// ── TIPOS ───────────────────────────────────────────────────────
// Pacote de crédito de um contrato (ex: 20 Estáticos, 10 Carrosséis)
export interface CreditoContrato {
    id: string;
    contratoId: string;
    nome: string;                    // Ex: "Estático", "Carrossel"
    quantidadeTotal: number;
    quantidadeUsada: number;
    quantidadeDisponivel: number;   // Calculado: total - usado
    valorUnitario: number;
    criadoEm: string;
}

export interface CreditoContratoCreate {
    contratoId: string;
    nome: string;
    quantidadeTotal: number;
    valorUnitario: number;
}

export interface Cliente {
    id: string;
    nome: string;
    email?: string;
    telefone?: string;
    documento?: string;
    linkDrive?: string;
    linkBriefing?: string;
    observacoes?: string;
    status: "ATIVO" | "INATIVO";
    criadoEm: string;
    deletadoEm?: string;
}

export interface Contrato {
    id: string;
    titulo: string;
    clienteId: string;
    cliente?: { id: string; nome: string };
    valorTotal: number;
    status: string;
    descricao?: string;
    inicioEm?: string;
    fimEm?: string;
    criadoEm: string;
}

export interface ContratoCreate {
    titulo: string;
    clienteId: string;
    valorTotal: number;
    status?: string;
    descricao?: string;
    inicioEm?: string;
    fimEm?: string;
}

export interface ServicoProjetoJson {
    nome: string;
    valor: number;
    catalogoId?: string;
}

export interface Projeto {
    id: string;
    nome: string;
    contratoId?: string | null;
    clienteId?: string | null;
    creditoId?: string | null;
    tipoProjeto?: string | null;
    avulso?: boolean;
    valorAvulso?: number | null;
    servicos?: ServicoProjetoJson[] | null;
    contrato?: { id: string; titulo: string; cliente?: { nome: string } } | null;
    cliente?: { id: string; nome: string } | null;
    creditoUsado?: { id: string; nome: string; quantidadeTotal: number; quantidadeUsada: number } | null;
    status: string;
    descricao?: string;
    prazoEstimado?: string;
    // Workflow de etapas (armazenado no campo servicos ou campo dedicado)
    etapaAtual?: number;        // ex: 0=Briefing, 1=Criação, 2=Revisão, 3=Aprovação, 4=Entrega
    tipoWorkflow?: "padrao" | "social" | "video" | null;
    criadoEm: string;
}

export interface ComentarioProjeto {
    id: string;
    projetoId: string;
    usuarioId: string | null;
    texto: string;
    criadoEm: string;
    usuario?: { id: string; nome: string } | null;
}

export interface ProjetoCreate {
    nome: string;
    contratoId?: string;
    clienteId?: string;
    creditoId?: string;      // Pacote de crédito a descontar
    tipoProjeto?: string;    // Ex: "Carrossel", "Estático"
    status?: string;
    descricao?: string;
    prazoEstimado?: string;
}

export interface ServicoAvulsoCreate {
    nome: string;
    clienteId: string;
    valorAvulso: number;
    servicos?: ServicoProjetoJson[];
    status?: string;
    descricao?: string;
    prazoEstimado?: string;
}

export interface ServicoCatalogo {
    id: string;
    nome: string;
    descricao?: string;
    valorPadrao: number;
    status: "ATIVO" | "INATIVO";
}

export interface Lancamento {
    id: string;
    projetoId: string;
    tipo: "RECEITA" | "DESPESA";
    valor: number;
    descricao: string;
    status: string;
    dataVencimento: string;
    dataPagamento?: string;
    mesReferencia: string;
}

export interface ResumoFinanceiro {
    totalReceitas: number;
    totalDespesas: number;
    saldoLiquido: number;
    pendentes: number;
    totalLancamentos: number;
}

export interface DevedorItem {
    id: string;
    valor: number;
    descricao: string;
    dataVencimento: string;
    projetoId: string;
    projetoNome: string;
    avulso: boolean;
    clienteId?: string;
    clienteNome: string;
}

// ── DASHBOARD ──────────────────────────────────────────────────
export interface ContratoVencendo {
    id: string;
    titulo: string;
    cliente: string;
    fimEm: string | null;
    diasRestantes: number | null;
    status: string;
}

export interface AtividadeRecente {
    id: string;
    acao: string;
    entidade: string;
    usuario: string;
    criadoEm: string;
    detalhes?: any;
}

export interface DashboardResumo {
    totalClientes: number;
    contratos: {
        total: number;
        porStatus: Record<string, number>;
        ativos: number;
        vencidos: number;
    };
    projetos: {
        total: number;
        porStatus: Record<string, number>;
        emAndamento: number;
        impedidos: number;
        concluidos: number;
    };
    financeiro: {
        receita: number;
        despesas: number;
        pendente: number;
        saldo: number;
    };
    contratosVencendo: ContratoVencendo[];
    atividadeRecente: AtividadeRecente[];
    receitaUltimos6Meses: { mes: string; receita: number; despesas: number }[];
}

export const dashboardApi = {
    resumo: () =>
        fetch(`${API_BASE}/dashboard/resumo`, { headers: headers() }).then(r => handleResponse<DashboardResumo>(r)),

    contratosVencendo: (dias = 30) =>
        fetch(`${API_BASE}/dashboard/contratos-vencendo?dias=${dias}`, { headers: headers() }).then(r => handleResponse<ContratoVencendo[]>(r)),
};

// ── RELATÓRIOS ─────────────────────────────────────────────────
export interface RelatorioClienteItem {
    clienteId: string;
    cliente: string;
    email: string | null;
    contratosAtivos: number;
    projetosTotal: number;
    projetosEntregues: number;
    projetosEmAndamento: number;
    receita: number;
    despesas: number;
    pendente: number;
    saldo: number;
}

export interface RelatorioMensalCliente {
    mesReferencia: string;
    totalClientes: number;
    totalReceita: number;
    totalPendente: number;
    clientes: RelatorioClienteItem[];
}

export const relatoriosApi = {
    mensalPorCliente: (mes: string, clienteId?: string) => {
        const params = new URLSearchParams({ mes });
        if (clienteId) params.set("clienteId", clienteId);
        return fetch(`${API_BASE}/relatorios/mensal-cliente?${params}`, { headers: headers() })
            .then(r => handleResponse<RelatorioMensalCliente>(r));
    },

    downloadCsv: (mes: string, clienteId?: string) => {
        const token = getToken();
        const params = new URLSearchParams({ mes });
        if (clienteId) params.set("clienteId", clienteId);
        const url = `${API_BASE}/relatorios/mensal-cliente/csv?${params}`;
        // Abre direto em nova aba para download com Auth header via link com token
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `relatorio-${mes}.csv`);
        // Usa fetch para baixar com auth
        return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.blob())
            .then(blob => {
                const objUrl = URL.createObjectURL(blob);
                link.href = objUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(objUrl);
            });
    },
};

