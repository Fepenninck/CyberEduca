-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "StatusProva" AS ENUM ('RASCUNHO', 'PUBLICADA', 'ARQUIVADA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TYPE "StatusProva" ADD VALUE IF NOT EXISTS 'PUBLICADA';
ALTER TYPE "StatusProva" ADD VALUE IF NOT EXISTS 'ARQUIVADA';

-- CreateTable
CREATE TABLE IF NOT EXISTS "Prova" (
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
CREATE TABLE IF NOT EXISTS "QuestaoProva" (
    "id" TEXT NOT NULL,
    "provaId" TEXT NOT NULL,
    "enunciado" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "QuestaoProva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AlternativaProva" (
    "id" TEXT NOT NULL,
    "questaoId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "correta" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "AlternativaProva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "TentativaProva" (
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
CREATE TABLE IF NOT EXISTS "RespostaProva" (
    "id" TEXT NOT NULL,
    "tentativaId" TEXT NOT NULL,
    "questaoId" TEXT NOT NULL,
    "alternativaId" TEXT NOT NULL,
    "acertou" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RespostaProva_pkey" PRIMARY KEY ("id")
);

-- Reconcile the earlier admin tables without discarding any data.
ALTER TABLE "QuestaoProva" ADD COLUMN IF NOT EXISTS "ordem" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AlternativaProva" ADD COLUMN IF NOT EXISTS "ordem" INTEGER NOT NULL DEFAULT 0;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'AlternativaProva' AND column_name = 'isCorreta') THEN
    ALTER TABLE "AlternativaProva" RENAME COLUMN "isCorreta" TO "correta";
  END IF;
END $$;
-- Legacy questions had no order. Assign a stable order only in groups with duplicates.
WITH ranked AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "provaId" ORDER BY "ordem", "id") AS position
  FROM "QuestaoProva" WHERE "provaId" IN (SELECT "provaId" FROM "QuestaoProva" GROUP BY "provaId", "ordem" HAVING count(*) > 1)
) UPDATE "QuestaoProva" q SET "ordem" = ranked.position FROM ranked WHERE q."id" = ranked."id";
WITH ranked AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "questaoId" ORDER BY "ordem", "id") AS position
  FROM "AlternativaProva" WHERE "questaoId" IN (SELECT "questaoId" FROM "AlternativaProva" GROUP BY "questaoId", "ordem" HAVING count(*) > 1)
) UPDATE "AlternativaProva" a SET "ordem" = ranked.position FROM ranked WHERE a."id" = ranked."id";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Prova_trilhaId_idx" ON "Prova"("trilhaId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Prova_status_idx" ON "Prova"("status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "QuestaoProva_provaId_ordem_key" ON "QuestaoProva"("provaId", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AlternativaProva_questaoId_ordem_key" ON "AlternativaProva"("questaoId", "ordem");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TentativaProva_usuarioId_idx" ON "TentativaProva"("usuarioId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TentativaProva_provaId_idx" ON "TentativaProva"("provaId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "RespostaProva_tentativaId_questaoId_key" ON "RespostaProva"("tentativaId", "questaoId");

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
