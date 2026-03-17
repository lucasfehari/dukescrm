import { PrismaClient } from "@prisma/client";
import type { ServicoCatalogoCreateInput, ServicoCatalogoUpdateInput } from "../../modelos/servicoCatalogo.schema.js";

const prisma = new PrismaClient();

export class ServicoCatalogoService {
    static async criar(dados: ServicoCatalogoCreateInput) {
        return prisma.servicoCatalogo.create({
            data: {
                nome: dados.nome,
                descricao: dados.descricao ?? null,
                valorPadrao: dados.valorPadrao,
                status: dados.status ?? "ATIVO",
            },
        });
    }

    static async listarTodos() {
        return prisma.servicoCatalogo.findMany({
            where: {
                status: "ATIVO",
            },
            orderBy: {
                nome: "asc",
            },
        });
    }

    static async buscarPorId(id: string) {
        return prisma.servicoCatalogo.findUnique({
            where: { id },
        });
    }

    static async atualizar(id: string, dados: ServicoCatalogoUpdateInput) {
        return prisma.servicoCatalogo.update({
            where: { id },
            data: {
                ...(dados.nome !== undefined && { nome: dados.nome }),
                ...(dados.descricao !== undefined && { descricao: dados.descricao ?? null }),
                ...(dados.valorPadrao !== undefined && { valorPadrao: dados.valorPadrao }),
                ...(dados.status !== undefined && { status: dados.status }),
            },
        });
    }

    static async deletar(id: string) {
        // Soft delete alterando o status
        return prisma.servicoCatalogo.update({
            where: { id },
            data: { status: "INATIVO" },
        });
    }
}
