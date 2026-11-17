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
