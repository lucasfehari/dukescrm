import { PrismaClient } from "@prisma/client";
import { criarLog } from "../../utilitarios/auditoria.js";

const prisma = new PrismaClient();

export class ComentarioService {
    static async criar(projetoId: string, texto: string, usuarioId: string) {
        const comentario = await prisma.comentarioProjeto.create({
            data: {
                projetoId,
                texto,
                usuarioId: usuarioId === "system" ? null : usuarioId, // handle system comments if needed
            },
            include: {
                usuario: { select: { id: true, nome: true } },
            },
        });

        await criarLog({ usuarioId, acao: "CREATE", entidade: "ComentarioProjeto", entidadeId: comentario.id, detalhes: { projetoId, texto } });
        return comentario;
    }

    static async listarPorProjeto(projetoId: string) {
        return prisma.comentarioProjeto.findMany({
            where: { projetoId },
            include: {
                usuario: { select: { id: true, nome: true } },
            },
            orderBy: { criadoEm: "asc" },
        });
    }
}
