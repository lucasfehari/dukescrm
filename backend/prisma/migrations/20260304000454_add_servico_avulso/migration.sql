-- DropForeignKey
ALTER TABLE "projetos" DROP CONSTRAINT "projetos_contratoId_fkey";

-- AlterTable
ALTER TABLE "projetos" ADD COLUMN     "avulso" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "clienteId" TEXT,
ADD COLUMN     "valorAvulso" DECIMAL(10,2),
ALTER COLUMN "contratoId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "projetos" ADD CONSTRAINT "projetos_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projetos" ADD CONSTRAINT "projetos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
