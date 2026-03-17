import { Router } from "express";
import { projetoController } from "../../controladores/projetos/projetos.controller.js";
import { comentariosController } from "../../controladores/projetos/comentarios.controller.js";

// @Agent: Senior Programmer (ASP) — Rotas do módulo Projetos

const router = Router();

router.get("/resumo", projetoController.resumo);
router.post("/", projetoController.criar);
router.get("/", projetoController.listar);
router.get("/:id", projetoController.buscarPorId);
router.patch("/:id", projetoController.atualizar); // Permitir patch parcial (como descrição)
router.patch("/:id/status", projetoController.moverStatus); // Para o Kanban
router.delete("/:id", projetoController.deletar);

// Comments
router.post("/:id/comentarios", comentariosController.adicionar);
router.get("/:id/comentarios", comentariosController.listar);

export default router;
