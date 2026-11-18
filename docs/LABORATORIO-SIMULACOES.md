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

## Lote 4 — célula animal interativa

A dinâmica está disponível em **Aprenda → Prática → Dinâmica → Célula animal**.

### Interações implementadas

- Modelo 2D com núcleo, mitocôndria, complexo golgiense, retículo endoplasmático, lisossomo, ribossomo e membrana plasmática.
- Seleção de cada estrutura diretamente no desenho.
- Painel com função e localização aproximada da organela selecionada.
- Controle para mostrar ou ocultar os nomes.
- Desafio de identificação com feedback para acerto e tentativa incorreta.
- Botão **Reiniciar**, que encerra o desafio, restaura os nomes e seleciona o núcleo.

O modelo informa que tamanhos e posições foram simplificados. A dinâmica funciona somente no navegador, sem IA, serviço pago, biblioteca 3D ou backend.

### Arquivos do lote

- `src/features/simulations/AnimalCellSimulation.tsx`: modelo, organelas, informações e desafio.
- `src/features/simulations/catalog.ts`: marca Célula animal como disponível.
- `src/pages/Learning.tsx`: abre a dinâmica pelo catálogo integrado à Prática.
- `tests/animal-cell-simulation.test.tsx`: cobre seleção, explicações, nomes, desafio e reinício.

### Validação do lote

- Testes da dinâmica, integração com Prática e catálogo: 8 aprovados.
- Checagem de TypeScript: aprovada.
- Build de produção: aprovado.

## Lote 5 — circuito elétrico básico

A dinâmica está disponível em **Aprenda → Prática → Dinâmica → Circuito elétrico**.

### Interações implementadas

- Chave que abre e fecha o circuito, interrompendo ou completando o caminho da corrente.
- Fonte ajustável entre 3 V, 6 V e 9 V.
- Resistência da lâmpada ajustável entre 10 Ω e 40 Ω.
- Cálculo da corrente pela Lei de Ohm e indicação da potência elétrica.
- Lâmpada com brilho atualizado conforme a potência calculada.
- Leituras e explicações atualizadas após cada ação.
- Botão **Reiniciar**, que abre a chave e restaura 6 V e 20 Ω.

O modelo explica que os valores e o brilho foram simplificados. A dinâmica funciona somente no navegador, sem IA, serviço pago, biblioteca 3D ou backend.

### Arquivos do lote

- `src/features/simulations/ElectricCircuitSimulation.tsx`: controles, circuito 2D, cálculos e leituras.
- `src/features/simulations/catalog.ts`: marca Circuito elétrico como disponível.
- `src/pages/Learning.tsx`: abre a dinâmica pelo catálogo integrado à Prática.
- `tests/electric-circuit-simulation.test.tsx`: cobre chave, tensão, resistência, leituras e reinício.

### Validação do lote

- Testes da dinâmica, integração com Prática e catálogo: 9 aprovados.
- Checagem de TypeScript: aprovada.
- Build de produção: aprovado.

## Lote 6 — testes, acessibilidade e refinamentos

As quatro dinâmicas foram revisadas em conjunto, sem adicionar uma nova simulação.

### Refinamentos realizados

- Testes de operação por teclado para portas lógicas, Sistema Solar, célula animal e circuito elétrico.
- Verificação dos nomes acessíveis, estados pressionados e mensagens anunciadas após as interações.
- Correção da estrutura das entradas das portas lógicas: os botões deixaram de ficar dentro de elementos `label`.
- Confirmação do suporte global a movimento reduzido, que desativa animações e transições quando essa preferência está ativa.
- Revisão dos layouts responsivos já usados pelos controles e painéis das quatro dinâmicas.
- Atualização do texto do catálogo para informar que as atividades estão disponíveis.

### Arquivos do lote

- `src/features/simulations/LogicGatesSimulation.tsx`: estrutura semântica das entradas.
- `src/features/simulations/SimulationLab.tsx`: descrição atualizada do catálogo.
- `src/styles/global.css`: compatibilidade visual da estrutura corrigida.
- `tests/simulation-accessibility.test.tsx`: operação por teclado e feedback acessível nas quatro dinâmicas.
- `tests/simulation-lab.test.tsx`: confirma que todas as dinâmicas estão disponíveis.

### Validação do lote

- Testes das simulações, acessibilidade, catálogo e integração com Prática: 19 aprovados.
- Checagem de TypeScript: aprovada.
- Build de produção: aprovado.
- Suíte completa: 224 testes aprovados, sem falhas.
