# Provas ao final dos níveis

O aluno conclui todas as aulas do básico, intermediário ou avançado e faz a prova na própria área de Trilhas. Aprovação exige ao menos 60% de acertos, sem aprovar por arredondamento da nota exibida. A aprovação concede a insígnia e libera o próximo nível. Os controles são aplicados no servidor, inclusive ao abrir e concluir aulas por URL direta.

Após reprovação, a próxima prova pode ser iniciada exatamente 24 horas depois da conclusão da tentativa anterior. Atualizar a página não troca a prova; a próxima tentativa troca todas as questões, mantendo uma questão de cada aula do nível. A interface informa a data e hora de liberação no fuso de São Paulo.

## Conteúdo e armazenamento

- Catálogo conferido: 89 aulas ativas; 25 básicas, 29 intermediárias, 35 avançadas.
- Banco: 178 questões, duas situações distintas para cada aula. Fontes: checkpoints das aulas, revisões editoriais existentes e variantes em `backend/prisma/content/certification-variants.ts`.
- As questões incluem a referência à aula na explicação. A marca interna de associação é removida no feedback da prova.
- Reutiliza `Prova`, `QuestaoProva`, `AlternativaProva`, `TentativaProva`, `RespostaProva` e `ResultadoProva`. Sem migrações ou exclusão de histórico.
- As três provas novas usam os IDs definidos em `backend/src/certificacoes/certification-progress.ts`. As avaliações antigas permanecem no histórico e no administrativo; os endereços antigos do aluno redirecionam para Trilhas.
- Aulas já concluídas continuam concluídas. A insígnia de nível agora depende da aprovação na nova prova abrangente, e não apenas de concluir as aulas. A conquista de Simulações permanece independente.

## Segurança

A sessão da prova é assinada com segredo derivado e exclusivo desta finalidade, vincula aluno, nível, última tentativa e a revisão das questões. O gabarito nunca é transmitido antes do envio. A correção verifica pertencimento das alternativas, duplicidade, quantidade exata de respostas, pré-requisitos e espera de 24 horas. Um lock transacional por aluno impede envios concorrentes. As rotas genéricas antigas não podem corrigir nem enviar estas provas.

## Operação

Na pasta `backend`:

```powershell
npm run db:prepare:certificacoes             # Apenas confere e mostra o planejamento
npm run db:prepare:certificacoes -- --apply  # Importação aditiva e idempotente
npm run db:verify:certificacoes              # Verificação com rollback dos dados temporários
npm test -- --runInBand
```

O preparador confere cobertura exata de todas as aulas antes de escrever. Alterações futuras no catálogo exigem questões e variantes para as novas aulas; provas com cobertura insuficiente permanecem indisponíveis em vez de omitir conteúdo.
