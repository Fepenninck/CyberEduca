/*
  Warnings:

  - A unique constraint covering the columns `[tokenRecuperacaoHash]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "tokenRecuperacaoExpiraEm" TIMESTAMP(3),
ADD COLUMN     "tokenRecuperacaoHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_tokenRecuperacaoHash_key" ON "Usuario"("tokenRecuperacaoHash");
