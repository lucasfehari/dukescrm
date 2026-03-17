import { z } from "zod";

export const servicoCatalogoCreateSchema = z.object({
    nome: z.string().min(3, "Nome do serviço deve ter pelo menos 3 caracteres."),
    descricao: z.string().optional().nullable(),
    valorPadrao: z.number().min(0, "O valor não pode ser negativo."),
    status: z.enum(["ATIVO", "INATIVO"]).default("ATIVO"),
});

export const servicoCatalogoUpdateSchema = servicoCatalogoCreateSchema.partial();

export type ServicoCatalogoCreateInput = z.infer<typeof servicoCatalogoCreateSchema>;
export type ServicoCatalogoUpdateInput = z.infer<typeof servicoCatalogoUpdateSchema>;
