import { Router } from "express";
import { ServicoCatalogoService } from "./catalogo.service.js";
import { servicoCatalogoCreateSchema, servicoCatalogoUpdateSchema } from "../../modelos/servicoCatalogo.schema.js";

const router = Router();

router.post("/", async (req, res) => {
    try {
        const dadosValidados = servicoCatalogoCreateSchema.parse(req.body);
        const servico = await ServicoCatalogoService.criar(dadosValidados);
        res.status(201).json(servico);
    } catch (e: any) {
        res.status(400).json({ erro: e.message || "Erro de validação" });
    }
});

router.get("/", async (req, res) => {
    try {
        const servicos = await ServicoCatalogoService.listarTodos();
        res.json(servicos);
    } catch (e: any) {
        res.status(500).json({ erro: e.message });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const dadosValidados = servicoCatalogoUpdateSchema.parse(req.body);
        const servicoAtualizado = await ServicoCatalogoService.atualizar(req.params.id, dadosValidados);
        res.json(servicoAtualizado);
    } catch (e: any) {
        res.status(400).json({ erro: e.message || "Erro de validação" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        await ServicoCatalogoService.deletar(req.params.id);
        res.sendStatus(204);
    } catch (e: any) {
        res.status(500).json({ erro: e.message });
    }
});

export default router;
