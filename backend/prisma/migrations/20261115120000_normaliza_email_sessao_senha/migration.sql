UPDATE "Usuario" SET "email" = lower(trim("email"));

ALTER TABLE "Usuario" ADD COLUMN "senhaAlteradaEm" TIMESTAMP(3);
