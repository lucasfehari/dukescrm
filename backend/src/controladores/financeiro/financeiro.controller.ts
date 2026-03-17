import type { Request, Response } from "express";
import { FinanceiroService } from "../../servicos/financeiro/financeiro.service.js";
import { financeiroCreateSchema, financeiroUpdateSchema } from "../../modelos/financeiro.schema.js";

// @Agent: Senior Programmer (ASP) - Controller REST do Financeiro

export const financeiroController = {
    async criar(req: Request, res: Response) {
        const dados = financeiroCreateSchema.parse(req.body);
        const lancamento = await FinanceiroService.criar(dados, (req as any).usuario?.id ?? "system");
        return res.status(201).json(lancamento);
    },

    async listar(req: Request, res: Response) {
        const filtros: { tipo?: string; status?: string; mesReferencia?: string } = {};
        if (req.query.tipo) filtros.tipo = req.query.tipo as string;
        if (req.query.status) filtros.status = req.query.status as string;
        if (req.query.mesReferencia) filtros.mesReferencia = req.query.mesReferencia as string;
        const lancamentos = await FinanceiroService.listarTodos(filtros);
        return res.status(200).json(lancamentos);
    },

    async resumo(req: Request, res: Response) {
        const { mesReferencia } = req.query;
        const kpis = await FinanceiroService.resumo(mesReferencia as string | undefined);
        return res.status(200).json(kpis);
    },

    async atualizar(req: Request, res: Response) {
        const dados = financeiroUpdateSchema.parse(req.body);
        const atualizado = await FinanceiroService.atualizar(
            req.params.id as string,
            dados,
            (req as any).usuario?.id ?? "system"
        );
        return res.status(200).json(atualizado);
    },

    async deletar(req: Request, res: Response) {
        await FinanceiroService.deletarLogico(req.params.id as string, (req as any).usuario?.id ?? "system");
        return res.status(204).send();
    },

    async carteiraDevedora(req: Request, res: Response) {
        const devedores = await FinanceiroService.carteiraDevedora();
        return res.status(200).json(devedores);
    },

    async consolidar(req: Request, res: Response) {
        const { lancamentoIds } = req.body;
        if (!Array.isArray(lancamentoIds) || !lancamentoIds.length) {
            return res.status(400).json({ error: "Informe um array de lancamentoIds" });
        }
        const resultado = await FinanceiroService.consolidar(lancamentoIds, (req as any).usuario?.id ?? "system");
        return res.status(200).json(resultado);
    },
};
