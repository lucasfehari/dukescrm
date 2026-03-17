import * as z from "zod";

// @Agent: ASP — Schema Zod para CreditoContrato
// Pacotes de créditos de serviços vinculados a um contrato

export const creditoCreateSchema = z.object({
    contratoId: z.string().uuid("ID do contrato inválido."),
    nome: z.string().min(1, "Nome do tipo de serviço obrigatório.").max(100),
    quantidadeTotal: z.number().int().min(1, "Quantidade mínima: 1."),
    valorUnitario: z.number().min(0, "Valor não pode ser negativo."),
});

export type CreditoCreateInput = z.infer<typeof creditoCreateSchema>;
