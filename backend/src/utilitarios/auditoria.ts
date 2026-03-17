import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function criarLog({
    usuarioId,
    acao,
    entidade,
    entidadeId,
    detalhes,
    ip
}: {
    usuarioId: string;
    acao: "CREATE" | "UPDATE" | "SOFT_DELETE" | "HARD_DELETE";
    entidade: string;
    entidadeId: string;
    detalhes?: any;
    ip?: string;
}) {
    return await prisma.logAuditoria.create({
        data: {
            usuarioId: usuarioId === "system" ? null : usuarioId,
            acao,
            entidade,
            entidadeId,
            detalhes,
            ip: ip || null
        }
    });
}
