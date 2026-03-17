import type { Request, Response } from "express";
import { ContratoService } from "../../servicos/contratos/contratos.service.js";
import { contratoCreateSchema, contratoUpdateSchema } from "../../modelos/contratos.schema.js";

export const contratoController = {
    async criar(req: Request, res: Response) {
        const dados = contratoCreateSchema.parse(req.body);
        const contrato = await ContratoService.criar(dados, (req as any).usuario?.id ?? "system");
        return res.status(201).json(contrato);
    },

    async listar(req: Request, res: Response) {
        const { clienteId } = req.query;
        const contratos = await ContratoService.listarTodos(clienteId as string | undefined);
        return res.status(200).json(contratos);
    },

    async buscarPorId(req: Request, res: Response) {
        const contrato = await ContratoService.buscarPorId(req.params.id as string);
        if (!contrato) return res.status(404).json({ erro: "Contrato não encontrado." });
        return res.status(200).json(contrato);
    },

    async atualizar(req: Request, res: Response) {
        const dados = contratoUpdateSchema.parse(req.body);
        const contrato = await ContratoService.atualizar(req.params.id as string, dados, (req as any).usuario?.id ?? "system");
        return res.status(200).json(contrato);
    },

    async deletar(req: Request, res: Response) {
        await ContratoService.deletarLogico(req.params.id as string, (req as any).usuario?.id ?? "system");
        return res.status(204).send();
    },
};
