import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
    if (err instanceof ZodError) {
        return res.status(400).json({
            erro: "Erro de Validação de Dados",
            detalhes: (err as any).errors
        });
    }

    console.error("[Erro Interno]", err);

    return res.status(500).json({
        erro: "Erro Interno do Servidor",
        mensagem: process.env.NODE_ENV === "development" ? err.message : "Ocorreu um erro inesperado."
    });
}
