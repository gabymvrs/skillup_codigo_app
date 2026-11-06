# Lote 1 — Navegação

Concluído em 6 de novembro de 2026, sem alterar o design system ou publicar em produção.

## Alterações

- Sidebar: “Configurações” por extenso; tab bar mantém “Config.” para caber no mobile.
- Configurações: removida a exportação de dados duplicada no modal Privacidade.
- Menu mobile: foco entra no painel, permanece nele e retorna ao botão ao fechar.
- Hierarquia preservada: cinco áreas principais e subtabs apenas em Aprenda e Social.

## Validação

- Navegação direcionada: 12 testes aprovados.
- TypeScript: aprovado sem erros.
- Fluxos completos consultados: 27 aprovados e 3 falhas fora deste lote, relacionadas ao texto do login, à simulação de clipboard e ao estado vazio da agenda.

Commits: `1e622f3`, `3dfd681` e `5ad168b`.
