import { PrismaClient } from "@prisma/client";
import type { ContratoCreateInput, ContratoUpdateInput } from "../../modelos/contratos.schema.js";
import { criarLog } from "../../utilitarios/auditoria.js";

const prisma = new PrismaClient();

export class ContratoService {
    static async criar(dados: ContratoCreateInput, usuarioId: string) {
        const contrato = await prisma.contrato.create({
            data: {
                clienteId: dados.clienteId,
                titulo: dados.titulo,
                descricao: dados.descricao || null,
                valorTotal: dados.valorTotal,
                status: dados.status ?? "RASCUNHO",
                inicioEm: dados.inicioEm ? new Date(dados.inicioEm) : null,
                fimEm: dados.fimEm ? new Date(dados.fimEm) : null,
            },
            include: { cliente: true },
        });

        await criarLog({ usuarioId, acao: "CREATE", entidade: "Contrato", entidadeId: contrato.id, detalhes: dados });
        return contrato;
    }

    static async listarTodos(clienteId?: string) {
        return prisma.contrato.findMany({
            where: { deletadoEm: null, ...(clienteId ? { clienteId } : {}) },
            include: { cliente: { select: { id: true, nome: true } } },
            orderBy: { criadoEm: "desc" },
        });
    }

    static async buscarPorId(id: string) {
        return prisma.contrato.findFirst({
            where: { id, deletadoEm: null },
            include: {
                cliente: { select: { id: true, nome: true, email: true } },
                projetos: { where: { deletadoEm: null } },
            },
        });
    }

    static async atualizar(id: string, dados: ContratoUpdateInput, usuarioId: string) {
        const atual = await ContratoService.buscarPorId(id);
        if (!atual) throw new Error("Contrato não encontrado.");

        const atualizado = await prisma.contrato.update({
            where: { id },
            data: {
                ...dados,
                descricao: dados.descricao || null,
                inicioEm: dados.inicioEm ? new Date(dados.inicioEm) : undefined,
                fimEm: dados.fimEm ? new Date(dados.fimEm) : undefined,
            } as any,
            include: { cliente: true },
        });

        await criarLog({ usuarioId, acao: "UPDATE", entidade: "Contrato", entidadeId: id, detalhes: { antes: atual, depois: atualizado } });
        return atualizado;
    }

    static async deletarLogico(id: string, usuarioId: string) {
        const atual = await ContratoService.buscarPorId(id);
        if (!atual) throw new Error("Contrato não encontrado.");

        const apagado = await prisma.contrato.update({ where: { id }, data: { deletadoEm: new Date() } });
        await criarLog({ usuarioId, acao: "SOFT_DELETE", entidade: "Contrato", entidadeId: id });
        return apagado;
    }
}
