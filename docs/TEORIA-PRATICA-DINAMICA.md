# Atividades em três partes

Os 56 módulos do catálogo usam a atividade em tela completa: teoria, prática e dinâmica reflexiva. Os dez módulos de Fundamentos e Backend, antes apenas de leitura, receberam teoria ampliada, uma prática de cinco questões e uma dinâmica específica. Os 46 planos anteriores e os blocos independentes de prática e exame foram preservados.

Os novos módulos trabalham cálculo manual, variáveis e tipos, lógica booleana, cadastro de estoque, condicionais, rastreamento de laços, listas vazias, HTTP, contratos REST e recuperação de falhas distribuídas. As práticas combinam escolha, lacuna, ordenação, verdadeiro/falso e casos. As dinâmicas exigem entregas, exemplos e testes do próprio aluno; a exigência aumenta ao longo da trilha.

A prática usa os formatos existentes, incluindo editor apenas quando há código. A primeira resposta fica registrada no resultado mesmo depois de uma correção. A dinâmica pede uma aplicação, análise de caso, criação ou análise visual; a exigência de justificativa e o tamanho mínimo aumentam com o nível. O relato é autoavaliado por critérios explícitos, sem alegar correção docente. Não há podcast ou vídeo novo produzido nesta atualização; os recursos disponíveis são nove artigos oficiais verificados. A produção de mídia e o aprofundamento editorial do currículo continuam pendentes.

A sessão e as respostas corrigidas são persistidas no servidor. Rascunhos ficam por conta e módulo na sessão do navegador. A demonstração usa armazenamento separado. A conclusão de um módulo configurado exige as três partes no servidor; tentativas da sessão não geram XP antes da conclusão. Conclusões e recompensas são únicas; dados antigos são preservados.

Os recursos podem ser salvos e removidos; aparecem na área de materiais. URLs precisam ser HTTPS e não podem conter credenciais. As referências são externas, sem promessa de download offline.

## Publicação

1. Aplicar a migração `20261101121920_lesson_journey.sql` (sem catálogo, mantém o comportamento legado).
2. Publicar a função `grading-code` com os dois arquivos atuais, preservando JWT e autenticação existente.
3. Publicar o frontend no projeto `skillup-codigo-app`.
4. Executar `supabase/lesson-seed.sql` para ativar os 56 planos e cadastrar as 50 questões novas. O seed é idempotente e não sobrescreve planos existentes. A atualização de teoria e vínculo nos dez módulos antigos só ocorre quando ainda não há exercício vinculado. Progresso, tentativas e recompensas anteriores não são apagados.
5. Conferir tabelas, permissões, versão da função, commit e alias de produção.

O avaliador Python/JavaScript continua dependendo do Judge0 configurado no projeto. Falta de configuração aparece como erro explícito e não gera conclusão fictícia. HTML é avaliado na função existente.

## Verificação

153 testes da aplicação e 57 verificações PostgreSQL/RLS passaram na reconstrução, incluindo bloqueio de salto de etapas, isolamento de sessões e recursos, proibição de vereditos de código do cliente, preservação da primeira tentativa e recompensa única após a dinâmica. O build de produção passou; permanece o aviso de tamanho do bundle.
