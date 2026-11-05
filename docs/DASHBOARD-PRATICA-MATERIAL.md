# Prática e Material — relatório de entrega

## 1. Diagnóstico antes das alterações

Material: `src/pages/Materials.tsx`, componentes existentes de Card, Link, SearchField e Icon; `.subject-grid` em `global.css` tinha `max-width: 820px`, diferentemente de `.recent-grid`. A limitação provocava margens direitas diferentes. As oito matérias, links, ordem e cores vêm do catálogo e foram preservados.

Prática: `src/pages/Learning.tsx`, `PracticeSession.tsx`, `ActivityRenderer.tsx` e DataContext. O painel antigo era recolhido e não tinha gráficos; filtros precediam Ações rápidas. Os dados existentes eram tentativas com usuário, questão, resposta, acerto, XP e data; matéria e formato vêm da questão. Faltavam um marcador de finalização de blocos e uma classificação de dificuldade por questão. Tempo de estudo não é registrado.

## 2. Grid das matérias

Removida apenas a limitação de largura do grid. Quatro colunas no desktop, duas até 900px e uma até 380px, com cartões de largura igual, espaçamento de 12px e altura uniforme por linha. Oito links continuam intactos. Comparação geométrica com os recentes passou em 360, 768, 1024 e 1440px; nenhum overflow horizontal do aplicativo.

## 3. Dados e regras dos indicadores

`practiceProgress.ts` calcula somente tentativas do estudante solicitado, com questão conhecida e data válida. Produções abertas não entram na taxa. IDs de tentativa duplicados não são contados novamente; tentativas diferentes da mesma questão entram na evolução. Questões distintas são informadas separadamente. Dias sem tentativas têm taxa ausente, não zero.

`practice_completions` registra blocos completos por usuário e identificador de conjunto. A RPC `complete_practice_set` valida identidade, sessão, conjunto canônico e respostas a todas as questões; a chave primária impede duplicatas. Não concede XP. As configurações dos conjuntos ficam no schema privado. A demonstração usa armazenamento separado por usuário. Dados antigos sem marcador de finalização não são convertidos em conclusões presumidas. Exames finalizados com questões em branco preservam suas respostas avaliadas, mas não contam como bloco completo.

## 4. Dashboard e gráficos

`PracticeDashboard.tsx` mostra quatro métricas sem exigir expansão: práticas concluídas, taxa, acertos e erros. O gráfico de evolução tem escala 0–100%, períodos de 7/30 dias, pontos focalizáveis, detalhes por mouse/teclado e tabela acessível. Barras com rótulos e valores mostram acertos/erros em verde/vermelho sem depender apenas das cores. Há estados de carregamento, falha com nova tentativa e ausência de histórico. Tempo de estudo não é estimado.

## 5. Ações e filtros

Ordem: cabeçalho, painel e gráficos, Ações rápidas, exploração das matérias, filtros, exercícios e histórico. Os controles existentes de Exames, Exercício e Dinâmica foram preservados. Matéria, formato, dificuldade conhecida do bloco e status funcionam em conjunto, com Limpar filtros e estado vazio. A única classificação avançada disponível é a dos exames; os demais conjuntos aparecem como dificuldade não informada. Um filtro de formato seleciona blocos que contêm esse formato, preservando o conjunto inteiro da prática/exame; questões avulsas são filtradas individualmente.

## 6. Responsividade e acessibilidade

O fixture de desenvolvimento `tests/layout-check.html` renderiza as telas reais em iframes de 360, 768, 1024 e 1440px. Material: oito cards alinhados, larguras iguais e sem overflow. Prática, com e sem histórico: quatro métricas com larguras iguais, filtros abaixo das ações e sem overflow nas quatro larguras. Histórico de teste explícito de duas tentativas produziu 50%, um acerto e um erro. A focagem do ponto pelo teclado exibiu os mesmos valores no tooltip acessível. Os atalhos de aumento/restauração de zoom foram exercitados; não se aferiu um percentual nominal de zoom. Não houve teste em dispositivo físico.

O console observado não apresentou erro originado no aplicativo; os erros registrados eram da extensão do navegador de teste. O build mantém o aviso de bundle acima de 650kB já existente.

## 7. Testes e arquivos

- 167 testes de aplicação aprovados, incluindo filtros combinados, limpeza, métricas sem histórico, repetição, isolamento por usuário e persistência de conclusão.
- 60 verificações PostgreSQL/RLS aprovadas, incluindo conjunto incompleto, conclusão única, privacidade e ausência de XP adicional.
- Build de produção aprovado. Os testes existentes de práticas/exames continuam verificando correção, revisão, erros de conexão e recompensas sem duplicação.
- Criados: `src/components/PracticeDashboard.tsx`, `src/services/practiceProgress.ts`, migração `20261101144654_practice_completion_dashboard.sql`, testes de dashboard/progresso e fixture de layout.
- Alterados: `Learning.tsx`, `PracticeSession.tsx`, `global.css`, testes de práticas e roteiro de RLS. `Materials.tsx` manteve seus links e dados; o ajuste foi feito nos estilos.
- Reutilizados: Card, Icon, Button, Notice, ExerciseFields, ActivityRenderer, PracticeSession, DataContext e as tentativas existentes.

## Backend e publicação

Aplicar a migração antes do frontend. Ela acrescenta o registro de conclusão sem alterar tentativas, progresso ou recompensas existentes. A publicação e o commit efetivos são confirmados na resposta final. Não há coleta de tempo nem inferência retroativa de blocos concluídos. Classificações de dificuldade adicionais dependem de metadados pedagógicos ainda não existentes.
