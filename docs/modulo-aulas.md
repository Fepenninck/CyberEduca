# Módulo de aulas e conteúdos

O módulo de aprendizagem oferece trilhas nos níveis básico, intermediário e avançado, aulas com conteúdo em Markdown, navegação sequencial e persistência do progresso. Os conteúdos são mantidos pelo administrador; o catálogo versionado também inclui materiais de aprendizagem.

## Implementação

- Backend: `backend/src/aprendizagem/aprendizagem.controller.ts` e `aprendizagem.service.ts`.
- Frontend: `frontend/app/aulas/`, com renderização por React Markdown.
- Persistência: modelos `Usuario`, `Trilha`, `Aula` e `ProgressoAula` em `backend/prisma/schema.prisma`.

O índice único de usuário e aula impede registros duplicados de progresso. A conclusão utiliza `upsert` e registra a operação na auditoria.

## API e autenticação

As rotas exigem sessão válida, verificada por `JwtAuthGuard`; a identidade vem de `req.user.id`.

| Operação no backend | Resultado |
|---|---|
| `GET /trilhas` | Trilhas e progresso do aluno autenticado |
| `GET /trilhas/:id` | Detalhes da trilha e suas aulas |
| `GET /aulas/:id` | Conteúdo, situação de conclusão e aulas anterior e próxima |
| `POST /aulas/:id/concluir` | Conclusão persistida e percentual atualizado da trilha |
| `GET /progresso` | Progresso geral do aluno |
| `POST /trilhas` e `PATCH /trilhas/:id` | Criação e edição de trilhas, restritas à administração |
| `POST /aulas` e `PATCH /aulas/:id` | Criação e edição de aulas, restritas à administração |

No navegador, essas chamadas recebem o prefixo `/api`, encaminhado pelo proxy do Next.js. O identificador de aula é o ID retornado pela API, inclusive nas páginas cujo segmento se chama `[slug]`.

O servidor verifica o desbloqueio ao consultar ou concluir uma aula. A navegação anterior/próxima considera a ordem dentro da mesma trilha. Concluir aulas atualiza o progresso; a insígnia do nível e a liberação do nível seguinte dependem também da aprovação na [prova por nível](./certificacoes-niveis.md), com pelo menos 60% de acertos.

## Conteúdo e execução local

O campo `conteudo` armazena Markdown, renderizado na interface com React Markdown. A apresentação pode incluir mídias conforme o conteúdo da aula. A gestão dos materiais fica na área administrativa.

Siga o [README principal](../README.md#executar-localmente) para configurar o ambiente: frontend na porta 3001 e API na porta 3002 por padrão. Aplique as migrações com `npx prisma migrate deploy`, na pasta `backend`. Seeds são ferramentas de importação e manutenção que podem atualizar conteúdos; consulte o [README do backend](../backend/README.md) antes de utilizá-los em um banco existente.
