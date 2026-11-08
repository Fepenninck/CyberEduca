CREATE TABLE "Simulacao" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Simulacao_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuestaoSimulacao" (
    "id" TEXT NOT NULL,
    "enunciado" TEXT NOT NULL,
    "simulacaoId" TEXT NOT NULL,

    CONSTRAINT "QuestaoSimulacao_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AlternativaSimulacao" (
    "id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "isCorreta" BOOLEAN NOT NULL DEFAULT false,
    "questaoId" TEXT NOT NULL,

    CONSTRAINT "AlternativaSimulacao_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "QuestaoSimulacao"
ADD CONSTRAINT "QuestaoSimulacao_simulacaoId_fkey"
FOREIGN KEY ("simulacaoId") REFERENCES "Simulacao"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AlternativaSimulacao"
ADD CONSTRAINT "AlternativaSimulacao_questaoId_fkey"
FOREIGN KEY ("questaoId") REFERENCES "QuestaoSimulacao"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
