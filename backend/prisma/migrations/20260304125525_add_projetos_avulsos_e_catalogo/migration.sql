-- CreateEnum
CREATE TYPE "StatusServico" AS ENUM ('ATIVO', 'INATIVO');

-- AlterTable
ALTER TABLE "projetos" ADD COLUMN     "servicos" JSONB;

-- CreateTable
CREATE TABLE "servicos_catalogo" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "valorPadrao" DECIMAL(10,2) NOT NULL,
    "status" "StatusServico" NOT NULL DEFAULT 'ATIVO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicos_catalogo_pkey" PRIMARY KEY ("id")
);
