import { PrismaClient } from "@prisma/client";
import type { FinanceiroCreateInput, FinanceiroUpdateInput } from "../../modelos/financeiro.schema.js";
import { criarLog } from "../../utilitarios/auditoria.js";

const prisma = new PrismaClient();

export class FinanceiroService {
    static async criar(dados: FinanceiroCreateInput, usuarioId: string) {
        const lancamento = await prisma.financeiro.create({
            data: {
                projetoId: dados.projetoId,
                tipo: dados.tipo,
                valor: dados.valor,
                descricao: dados.descricao,
                status: dados.status ?? "PENDENTE",
                dataVencimento: new Date(dados.dataVencimento),
                dataPagamento: dados.dataPagamento ? new Date(dados.dataPagamento) : null,
                mesReferencia: dados.mesReferencia,
            },
        });
        await criarLog({ usuarioId, acao: "CREATE", entidade: "Financeiro", entidadeId: lancamento.id, detalhes: dados });
        return lancamento;
    }

    static async listarTodos(filtros?: { tipo?: string; status?: string; mesReferencia?: string }) {
        return prisma.financeiro.findMany({
            where: {
                deletadoEm: null,
                ...(filtros?.tipo ? { tipo: filtros.tipo as "RECEITA" | "DESPESA" } : {}),
                ...(filtros?.status ? { status: filtros.status as any } : {}),
                ...(filtros?.mesReferencia ? { mesReferencia: filtros.mesReferencia } : {}),
            },
            include: { projeto: { select: { id: true, nome: true } } },
            orderBy: { dataVencimento: "desc" },
        });
    }

    static async resumo(mesReferencia?: string) {
        const lancamentos = await prisma.financeiro.findMany({
            where: {
                deletadoEm: null,
                ...(mesReferencia ? { mesReferencia } : {}),
            },
        });

        const totalReceitas = lancamentos
            .filter((l) => l.tipo === "RECEITA" && l.status === "PAGO")
            .reduce((acc, l) => acc + Number(l.valor), 0);

        const totalDespesas = lancamentos
            .filter((l) => l.tipo === "DESPESA" && l.status === "PAGO")
            .reduce((acc, l) => acc + Number(l.valor), 0);

        const pendentes = lancamentos
            .filter((l) => l.status === "PENDENTE")
            .reduce((acc, l) => acc + Number(l.valor), 0);

        return {
            totalReceitas,
            totalDespesas,
            saldoLiquido: totalReceitas - totalDespesas,
            pendentes,
            totalLancamentos: lancamentos.length,
        };
    }

    static async atualizar(id: string, dados: FinanceiroUpdateInput, usuarioId: string) {
        const atual = await prisma.financeiro.findFirst({ where: { id, deletadoEm: null } });
        if (!atual) throw new Error("Lançamento não encontrado.");

        const atualizado = await prisma.financeiro.update({
            where: { id },
            data: {
                ...dados,
                dataVencimento: dados.dataVencimento ? new Date(dados.dataVencimento) : undefined,
                dataPagamento: dados.dataPagamento ? new Date(dados.dataPagamento) : undefined,
            } as any,
        });

        await criarLog({ usuarioId, acao: "UPDATE", entidade: "Financeiro", entidadeId: id, detalhes: { antes: atual, depois: atualizado } });
        return atualizado;
    }

    static async deletarLogico(id: string, usuarioId: string) {
        const atual = await prisma.financeiro.findFirst({ where: { id, deletadoEm: null } });
        if (!atual) throw new Error("Lançamento não encontrado.");

        await prisma.financeiro.update({ where: { id }, data: { deletadoEm: new Date() } });
        await criarLog({ usuarioId, acao: "SOFT_DELETE", entidade: "Financeiro", entidadeId: id });
    }

    // Retorna todos os lançamentos PENDENTES de RECEITA agrupados por Cliente
    static async carteiraDevedora() {
        const pendentes = await prisma.financeiro.findMany({
            where: {
                tipo: "RECEITA",
                status: "PENDENTE",
                deletadoEm: null,
            },
            include: {
                projeto: {
                    select: {
                        id: true,
                        nome: true,
                        avulso: true,
                        cliente: { select: { id: true, nome: true } },
                        contrato: { select: { cliente: { select: { id: true, nome: true } } } },
                    },
                },
            },
            orderBy: { dataVencimento: "asc" },
        });

        return pendentes.map(l => {
            const cliente = l.projeto.avulso ? l.projeto.cliente : l.projeto.contrato?.cliente;
            return {
                id: l.id,
                valor: Number(l.valor),
                descricao: l.descricao,
                dataVencimento: l.dataVencimento,
                projetoId: l.projeto.id,
                projetoNome: l.projeto.nome,
                avulso: l.projeto.avulso,
                clienteId: cliente?.id,
                clienteNome: cliente?.nome ?? "Cliente não informado",
            };
        });
    }

    // Consolida/Paga múltiplos lançamentos de uma vez
    static async consolidar(lancamentoIds: string[], usuarioId: string) {
        if (!lancamentoIds.length) throw new Error("Nenhum lançamento informado.");

        const atualizados = await prisma.financeiro.updateMany({
            where: { id: { in: lancamentoIds }, status: "PENDENTE", deletadoEm: null },
            data: {
                status: "PAGO",
                dataPagamento: new Date(),
            },
        });

        await criarLog({
            usuarioId,
            acao: "UPDATE",
            entidade: "Financeiro",
            entidadeId: "LOTE",
            detalhes: { originalAction: "CONSOLIDATE", lancamentos: lancamentoIds, qtd: atualizados.count }
        });

        return { count: atualizados.count };
    }
}
