-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "StatusProva" AS ENUM ('RASCUNHO', 'PUBLICADO', 'ARQUIVADO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TYPE "StatusProva" ADD VALUE IF NOT EXISTS 'PUBLICADO';
ALTER TYPE "StatusProva" ADD VALUE IF NOT EXISTS 'ARQUIVADO';

-- CreateTable
CREATE TABLE IF NOT EXISTS "Prova" (
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
CREATE TABLE IF NOT EXISTS "QuestaoProva" (
    "id" TEXT NOT NULL,
    "enunciado" TEXT NOT NULL,
    "provaId" TEXT NOT NULL,

    CONSTRAINT "QuestaoProva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AlternativaProva" (
    "id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "isCorreta" BOOLEAN NOT NULL DEFAULT false,
    "questaoId" TEXT NOT NULL,

    CONSTRAINT "AlternativaProva_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Prova" ADD CONSTRAINT "Prova_trilhaId_fkey" FOREIGN KEY ("trilhaId") REFERENCES "Trilha"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "QuestaoProva" ADD CONSTRAINT "QuestaoProva_provaId_fkey" FOREIGN KEY ("provaId") REFERENCES "Prova"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "AlternativaProva" ADD CONSTRAINT "AlternativaProva_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "QuestaoProva"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
