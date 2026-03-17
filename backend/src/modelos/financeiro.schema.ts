import { z } from "zod";

export const financeiroCreateSchema = z.object({
    projetoId: z.string().uuid("ID do projeto inválido."),
    tipo: z.enum(["RECEITA", "DESPESA"]),
    valor: z.number().positive("Valor deve ser positivo."),
    descricao: z.string().min(3, "Descrição deve ter pelo menos 3 caracteres."),
    status: z.enum(["PENDENTE", "PAGO", "ATRASADO", "CANCELADO"]).default("PENDENTE"),
    dataVencimento: z.string().datetime("Data de vencimento inválida."),
    dataPagamento: z.string().datetime().optional(),
    mesReferencia: z.string().regex(/^\d{4}-\d{2}$/, "Formato: YYYY-MM"),
});

export const financeiroUpdateSchema = financeiroCreateSchema.partial();

export type FinanceiroCreateInput = z.infer<typeof financeiroCreateSchema>;
export type FinanceiroUpdateInput = z.infer<typeof financeiroUpdateSchema>;
