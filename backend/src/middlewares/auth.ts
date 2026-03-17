import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// @Agent: Segurança — Middleware de autenticação JWT corrigido
// Salva o payload completo em req.usuario para compatibilidade com todos os controllers

export interface RequestComUsuario extends Request {
    usuarioId?: string;
    funcao?: string;
    usuario?: { id: string; email: string; funcao: string };
}

export function authMiddleware(req: RequestComUsuario, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ erro: "Token de autenticação ausente." });
    }

    const parts = authHeader.split(" ");
    const token = parts[1];
    if (!token) {
        return res.status(401).json({ erro: "Token de autenticação mal formatado." });
    }

    try {
        const payload = jwt.verify(
            token,
            (process.env.JWT_SECRET || "SUPER_SECRETO_DEV")
        ) as unknown as { id: string; email: string; funcao: string };

        // Expõe como req.usuario (padrão novo) E req.usuarioId (compatibilidade retroativa)
        (req as any).usuario = { id: payload.id, email: payload.email, funcao: payload.funcao };
        req.usuarioId = payload.id;
        req.funcao = payload.funcao;

        next();
    } catch (error) {
        return res.status(401).json({ erro: "Token inválido ou expirado." });
    }
}
