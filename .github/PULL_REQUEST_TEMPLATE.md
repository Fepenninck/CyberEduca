## 1. Identificação
- **Aluno(s):**
  - Luís Felipe Penninck dos Santos - 11231101140
  - Caio Miranda do Nascimento - 1123110183
  - Thiago dos Santos Soares - 11221101451
- **Projeto (PFC):** CyberEduca+
- **Branch:** feat/testes-automatizados

## 2. Resumo da entrega
Foram implementados testes unitários e de integração para as principais regras de negócio do backend (NestJS) do CyberEduca+. Os testes unitários cobrem três classes: AprendizagemService (conclusão de aulas, progresso, detalhamento de trilhas e cálculo percentual), AuthService (login e cadastro) e UsuariosService (busca e atualização de usuários). Os testes de integração cobrem persistência em banco PostgreSQL de teste, o fluxo completo API → Controller → Service → Banco, o endpoint de login e o retorno de erro 404 ao detalhar uma trilha inexistente.

## 3. Cenários de testes unitários implementados
| # | Classe testada | Método / regra | Cenário | Tipo | Arquivo de teste | Método de teste |
|---|----------------|----------------|---------|------|------------------|-----------------|
| 1 | AprendizagemService | concluirAula() | Conclusão de uma aula válida registra o progresso e a auditoria | Feliz | aprendizagem.service.spec.ts | deve concluir uma aula válida |
| 2 | AprendizagemService | concluirAula() | Tentativa de concluir uma aula inexistente | Violação | aprendizagem.service.spec.ts | deve rejeitar uma aula inexistente |
| 3 | AprendizagemService | progressoGeral() | Usuário sem aulas concluídas retorna 0% | Limite | aprendizagem.service.spec.ts | deve retornar 0% quando nenhuma aula foi concluída |
| 4 | AprendizagemService | progressoGeral() | Duas de cinco aulas concluídas retornam 40% | Feliz | aprendizagem.service.spec.ts | deve calcular 40% quando 2 de 5 aulas foram concluídas |
| 5 | AuthService | login() | Credenciais válidas retornam o token JWT assinado | Feliz | auth.service.spec.ts | faz login válido e assina o token |
| 6 | AuthService | register() | Cadastro com e-mail já existente é rejeitado | Violação | auth.service.spec.ts | rejeita cadastro quando o e-mail já existe |
| 7 | AuthService | login() | Conta criada pelo Google, sem senha cadastrada, não pode fazer login com senha | Limite | auth.service.spec.ts | rejeita login de conta Google sem senha cadastrada |
| 8 | AprendizagemService | detalharTrilha() | Trilha existente e liberada retorna seus detalhes e o progresso de cada aula | Feliz | aprendizagem-trilhas.service.spec.ts | deve retornar os detalhes de uma trilha existente e liberada |
| 9 | AprendizagemService | detalharTrilha() | Tentativa de detalhar uma trilha inexistente | Violação | aprendizagem-trilhas.service.spec.ts | deve lançar NotFoundException ao detalhar uma trilha inexistente |
| 10 | AprendizagemService | detalharTrilha() | Trilha existente sem nenhuma aula retorna 0% e lista vazia | Limite | aprendizagem-trilhas.service.spec.ts | deve retornar 0% e nenhuma aula quando a trilha existe mas não tem aulas |
| 11 | AprendizagemService | calcularPercentual() | Percentual de progresso em 6 combinações (0/0, 0/4, 1/4, 1/3, 2/3, 4/4), incluindo arredondamento — teste parametrizado (it.each) | Limite | aprendizagem-trilhas.service.spec.ts | deve calcular o percentual com %i aulas e %i concluídas = %i% |
| 12 | UsuariosService | buscarPorId() | Usuário existente retorna seus dados sem expor a senha | Feliz | usuarios.service.spec.ts | deve retornar os dados públicos de um usuário existente |
| 13 | UsuariosService | buscarPorId() | Tentativa de buscar um usuário inexistente | Violação | usuarios.service.spec.ts | deve lançar NotFoundException ao buscar um usuário inexistente |
| 14 | UsuariosService | atualizar() | Atualização sem enviar senha não altera a senha | Limite | usuarios.service.spec.ts | não deve alterar a senha ao atualizar um usuário sem enviar senha |

Tipo: Feliz | Violação | Limite
**Total de cenários unitários:** 14

