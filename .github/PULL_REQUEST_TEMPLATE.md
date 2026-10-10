## 1. Identificação
- **Aluno(s):**
  - Luís Felipe Penninck dos Santos - RGM 11231101140
  - Caio Miranda do Nascimento - RGM 1123110183
  - Thiago: ____________________________
- **Projeto (PFC):** CyberEduca+
- **Branch:** feat/testes-automatizados

## 2. Resumo da entrega
Foram implementados testes unitários e de integração para o progresso do usuário nas aulas. Os testes cobrem conclusão de aula, aula inexistente, progresso inicial, cálculo percentual, persistência e fluxo completo entre API, Controller, Service e banco de dados.

Caio: 
Foram implementados testes unitários e de integração focados no módulo de Autenticação e Usuários. Os cenários garantem a emissão correta de tokens JWT em logins válidos, bloqueiam acessos com credenciais incorretas e validam tentativas de login com contas inexistentes. O teste E2E assegura a resposta e o status HTTP correto do endpoint de autenticação. 

Thiago: ____________________________________________________________________

## 3. Cenários de testes unitários implementados
| # | Classe testada | Método / regra | Cenário | Tipo | Arquivo de teste | Método de teste |
|---|----------------|----------------|---------|------|------------------|-----------------|
| 1 | AprendizagemService | concluirAula() | Conclusão de uma aula válida | Feliz | aprendizagem.service.spec.ts | deve concluir uma aula válida |
| 2 | AprendizagemService | concluirAula() | Tentativa de concluir uma aula inexistente | Violação | aprendizagem.service.spec.ts | deve rejeitar uma aula inexistente |
| 3 | AprendizagemService | progressoGeral() | Usuário sem aulas concluídas retorna 0% | Limite | aprendizagem.service.spec.ts | deve retornar 0% quando nenhuma aula foi concluída |
| 4 | AprendizagemService | progressoGeral() | Duas de cinco aulas concluídas retornam 40% | Limite | aprendizagem.service.spec.ts | deve calcular 40% quando 2 de 5 aulas foram concluídas |
| 5 | AuthService | login() | Usuário fornece credenciais válidas e recebe token JWT | Feliz | auth.service.spec.ts | faz login válido e assina o token |
| 6 | AuthService | login() | Tentativa de login com senha incorreta | Violação | auth.service.spec.ts | rejeita login com credenciais inválidas |
| 7 | AuthService | login() | Tentativa de login com e-mail não existente | Limite | auth.service.spec.ts | rejeita login quando o e-mail não existe no sistema |
| 8 |  |  |  |  |  |  |
| 9 |  |  |  |  |  |  |
| 10 |  |  |  |  |  |  |

Tipo: Feliz | Violação | Limite  
**Total de cenários unitários:** 10




## 4. Cenários de testes de integração implementados
| # | Camadas envolvidas | Cenário | Arquivo de teste | Método de teste | Recurso usado |
|---|--------------------|---------|------------------|-----------------|---------------|
| 1 | Prisma + Banco | Salvar e recuperar um registro de progresso | progresso.e2e-spec.ts | deve salvar e recuperar o progresso no banco de teste | Prisma + PostgreSQL |
| 2 | API + Controller + Service + Banco | Concluir uma aula pela API e confirmar a persistência | progresso.e2e-spec.ts | deve concluir uma aula pelo fluxo API, Controller, Service e Banco | Supertest + Prisma + PostgreSQL |
| 3 | API + Controller + Service | Autenticação HTTP retornando status de sucesso e corpo com token JWT | auth.e2e-spec.ts | POST /auth/login - integração › responde com sucesso ao autenticar pelo endpoint HTTP | Supertest + Nest Application |
| 4 |  |  |  |  |  |

**Total de cenários de integração:** 4



## 5. Arquivos de teste criados ou alterados
| Arquivo (caminho completo) | Criado / Alterado | Qtd. de testes |
|----------------------------|-------------------|----------------|
| backend/src/aprendizagem/aprendizagem.service.spec.ts | Criado | 4 |
| backend/test/progresso.e2e-spec.ts | Criado | 2 |
| backend/test/auth.e2e-spec.ts | Criado | 1 |
|  backend/src/auth/auth.service.spec.ts | Criado | 3 |

**Total de arquivos de teste:** 2 + arquivos de Caio e Thiago  
**Total de testes:** 14




## 6. Como executar os testes
```bash
cd backend
npm test
npm run test:e2e
```

## 7. Evidências
- **Resultado da execução:** Felipe: 6 testes executados, 6 aprovados, 0 falhas. O resultado completo dos 14 testes será adicionado após a integração das entregas de Caio e Thiago.

Caio: 4 testes executados, 4 aprovados, 0 falhas.
- **Link do CI (se houver):** não se aplica

## 8. Decisões e dificuldades
- **O que foi mockado e por quê:** Nos testes unitários de progresso, o PrismaService e o AuditoriaService foram mockados para impedir acesso ao banco de dados. Os testes de integração utilizaram um banco PostgreSQL exclusivo chamado cybereduca_test.
- **Bugs encontrados pelos testes (se houver):** nenhum.
- **Dificuldades:** Foi necessário configurar Jest e TypeScript para executar os módulos ESM utilizados pelo NestJS. Os dados dos testes de integração são limpos após a execução para manter o isolamento.

Caio: 
O principal desafio técnico ocorreu na configuração dos testes em ambiente Node ESM (--experimental-vm-modules). Foi necessário importar o objeto jest explicitamente através de @jest/globals e garantir a resolução correta das dependências de módulo (como o JwtAuthGuard) utilizando .overrideProvider() na injeção do ambiente de testes de integração, mockando o serviço para não depender do banco e focar no endpoint


Thiago: ____________________________________________________________________

## 9. Checklist de entrega
- [ ] Todos os testes passam localmente com o comando da seção 6
- [ ] Cada cenário listado nas seções 3 e 4 existe no código
- [ ] Cada arquivo de teste alterado ou criado está listado na seção 5
- [ ] Mínimos do exercício atendidos (10 unitários em 3 classes; 4 de integração)
- [x] Nenhum teste com @Disabled, sem asserção ou com Thread.sleep
- [x] Professor adicionado como reviewer