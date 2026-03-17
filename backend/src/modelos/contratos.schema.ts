import { z } from "zod";

export const contratoCreateSchema = z.object({
    clienteId: z.string().uuid("ID do cliente inválido."),
    titulo: z.string().min(3, "Título deve ter pelo menos 3 caracteres."),
    descricao: z.string().optional(),
    valorTotal: z.number().positive("Valor deve ser positivo."),
    status: z.enum(["RASCUNHO", "ENVIADO", "ASSINADO", "ATIVO", "EM_ANDAMENTO", "PAUSADO", "VENCIDO", "CANCELADO", "FINALIZADO"]).default("RASCUNHO"),
    inicioEm: z.string().datetime().optional(),
    fimEm: z.string().datetime().optional(),
});

export const contratoUpdateSchema = contratoCreateSchema.partial();

export type ContratoCreateInput = z.infer<typeof contratoCreateSchema>;
export type ContratoUpdateInput = z.infer<typeof contratoUpdateSchema>;
