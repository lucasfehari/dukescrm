import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.js";
import { RelatorioService } from "../../servicos/relatorios/relatorio.service.js";

// @Agent: ASP — Rotas de Relatórios

const router = Router();
router.use(authMiddleware as any);

// GET /api/relatorios/mensal-cliente?mes=2026-03&clienteId=...
router.get("/mensal-cliente", async (req, res, next) => {
    try {
        const hoje = new Date();
        const mesDefault = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
        const mes = (req.query.mes as string) || mesDefault;
        const clienteId = req.query.clienteId as string | undefined;

        const dados = await RelatorioService.relatorioMensalPorCliente(mes, clienteId);
        return res.json(dados);
    } catch (err) {
        next(err);
    }
});

// GET /api/relatorios/mensal-cliente/csv?mes=2026-03
router.get("/mensal-cliente/csv", async (req, res, next) => {
    try {
        const hoje = new Date();
        const mesDefault = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
        const mes = (req.query.mes as string) || mesDefault;
        const clienteId = req.query.clienteId as string | undefined;

        const dados = await RelatorioService.relatorioMensalPorCliente(mes, clienteId);
        const csv = RelatorioService.relatorioParaCsv(dados);

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="relatorio-${mes}.csv"`);
        // BOM para Excel reconhecer UTF-8
        return res.send("\uFEFF" + csv);
    } catch (err) {
        next(err);
    }
});

export default router;
