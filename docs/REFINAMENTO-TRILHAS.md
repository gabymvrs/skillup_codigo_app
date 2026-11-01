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
