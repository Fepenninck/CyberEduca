-- Configuracao unica do administrador oficial. A senha e armazenada somente como hash.
-- Preserva as demais contas e seus dados, removendo apenas a permissao administrativa.
BEGIN;
LOCK TABLE "Usuario" IN SHARE ROW EXCLUSIVE MODE;
UPDATE "Usuario" SET "papel" = 'USUARIO', "atualizadoEm" = CURRENT_TIMESTAMP
WHERE "papel" = 'ADMIN' AND "email" <> 'cybereduca.oficial@gmail.com';

INSERT INTO "Usuario" ("id", "nome", "email", "senhaHash", "papel", "criadoEm", "atualizadoEm", "senhaAlteradaEm")
VALUES ('19a89772-9641-431c-a22f-61ccb113f588', 'CyberEduca Oficial', 'cybereduca.oficial@gmail.com', '$2b$12$hkd9bIZLO2rB7mwo4j3gs.CGaXS1p.S8rjToz/Pg4e8FMPDnDY6by', 'ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("email") DO UPDATE SET
  "papel" = 'ADMIN',
  "senhaHash" = EXCLUDED."senhaHash",
  "senhaAlteradaEm" = CURRENT_TIMESTAMP,
  "atualizadoEm" = CURRENT_TIMESTAMP,
  "tokenRecuperacaoHash" = NULL,
  "tokenRecuperacaoExpiraEm" = NULL,
  "tokenLoginHash" = NULL,
  "tokenLoginExpiraEm" = NULL;

-- A unicidade de email existente garante no maximo uma conta administradora.
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_admin_oficial_check"
CHECK ("papel" <> 'ADMIN' OR "email" = 'cybereduca.oficial@gmail.com');
COMMIT;
