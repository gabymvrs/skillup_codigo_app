# Refinamento das trilhas — entrega por partes

## Parte 1: fluxo, retomada e feedback

Implementado: card de entrada com Começar, Continuar atividade ou Ver resultado; atividade única em tela cheia com três partes; rascunho persistido com índice da questão, respostas e entrega; cópia local imediata e cópia na conta após intervalo curto ou fechamento.

O feedback consolida total objetivo, acertos e erros na primeira tentativa, porcentagem e as quatro faixas solicitadas. Produções abertas ficam fora do cálculo. Há revisão filtrada dos erros, acesso à teoria, respostas inicial e final, resposta esperada quando há gabarito objetivo, explicação, resultado da dinâmica, critérios e recomendações. Respostas históricas não registradas explicitamente aparecem como indisponíveis. Para código, a referência são os testes e requisitos, pois há múltiplas soluções válidas. O campo de rascunho nunca altera etapas, notas ou XP.

## Partes ainda pendentes do prompt

- Reestruturar a sequência completa de Fundamentos, Python e Desenvolvimento Web com todos os tópicos solicitados, objetivos, sintaxe comentada, erros comuns e resumos por atividade.
- Ampliar para cinco questões os planos antigos que ainda têm uma questão. Os dez módulos complementados na entrega anterior já têm cinco.
- Implementar e validar as dinâmicas interativas de simulação, depuração, missão visual e miniprojeto; os formatos atuais ainda usam produção reflexiva com critérios.
- Adicionar mídia real e controles de áudio, caso haja um áudio validado. Não há podcast funcional nesta entrega.
- Implementar repetição voluntária com histórico de sessões e reforço adaptativo. A correção de respostas antes de concluir e a revisão após concluir já existem.
- Completar o editor com destaque de sintaxe, abas Web e avaliação de comportamento, preservando a execução isolada existente.
- Executar a matriz completa de mobile e desktop para as novas dinâmicas, quando implementadas.

## Validação da parte 1

156 testes de aplicação e 58 verificações PostgreSQL/RLS. As verificações incluem primeira resposta preservada, gabarito do servidor, rascunho sem poder de forjar conclusão, privacidade de rascunhos e bloqueio de acesso anônimo. Build de produção com o aviso de tamanho do bundle já existente.


## Parte 2: piloto de teoria guiada

A auditoria e o plano de sequência por pré-requisitos estão em `AUDITORIA-PEDAGOGICA.md`. A primeira bolinha de Fundamentos recebeu nove passos contextualizados, pseudocódigo explicado, um experimento editável e uma missão de organização com validação no servidor. O passo atual e as entradas são retomados. As outras bolinhas ainda usam o formato anterior. O modelo foi validado por testes, sem alegar uma sessão de teste humano com iniciantes. A expansão para as unidades e a reestruturação de HTML continuam pendentes.

Validação acumulada: 159 testes da aplicação e 59 verificações PostgreSQL/RLS; build passou com o aviso de bundle já existente.

## Navegação livre entre as partes

Por solicitação posterior, a teoria passou a ser opcional. Os três controles no topo permitem alternar livremente entre Teoria, Prática e Dinâmica. O botão de pular teoria abre a prática diretamente, e a parte aberta é salva no rascunho. A visualização é independente da etapa validada pelo servidor: visitar a dinâmica antes de corrigir a prática não conclui a atividade. O XP permanece condicionado à prática corrigida e à entrega válida da dinâmica. Rever as partes após a conclusão não gera nova recompensa.

Validação: 160 testes da aplicação e build de produção aprovados; nenhuma alteração de schema ou das regras de correção do servidor foi necessária.

## Parte 3: apresentações das trilhas

As 13 trilhas do catálogo receberam introduções próprias antes do caminho de atividades. Cada apresentação contextualiza a área, aplicações, objetivos, resultados compatíveis com o percurso atual, pré-requisitos e dificuldade inicial. O percurso exibido é derivado dos módulos reais. Começar minha jornada inicia a trilha sem conceder XP; a apresentação pode ser recolhida e revisitada. A preferência visual fica por perfil e trilha neste navegador. Não houve mudança de schema nem apagamento de progresso.

Python e JavaScript declaram os pré-requisitos exigidos pelas atividades atuais, sem afirmar que a reorganização para iniciantes absolutos já está pronta. A apresentação não substitui essa reorganização. O texto sobre atividades preserva a teoria opcional e a navegação livre.

Validação: 163 testes da aplicação e build aprovados. Permanecem pendentes a revisão de pré-requisitos por atividade, as fases de dificuldade validadas pedagogicamente e a expansão da teoria guiada para as outras bolinhas.
