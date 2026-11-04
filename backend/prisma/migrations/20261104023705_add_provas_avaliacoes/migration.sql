-- CreateEnum
CREATE TYPE "StatusProva" AS ENUM ('RASCUNHO', 'PUBLICADA', 'ARQUIVADA');

-- CreateTable
CREATE TABLE "Prova" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL DEFAULT '',
    "trilhaId" TEXT NOT NULL,
    "status" "StatusProva" NOT NULL DEFAULT 'RASCUNHO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prova_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestaoProva" (
    "id" TEXT NOT NULL,
    "provaId" TEXT NOT NULL,
    "enunciado" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "QuestaoProva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlternativaProva" (
    "id" TEXT NOT NULL,
    "questaoId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "correta" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "AlternativaProva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TentativaProva" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "provaId" TEXT NOT NULL,
    "nota" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalQuestoes" INTEGER NOT NULL DEFAULT 0,
    "totalAcertos" INTEGER NOT NULL DEFAULT 0,
    "iniciadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concluidoEm" TIMESTAMP(3),

    CONSTRAINT "TentativaProva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespostaProva" (
    "id" TEXT NOT NULL,
    "tentativaId" TEXT NOT NULL,
    "questaoId" TEXT NOT NULL,
    "alternativaId" TEXT NOT NULL,
    "acertou" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RespostaProva_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Prova_trilhaId_idx" ON "Prova"("trilhaId");

-- CreateIndex
CREATE INDEX "Prova_status_idx" ON "Prova"("status");

-- CreateIndex
CREATE UNIQUE INDEX "QuestaoProva_provaId_ordem_key" ON "QuestaoProva"("provaId", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "AlternativaProva_questaoId_ordem_key" ON "AlternativaProva"("questaoId", "ordem");

-- CreateIndex
CREATE INDEX "TentativaProva_usuarioId_idx" ON "TentativaProva"("usuarioId");

-- CreateIndex
CREATE INDEX "TentativaProva_provaId_idx" ON "TentativaProva"("provaId");

-- CreateIndex
CREATE UNIQUE INDEX "RespostaProva_tentativaId_questaoId_key" ON "RespostaProva"("tentativaId", "questaoId");

-- AddForeignKey
ALTER TABLE "Prova" ADD CONSTRAINT "Prova_trilhaId_fkey" FOREIGN KEY ("trilhaId") REFERENCES "Trilha"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestaoProva" ADD CONSTRAINT "QuestaoProva_provaId_fkey" FOREIGN KEY ("provaId") REFERENCES "Prova"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlternativaProva" ADD CONSTRAINT "AlternativaProva_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "QuestaoProva"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TentativaProva" ADD CONSTRAINT "TentativaProva_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TentativaProva" ADD CONSTRAINT "TentativaProva_provaId_fkey" FOREIGN KEY ("provaId") REFERENCES "Prova"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaProva" ADD CONSTRAINT "RespostaProva_tentativaId_fkey" FOREIGN KEY ("tentativaId") REFERENCES "TentativaProva"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaProva" ADD CONSTRAINT "RespostaProva_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "QuestaoProva"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaProva" ADD CONSTRAINT "RespostaProva_alternativaId_fkey" FOREIGN KEY ("alternativaId") REFERENCES "AlternativaProva"("id") ON DELETE CASCADE ON UPDATE CASCADE;
