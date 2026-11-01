# Atividades em três partes

Reconstrução da implementação que estava apenas no ambiente temporário, a partir do catálogo publicado no commit 3bdf6e6. A nova versão deve ser identificada pelo seu novo commit; o commit e794cf6 não está disponível.

Cada um dos 46 módulos com exercício vinculado abre uma atividade em tela completa: teoria, prática e dinâmica reflexiva. Os 10 módulos antigos sem exercício vinculado continuam no leitor existente. Os exercícios existentes são preservados; os planos atualmente têm um exercício por módulo. Os blocos independentes de prática e exame mantêm seus conjuntos de cinco e dez ou mais questões.

A prática usa os formatos existentes, incluindo editor apenas quando há código. A primeira resposta fica registrada no resultado mesmo depois de uma correção. A dinâmica pede uma aplicação, análise de caso, criação ou análise visual; a exigência de justificativa e o tamanho mínimo aumentam com o nível. O relato é autoavaliado por critérios explícitos, sem alegar correção docente. Não há podcast ou vídeo novo produzido nesta atualização; os recursos disponíveis são cinco artigos oficiais verificados. A produção de mídia e o aprofundamento editorial do currículo continuam pendentes.

A sessão e as respostas corrigidas são persistidas no servidor. Rascunhos ficam por conta e módulo na sessão do navegador. A demonstração usa armazenamento separado. A conclusão de um módulo configurado exige as três partes no servidor; tentativas da sessão não geram XP antes da conclusão. Conclusões e recompensas são únicas; dados antigos são preservados.

Os recursos podem ser salvos e removidos; aparecem na área de materiais. URLs precisam ser HTTPS e não podem conter credenciais. As referências são externas, sem promessa de download offline.

## Publicação

1. Aplicar a migração `20261101121920_lesson_journey.sql` (sem catálogo, mantém o comportamento legado).
2. Publicar a função `grading-code` com os dois arquivos atuais, preservando JWT e autenticação existente.
3. Publicar o frontend no projeto `skillup-codigo-app`.
4. Executar `supabase/lesson-seed.sql` para ativar os 46 planos. O seed é idempotente e não sobrescreve planos existentes.
5. Conferir tabelas, permissões, versão da função, commit e alias de produção.

O avaliador Python/JavaScript continua dependendo do Judge0 configurado no projeto. Falta de configuração aparece como erro explícito e não gera conclusão fictícia. HTML é avaliado na função existente.

## Verificação

150 testes da aplicação e 55 verificações PostgreSQL/RLS passaram na reconstrução, incluindo bloqueio de salto de etapas, isolamento de sessões e recursos, proibição de vereditos de código do cliente, preservação da primeira tentativa e recompensa única após a dinâmica. O build de produção passou; permanece o aviso de tamanho do bundle.
