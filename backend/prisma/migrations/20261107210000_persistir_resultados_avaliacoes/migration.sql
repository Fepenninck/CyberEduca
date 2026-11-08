CREATE TABLE "ResultadoSimulacao" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "simulacaoId" TEXT NOT NULL,
    "acertos" INTEGER NOT NULL,
    "totalQuestoes" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResultadoSimulacao_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ResultadoProva" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "provaId" TEXT NOT NULL,
    "acertos" INTEGER NOT NULL,
    "totalQuestoes" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResultadoProva_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ResultadoSimulacao_usuarioId_simulacaoId_key"
ON "ResultadoSimulacao"("usuarioId", "simulacaoId");

CREATE UNIQUE INDEX "ResultadoProva_usuarioId_provaId_key"
ON "ResultadoProva"("usuarioId", "provaId");

ALTER TABLE "ResultadoSimulacao"
ADD CONSTRAINT "ResultadoSimulacao_usuarioId_fkey"
FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ResultadoSimulacao"
ADD CONSTRAINT "ResultadoSimulacao_simulacaoId_fkey"
FOREIGN KEY ("simulacaoId") REFERENCES "Simulacao"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ResultadoProva"
ADD CONSTRAINT "ResultadoProva_usuarioId_fkey"
FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ResultadoProva"
ADD CONSTRAINT "ResultadoProva_provaId_fkey"
FOREIGN KEY ("provaId") REFERENCES "Prova"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
