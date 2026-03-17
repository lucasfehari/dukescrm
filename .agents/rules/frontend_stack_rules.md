---
trigger: always_on
---

# Regras de Stack e Visual Frontend

## 1. Objetivo
Garantir que a interface do ERP Antigravity seja visualmente superior, responsiva e performática.

## 2. Bibliotecas Obrigatórias
- **Classes:** `clsx` + `tailwind-merge`
- **Variantes:** `class-variance-authority` (CVA)
- **Animações:** `framer-motion`
- **Gráficos:** `recharts` ou `nivo`
- **Formulários:** `react-hook-form` + `zod`
- **Datas:** `date-fns` + `react-day-picker`
- **Notificações:** `sonner`
- **Modais/Drawers:** `vaul` + `radix-ui-dialog`
- **Tabelas:** `tanstack-table`
- **URL State:** `nuqs`

## 3. Design System
- **Tema:** Dark Mode nativo como padrão
- **Cores:** Base `zinc`/`slate` com acentos `indigo` e `emerald`
- **Tipografia:** `Inter` ou `Geist Sans`
- **Bordas:** Subtis (`border-white/10`)
- **Sombras:** Coloridas e suaves (`shadow-indigo-500/20`)

## 4. Performance
- Lazy Loading em todas as rotas
- Code splitting por feature
- Monitorar tamanho do bundle

## 5. Acessibilidade
- Componentes focáveis via teclado
- Contraste WCAG AA
- ARIA labels em ícones