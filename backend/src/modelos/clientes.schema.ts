import { z } from "zod";

export const clienteCreateSchema = z.object({
    nome: z.string({ message: "Nome do cliente é obrigatório." }).min(3, "O nome deve conter pelo menos 3 caracteres."),
    email: z.string().email("Endereço de e-mail inválido.").optional().nullable(),
    telefone: z.string().optional().nullable(),
    documento: z.string().optional().nullable(),
    linkDrive: z.string().url("Insira uma URL válida para o Google Drive").optional().nullable().or(z.literal("")),
    linkBriefing: z.string().url("Insira uma URL válida para o Briefing").optional().nullable().or(z.literal("")),
    observacoes: z.string().optional().nullable(),
});

export const clienteUpdateSchema = clienteCreateSchema.partial();

export type ClienteCreateInput = z.infer<typeof clienteCreateSchema>;
export type ClienteUpdateInput = z.infer<typeof clienteUpdateSchema>;
