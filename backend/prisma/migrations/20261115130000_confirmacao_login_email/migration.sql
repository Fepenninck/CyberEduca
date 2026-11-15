ALTER TABLE "Usuario" ADD COLUMN "tokenLoginExpiraEm" TIMESTAMP(3),
ADD COLUMN "tokenLoginHash" TEXT;

CREATE UNIQUE INDEX "Usuario_tokenLoginHash_key" ON "Usuario"("tokenLoginHash");
