import { Router } from "express";
import { financeiroController } from "../../controladores/financeiro/financeiro.controller.js";

// @Agent: Senior Programmer (ASP) - Rotas do Financeiro

const router = Router();

// GET /api/financeiro/resumo — KPIs de caixa
router.get("/resumo", financeiroController.resumo);

// Novas rotas para Fechamento/Carteira Devedora
router.get("/carteira-devedora", financeiroController.carteiraDevedora);
router.post("/consolidar", financeiroController.consolidar);

// CRUD padrão
router.post("/", financeiroController.criar);
router.get("/", financeiroController.listar);
router.put("/:id", financeiroController.atualizar);
router.delete("/:id", financeiroController.deletar);

export default router;
