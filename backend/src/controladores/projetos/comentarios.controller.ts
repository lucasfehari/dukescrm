import type { Request, Response } from "express";
import { ComentarioService } from "../../servicos/projetos/comentarios.service.js";
import { z } from "zod";

const comentarioSchema = z.object({
    texto: z.string().min(1, "O comentário não pode estar vazio."),
});

// @Agent: Senior Programmer (ASP) — Controller REST para Comentários

export const comentariosController = {
    async adicionar(req: Request, res: Response) {
        const id = String(req.params.id); // projetoId
        const dados = comentarioSchema.parse(req.body);
        const usuarioId = String((req as any).usuario?.id ?? "system");

        const comentario = await ComentarioService.criar(id, dados.texto, usuarioId);
        return res.status(201).json(comentario);
    },

    async listar(req: Request, res: Response) {
        const id = String(req.params.id); // projetoId
        const comentarios = await ComentarioService.listarPorProjeto(id);
        return res.status(200).json(comentarios);
    },
};
