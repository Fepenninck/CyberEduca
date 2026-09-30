-- CreateEnum
CREATE TYPE "AcaoAuditoria" AS ENUM ('CADASTRO', 'LOGIN', 'LOGIN_FALHOU', 'ATUALIZAR', 'CRIAR', 'EXCLUIR', 'CONCLUIR_AULA');

-- CreateTable
CREATE TABLE "LogAuditoria" (
    "id" TEXT NOT NULL,
    "acao" "AcaoAuditoria" NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT,
    "atorId" TEXT,
    "dadosAnteriores" JSONB,
    "dadosNovos" JSONB,
    "detalhes" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "sucesso" BOOLEAN NOT NULL DEFAULT true,
    "erro" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogAuditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LogAuditoria_atorId_idx" ON "LogAuditoria"("atorId");

-- CreateIndex
CREATE INDEX "LogAuditoria_entidade_entidadeId_idx" ON "LogAuditoria"("entidade", "entidadeId");

-- CreateIndex
CREATE INDEX "LogAuditoria_acao_idx" ON "LogAuditoria"("acao");

-- CreateIndex
CREATE INDEX "LogAuditoria_criadoEm_idx" ON "LogAuditoria"("criadoEm");

-- AddForeignKey
ALTER TABLE "LogAuditoria" ADD CONSTRAINT "LogAuditoria_atorId_fkey" FOREIGN KEY ("atorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
