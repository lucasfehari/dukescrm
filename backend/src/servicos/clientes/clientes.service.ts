import { PrismaClient } from "@prisma/client";
import type { ClienteCreateInput, ClienteUpdateInput } from "../../modelos/clientes.schema.js";
import { criarLog } from "../../utilitarios/auditoria.js";

const prisma = new PrismaClient();

export class ClienteService {
    static async criar(dados: ClienteCreateInput, usuarioId: string) {
        const payloadTratado = {
            ...dados,
            email: dados.email || null,
            telefone: dados.telefone || null,
            documento: dados.documento || null,
            linkDrive: dados.linkDrive || null,
            linkBriefing: dados.linkBriefing || null,
            logoUrl: dados.logoUrl || null,
            saude: dados.saude || "OTIMA",
            mrrEstimado: dados.mrrEstimado || null,
            observacoes: dados.observacoes || null,
        };

        const cliente = await prisma.cliente.create({
            data: payloadTratado,
        });
        await criarLog({
            usuarioId,
            acao: "CREATE",
            entidade: "Cliente",
            entidadeId: cliente.id,
            detalhes: dados,
        });

        return cliente;
    }

    static async listarTodos() {
        return prisma.cliente.findMany({
            where: {
                deletadoEm: null,
            },
            orderBy: {
                criadoEm: "desc",
            },
        });
    }

    static async buscarPorId(id: string) {
        return prisma.cliente.findFirst({
            where: {
                id,
                deletadoEm: null,
            },
        });
    }

    static async atualizar(id: string, dados: ClienteUpdateInput, usuarioId: string) {
        const clienteAtual = await ClienteService.buscarPorId(id);
        if (!clienteAtual) throw new Error("Cliente não encontrado.");

        const payloadTratado = {
            ...dados,
            ...(dados.email !== undefined && { email: dados.email || null }),
            ...(dados.telefone !== undefined && { telefone: dados.telefone || null }),
            ...(dados.documento !== undefined && { documento: dados.documento || null }),
            ...(dados.linkDrive !== undefined && { linkDrive: dados.linkDrive || null }),
            ...(dados.linkBriefing !== undefined && { linkBriefing: dados.linkBriefing || null }),
            ...(dados.logoUrl !== undefined && { logoUrl: dados.logoUrl || null }),
            ...(dados.saude !== undefined && { saude: dados.saude }),
            ...(dados.mrrEstimado !== undefined && { mrrEstimado: dados.mrrEstimado || null }),
            ...(dados.observacoes !== undefined && { observacoes: dados.observacoes || null }),
        };

        const clienteAtualizado = await prisma.cliente.update({
            where: { id },
            data: payloadTratado as any,
        });
        await criarLog({
            usuarioId,
            acao: "UPDATE",
            entidade: "Cliente",
            entidadeId: id,
            detalhes: { antes: clienteAtual, depois: clienteAtualizado },
        });

        return clienteAtualizado;
    }

    static async deletarLogico(id: string, usuarioId: string) {
        const clienteAtual = await ClienteService.buscarPorId(id);
        if (!clienteAtual) throw new Error("Cliente não encontrado.");

        // Soft delete em cascata: primeiro marca contratos/projetos como deletados
        const [contratosAfetados, projetosAfetados] = await Promise.all([
            prisma.contrato.updateMany({
                where: { clienteId: id, deletadoEm: null },
                data: { deletadoEm: new Date(), status: "CANCELADO" },
            }),
            prisma.projeto.updateMany({
                where: { clienteId: id, deletadoEm: null },
                data: { deletadoEm: new Date() },
            }),
        ]);

        const clienteApagado = await prisma.cliente.update({
            where: { id },
            data: { deletadoEm: new Date() },
        });

        await criarLog({
            usuarioId,
            acao: "SOFT_DELETE",
            entidade: "Cliente",
            entidadeId: id,
            detalhes: {
                nome: clienteAtual.nome,
                contratosAfetados: contratosAfetados.count,
                projetosAfetados: projetosAfetados.count,
            },
        });

        return clienteApagado;
    }
}
