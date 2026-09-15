# CyberEduca+

> Plataforma web de aprendizagem em cibersegurança, com trilhas, quizzes e simulador de phishing — desenvolvida como Projeto Final de Curso (PFC) na UMC.

![Banner do CyberEduca+](./assets/banner.png)

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![Licença](https://img.shields.io/badge/licença-acadêmica-lightgrey)
![Next.js](https://img.shields.io/badge/Next.js%2016-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React%2019-61dafb?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS%204-06b6d4?logo=tailwindcss&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-e0234e?logo=nestjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2d3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?logo=postgresql&logoColor=white)

## Sobre o projeto

<img src="./assets/ilustracao.png" alt="Ilustração do CyberEduca+" align="right" width="320">

Desenvolvido como **Projeto Final de Curso (PFC)** da **Universidade de Mogi das Cruzes - UMC**, para os cursos de Bacharelado em Engenharia de Software e Bacharelado em Sistemas de Informação.

À medida que os ciberataques (phishing, golpes, força bruta) se tornam mais frequentes, cresce a necessidade de capacitação prática em segurança digital. O **CyberEduca+** propõe um site educacional com trilhas de aprendizagem, aulas, quizzes de avaliação e um simulador de phishing, incluindo autenticação de usuário, perfil básico e um painel administrativo para gestão de conteúdos e acompanhamento de desempenho.

**Fora do escopo do MVP:** aplicativo móvel, login social, notificações push e integrações externas não obrigatórias.

<br clear="right"/>

## Objetivo

Oferecer uma ferramenta prática e acessível de capacitação em cibersegurança, na qual o usuário aprende por meio de trilhas de conteúdo, valida o conhecimento com quizzes e treina a identificação de ameaças reais através de um simulador de cenários de phishing, com acompanhamento contínuo do seu progresso.

## Integrantes

| Integrante | Nome completo | RGM |
|---|---|---|
| Aluno 1 | Luís Felipe Penninck Dos Santos | 11231101140 |
| Aluno 2 | Caio Miranda do Nascimento | 11231101833 |
| Aluno 3 | Thiago dos Santos Soares | 11221101451 |

**Orientador(a):** Alessandro Aparecido da Silva Horas

## Atores do Sistema

- **Administrador:** gerencia trilhas, aulas, quizzes, cenários de phishing e usuários da plataforma pelo painel administrativo.
- **Usuário:** realiza trilhas e aulas, responde quizzes, pratica no simulador de phishing e acompanha sua evolução e histórico de desempenho.

## Funcionalidades

- Trilhas de aprendizagem, aulas e conteúdos
- Acompanhamento de progresso por trilha
- Quizzes de múltipla escolha com correção e feedback
- Histórico de desempenho e resultados
- Simulador de cenários de phishing com classificação e análise de sinais de risco
- Cadastro, login/logout e perfil do usuário (com gerenciamento de preferências)
- Seção de notícias sobre cibersegurança, com artigos ilustrando ameaças reais
- Navegação entre as áreas do sistema
- Painel administrativo (dashboard, gerenciamento de trilhas, quizzes, phishing e usuários)

## Arquitetura

![Arquitetura do CyberEduca+](./assets/arquitetura.png)

O front-end (**Next.js**) consome a API REST do back-end (**NestJS**) via HTTPS, com autenticação por **JWT**. O back-end aplica regras de negócio, autenticação/autorização (JWT), controle de permissões (**RBAC**), validação de dados (DTOs, Pipes, Guards) e auditoria (logs), além de gerenciar os módulos de cursos, trilhas, quizzes, progresso e o simulador de phishing. A comunicação com o banco de dados é feita através do **Prisma ORM**, conectado ao **PostgreSQL** hospedado no **Neon** (PostgreSQL Serverless). O front-end é publicado na **Vercel**, e o back-end em um servidor cloud (VPS/Cloud), com repositório e CI/CD no **GitHub**.

**Fluxo de comunicação:** Usuário (navegador) → Frontend (Next.js) → Requisição REST (Backend NestJS) → Consulta via Prisma → Banco de Dados (PostgreSQL + Neon) → Infraestrutura (Deploy e CI/CD).

## Stack Tecnológica

| Camada | Tecnologias |
|---|---|
| **Front-end** | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Base UI, Lucide (ícones), React Markdown |
| **Back-end** | Node.js, NestJS, TypeScript, JWT (autenticação), RBAC (permissões), validação de DTOs, Logs (auditoria) |
| **Banco de Dados** | PostgreSQL, Prisma ORM, Neon (PostgreSQL Serverless) |
| **Deploy** | Vercel (front-end), Servidor Cloud (back-end — ex.: Render, Railway ou similar), Neon (banco de dados), GitHub (repositório e CI/CD) |
| **Qualidade** | ESLint, Jest, testes unitários e de integração |

## Como rodar o projeto localmente

### Pré-requisitos

- Node.js (LTS) e npm
- PostgreSQL (local ou uma URL de conexão remota, ex.: Neon)

### 1. Back-end

```bash
cd backend
npm install
cp .env.example .env   # preencher com a senha do banco (DATABASE_URL)
```

Crie um banco PostgreSQL local chamado `cybereduca` e rode as migrations:

```bash
npx prisma migrate dev
npm run db:seed        # popula uma trilha e uma aula vazias
npm run start:dev
```

A API sobe em `http://localhost:3000`.

### 2. Front-end

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

O frontend sobe em `http://localhost:3001` (o CORS da API já está liberado para essa porta).

## Metodologia

Desenvolvimento em **Scrum**, com gestão de tarefas via Monday e comunicação da equipe via Discord/WhatsApp. Modelagem com UML (casos de uso e classes), DER e prototipação de interfaces (Figma).

## Segurança e LGPD

Modelo de segurança planejado para o MVP (parte ainda em implementação — ver [Status do Projeto](#-status-do-projeto)):

- Autenticação via JWT (Bearer Token)
- Hash de senhas
- Controle de acesso por perfil (RBAC — usuário/administrador)
- Validação de entrada
- Auditoria e logs
- Tratamento de dados pessoais conforme a LGPD (Lei nº 13.709/2018)

## Status do Projeto

Projeto em desenvolvimento ativo, seguindo o cronograma do PFC (2026).

- [x] Definição de escopo e arquitetura
- [x] Modelagem inicial de dados
- [x] Módulo de trilhas e aulas 
- [ ] Autenticação e autorização (JWT + RBAC) — hoje a API usa um usuário demo fixo
- [ ] Módulo de quizzes
- [ ] Simulador de phishing
- [ ] Painel administrativo
- [ ] Dashboards de desempenho (a página de progresso do frontend já consome a API, mas segue em evolução)
- [ ] Testes automatizados

## Licença e uso de dados

O uso de bibliotecas, APIs, ferramentas de IA e demais recursos de terceiros é identificado e documentado no projeto. O tratamento de dados pessoais, quando existente, observa os princípios e requisitos legais e institucionais aplicáveis.

## Instituição

Projeto desenvolvido para a **Universidade de Mogi das Cruzes - UMC** · Mogi das Cruzes - SP, 2026.
