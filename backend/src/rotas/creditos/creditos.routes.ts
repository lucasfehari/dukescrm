import { Router } from "express";
import { creditoController } from "../../controladores/creditos/creditos.controller.js";

// @Agent: ASP — Rotas de Créditos de Contrato
// GET  /api/creditos/contrato/:contratoId  → listar créditos do contrato (com saldo)
// POST /api/creditos                        → criar pacote de crédito
// DELETE /api/creditos/:id                 → remover pacote (somente sem uso)

const router = Router();

router.get("/contrato/:contratoId", creditoController.listarPorContrato);
router.post("/", creditoController.criar);
router.delete("/:id", creditoController.deletar);

export default router;
