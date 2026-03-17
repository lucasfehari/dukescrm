import type { Request, Response } from "express";
import { CreditoService } from "../../servicos/creditos/creditos.service.js";
import { creditoCreateSchema } from "../../modelos/creditos.schema.js";

// @Agent: ASP — Controller de Créditos de Contrato

export const creditoController = {
    async listarPorContrato(req: Request, res: Response) {
        const contratoId = req.params.contratoId as string;
        const creditos = await CreditoService.listarPorContrato(contratoId);
        return res.status(200).json(creditos);
    },

    async criar(req: Request, res: Response) {
        const dados = creditoCreateSchema.parse(req.body);
        const credito = await CreditoService.criar(dados);
        return res.status(201).json(credito);
    },

    async deletar(req: Request, res: Response) {
        const id = req.params.id as string;
        await CreditoService.deletar(id);
        return res.status(204).send();
    },
};
