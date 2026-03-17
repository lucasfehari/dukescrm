import { Router } from "express";
import { authController } from "../../controladores/auth/auth.controller.js";
import { authMiddleware } from "../../middlewares/auth.js";

// @Agent: Senior Programmer (ASP) — Rotas de Autenticação (públicas e protegidas)

const router = Router();

// Rotas públicas (sem autenticação)
router.post("/login", authController.login);
router.post("/registrar", authController.registrar);

// Rota protegida — verifica se o token é válido
router.get("/me", authMiddleware, authController.me);

export default router;
