import { z } from "zod";

// @Agent: Senior Programmer (ASP) + Segurança — Schemas de Autenticação

export const loginSchema = z.object({
    email: z.string().email("E-mail inválido."),
    senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres."),
});

export const registerSchema = z.object({
    nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres."),
    email: z.string().email("E-mail inválido."),
    senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres."),
    funcao: z.enum(["ADMINISTRADOR", "GERENTE", "USUARIO"]).default("USUARIO"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
