# 🛡️ DukesFreela ERP

Bem-vindo ao repositório do **DukesFreela ERP**, um sistema construído sob a premissa de Inteligência Artificial Multi-Agente (*Agent-Driven Architecture*), focado em fornecer uma suíte SaaS corporativa elegante e escalável para estúdios criativos e designers freelancers.

## 🚀 Status: Fase 1 - Fundação
O projeto encontra-se com sua infraestrutura vital configurada. O **Backend** conta com Node.js + Prisma com Segurança via Zod e JWT, enquanto o **Frontend** possui Vite + React empoderado com o novíssimo TailwindCSS V4 e `shadcn/ui + Material-UI`.

---

## 💻 Primeiros Passos (Setup de Desenvolvimento - Windows)

### Pré-requisitos
- Node.js `v20+` / npm `v10+`
- PostgreSQL instalado localmente na porta `5432`

### Instalação

#### 1. Backend
Abra um terminal na raiz do projeto e execute:
```powershell
cd backend
npm install
```
Ajuste as credenciais do seu banco de dados no arquivo `/backend/.env`:
`DATABASE_URL="postgresql://USUARIO:SENHA@localhost:5432/dukesfreeladb?schema=public"`

Com o banco ativo, rode as migrações automáticas:
```powershell
npx prisma migrate dev --name init
```

Estará pronto para ser rodado com:
```powershell
npm run dev
```

#### 2. Frontend
Abra um segundo terminal:
```powershell
cd frontend
npm install
npm run dev
```

*O frontend ficará ativo em `http://localhost:5173`.*

---

## 🏛️ Manifesto e Constituições (AIs e Devs Humanos)
Qualquer desenvolvedor (ou Inteligência Artificial) trabalhando neste repositório **deve** obrigatoriamente seguir a Constituição do Sistema localizada em `ANTIGRAVITY.md`. As personas definidas em `.agents/agents/*` comandam as disciplinas especializadas.

*O Orquestrador (AO) lidera este código.*
