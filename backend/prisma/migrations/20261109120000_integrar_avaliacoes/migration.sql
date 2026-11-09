DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'AlternativaProva' AND column_name = 'isCorreta') THEN
    ALTER TABLE "AlternativaProva" RENAME COLUMN "isCorreta" TO "correta";
  END IF;
END $$;
ALTER TABLE "Prova" ALTER COLUMN "descricao" SET DEFAULT '';
