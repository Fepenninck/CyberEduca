# Integração entrega0911

Base: `origin/main` (`6933672`). Foram integradas, com commits de merge e sem squash, as branches:

- `feature/luis-quizzes-phishing` (`36cd372`)
- `feature/caio-admin` (`7797eed`)
- `feature/thiago-avaliacoes` (`81e6a27`)

## Conflitos e correções

- O schema preserva as entidades e relações das três branches, incluindo quizzes, phishing, consultas, resultados anteriores e tentativas de provas.
- Os módulos NestJS foram registrados juntos. Há somente um conjunto de rotas administrativas de provas registrado: o painel aceita tanto `isCorreta` quanto `correta`, mantém questões dissertativas e passa a validar a publicação.
- As migrações sobrepostas de provas foram conciliadas para não recriar tabelas nem apagar gabaritos. A coluna persistida é `correta`, exposta pelo Prisma como `isCorreta` para compatibilidade. Respostas dissertativas são persistidas e sinalizadas para correção manual; somente questões objetivas recebem correção automática.
- O painel tem cadastro e edição de cenários de phishing com os mesmos campos dos DTOs do Luís. Quizzes têm edição de dados, inclusão de questões e alternativas. Quizzes e cenários podem retornar a rascunho para edição. Arquivar um quiz preserva suas tentativas.
- `/simulacoes/[cenarioId]` permanece para phishing. O simulador por categorias foi preservado em `/simulacoes/treino/[simulacaoId]`, com os links atualizados.
- `/avaliacoes/[provaId]` usa o fluxo de provas e tentativas do Thiago. A experiência anterior com conclusão única permanece em `/avaliacoes/legado/[provaId]`; seus endpoints foram mantidos por compatibilidade. O redirecionamento provisório que colidia com essa rota foi incorporado como arquivo auxiliar, sem uma segunda rota dinâmica.
- Foram incluídos desempenho do aluno, histórico e relatórios administrativos usando as tentativas de quizzes, phishing e provas. A média considera apenas notas de provas. Nenhuma atividade altera automaticamente `ProgressoAula`.
- O build do Next.js passou a verificar erros de TypeScript em vez de ignorá-los.

## Verificações executadas

| Verificação | Resultado |
| --- | --- |
| Backend: `npm run build` | Aprovado |
| Frontend: `npm run build`, incluindo TypeScript | Aprovado |
| Backend: `npm run lint` | Aprovado sem avisos |
| Backend: `npm test -- --runInBand` | 29 testes aprovados |
| Backend: `npm run test:entrega` | 14 testes HTTP/e2e aprovados, em banco temporário |
| Backend: `npm run test:integracao` | 13 testes aprovados, em banco temporário |
| Todas as 21 migrações em banco vazio | Aprovado |
| Atualização de banco com dados anteriores do Caio e do Thiago | Provas, questões e gabaritos preservados; comparação com schema sem divergências |

O cenário anterior do Caio foi montado com suas migrações até `20261107240000`, antes das migrações de defaults que dependiam das colunas de ordem ausentes naquela sequência isolada. A sequência integrada inclui essas colunas antes dos defaults. O cenário do Thiago usa suas migrações originais completas. Os testes usaram exclusivamente uma instância PostgreSQL temporária; o banco existente não foi acessado.

Para reproduzir os testes de entrega, configure `backend/.env.test.local` conforme `.env.test.example`, com `DATABASE_URL` de PostgreSQL local contendo `test` no nome e `JWT_SECRET`. O runner cria um banco separado, aplica as migrações, executa os testes e remove apenas o banco que criou.

## Limites da verificação

- A chamada real ao VirusTotal depende de `VIRUSTOTAL_API_KEY`. Os testes cobrem respostas simuladas, limites, falhas de rede, estatísticas inválidas, persistência e proteção da chave.
- O Next.js informa que a convenção `middleware` está depreciada. A proteção administrativa existente foi preservada e o build termina com sucesso.
- Duas migrações históricas de provas precisaram ser conciliadas por conterem criação duplicada das mesmas estruturas. O caminho de atualização foi verificado com `prisma migrate deploy`; não foi executado `migrate reset` nem alterado banco de produção. `migrate dev` pode apontar diferenças de checksum em ambientes que já aplicaram as versões individuais dessas migrações.
