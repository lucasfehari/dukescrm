import { PrismaClient } from "@prisma/client";
import type { CreditoCreateInput } from "../../modelos/creditos.schema.js";

// @Agent: ASP + AO — Service de Créditos de Contrato
// Gerencia pacotes de serviços (ex: 20 estáticos, 10 carrosséis)
// com controle de quantidade usada x disponível
// Usa (prisma as any) para garantir acesso ao modelo após geração do client

const prisma = new PrismaClient();
const db = prisma as any; // cast para acessar modelos após generate

export class CreditoService {
    /** Lista todos os créditos de um contrato com saldo disponível */
    static async listarPorContrato(contratoId: string) {
        const creditos = await db.creditoContrato.findMany({
            where: { contratoId },
            orderBy: { criadoEm: "asc" },
        });

        return creditos.map((c: any) => ({
            ...c,
            quantidadeDisponivel: c.quantidadeTotal - c.quantidadeUsada,
        }));
    }

    /** Adiciona um pacote de crédito ao contrato */
    static async criar(dados: CreditoCreateInput) {
        const contrato = await db.contrato.findFirst({
            where: { id: dados.contratoId, deletadoEm: null },
        });
        if (!contrato) throw new Error("Contrato não encontrado.");

        const credito = await db.creditoContrato.create({
            data: {
                contratoId: dados.contratoId,
                nome: dados.nome,
                quantidadeTotal: dados.quantidadeTotal,
                valorUnitario: dados.valorUnitario,
            },
        });

        return {
            ...credito,
            quantidadeDisponivel: credito.quantidadeTotal,
        };
    }

    /** Decrementa 1 uso de um crédito (chamado ao criar projeto) */
    static async decrementar(creditoId: string): Promise<void> {
        const credito = await db.creditoContrato.findUnique({ where: { id: creditoId } });
        if (!credito) throw new Error("Crédito não encontrado.");

        const disponivel = credito.quantidadeTotal - credito.quantidadeUsada;
        if (disponivel <= 0)
            throw new Error(`Sem saldo disponível para "${credito.nome}". Todos os créditos foram usados.`);

        await db.creditoContrato.update({
            where: { id: creditoId },
            data: { quantidadeUsada: { increment: 1 } },
        });
    }

    /** Devolve 1 uso de um crédito (chamado ao deletar/cancelar projeto) */
    static async devolver(creditoId: string): Promise<void> {
        const credito = await db.creditoContrato.findUnique({ where: { id: creditoId } });
        if (!credito) return;

        if (credito.quantidadeUsada > 0) {
            await db.creditoContrato.update({
                where: { id: creditoId },
                data: { quantidadeUsada: { decrement: 1 } },
            });
        }
    }

    /** Remove um pacote de crédito (somente se não houver uso) */
    static async deletar(id: string) {
        const credito = await db.creditoContrato.findUnique({ where: { id } });
        if (!credito) throw new Error("Crédito não encontrado.");
        if (credito.quantidadeUsada > 0) {
            throw new Error(`"${credito.nome}" possui ${credito.quantidadeUsada} uso(s). Cancele os projetos antes de remover.`);
        }
        await db.creditoContrato.delete({ where: { id } });
    }
}
