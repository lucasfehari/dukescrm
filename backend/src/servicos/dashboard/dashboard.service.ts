import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// @Agent: ASP + Empresário — DashboardService agrega KPIs reais de todos os módulos

export class DashboardService {

    /**
     * Resumo executivo do Dashboard — agrega dados de todos os módulos em paralelo
     */
    static async resumo() {
        const hoje = new Date();
        const inicioDeMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const fimDeMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);
        const mesRef = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
        const limite30dias = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000);

        const [
            totalClientes,
            contratosPorStatus,
            projetosPorStatus,
            financeiroMes,
            contratosVencendo,
            ultimosLogs,
            receitaUltimos6Meses,
        ] = await Promise.all([
            // 1. Clientes ativos
            prisma.cliente.count({ where: { deletadoEm: null } }),

            // 2. Contratos por status
            prisma.contrato.groupBy({
                by: ["status"],
                where: { deletadoEm: null },
                _count: { status: true },
            }),

            // 3. Projetos por status
            prisma.projeto.groupBy({
                by: ["status"],
                where: { deletadoEm: null },
                _count: { status: true },
            }),

            // 4. Financeiro do mês vigente
            prisma.financeiro.findMany({
                where: {
                    deletadoEm: null,
                    mesReferencia: mesRef,
                },
                select: { tipo: true, valor: true, status: true },
            }),

            // 5. Contratos vencendo em até 30 dias
            prisma.contrato.findMany({
                where: {
                    deletadoEm: null,
                    fimEm: { gte: hoje, lte: limite30dias },
                    status: { notIn: ["CANCELADO", "FINALIZADO"] },
                },
                include: { cliente: { select: { nome: true } } },
                orderBy: { fimEm: "asc" },
                take: 10,
            }),

            // 6. Últimas atividades (LogAuditoria)
            prisma.logAuditoria.findMany({
                orderBy: { criadoEm: "desc" },
                take: 8,
                include: { usuario: { select: { nome: true } } },
            }),

            // 7. Receita dos últimos 6 meses para o gráfico
            DashboardService.receitaUltimos6Meses(),
        ]);

        // Consolidar financeiro do mês
        let receita = 0, despesas = 0, pendente = 0;
        for (const l of financeiroMes) {
            const v = Number(l.valor);
            if (l.tipo === "RECEITA" && l.status === "PAGO") receita += v;
            else if (l.tipo === "DESPESA" && l.status === "PAGO") despesas += v;
            else if (l.status === "PENDENTE") pendente += v;
        }

        // Mapear contratos por status
        const contratoStatus: Record<string, number> = {};
        for (const c of contratosPorStatus) {
            contratoStatus[c.status] = c._count.status;
        }

        // Mapear projetos por status
        const projetoStatus: Record<string, number> = {};
        for (const p of projetosPorStatus) {
            projetoStatus[p.status] = p._count.status;
        }

        return {
            totalClientes,
            contratos: {
                total: contratosPorStatus.reduce((acc, c) => acc + c._count.status, 0),
                porStatus: contratoStatus,
                ativos: (contratoStatus["ATIVO"] ?? 0) + (contratoStatus["EM_ANDAMENTO"] ?? 0),
                vencidos: contratoStatus["VENCIDO"] ?? 0,
            },
            projetos: {
                total: projetosPorStatus.reduce((acc, p) => acc + p._count.status, 0),
                porStatus: projetoStatus,
                emAndamento: projetoStatus["EM_ANDAMENTO"] ?? 0,
                impedidos: projetoStatus["IMPEDIDO"] ?? 0,
                concluidos: projetoStatus["CONCLUIDO"] ?? 0,
            },
            financeiro: { receita, despesas, pendente, saldo: receita - despesas },
            contratosVencendo: contratosVencendo.map(c => ({
                id: c.id,
                titulo: c.titulo,
                cliente: c.cliente.nome,
                fimEm: c.fimEm,
                diasRestantes: c.fimEm
                    ? Math.ceil((c.fimEm.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
                    : null,
                status: c.status,
            })),
            atividadeRecente: ultimosLogs.map(l => ({
                id: l.id,
                acao: l.acao,
                entidade: l.entidade,
                usuario: l.usuario?.nome ?? "Sistema",
                criadoEm: l.criadoEm,
                detalhes: l.detalhes,
            })),
            receitaUltimos6Meses,
        };
    }

    /**
     * Receita dos últimos 6 meses para o gráfico de área
     */
    static async receitaUltimos6Meses() {
        const meses: { mes: string; receita: number; despesas: number }[] = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const mesRef = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            const nomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
            const label = `${nomes[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;

            const lancamentos = await prisma.financeiro.findMany({
                where: { deletadoEm: null, mesReferencia: mesRef, status: "PAGO" },
                select: { tipo: true, valor: true },
            });

            let receita = 0, despesas = 0;
            for (const l of lancamentos) {
                if (l.tipo === "RECEITA") receita += Number(l.valor);
                else despesas += Number(l.valor);
            }

            meses.push({ mes: label, receita, despesas });
        }

        return meses;
    }

    /**
     * Contratos vencendo em até N dias
     */
    static async contratosVencendo(dias = 30) {
        const hoje = new Date();
        const limite = new Date(hoje.getTime() + dias * 24 * 60 * 60 * 1000);

        return prisma.contrato.findMany({
            where: {
                deletadoEm: null,
                fimEm: { gte: hoje, lte: limite },
                status: { notIn: ["CANCELADO", "FINALIZADO"] },
            },
            include: { cliente: { select: { nome: true, email: true } } },
            orderBy: { fimEm: "asc" },
        });
    }
}
