import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// @Agent: ASP + Empresário — RelatorioService — Relatório Mensal por Cliente

export class RelatorioService {

    /**
     * Relatório Mensal por Cliente
     * Filtra por mês de referência (YYYY-MM) e opcionalmente por clienteId
     */
    static async relatorioMensalPorCliente(mesReferencia: string, clienteId?: string) {
        // 1. Buscar clientes ativos (ou apenas o cliente filtrado)
        const clientes = await prisma.cliente.findMany({
            where: {
                deletadoEm: null,
                ...(clienteId ? { id: clienteId } : {}),
            },
            select: { id: true, nome: true, email: true },
            orderBy: { nome: "asc" },
        });

        // 2. Para cada cliente, agregar dados do mês
        const relatorio = await Promise.all(clientes.map(async (cliente) => {

            // Buscar projetos do cliente no período
            const projetos = await prisma.projeto.findMany({
                where: {
                    deletadoEm: null,
                    OR: [
                        { clienteId: cliente.id },
                        { contrato: { clienteId: cliente.id } },
                    ],
                },
                select: { id: true, status: true },
            });

            const projetoIds = projetos.map(p => p.id);

            // Buscar lançamentos financeiros do mês vinculados a esse cliente (via projetos)
            const lancamentos = projetoIds.length > 0
                ? await prisma.financeiro.findMany({
                    where: {
                        deletadoEm: null,
                        mesReferencia,
                        projetoId: { in: projetoIds },
                    },
                    select: { tipo: true, valor: true, status: true },
                })
                : [];

            // Contratos ativos do cliente
            const contratosAtivos = await prisma.contrato.count({
                where: {
                    deletadoEm: null,
                    clienteId: cliente.id,
                    status: { in: ["ATIVO", "EM_ANDAMENTO", "ASSINADO"] },
                },
            });

            // Calcular receita, despesas e pendente
            let receita = 0, despesas = 0, pendente = 0;
            for (const l of lancamentos) {
                const v = Number(l.valor);
                if (l.tipo === "RECEITA" && l.status === "PAGO") receita += v;
                else if (l.tipo === "DESPESA" && l.status === "PAGO") despesas += v;
                else if (l.status === "PENDENTE") pendente += v;
            }

            const entregues = projetos.filter(p => p.status === "CONCLUIDO").length;
            const emAndamento = projetos.filter(p => p.status === "EM_ANDAMENTO").length;

            return {
                clienteId: cliente.id,
                cliente: cliente.nome,
                email: cliente.email ?? null,
                contratosAtivos,
                projetosTotal: projetos.length,
                projetosEntregues: entregues,
                projetosEmAndamento: emAndamento,
                receita,
                despesas,
                pendente,
                saldo: receita - despesas,
            };
        }));

        // Apenas clientes com alguma movimentação ou contrato no período
        const comMovimento = relatorio.filter(r =>
            r.receita > 0 || r.despesas > 0 || r.pendente > 0 || r.contratosAtivos > 0 || r.projetosTotal > 0
        );

        return {
            mesReferencia,
            totalClientes: comMovimento.length,
            totalReceita: comMovimento.reduce((a, r) => a + r.receita, 0),
            totalPendente: comMovimento.reduce((a, r) => a + r.pendente, 0),
            clientes: comMovimento,
        };
    }

    /**
     * Gera string CSV do relatório mensal por cliente
     */
    static relatorioParaCsv(dados: Awaited<ReturnType<typeof RelatorioService.relatorioMensalPorCliente>>) {
        const linhas = [
            `Relatório Mensal — ${dados.mesReferencia}`,
            `Total de Clientes;${dados.totalClientes}`,
            `Receita Total;${dados.totalReceita.toFixed(2)}`,
            `Pendente Total;${dados.totalPendente.toFixed(2)}`,
            ``,
            `Cliente;E-mail;Contratos Ativos;Projetos;Entregues;Em Andamento;Receita;Despesas;Pendente;Saldo`,
            ...dados.clientes.map(c =>
                [
                    c.cliente,
                    c.email ?? "",
                    c.contratosAtivos,
                    c.projetosTotal,
                    c.projetosEntregues,
                    c.projetosEmAndamento,
                    c.receita.toFixed(2),
                    c.despesas.toFixed(2),
                    c.pendente.toFixed(2),
                    c.saldo.toFixed(2),
                ].join(";")
            ),
        ];

        return linhas.join("\n");
    }
}
