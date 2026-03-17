import { Router } from "express";
import { clienteController } from "../../controladores/clientes/clientes.controller.js";
import { authMiddleware } from "../../middlewares/auth.js";

const router = Router();

// Todas as rotas de clientes requerem autenticação
router.use(authMiddleware);

router.post("/", clienteController.criar);
router.get("/", clienteController.listar);
router.put("/:id", clienteController.atualizar);
router.delete("/:id", clienteController.deletar);

export default router;
