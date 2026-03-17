import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.js";
import { DashboardService } from "../../servicos/dashboard/dashboard.service.js";

// @Agent: ASP — Rotas do Dashboard Executivo

const router = Router();
router.use(authMiddleware as any);

// GET /api/dashboard/resumo — KPIs de todos os módulos
router.get("/resumo", async (req, res, next) => {
    try {
        const dados = await DashboardService.resumo();
        return res.json(dados);
    } catch (err) {
        next(err);
    }
});

// GET /api/dashboard/contratos-vencendo?dias=30
router.get("/contratos-vencendo", async (req, res, next) => {
    try {
        const dias = parseInt(req.query.dias as string) || 30;
        const contratos = await DashboardService.contratosVencendo(dias);
        return res.json(contratos);
    } catch (err) {
        next(err);
    }
});

export default router;
