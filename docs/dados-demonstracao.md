# Dados de demonstração para a apresentação do TCC

O ambiente de produção utiliza uma população sintética para demonstrar os dashboards com pelo menos **1.000 alunos**, além da conta administrativa. Esses registros são dados de demonstração; não representam usuários reais, adesão à plataforma ou resultados de uma avaliação educacional.

## Contas e atividades

- O nome começa com `[DEMO]` e o e-mail usa `demo.cybereduca.invalid`.
- As contas não recebem senha, Google ID ou tokens. Não há envio de e-mails, chamadas ao VirusTotal ou registro fictício de aceite dos termos.
- Cadastros ocupam uma janela de 180 dias anterior à execução, com dias e horários variados. Atividades acontecem após o cadastro, até o instante da carga; os gráficos agrupam os registros no fuso `America/Sao_Paulo`.
- Há perfis sem atividades, com estudos parciais, reprovados no básico, cursando os níveis seguintes e com os três níveis concluídos.
- Aulas são concluídas em sequência. A prova usa uma questão por aula, armazena as respostas e calcula o total de acertos e a nota; o estudo do próximo nível ocorre depois da aprovação do anterior.
- Quizzes, simulações e exercícios de phishing usam questões e alternativas do catálogo existente. Não são criados relatórios fictícios do VirusTotal.
- O histórico de acesso e as conclusões também são sintéticos, identificados nos detalhes da auditoria com `demonstracao: true` e `origem: tcc-demo-v1`.

## Execução em produção

O script `backend/scripts/seed-demonstracao-producao.cjs` é chamado por `preparar-deploy-render.cjs`, depois das migrações, durante o `postinstall` do backend. Ele usa a conexão que já existe no ambiente do Render e não lê o arquivo `.env` local.

A carga exige o destino de produção já autorizado pelo projeto: `RENDER=true`, ausência de preview de pull request e o endpoint Neon `/neondb` verificado em `renderTarget`. Fora desse destino, encerra sem escrever. A implementação é mantida tanto em `main` quanto em `entrega1611`.

Para conferir o planejamento em um terminal do próprio Render:

```bash
npm run db:demo:producao
```

Para aplicar manualmente nesse mesmo ambiente:

```bash
npm run db:demo:producao -- --apply
```

O total considera os alunos existentes (`USUARIO` e `ALUNO`) e completa somente o que falta para 1.000. Administradores não entram nessa meta. O script preserva contas, conteúdos e históricos existentes.

Os lotes de 25 alunos são transacionais: cadastro e atividades são gravados juntos. Uma trava no PostgreSQL serializa execuções concorrentes. IDs determinísticos e e-mails únicos impedem duplicações; falhas podem ser retomadas. Ao alcançar a meta, novos deploys não geram mais registros nem redistribuem datas existentes. A janela histórica permanece a da primeira carga; novos períodos não são fabricados a cada deploy.

Os logs mostram o planejamento, o avanço por lote e os totais finais, sem credenciais. Depois do deploy, confira os filtros de 7, 30 e 90 dias em `/admin`, os usuários e os resultados. Um deploy enviado ao GitHub, por si só, não comprova que a carga concluiu: essa confirmação depende dos logs do Render e do dashboard publicado.

## Verificação

Na pasta `backend`:

```bash
npm run test:demo
npm run test:demo:banco
npm run lint
```

O primeiro comando verifica cronologia, distribuição em datas, respostas e pré-requisitos. O segundo cria um banco PostgreSQL temporário a partir da conexão local, aplica as migrações, executa cargas simultâneas, confere idempotência, preservação de contas e consultas reais dos dashboards, e descarta o banco temporário. Ele não popula nem altera os dados do banco local da aplicação e exige permissão `CREATEDB`.
