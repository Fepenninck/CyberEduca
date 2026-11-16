# API do CyberEduca+

Backend em NestJS, com Prisma e PostgreSQL. Fornece autenticação, trilhas, aulas, avaliações, simulações, conquistas e administração da plataforma.

## Executar localmente

Requisitos: Node.js, npm e PostgreSQL.

Na pasta backend:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

Antes da primeira execução, crie .env a partir de .env.example e configure DATABASE_URL e JWT_SECRET. O banco indicado deve existir antes da aplicação das migrações. As variáveis de Google, envio de e-mail e VirusTotal habilitam as respectivas integrações; consulte .env.example.

A API usa a porta 3002 por padrão, configurável por PORT. O frontend local acessa a API pelo proxy /api, com BACKEND_URL apontando para o backend.

## Verificação

```bash
npm test -- --runInBand
npm run lint
npm run build
```

Os testes de integração usam um banco separado. Configure .env.test.local conforme .env.test.example e execute npm run test:integracao. O executor exige PostgreSQL local e cria um banco temporário para os testes.

## Banco e publicação

npm run deploy aplica as migrações pendentes. Migrações já aplicadas devem permanecer intactas; novas alterações recebem uma nova migração.

Os comandos db:seed importam conteúdos específicos. O seed geral também atualiza textos e estrutura das trilhas; não deve ser usado como substituto das migrações em um banco com conteúdo editado.

A autenticação usa cookie de sessão HttpOnly. O acesso administrativo é validado no backend. Senhas e credenciais de integração não devem ser incluídas no repositório.

Consulte o [README principal](../README.md) para a visão geral, integrantes e execução do frontend.
