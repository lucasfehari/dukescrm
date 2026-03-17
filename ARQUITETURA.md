# Arquitetura do Sistema DukesFreela ERP

Este documento detalha a arquitetura do projeto DukesFreela ERP, desenhada visando as regras de ouro do `ANTIGRAVITY.md`.

## 1. Visão Geral

O projeto consiste em um monorepo falso (pastas separadas no mesmo repositório lógico) que provê uma SPA feita em React e uma API servida por Node.js + Express. O projeto utiliza o formato **Multi-Agent** não só para seu desenvolvimento (AIs), mas também nos conceitos do backend para lidar com background jobs.

## 2. Camadas do Backend

A estrutura está dividida em `/backend/src`:
- **`/rotas`**: Define os endpoints (REST) mapeando para os controladores. Utiliza wrappers para tratamento automático de erros.
- **`/controladores`**: Recebe o request HTTP, chama a validação (Zod) e repassa os dados puros para a camada de Serviços. Responde ao cliente com o status apropriado.
- **`/servicos`**: Contém as **Regras de Negócio Puro**. Onde residem cálculos, lógicas de soft delete, cascatas lógicas, e disparo de logs de auditoria. Não lida com Req/Res do Express.
- **`/middlewares`**: Funções intermediárias vitais, como `authMiddleware` (valida JWT), `rhMiddleware` (RBAC), e interceptadores globais de erros.
- **`/banco`**: Scripting direto sobre dados, seeds e migrações.
- **`/modelos`**: Wrapper do Prisma Client, tipagens auxiliares.
- **`/agentes`**: Processos independentes/Cron Jobs para validação de bloqueio temporal, notificação de faturas atrasadas, etc.

## 3. Fluxo de Dados

1. **Client** faz request `/api/projetos`
2. **Rota** → **Middleware** (Auth -> Validação Zod)
3. **Controlador** extrai payload validado
4. **Serviço** processa negócio, aciona Prisma Client e cria o `LogAuditoria`
5. **Controlador** responde com o dado atualizado ou 400/500

## 4. Regras Chave da Arquitetura de Dados (Prisma)
- **Soft Delete**: Usamos deleção lógica com campos `deletadoEm`. A aplicação, no Prisma Middleware ou nos Serviços, sempre adicionará a cláusula `deletadoEm: null` para buscas normais.
- **Auditoria Universal**: Toda mutação (`CREATE`, `UPDATE`, "Soft DELETE") invoca a criação de um `LogAuditoria`.
- **Bloqueio Temporal**: O atributo `mesReferencia` no `Financeiro` restringe escritas quando um mês é flagrado como "Fechado" via Service / Database. (Este estado pode viver em tabela de configurações futuramente).
