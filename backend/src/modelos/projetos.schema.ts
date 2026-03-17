import { z } from "zod";

// @Agent: Senior Programmer (ASP) + System Design — Schema Zod do Módulo de Projetos
// Zod v4: .partial() não funciona em schemas com .refine()
// → separamos o schema base (sem refine) para derivar o update schema

const projetoBaseSchema = z.object({
    contratoId: z.string().uuid("ID do contrato inválido.").optional().nullable(),
    clienteId: z.string().uuid("ID do cliente inválido.").optional().nullable(),
    creditoId: z.string().uuid("ID do crédito inválido.").optional().nullable(),  // Pacote de crédito a descontar
    tipoProjeto: z.string().max(100).optional().nullable(),                        // Ex: "Carrossel", "Estático", "Vídeo"
    avulso: z.boolean().default(false),
    valorAvulso: z.number().nonnegative("Valor deve ser maior ou igual a zero.").optional().nullable(),
    nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres."),
    descricao: z.string().optional().nullable(),
    status: z.enum(["NAO_INICIADO", "EM_ANDAMENTO", "IMPEDIDO", "CONCLUIDO", "CANCELADO"]).default("NAO_INICIADO"),
    prazoEstimado: z.string().optional().nullable(),
    servicos: z.array(z.object({
        nome: z.string(),
        valor: z.number(),
        catalogoId: z.string().uuid().optional(),
    })).optional().nullable(),
});

// Create: exige contratoId (projeto normal) OU clienteId (serviço avulso)
export const projetoCreateSchema = projetoBaseSchema.refine(
    (d) => d.contratoId || d.clienteId,
    { message: "Informe um contratoId (via Créditos/Contrato) ou clienteId.", path: ["contratoId"] }
);

// Update: todos os campos opcionais — derivado do base (sem refine, que é incompatível com .partial() no Zod v4)
export const projetoUpdateSchema = projetoBaseSchema.partial();

export type ProjetoCreateInput = z.infer<typeof projetoCreateSchema>;
export type ProjetoUpdateInput = z.infer<typeof projetoUpdateSchema>;
