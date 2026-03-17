---
trigger: always_on
---

# 🛡️ DukesFreela ERP - CONSTITUIÇÃO DO SISTEMA

## 1. IDENTIDADE E PROPÓSITO
- **Projeto:** DukesERP
- **Versão:** 1.0.0
- **Arquitetura:** Multi-Agent System (MAS)
- **Objetivo:** Criar um sistema de gestão enterprise para criativos, visualmente premium e escalável (SaaS Ready).
- **Idioma:** Português (Brasil)
- **Soberania:** Este arquivo contém as leis supremas do projeto. Nenhum Agent pode violar estas regras.

## 2. ARQUITETURA DE AGENTS
Este projeto opera sob uma estrutura de inteligência multi-agente. A IA deve assumir a persona adequada conforme a tarefa, consultando as definições específicas em `.agents/agents/`, mas **sempre** submetendo-se às regras deste arquivo.

### 2.1. Hierarquia de Decisão
1. **Regras Globais (Este Arquivo):** Soberanas. Segurança, Stack e Integridade de Dados não são negociáveis.
2. **Agent Orquestrador:** Coordena o fluxo entre os agents.
3. **Agents Especializados:** Executam tarefas dentro de seus domínios (Design, Code, Security, Business).

### 2.2. Protocolo de Atuação
- **Consciência de Papel:** Ao iniciar uma tarefa, identifique qual Agent está atuando.
- **Validação Cruzada:** Antes de finalizar uma entrega, verifique se ela viola regras de outros agents.
- **Referência:** As definições completas de persona estão em `.agents/agents/*.md`.

## 3. STACK TECNOLÓGICO (LEI IMUTÁVEL)
- **Frontend:** React + Vite + TypeScript
- **Estilização:** Tailwind CSS + shadcn/ui + `class-variance-authority`
- **Ícones:** Lucide React
- **Animações:** Framer Motion
- **Dados:** TanStack Query + Prisma ORM
- **Backend:** Node.js + Express
- **Banco:** PostgreSQL (Local/Windows)
- **Validação:** Zod (Frontend & Backend)

## 4. REGRAS DE OURO (NÃO NEGOCIÁVEIS)

### 4.1. Integridade de Dados
- **Soft Delete Obrigatório:** Nunca use `DELETE` físico. Use `deletedAt` em todas as tabelas.
- **Vinculação em Cascata:** Cliente → Contrato → Projeto → Financeiro. Nada existe isolado.
- **Auditoria:** Toda ação crítica deve gerar registro na tabela `Logs`.
- **Bloqueio Temporal:** Meses fechados financeiramente são `read-only`.

### 4.2. Segurança
- **Validação:** Zod em todas as entradas de API e Formulários.
- **Proteção:** Prisma para SQL Injection, sanitização para XSS.
- **Auth:** JWT + Refresh Token. Senhas com Argon2/Bcrypt.
- **Segredo:** Nunca commitar `.env` ou chaves hardcoded.

### 4.3. Qualidade de Código
- **Linguagem:** Variáveis e funções em **Português** (ex: `calcularTotal`, `usuarioAtivo`).
- **Tipagem:** TypeScript estrito. Proibido `any`.
- **Estrutura:** Seguir rigorosamente a estrutura de pastas definida na Seção 6.

### 4.4. Experiência Visual
- **Tema:** Dark Mode Premium padrão.
- **Feedback:** Toda ação requer feedback (Toast, Loader, Skeleton).
- **Responsividade:** Mobile-first.
- **Estética:** Minimalista, sofisticado, uso de espaço negativo.

## 5. FLUXO DE TRABALHO DA IA

1. **Receber Task:** Identificar qual Agent deve liderar.
2. **Verificar Restrições:** Consultar este arquivo (`ANTIGRAVITY.md`) para regras globais.
3. **Consultar Persona:** Ler `.agents/agents/[role].md` para tom e foco específico.
4. **Executar:** Gerar código/documento completo.
5. **Auto-Auditoria:** Verificar se violou alguma Regra de Ouro.
6. **Entregar:** Apresentar solução com explicação didática.

## 6. ESTRUTURA DE PASTAS OFICIAL

### Frontend (`/frontend/src`)
/paginas (Rotas principais)
/componentes (UI Shadcn + Customizados)
/agentes (Lógica de estado por domínio)
/servicos (Chamadas API tipadas)
/contextos (Auth, Theme, Toast)
/utilitarios (Helpers, Formatters)
/estilos (Globais, Tailwind Config)
### Backend (`/backend/src`)
/controladores (Requisições HTTP)
/rotas (Definição de endpoints)
/modelos (Schema Prisma)
/servicos (Regras de Negócio Puro)
/middlewares (Auth, Logs, ErrorHandling)
/agentes (Jobs, Cron, Tasks)
/banco (Migrations, Seeds)

## 7. PROIBIÇÕES EXPLÍCITAS
- ❌ Ignorar o sistema de Soft Delete.
- ❌ Criar campos financeiros sem vinculação a projeto.
- ❌ Usar bibliotecas não aprovadas sem consulta ao Agent System Design.
- ❌ Entregar código sem tratamento de erros (try/catch).
- ❌ Quebrar a consistência visual.

## 8. EVOLUÇÃO E MELHORIA CONTÍNUA
- **Agent Empresário:** Deve sugerir melhorias de lucro e retenção a cada sprint.
- **Agent System Design:** Deve revisar a arquitetura a cada 5 funcionalidades novas.
- **Agent UI/UX:** Deve propor refinamentos visuais baseados em tendências modernas.

---
**NOTA FINAL:** Este arquivo é a fonte da verdade. Em caso de conflito entre um Agent e este arquivo, **este arquivo prevalece**.

