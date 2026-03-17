import type { Request, Response } from "express";
import { ProjetoService } from "../../servicos/projetos/projetos.service.js";
import { projetoCreateSchema, projetoUpdateSchema } from "../../modelos/projetos.schema.js";

// @Agent: Senior Programmer (ASP) — Controller REST do módulo Projetos

export const projetoController = {
    async criar(req: Request, res: Response) {
        const dados = projetoCreateSchema.parse(req.body);
        const projeto = await ProjetoService.criar(dados, String((req as any).usuario?.id ?? "system"));
        return res.status(201).json(projeto);
    },

    async listar(req: Request, res: Response) {
        const { contratoId } = req.query;
        const projetos = await ProjetoService.listarTodos(contratoId as string | undefined);
        return res.status(200).json(projetos);
    },

    async buscarPorId(req: Request, res: Response) {
        const projeto = await ProjetoService.buscarPorId(String(req.params.id));
        if (!projeto) return res.status(404).json({ erro: "Projeto não encontrado." });
        return res.status(200).json(projeto);
    },

    async atualizar(req: Request, res: Response) {
        const dados = projetoUpdateSchema.parse(req.body);
        const atualizado = await ProjetoService.atualizar(String(req.params.id), dados, String((req as any).usuario?.id ?? "system"));
        return res.status(200).json(atualizado);
    },

    async moverStatus(req: Request, res: Response) {
        const { status } = req.body;
        if (!status) return res.status(400).json({ erro: "Status é obrigatório." });
        const projeto = await ProjetoService.atualizarStatus(String(req.params.id), status, String((req as any).usuario?.id ?? "system"));
        return res.status(200).json(projeto);
    },

    async resumo(req: Request, res: Response) {
        const resumo = await ProjetoService.resumoPorStatus();
        return res.status(200).json(resumo);
    },

    async deletar(req: Request, res: Response) {
        await ProjetoService.deletarLogico(String(req.params.id), String((req as any).usuario?.id ?? "system"));
        return res.status(204).send();
    },
};
