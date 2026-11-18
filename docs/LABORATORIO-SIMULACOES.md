# Laboratório de Simulações Interativas

## Lote 1 — arquitetura, catálogo e navegação

O laboratório foi incluído em **Aprenda → Laboratório** para estudantes e docentes. Este lote não implementa as simulações: ele define as rotas, o catálogo tipado e as páginas que apresentam o objetivo de cada atividade.

### Estrutura

- `src/features/simulations/catalog.ts`: contrato e metadados das quatro simulações.
- `src/features/simulations/SimulationLab.tsx`: catálogo e página de planejamento de cada item.
- `/app/aprenda/laboratorio`: catálogo responsivo.
- `/app/aprenda/laboratorio/:simulationId`: rota estável de cada experiência.

### Próximos lotes

| Lote | Simulação                                    |
| ---- | -------------------------------------------- |
| 2    | Portas lógicas AND, OR e NOT                 |
| 3    | Sistema Solar simplificado em 2D             |
| 4    | Célula animal interativa                     |
| 5    | Circuito elétrico básico                     |
| 6    | Testes, acessibilidade e refinamentos finais |

Cada simulação deverá permanecer no navegador, sem IA, serviço pago, biblioteca 3D ou backend. Os próximos lotes devem reutilizar o catálogo e a rota definidos aqui.

### Validação do lote

- Testes do laboratório e regressão de navegação: 14 aprovados.
- Checagem de TypeScript e ESLint: aprovada.
- Build de produção: aprovado.
- Suíte completa: 189 testes aprovados e 18 falhas fora do escopo deste lote, concentradas em fluxos de atividades, cadastro, navegação e service worker; nenhuma está nos arquivos do laboratório.

## Lote 2 — portas lógicas

A dinâmica de portas lógicas está disponível em **Aprenda → Prática → Dinâmica → Portas lógicas**. As rotas antigas de Laboratório e Dinâmica continuam redirecionando para Prática, conforme a navegação atual do SkillUp.

### Interações implementadas

- Seleção das portas AND (E), OR (OU) e NOT (NÃO).
- Entradas binárias que podem ser ligadas e desligadas.
- Diagrama 2D com fios, porta e lâmpada de saída atualizados a cada ação.
- Explicação curta da regra selecionada.
- Tabela-verdade com destaque para a combinação atual.
- Botão **Reiniciar**, que retorna à porta AND com as entradas desligadas.

A dinâmica funciona somente no navegador. Não usa IA, serviço pago, biblioteca 3D ou backend.

### Arquivos do lote

- `src/features/simulations/LogicGatesSimulation.tsx`: regras, controles, diagrama e tabela-verdade.
- `src/features/simulations/catalog.ts`: marca Portas lógicas como disponível.
- `src/pages/Learning.tsx`: abre a dinâmica pelo catálogo integrado à Prática.
- `tests/logic-gates-simulation.test.tsx`: cobre AND, OR, NOT, reinício, tabela e descrição acessível.

### Validação do lote

- Testes da dinâmica, integração com Prática e catálogo: 7 aprovados.
- Checagem de TypeScript: aprovada.
- Build de produção: aprovado.

## Lote 3 — Sistema Solar 2D

A dinâmica está disponível em **Aprenda → Prática → Dinâmica → Sistema Solar**.

### Interações implementadas

- Oito planetas na ordem correta a partir do Sol.
- Órbitas 2D que podem ser iniciadas e pausadas.
- Controle de velocidade entre 0,5× e 2×.
- Seleção de cada planeta para consultar posição, período orbital e uma explicação curta.
- Controle para mostrar ou ocultar os nomes no modelo.
- Botão **Reiniciar**, que pausa o movimento, restaura a velocidade e seleciona a Terra.

O modelo informa que tamanhos, distâncias e velocidades foram simplificados. A dinâmica funciona somente no navegador, sem IA, serviço pago, biblioteca 3D ou backend.

### Arquivos do lote

- `src/features/simulations/SolarSystemSimulation.tsx`: planetas, controles, órbitas e painel educativo.
- `src/features/simulations/catalog.ts`: marca Sistema Solar como disponível.
- `src/pages/Learning.tsx`: abre a dinâmica pelo catálogo integrado à Prática.
- `tests/solar-system-simulation.test.tsx`: cobre movimento, pausa, velocidade, seleção, nomes e reinício.

### Validação do lote

- Testes da dinâmica, integração com Prática e catálogo: 7 aprovados.
- Checagem de TypeScript: aprovada.
- Build de produção: aprovado.
