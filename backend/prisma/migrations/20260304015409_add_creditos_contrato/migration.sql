-- AlterTable
ALTER TABLE "projetos" ADD COLUMN     "creditoId" TEXT,
ADD COLUMN     "tipoProjeto" TEXT;

-- CreateTable
CREATE TABLE "creditos_contrato" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "quantidadeTotal" INTEGER NOT NULL,
    "quantidadeUsada" INTEGER NOT NULL DEFAULT 0,
    "valorUnitario" DECIMAL(10,2) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creditos_contrato_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "projetos" ADD CONSTRAINT "projetos_creditoId_fkey" FOREIGN KEY ("creditoId") REFERENCES "creditos_contrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creditos_contrato" ADD CONSTRAINT "creditos_contrato_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
