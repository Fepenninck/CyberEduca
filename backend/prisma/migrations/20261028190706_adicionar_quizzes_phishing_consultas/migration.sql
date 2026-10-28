-- CreateEnum
CREATE TYPE "StatusAtividade" AS ENUM ('RASCUNHO', 'PUBLICADO', 'ARQUIVADO');

-- CreateEnum
CREATE TYPE "TipoCenarioPhishing" AS ENUM ('EMAIL', 'SMS', 'SITE', 'REDE_SOCIAL');

-- CreateEnum
CREATE TYPE "ResultadoConsultaSeguranca" AS ENUM ('SEM_DETECCOES', 'SUSPEITO', 'MALICIOSO', 'SEM_DADOS');

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "aulaId" TEXT NOT NULL,
    "status" "StatusAtividade" NOT NULL DEFAULT 'RASCUNHO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestaoQuiz" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "enunciado" TEXT NOT NULL,
    "explicacao" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "QuestaoQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlternativaQuiz" (
    "id" TEXT NOT NULL,
    "questaoId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "correta" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "AlternativaQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TentativaQuiz" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "totalQuestoes" INTEGER NOT NULL,
    "totalAcertos" INTEGER NOT NULL,
    "concluidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TentativaQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespostaQuiz" (
    "id" TEXT NOT NULL,
    "tentativaId" TEXT NOT NULL,
    "questaoId" TEXT NOT NULL,
    "alternativaId" TEXT NOT NULL,
    "acertou" BOOLEAN NOT NULL,

    CONSTRAINT "RespostaQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CenarioPhishing" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "conteudoMensagem" TEXT NOT NULL,
    "tipo" "TipoCenarioPhishing" NOT NULL,
    "ehPhishing" BOOLEAN NOT NULL,
    "explicacao" TEXT NOT NULL,
    "aulaId" TEXT NOT NULL,
    "status" "StatusAtividade" NOT NULL DEFAULT 'RASCUNHO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CenarioPhishing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TentativaPhishing" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "cenarioId" TEXT NOT NULL,
    "respostaEhPhishing" BOOLEAN NOT NULL,
    "acertou" BOOLEAN NOT NULL,
    "concluidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TentativaPhishing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultaSeguranca" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "dominio" TEXT NOT NULL,
    "provedor" TEXT NOT NULL DEFAULT 'VIRUSTOTAL',
    "resultado" "ResultadoConsultaSeguranca" NOT NULL,
    "consultadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsultaSeguranca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Quiz_aulaId_status_idx" ON "Quiz"("aulaId", "status");

-- CreateIndex
CREATE INDEX "Quiz_status_idx" ON "Quiz"("status");

-- CreateIndex
CREATE UNIQUE INDEX "QuestaoQuiz_quizId_ordem_key" ON "QuestaoQuiz"("quizId", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "AlternativaQuiz_questaoId_ordem_key" ON "AlternativaQuiz"("questaoId", "ordem");

-- CreateIndex
CREATE INDEX "TentativaQuiz_usuarioId_concluidoEm_idx" ON "TentativaQuiz"("usuarioId", "concluidoEm");

-- CreateIndex
CREATE INDEX "TentativaQuiz_quizId_idx" ON "TentativaQuiz"("quizId");

-- CreateIndex
CREATE INDEX "RespostaQuiz_questaoId_idx" ON "RespostaQuiz"("questaoId");

-- CreateIndex
CREATE INDEX "RespostaQuiz_alternativaId_idx" ON "RespostaQuiz"("alternativaId");

-- CreateIndex
CREATE UNIQUE INDEX "RespostaQuiz_tentativaId_questaoId_key" ON "RespostaQuiz"("tentativaId", "questaoId");

-- CreateIndex
CREATE INDEX "CenarioPhishing_aulaId_status_idx" ON "CenarioPhishing"("aulaId", "status");

-- CreateIndex
CREATE INDEX "CenarioPhishing_status_idx" ON "CenarioPhishing"("status");

-- CreateIndex
CREATE INDEX "TentativaPhishing_usuarioId_concluidoEm_idx" ON "TentativaPhishing"("usuarioId", "concluidoEm");

-- CreateIndex
CREATE INDEX "TentativaPhishing_cenarioId_idx" ON "TentativaPhishing"("cenarioId");

-- CreateIndex
CREATE INDEX "ConsultaSeguranca_usuarioId_consultadoEm_idx" ON "ConsultaSeguranca"("usuarioId", "consultadoEm");

-- CreateIndex
CREATE INDEX "ConsultaSeguranca_dominio_idx" ON "ConsultaSeguranca"("dominio");

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "Aula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestaoQuiz" ADD CONSTRAINT "QuestaoQuiz_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlternativaQuiz" ADD CONSTRAINT "AlternativaQuiz_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "QuestaoQuiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TentativaQuiz" ADD CONSTRAINT "TentativaQuiz_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TentativaQuiz" ADD CONSTRAINT "TentativaQuiz_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaQuiz" ADD CONSTRAINT "RespostaQuiz_tentativaId_fkey" FOREIGN KEY ("tentativaId") REFERENCES "TentativaQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaQuiz" ADD CONSTRAINT "RespostaQuiz_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "QuestaoQuiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaQuiz" ADD CONSTRAINT "RespostaQuiz_alternativaId_fkey" FOREIGN KEY ("alternativaId") REFERENCES "AlternativaQuiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CenarioPhishing" ADD CONSTRAINT "CenarioPhishing_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "Aula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TentativaPhishing" ADD CONSTRAINT "TentativaPhishing_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TentativaPhishing" ADD CONSTRAINT "TentativaPhishing_cenarioId_fkey" FOREIGN KEY ("cenarioId") REFERENCES "CenarioPhishing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultaSeguranca" ADD CONSTRAINT "ConsultaSeguranca_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
