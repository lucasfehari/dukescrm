import type { Request, Response } from "express";
import { ClienteService } from "../../servicos/clientes/clientes.service.js";
import { clienteCreateSchema, clienteUpdateSchema } from "../../modelos/clientes.schema.js";

export const clienteController = {
    async criar(req: Request, res: Response) {
        const dadosZod = clienteCreateSchema.parse(req.body);
        const cliente = await ClienteService.criar(dadosZod, (req as any).usuario.id);
        return res.status(201).json(cliente);
    },

    async listar(req: Request, res: Response) {
        const clientes = await ClienteService.listarTodos();
        return res.status(200).json(clientes);
    },

    async atualizar(req: Request, res: Response) {
        const dadosZod = clienteUpdateSchema.parse(req.body);
        const cliente = await ClienteService.atualizar(req.params.id as string, dadosZod, (req as any).usuario.id);
        return res.status(200).json(cliente);
    },

    async deletar(req: Request, res: Response) {
        await ClienteService.deletarLogico(req.params.id as string, (req as any).usuario.id);
        return res.status(204).send();
    },
};
