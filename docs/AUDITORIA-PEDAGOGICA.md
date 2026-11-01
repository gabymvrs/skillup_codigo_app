# Auditoria e piloto de aprendizagem guiada

## Localização do fluxo

- Trilhas e bolinhas: `src/pages/Learning.tsx`; card inicial: `LessonLauncher.tsx`.
- Atividade em três partes: `LessonSession.tsx`; renderização da prática: `ActivityRenderer.tsx` e `ExerciseFields.tsx`; editor isolado: `CodePractice.tsx`.
- Catálogo: `src/data/catalog.ts`, `enrichment.json`, `track-activities.json`, `foundation-lessons.json`. Planos: `lesson-plans.json`.
- Progresso interno e correção: `services/lessonJourney.ts`, RPC `lesson_action`, sessões e rascunhos no Supabase. Conclusões ficam em `progress`; recompensas são únicas em `reward_events`.
- Correção de código: função `grading-code`. A configuração Judge0 continua sendo necessária para avaliar Python/JavaScript no servidor.
- Feedback: `LessonFeedback.tsx`; erros objetivos calculados pela primeira tentativa, produções abertas separadas.

## Problemas confirmados

1. A teoria era apresentada inteira como parágrafos, sem passos ou experimento guiado.
2. Web começa em HTML semântico antes de explicar navegador, elementos e tags.
3. Python começa em condicionais e rapidamente pede código com entrada/conversão; faltam os primeiros programas e os pré-requisitos ensinados isoladamente.
4. Parte das teorias remete a uma reflexão genérica sem ensinar os detalhes necessários ao exercício.
5. Quarenta e seis planos antigos ainda têm um exercício. Os dez de Fundamentos/Backend complementados anteriormente já têm cinco.
6. As dinâmicas atuais dependiam predominantemente de texto e critérios de autoavaliação. O tipo declarado não implicava uma interação própria.
7. O rascunho tinha o índice da prática, mas não um passo interno de teoria ou as entradas de um experimento.
8. Os recursos externos estavam disponíveis, mas não resolviam as lacunas do conteúdo principal.

## Sequência planejada antes de expandir

| Unidade | Pré-requisito | Competência e aplicação | Sequência de conceitos |
| --- | --- | --- | --- |
| Fundamentos | Nenhum conhecimento de código | Planejar, rastrear e testar uma solução | Programação e algoritmo → entrada/processamento/saída → variáveis e tipos → operadores e lógica → condicionais → repetições → listas → funções → problema integrador |
| Python | Algoritmos introdutórios | Escrever, executar e depurar pequenos programas | Saída com print → variáveis → input → conversão → operadores → condicionais → laços → listas → funções → erros → miniprojeto |
| Web | Uso básico de navegador | Construir uma página com estrutura e comportamento compreensíveis | Site e navegador → HTML → elementos e tags → h1 → p → organização → documento → semântica → links/botões → CSS → box model → Flexbox/Grid → responsividade → JS/eventos/DOM → projeto |
| JavaScript | Sequências, entradas e cálculos | Interpretar valores e controlar o fluxo | Saída → valores e variáveis → conversão → operadores → condições → laços → funções → depuração → eventos/DOM após HTML |

Essa tabela é planejamento de expansão, não uma afirmação de que as novas bolinhas já foram publicadas. IDs, pré-requisitos e progresso existentes devem ser preservados na migração de cada unidade.

## Piloto implementado: Fundamentos

Atividade estável `00000000-0000-4000-8000-000000000300`. Nenhuma bolinha adicional foi criada para separar as três partes.

- Objetivo: descrever e testar um algoritmo de média com entrada, processamento e saída.
- Pré-requisito explícito: nenhum conhecimento de programação; soma e divisão são explicadas.
- Nove passos com situação do boletim, problema bem definido, conceito de algoritmo, pseudocódigo explicado, rastreamento manual, experimentação, validação de entradas, testes e recapitulação.
- Experimento funcional: notas entre 0 e 10; vazio é diferente de zero; resultados calculados a partir das entradas.
- Cinco questões existentes alinhadas com o conteúdo ensinado: reconhecer papéis, interpretar a média, ordenar instruções, conferir testes e tratar entrada ausente.
- Missão: organizar quatro instruções, observar erro de dependência, corrigir, testar e explicar o resultado. A ordem e os dados são conferidos novamente no servidor antes da conclusão. O relato aberto continua separado dos acertos objetivos.
- Rascunho guarda passo interno, entradas do experimento e estado da missão, além da questão e do relato.
- A próxima atividade é Variáveis: dar nomes e tipos aos valores já apresentados.

## Limites desta parte

O modelo ainda não foi aplicado às outras atividades. Não há áudio novo, execução de pseudocódigo como linguagem real, nem alegação de validação humana com iniciantes. A avaliação pedagógica desta parte foi feita por revisão de conteúdo e percurso automatizado. A expansão por unidades e a revisão completa de HTML continuam pendentes.
