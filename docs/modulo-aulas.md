# Módulo: aulas e conteúdos

Esta estrutura permite entrar em uma aula, exibir seu conteúdo, navegar na
trilha e salvar a conclusão. O conteúdo começa vazio por escolha: é você quem
vai preencher cada aula.

## Banco de dados

As tabelas estão no arquivo `backend/prisma/schema.prisma`:

| Tabela | Responsabilidade |
| --- | --- |
| `Usuario` | identifica quem estudou |
| `Trilha` | agrupa aulas em uma sequência |
| `Aula` | guarda título, conteúdo Markdown e ordem |
| `ProgressoAula` | registra a conclusão de uma aula por usuário |

O índice único `@@unique([usuarioId, aulaId])` impede dois registros de
conclusão para a mesma pessoa e aula. Por isso o endpoint usa `upsert`: clicar
mais de uma vez continua seguro.

## Conteúdo em Markdown

No campo `conteudo`, use um formato como este quando quiser escrever uma aula:

```md
# Título complementar

Escreva o primeiro parágrafo aqui.

## Outro tópico

![Descrição acessível da imagem](/imagens/minha-imagem.png)

- Item um
- Item dois
```

O frontend ainda precisa de um renderizador de Markdown para transformar esse
texto em HTML. Ao chegar nessa etapa, use uma biblioteca que sanitize o HTML;
nunca use `dangerouslySetInnerHTML` com conteúdo vindo do banco.

## API disponível

`GET /aulas/:id` retorna a aula, o status `concluida`, e os objetos
`anterior` e `proxima`. A navegação considera somente a ordem dentro da mesma
trilha.

`POST /aulas/:id/concluir` cria (ou preserva) o registro de conclusão e retorna
o percentual atualizado da trilha.

Enquanto a autenticação não estiver pronta, a API utiliza um usuário demo.
Troque `USUARIO_DEMO_ID` por `req.user.id` depois de adicionar JWT.

## Tela da aula

`frontend/app/aulas/[slug]/lesson-study.tsx` faz o GET da aula, mostra um
estado de carregamento, apresenta uma mensagem quando o conteúdo estiver vazio
e envia o POST ao concluir. Apesar do nome legado `[slug]`, a rota agora espera
o **id UUID** retornado pela API. Anterior e Próxima vêm da API, por isso a
sequência não é recalculada no navegador.

Copie `frontend/.env.local.example` para `frontend/.env.local`. O frontend
inicia em `http://localhost:3001` e a API em `http://localhost:3000`; assim não
há conflito de portas e o CORS da API já aceita o frontend.

## Criar o banco local

1. Copie `backend/.env.example` para `backend/.env` e coloque sua senha.
2. Crie um banco PostgreSQL chamado `cybereduca`.
3. Na pasta `backend`, execute `npx prisma migrate dev`.
4. Execute `npm run db:seed` para inserir uma trilha e aula vazias.
5. Para inspecionar os dados, execute `npm run db:studio`.

O seed apaga apenas as trilhas e aulas locais antes de recriá-las; use-o só no
ambiente de desenvolvimento.
