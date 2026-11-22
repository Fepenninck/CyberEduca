# Apresentação dos testes de integração — CyberEduca+

Registro de uma entrega anterior, com apresentação da configuração e da execução dos 13 testes de integração demonstrados naquela ocasião. Esse número descreve a gravação e não o total atual da suíte.

A demonstração completa atualizada está em [Vídeo completo do CyberEduca+](./video-completo-cybereduca.mp4), armazenado com Git LFS. Os slides estão na [apresentação em PDF](./apresentacao_cybereduca.pdf).

[Assistir ao vídeo no YouTube](https://youtu.be/QyyDFVo36RQ)

## Arquivos apresentados

- `backend/test/pfc.integracao-spec.ts`
- `backend/test/jest-integracao.json`
- `backend/test/run-integracao.cjs`
- `backend/test/setup-test-env.ts`

## Executar os testes

Com o ambiente local de teste configurado, dentro de `backend`:

```powershell
npm run test:integracao
```

## Pull request da entrega

[PR #4 — Testes de integração do CyberEduca+](https://github.com/Fepenninck/CyberEduca/pull/4)
