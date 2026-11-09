-- Keep essay answers alongside objective attempts; no existing data is removed.
ALTER TABLE "RespostaProva" ALTER COLUMN "alternativaId" DROP NOT NULL;
ALTER TABLE "RespostaProva" ADD COLUMN "respostaTexto" TEXT;
ALTER TABLE "RespostaProva" ADD COLUMN "avaliacaoManual" BOOLEAN NOT NULL DEFAULT false;

-- Already deployed branch databases may have skipped the reconciliation above.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'AlternativaProva' AND column_name = 'isCorreta') THEN
    ALTER TABLE "AlternativaProva" RENAME COLUMN "isCorreta" TO "correta";
  END IF;
END $$;
ALTER TABLE "Prova" ALTER COLUMN "descricao" SET DEFAULT '';
