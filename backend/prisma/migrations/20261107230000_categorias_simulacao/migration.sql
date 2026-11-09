CREATE TABLE "CategoriaSimulacao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CategoriaSimulacao_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CategoriaSimulacao_nome_key" ON "CategoriaSimulacao"("nome");

INSERT INTO "CategoriaSimulacao" ("id", "nome", "descricao")
VALUES ('00000000-0000-4000-8000-000000000001', 'Geral', 'Categoria inicial para simulações existentes.');

ALTER TABLE "Simulacao" ADD COLUMN "categoriaId" TEXT;
UPDATE "Simulacao" SET "categoriaId" = '00000000-0000-4000-8000-000000000001' WHERE "categoriaId" IS NULL;
ALTER TABLE "Simulacao" ALTER COLUMN "categoriaId" SET NOT NULL;

ALTER TABLE "Simulacao"
ADD CONSTRAINT "Simulacao_categoriaId_fkey"
FOREIGN KEY ("categoriaId") REFERENCES "CategoriaSimulacao"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
