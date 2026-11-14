DROP INDEX IF EXISTS "ResultadoSimulacao_usuarioId_simulacaoId_key";
CREATE INDEX "ResultadoSimulacao_usuarioId_simulacaoId_criadoEm_idx"
ON "ResultadoSimulacao"("usuarioId", "simulacaoId", "criadoEm");
