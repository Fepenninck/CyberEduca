-- CreateEnum
CREATE TYPE "StatusProva" AS ENUM ('RASCUNHO', 'PUBLICADO', 'ARQUIVADO');

-- CreateTable
CREATE TABLE "Prova" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "trilhaId" TEXT NOT NULL,
    "status" "StatusProva" NOT NULL DEFAULT 'RASCUNHO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prova_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestaoProva" (
    "id" TEXT NOT NULL,
    "enunciado" TEXT NOT NULL,
    "provaId" TEXT NOT NULL,

    CONSTRAINT "QuestaoProva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlternativaProva" (
    "id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "isCorreta" BOOLEAN NOT NULL DEFAULT false,
    "questaoId" TEXT NOT NULL,

    CONSTRAINT "AlternativaProva_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Prova" ADD CONSTRAINT "Prova_trilhaId_fkey" FOREIGN KEY ("trilhaId") REFERENCES "Trilha"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestaoProva" ADD CONSTRAINT "QuestaoProva_provaId_fkey" FOREIGN KEY ("provaId") REFERENCES "Prova"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlternativaProva" ADD CONSTRAINT "AlternativaProva_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "QuestaoProva"("id") ON DELETE CASCADE ON UPDATE CASCADE;
