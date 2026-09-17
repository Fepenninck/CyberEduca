-- CreateEnum
CREATE TYPE "NivelTrilha" AS ENUM ('BASICO', 'INTERMEDIARIO', 'AVANCADO');

-- AlterTable
ALTER TABLE "Trilha" ADD COLUMN     "bloqueada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nivel" "NivelTrilha" NOT NULL DEFAULT 'BASICO';
