# Ajustes de prática e interação — 22/10/2026

## Escopo e referência

Pedido da usuária e captura `image(20261022-125425).png`: o elemento circulado é a faixa de estatísticas da página Prática. O layout existente e os seis formatos de exercício foram preservados.

- A faixa tem botão **Fechar resumo de prática** (X) e pode ser reaberta por **Mostrar resumo de prática**. Ocultar não remove dados.
- Mensagens de sucesso/erro de ações têm **Fechar aviso**. Mensagens obrigatórias e informações permanentes não foram convertidas em notificações descartáveis.
- A chama fica laranja com ofensiva ativa (`current > 0`), no cabeçalho e no progresso. Marcos já conquistados usam a mesma chama. Sem ofensiva, a chama permanece neutra. O novo token `--streak-orange` atende ao pedido explícito; não substitui cores do design original.
- Exercício, Laboratório e Dinâmica agora têm blocos de **5 questões** cada. As oito disciplinas têm blocos de **6 questões**, além do reforço por questões avulsas já existente. Filtros selecionam blocos que contêm a disciplina/formato, sem encurtar o bloco.
- Dois exames avançados, **10 questões cada**: algoritmos e dados; planejamento e logística. Problemas de múltiplas etapas, fronteiras, recorrências, consistência, capacidade, médias ponderadas e indicadores. Dificuldade é uma classificação editorial, não uma medida validada com estudantes.
- Exames permitem **Anterior**, **Próxima** e navegação numerada sem responder. Marcações permanecem durante a navegação. A revisão permite abrir todas as alternativas e voltar para editar cada questão antes de finalizar.
- Correção de exame somente após **Finalizar e corrigir**. Questões sem resposta completa ficam sem pontuação. O resultado mostra acertos, XP obtido e explicações das questões respondidas. As respostas confirmadas ficam no histórico de tentativas; a revisão do bloco permanece aberta até ser fechada.
- Em falhas parciais de conexão, o painel preserva marcações e resultados confirmados. A tentativa de conclusão reenvia apenas itens ainda não confirmados pelo cliente; a unicidade de XP continua validada no servidor. Fechar um bloco inacabado exige confirmação. Rascunhos não enviados não sobrevivem ao fechamento da aba/recarregamento.
- **Tenho interesse / Interesse marcado** alterna marcado → desmarcado → marcado e usa `aria-pressed`. O vínculo persiste em `saved_jobs`, sob as mesmas políticas RLS. Não equivale a enviar candidatura. A versão antiga em `legacy/script.js`, que só adicionava interesse, também foi corrigida sem alterar sua natureza demonstrativa.

## Catálogo e implantação

Foram adicionadas **32 questões originais** (12 de prática e 20 de exame), preservando as anteriores. Total do catálogo: **111 questões**, 11 trilhas. `src/data/practice-packs.json` contém o catálogo adicional, a definição dos blocos e respostas demonstrativas; no banco real, a correção usa a função existente `submit_exercise` e respostas no esquema privado. Trata-se de exercício educacional, não de uma plataforma de provas com proteção contra consulta ao código demonstrativo.

Para um projeto que já aplicou a migração 007:

1. Publicar a branch `dev/skillup-modular-20261019` na Vercel.
2. Executar **somente o `supabase/seed.sql` atualizado e completo**, em nova consulta do SQL Editor. Não repetir migrations antigas.
3. Atualizar o aplicativo e entrar com uma conta de estudante.

O seed usa IDs estáveis e `ON CONFLICT DO NOTHING`; não redefine usuários, progresso ou respostas existentes. Foi testada sua reaplicação. Sem os novos registros, o aplicativo impede iniciar um exame incompleto e informa indisponibilidade, sem gerar questões fictícias nem atribuir pontos localmente na sessão real.

## Verificação

- PostgreSQL/PGlite: **38/38 verificações aprovadas**, incluindo reaplicação do seed, erro/acerto/repetição das 32 novas questões, privacidade dos gabaritos e proteção contra XP duplicado.
- Interface/lógica: **105/105 testes aprovados**, em 12 arquivos; relatório em `ui-test-results.json`. Execução serial (`npx vitest run --maxWorkers=1 --testTimeout=20000`) para evitar timeouts por disputa de CPU neste ambiente.
- TypeScript estrito + build Vite + Service Worker: **aprovados**. Persiste o aviso conhecido de bundle acima de 650 kB; não é uma falha de compilação.
- Regressões cobrem navegação por questões vazias, seleção persistida, edição na revisão, correção ao finalizar, recuperação de erro parcial, fechamento de avisos, ofensiva ativa e três alternâncias de interesse com persistência.
- Comparação visual em navegador e testes conectados ao Supabase hospedado não executados nesta alteração. Os testes de interface usam jsdom; os de SQL executam PostgreSQL via PGlite, com Auth/Storage simulados.

Novas rotas não foram necessárias: os blocos abrem na página `/app/aprenda/pratica`; interesse permanece em `/app/emprego`.
