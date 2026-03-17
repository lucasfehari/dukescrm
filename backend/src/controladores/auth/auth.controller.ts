import type { Request, Response } from "express";
import { AuthService } from "../../servicos/auth/auth.service.js";
import { loginSchema, registerSchema } from "../../modelos/auth.schema.js";

// @Agent: Senior Programmer (ASP) — Controller de Autenticação

export const authController = {
    async login(req: Request, res: Response) {
        const dados = loginSchema.parse(req.body);
        const resultado = await AuthService.login(dados);
        return res.status(200).json(resultado);
    },

    async registrar(req: Request, res: Response) {
        const dados = registerSchema.parse(req.body);
        const resultado = await AuthService.registrar(dados);
        return res.status(201).json(resultado);
    },

    async me(req: Request, res: Response) {
        // Retorna dados do usuário autenticado via token
        const usuario = (req as any).usuario;
        if (!usuario) return res.status(401).json({ erro: "Não autenticado." });
        return res.status(200).json({ usuario });
    },
};