## 4. Cenários de testes de integração implementados
| # | Camadas envolvidas | Cenário | Arquivo de teste | Método de teste | Recurso usado |
|---|--------------------|---------|------------------|-----------------|---------------|
| 1 | Prisma + Banco | Salvar e recuperar um registro de progresso | progresso.e2e-spec.ts | deve salvar e recuperar o progresso no banco de teste | Prisma + PostgreSQL de teste |
| 2 | API + Controller + Service + Banco | POST /aulas/:id/concluir retorna 201 com o corpo esperado e persiste o progresso e a auditoria | progresso.e2e-spec.ts | deve concluir uma aula pelo fluxo API, Controller, Service e Banco | Supertest + Prisma + PostgreSQL de teste |
| 3 | API + Controller + Service | POST /auth/login retorna 200 com a mensagem de sucesso e o cookie de autenticação | auth.e2e-spec.ts | responde com sucesso ao autenticar pelo endpoint HTTP | Supertest + Nest Application (Prisma mockado) |
| 4 | API + Controller + Service + Banco | GET /trilhas/:id com trilha inexistente retorna 404 com o corpo de erro esperado | aprendizagem.e2e-spec.ts | deve retornar 404 ao detalhar uma trilha inexistente pela API | Supertest + Prisma + PostgreSQL de teste |

**Total de cenários de integração:** 4

## 5. Arquivos de teste criados ou alterados
| Arquivo (caminho completo) | Criado / Alterado | Qtd. de testes |
|----------------------------|-------------------|----------------|
| backend/src/aprendizagem/aprendizagem.service.spec.ts | Criado | 4 |
| backend/src/auth/auth.service.spec.ts | Criado | 3 |
| backend/src/aprendizagem/aprendizagem-trilhas.service.spec.ts | Criado | 9 (3 + 6 casos do teste parametrizado) |
| backend/src/usuarios/usuarios.service.spec.ts | Criado | 3 |
| backend/test/progresso.e2e-spec.ts | Criado | 2 |
| backend/test/auth.e2e-spec.ts | Criado | 1 |
| backend/test/aprendizagem.e2e-spec.ts | Criado | 1 |

**Total de arquivos de teste:** 7  |  **Total de testes:** 23

## 6. Como executar os testes
```
cd backend
npm ci
npx prisma generate
npm test
npm run test:e2e
```

## 7. Evidências
- **Resultado da execução:** `npm test` → "Test Suites: 4 passed, 4 total | Tests: 19 passed, 19 total" (0 falhas). `npm run test:e2e` → "Test Suites: 3 passed, 3 total | Tests: 4 passed, 4 total" (0 falhas).
- **Link do CI (se houver):** não se aplica

## 8. Decisões e dificuldades
- **O que foi mockado e por quê:** Nos testes unitários, o PrismaService, o AuditoriaService e o JwtService foram substituídos por mocks do Jest, para isolar as regras de negócio do banco de dados e de serviços externos e permitir verificar as interações (por exemplo, que o progresso não é gravado quando a aula não existe). Nos testes de integração, o JwtAuthGuard foi substituído por um guard de teste que simula um usuário autenticado, para testar as rotas sem depender de login real. No teste de integração de login, o PrismaService foi mockado para focar no endpoint HTTP. Os demais testes de integração usam um banco PostgreSQL exclusivo de teste (cybereduca_test), configurado no arquivo backend/.env.test.local; o setup dos testes recusa qualquer banco cujo nome não contenha "test", e cada teste monta e limpa os próprios dados.
- **Bugs encontrados pelos testes (se houver):** nenhum.
- **Dificuldades:** O NestJS do projeto usa módulos ESM, o que exigiu configurar o Jest com ts-jest em modo ESM (node --experimental-vm-modules) e importar o objeto jest de @jest/globals. Uma primeira versão de parte dos testes foi feita com Vitest, mas foi substituída por Jest para manter uma única ferramenta no projeto. Como o CyberEduca+ não possui classes separadas para trilhas, módulos ou aulas, os testes de trilhas foram feitos sobre o AprendizagemService, que concentra essas regras, e o UsuariosService foi incluído como terceira classe de regra de negócio. Também foi necessário ajustar os testes às mudanças de assinatura dos métodos (parâmetro usuarioId e dependência do AuditoriaService) durante a integração do trabalho do grupo, e configurar o banco de teste local para os testes de integração.

## 9. Checklist de entrega
- [x] Todos os testes passam localmente com o comando da seção 6
- [x] Cada cenário listado nas seções 3 e 4 existe no código
- [x] Cada arquivo de teste alterado ou criado está listado na seção 5
- [x] Mínimos do exercício atendidos (10 unitários em 3 classes; 4 de integração)
- [x] Nenhum teste com @Disabled, sem asserção ou com Thread.sleep
- [x] Professor adicionado como reviewer