import { Router } from "express";
import { contratoController } from "../../controladores/contratos/contratos.controller.js";

const router = Router();

router.post("/", contratoController.criar);
router.get("/", contratoController.listar);
router.get("/:id", contratoController.buscarPorId);
router.put("/:id", contratoController.atualizar);
router.delete("/:id", contratoController.deletar);

export default router;
