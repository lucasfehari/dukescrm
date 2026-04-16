import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorMiddleware } from "./middlewares/erros.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

import rotasAuth from "./rotas/auth/auth.routes.js";
import rotasClientes from "./rotas/clientes/clientes.routes.js";
import rotasContratos from "./rotas/contratos/contratos.routes.js";
import rotasFinanceiro from "./rotas/financeiro/financeiro.routes.js";
import rotasProjetos from "./rotas/projetos/projetos.routes.js";
import rotasCreditos from "./rotas/creditos/creditos.routes.js";
import rotasCatalogo from "./servicos/catalogo/catalogo.routes.js";
import rotasDashboard from "./rotas/dashboard/dashboard.routes.js";
import rotasRelatorios from "./rotas/relatorios/relatorios.routes.js";
import { uploadRoutes } from "./rotas/upload.routes.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Endpoints
// Servir arquivos estáticos (Uploads locais)
app.use("/uploads", express.static(path.resolve(__dirname, "..", "uploads")));

app.use("/api/upload", uploadRoutes);
app.use("/api/auth", rotasAuth);
app.use("/api/clientes", rotasClientes);
app.use("/api/contratos", rotasContratos);
app.use("/api/financeiro", rotasFinanceiro);
app.use("/api/projetos", rotasProjetos);
app.use("/api/creditos", rotasCreditos);         // Pacotes de crédito por contrato
app.use("/api/catalogo", rotasCatalogo);         // Catálogo de Serviços Avulsos
app.use("/api/dashboard", rotasDashboard);       // Dashboard Executivo
app.use("/api/relatorios", rotasRelatorios);     // Relatórios

app.get("/api/health", (req, res) => res.json({ status: "DukesFreela API ONLINE", version: "1.0.0" }));

// Middleware Global de Tratamento de Erros (Zod, Prisma e Exceções)
app.use(errorMiddleware as any);

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
    console.log(`[ORQUESTRADOR] DukesFreela Backend ativo na porta ${PORT}`);
});
