# Exclusão de contas e retenção de dados — controle por lotes

Documento técnico de continuidade. Não constitui parecer jurídico nem declara conformidade com a LGPD. Prazos, bases legais, anonimização, atendimento de responsáveis legais e regras aplicáveis a adolescentes precisam de validação jurídica e do controlador antes de produção.

## Controle de progresso

| Lote                         | Estado                  | Resultado                                                  |
| ---------------------------- | ----------------------- | ---------------------------------------------------------- |
| 1 — Auditoria e planejamento | Concluído em 10/11/2026 | Inventário, riscos, matriz preliminar e plano abaixo       |
| 2 — Interface de exclusão    | Não iniciado            | Depende de autorização após revisão do Lote 1              |
| 3 — Backend seguro           | Não iniciado            | Depende da matriz aprovada e de ambiente Supabase de teste |
| 4 — Storage e dados locais   | Não iniciado            | Depende do contrato do backend                             |
| 5 — Retenção e backups       | Não iniciado            | Depende de decisão jurídica e política real do Supabase    |
| 6 — Integração e testes      | Não iniciado            | Depende dos lotes 2–5                                      |
| 7 — Documentação e produção  | Não iniciado            | Depende da homologação dos lotes anteriores                |

## Lote 1 — Auditoria e planejamento

### Escopo e método

Foram inspecionados o cliente React, as migrations SQL existentes, políticas RLS, funções SQL, buckets, serviços de armazenamento local, Service Worker e documentação. Não houve consulta ou alteração no banco de produção, execução de exclusão, criação de migration ou modificação de interface.

Fontes principais: `src/services/supabase.ts`, `src/state/AuthContext.tsx`, `src/services/offline.ts`, `src/services/registration.ts`, `src/features/portfolio/service.ts`, `src/pages/Settings.tsx`, `scripts/sw-template.js` e `supabase/migrations/`.

### Resumo executivo

- Não existe exclusão definitiva de conta no frontend, em RPC SQL ou Edge Function.
- O cliente não contém chave administrativa, o que está correto. A futura remoção de `auth.users` deve ocorrer somente em backend confiável.
- `profiles.id` referencia `auth.users.id` com `ON DELETE CASCADE`, mas muitas tabelas referenciam `profiles` sem ação de exclusão. Excluir primeiro a identidade Auth pode falhar por restrição de chave estrangeira.
- Usar cascade indiscriminadamente também seria incorreto: mensagens, comentários, conteúdo educacional, certificados, turmas, vagas e projetos podem pertencer a relações com terceiros e exigem decisão explícita entre exclusão, transferência e anonimização.
- A RLS protege leitura e escrita durante uso normal, mas não implementa retenção nem resolve exclusões administrativas. Um backend com `service_role` ignora RLS e precisa validar identidade, autenticação recente, estado e escopo em todas as etapas.
- Os buckets são privados e organizam arquivos pelo UUID do titular, o que facilita limpeza. A remoção de linhas do banco não remove automaticamente objetos do Storage.
- IndexedDB separa materiais e fila pelo campo `owner`; existe `clearOffline(owner)`. A tela de Configurações usa essa limpeza, mas o logout comum não a chama.
- `localStorage` e `sessionStorage` têm chaves por usuário e chaves globais de demonstração. Não existe uma rotina central que remova todos os dados locais de uma conta real.
- O Service Worker guarda apenas shell e ativos públicos. Não armazena respostas autenticadas, documentos privados ou chamadas da API.
- A aplicação pode atender adolescentes, mas não coleta data de nascimento nem registra consentimento/representação de responsável. Não é possível aplicar regras etárias ou comprovar o tratamento adequado apenas com o modelo atual.

## Inventário de dados

### Supabase Auth

`auth.users`, `auth.identities`, `auth.sessions`, fatores MFA e metadados de autenticação podem conter e-mail, provedores OAuth, horários de acesso, atributos do provedor e metadados de cadastro. `private.session_allowed()` consulta `auth.users`, `auth.sessions` e `auth.mfa_factors`. O trigger `private.handle_new_user()` cria `profiles`, `user_roles` e, para perfis profissionais, `role_requests`.

Risco: apagar a identidade antes de concluir a limpeza de Storage e tabelas torna o titular incapaz de retomar ou autorizar a operação. A identidade deve ser a última etapa irreversível, após registro seguro do resultado.

### Tabelas com dados pessoais ou vinculáveis

| Grupo                             | Tabelas/campos principais                                                                                                                                           | Natureza                                                                                                                              | Relação de exclusão atual                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Identidade e perfil               | `profiles`, `user_roles`, `role_requests`, `learning_settings`                                                                                                      | Nome, biografia, habilidades, site, preferências, avatar, perfil, organização, CNPJ/CPF informado, CNAE, caminhos de documentos, fuso | `profiles → auth.users` cascade; dependentes diretos variam                                              |
| Documentação profissional         | `role_requests`                                                                                                                                                     | Dados cadastrais e caminhos de documentos privados                                                                                    | Cascade por `user_id`; arquivos não são cascade                                                          |
| Aprendizagem e comportamento      | `progress`, `attempts`, `reward_events`, `study_days`, `track_enrollments`, `material_reads`, `lesson_sessions`, `practice_completions`, `saved_learning_resources` | Respostas, acertos, XP, rascunhos, relatos, sequência de estudo, horários e conclusão                                                 | Em geral cascade por usuário; confirmar todos os constraints no banco aplicado                           |
| Turmas e avaliação                | `classes`, `enrollments`, `assignments`, `submissions`, `certificates`                                                                                              | Vínculo escolar, atividades, texto entregue, nota, feedback e certificado                                                             | Matrícula cascade; professor, aluno, emissor e submissão possuem relações restritivas em partes críticas |
| Social                            | `posts`, `comments`, `reactions`, `projects`, `project_members`, `comment_reports`, `project_signals`                                                               | Conteúdo autoral, nome duplicado, interação, denúncia e visualização                                                                  | Conteúdo compartilhado possui FKs restritivas; dependentes do conteúdo usam alguns cascades              |
| Portfólio e carreira              | `student_portfolios`, `profile_highlights`, `student_resumes`, `experiences`, `applications`, `saved_jobs`, `jobs`                                                  | Currículo, arquivo, experiências, candidatura, carta, empresa e interesses                                                            | Dados exclusivos recentes usam cascade; vagas, candidaturas e relações antigas exigem decisão            |
| Comunicação e suporte             | `messages`, `support_tickets`, `notifications`                                                                                                                      | Conversas, dúvidas, urgência, respostas, remetente, destinatário e professor atribuído                                                | FKs para perfis sem ação explícita; exclusão direta fica bloqueada                                       |
| Agenda                            | `study_events`                                                                                                                                                      | Título, descrição, horário, turma                                                                                                     | FK de usuário sem ação explícita                                                                         |
| Conteúdo criado por profissionais | `materials`, `tracks`, `classes`, `assignments`, `jobs`, `projects`                                                                                                 | Autoria e conteúdo usado por terceiros                                                                                                | Proprietário/professor geralmente restritivo; não pode ser removido sem tratar consumidores              |
| Catálogo sem titular direto       | `organizations`, `subjects`, `questions`, `modules`, `lesson_plans`, `learning_resources`, `achievement_definitions`                                                | Conteúdo institucional/pedagógico                                                                                                     | Pode conter autoria indireta ou referências; não deve ser apagado apenas pela conta                      |
| Tabelas privadas operacionais     | `private.question_answers`, `private.code_validation_requests`, `private.practice_catalog`                                                                          | Gabaritos, limitação de validação e catálogo                                                                                          | `code_validation_requests.user_id → auth.users` cascade; demais não são dados do titular                 |

Campos textuais livres — mensagens, posts, comentários, suporte, submissões, biografias, projetos, rascunhos e respostas — podem conter dados pessoais ou sensíveis não previstos pelo schema. A classificação deve considerar o conteúdo, não apenas o nome da coluna.

### Relações que impedem exclusão ingênua

As seguintes referências a `profiles` não declaram `ON DELETE CASCADE` ou `ON DELETE SET NULL` nas migrations auditadas: proprietários de `materials` e `tracks`; professor de `classes` e `assignments`; estudante de `submissions`; autores de `posts`, `comments` e `reactions`; proprietários/membros de `projects`; proprietário de `jobs`; estudante de `applications`; favoritos; agenda; titular e emissor de `certificates`; autor/atribuído de `support_tickets`; remetente/destinatário de `messages`; notificações; denúncias. Algumas migrations posteriores acrescentam cascades para portfólio, mas não resolvem as relações históricas.

Consequências:

1. `delete auth.users` pode iniciar o cascade em `profiles` e falhar por FK restritiva.
2. Alterar todas as FKs para cascade apagaria conteúdo e histórico de terceiros sem avaliação.
3. A estratégia deve ser definida por relação: apagar dado exclusivo, anonimizar autoria, manter registro legal minimizado ou transferir conteúdo institucional.
4. O backend deve executar etapas idempotentes, registrar progresso sem conteúdo pessoal desnecessário e somente remover Auth quando não houver bloqueios.

### RLS e autorização

- As migrations habilitam RLS nas tabelas públicas e aplicam uma política restritiva baseada em `private.session_allowed()`.
- Políticas adicionais limitam linhas pelo usuário, função, organização, turma ou relacionamento.
- Há deletes concedidos para itens específicos, como posts próprios, comentários próprios, reações, experiências, agenda, destaques e recursos salvos. Isso não equivale a exclusão integral da conta.
- Não há política/RPC para o titular apagar `profiles`, `user_roles` ou `auth.users`.
- Funções `security definer` validam sessão para operações educacionais, mas não existe função de exclusão.
- Uma Edge Function futura deve obter o usuário a partir do JWT validado, nunca aceitar um UUID arbitrário como autoridade e exigir autenticação recente por regra documentada.

### Supabase Storage

| Bucket               | Conteúdo                                              | Visibilidade                                                  | Chave de escopo                       |
| -------------------- | ----------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------- |
| `profile-documents`  | Documentos de verificação de perfil                   | Privado                                                       | Primeiro segmento é o UUID do titular |
| `avatars`            | Foto de perfil                                        | Privado com leitura relacional                                | Primeiro segmento é o UUID do titular |
| `student-resumes`    | Currículo PDF                                         | Privado; leitura do titular ou candidatura vinculada          | Primeiro segmento é o UUID do titular |
| `portfolio-files`    | Capas e arquivos do portfólio                         | Privado, com acesso autenticado/público conforme visibilidade | Primeiro segmento é o UUID do titular |
| `learning-materials` | Arquivos de materiais criados por docente/instituição | Privado, compartilhado por referência em `materials`          | Primeiro segmento é o UUID do autor   |

Não há trigger de banco que remova objetos quando uma linha ou conta é apagada. Objetos órfãos são possíveis. Arquivos de materiais podem ser usados por terceiros; remover o autor não deve quebrar acesso sem decisão de transferência, despublicação ou retenção.

### Armazenamento no navegador

| Tecnologia/chave                                           | Conteúdo                                   | Escopo e limpeza atual                                                          |
| ---------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------- |
| IndexedDB `skillup-offline-v2/materials`                   | Metadados e Blob de material autorizado    | `owner`; `clearOffline(owner)` remove apenas o titular                          |
| IndexedDB `skillup-offline-v2/queue`                       | IDs de módulos pendentes                   | `owner`; mesma limpeza seletiva                                                 |
| `localStorage skillup.demo.v2`                             | Dataset completo da demonstração           | Global de demonstração; pode incluir conteúdo criado no teste                   |
| `localStorage skillup.portfolio.demo.v1`                   | Portfólio demonstrativo                    | Global de demonstração                                                          |
| `localStorage skillup.lesson.demo.<user>.<module>`         | Sessões/rascunhos demonstrativos           | Por usuário e módulo                                                            |
| `localStorage skillup.resources.demo.<user>`               | Recursos salvos na demonstração            | Por usuário                                                                     |
| `localStorage skillup.practice.completions.demo.<user>`    | Conclusões demonstrativas                  | Por usuário                                                                     |
| `localStorage skillup.track-intro.<owner>.<track>`         | Estado de apresentação                     | Por proprietário e trilha                                                       |
| `localStorage skillup.recent.<owner>`                      | Materiais recentes                         | Por conta                                                                       |
| `localStorage skillup.lesson.draft.<tipo>.<user>.<module>` | Rascunho local de aula                     | Por tipo, conta e módulo                                                        |
| `localStorage skillup_fidelity`                            | Importação legada opcional                 | Global, origem externa ao fluxo atual                                           |
| `sessionStorage skillup.demo.role`                         | Perfil de demonstração                     | Por aba; removido no login/logout real                                          |
| `sessionStorage skillup.triage.<user>`                     | Conversa de triagem                        | Por conta e aba                                                                 |
| Memória `stagedStudent`                                    | Documento selecionado antes da confirmação | Escopo de módulo/aba, até 30 minutos; limpo no logout                           |
| Cache `skillup-shell-*`                                    | HTML, CSS, JS, fontes e ativos públicos    | Sem API, tokens ou arquivos privados; versões antigas são removidas no activate |

A ação “Limpar dados deste dispositivo” em Configurações remove IndexedDB do proprietário, triagem e recentes. Não há inventário central das chaves, portanto rascunhos, introduções, práticas e dados demonstrativos podem permanecer. O logout comum limpa sessão/draft de cadastro, mas não chama `clearOffline` e não remove todas as chaves por usuário. A futura exclusão deve limpar apenas o UUID afetado e preservar outras contas do mesmo navegador.

## Mecanismos existentes de exclusão

- Exclusões unitárias protegidas por RLS para alguns registros do próprio usuário.
- Remoção explícita de arquivos substituídos em cadastro, avatar e portfólio.
- `clearOffline(owner)` para dados IndexedDB de uma conta.
- Limpeza de caches antigos do shell pelo Service Worker.
- Não existe: solicitação de exclusão de conta, período de cancelamento, fila de processamento, tombstone, auditoria de etapas, anonimização, remoção administrativa de Auth ou reconciliação de falhas parciais.

## Riscos LGPD e adolescentes

| Prioridade | Risco                                                                                                  | Tratamento necessário                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Crítica    | Exclusão de Auth antes de dados/arquivos causa bloqueio e órfãos                                       | Auth por último; processo idempotente e reconciliável                             |
| Crítica    | Cascade amplo pode apagar mensagens, trabalhos, turmas ou conteúdo de terceiros                        | Matriz por relação e anonimização/transmissão controlada                          |
| Alta       | Documentos de perfil, currículo e campos livres podem conter dados sensíveis                           | Minimização, acesso restrito, descarte prioritário e logs sem conteúdo            |
| Alta       | Ausência de idade/consentimento impede identificar adolescentes e responsável                          | Decisão do controlador e desenho jurídico específico antes de coletar novos dados |
| Alta       | Nome duplicado em `posts.author_name` e `comments.author_name` permanece mesmo após desvincular perfil | Anonimizar também cópias denormalizadas                                           |
| Alta       | Certificados públicos vinculam nome e histórico                                                        | Definir obrigação, prazo, revogação e forma de anonimização/verificação           |
| Alta       | Mensagens possuem dois titulares; apagar integralmente afeta o interlocutor                            | Preservar conteúdo minimizado ou anonimizar remetente conforme base aprovada      |
| Alta       | Backups do Supabase não são auditados neste repositório                                                | Confirmar plano, PITR, restauração e janela real com o fornecedor                 |
| Média      | Logout não limpa todos os dados locais reais                                                           | Criar registro central de chaves e limpeza seletiva no Lote 4                     |
| Média      | Arquivos públicos de portfólio podem continuar em cache externo                                        | Revogar objeto/URL e documentar limites de caches e cópias de terceiros           |
| Média      | Não há exportação regulatória completa nem canal formal de titular                                     | Definir procedimento humano e SLA legal com revisão jurídica                      |
| Média      | Falta de trilha de exclusão dificulta provar atendimento sem reter PII em excesso                      | Log mínimo com identificador irreversível, etapas e tempos                        |

Para adolescentes, qualquer decisão deve observar o melhor interesse, transparência adequada à faixa etária, minimização e participação do responsável quando juridicamente exigida. O software atual não fornece elementos suficientes para afirmar que esses requisitos são cumpridos.

## Matriz preliminar de retenção

Os prazos abaixo são propostas de engenharia para discussão, não regras aprovadas. “D0” é a confirmação válida da exclusão. Nenhuma rotina programada deve ser criada antes da aprovação do controlador e jurídico.

| Categoria                                                                | Ação proposta                                                                              | Prazo preliminar                                                                   | Validação pendente                                                       |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Auth, sessões, MFA e identificadores diretos                             | Revogar sessões no início; remover identidade ao final                                     | Sessões: imediato; identidade: ao concluir o processamento                         | Recuperação, fraude, obrigação legal e política Supabase                 |
| Perfil, preferências, avatar e documentos de verificação                 | Excluir, sem anonimização quando não houver obrigação                                      | D0; tolerância operacional máxima proposta de 30 dias para repetição/reconciliação | Necessidade de prazo de cancelamento e obrigações cadastrais             |
| Currículo, portfólio privado e experiências                              | Excluir arquivos e linhas próprias                                                         | D0 até 30 dias                                                                     | Candidaturas em andamento e direitos de terceiros                        |
| Progresso, respostas, rascunhos e telemetria educacional                 | Excluir ou anonimizar de forma irreversível                                                | D0 até 30 dias                                                                     | Obrigações acadêmicas da instituição e validade de registros             |
| Submissões, notas e certificados                                         | Reter minimizado ou anonimizar conforme obrigação                                          | Prazo não definido                                                                 | Legislação educacional, contrato institucional e validade do certificado |
| Mensagens e suporte                                                      | Anonimizar a autoria; avaliar conteúdo do outro participante                               | Prazo não definido                                                                 | Base legal, expectativa do interlocutor e prevenção de abuso             |
| Posts, comentários e projetos compartilhados                             | Excluir quando exclusivamente pessoais; caso preservados, anonimizar nome, UUID e arquivos | D0 até 30 dias após decisão                                                        | Moderação, direitos de terceiros e licença de conteúdo                   |
| Vagas, materiais, trilhas, turmas e atividades criadas profissionalmente | Transferir/despublicar ou anonimizar autoria antes de remover conta                        | Prazo não definido                                                                 | Titularidade institucional e continuidade do serviço                     |
| Candidaturas                                                             | Excluir carta/currículo; avaliar registro mínimo do processo                               | Prazo não definido                                                                 | Obrigações trabalhistas, defesa em processo e consentimentos             |
| Denúncias e segurança                                                    | Reter versão minimizada e com acesso restrito se necessário                                | Proposta para discussão: 6 a 12 meses                                              | Necessidade, proporcionalidade e prescrição aplicável                    |
| Log técnico da exclusão                                                  | Hash não reversível do usuário, estado, timestamps e códigos de erro; sem conteúdo         | Proposta para discussão: 12 meses                                                  | Prestação de contas, segurança e minimização                             |
| Dados locais no dispositivo                                              | Limpeza seletiva por conta após confirmação do servidor                                    | Imediato após sucesso; oferecer nova tentativa se falhar                           | Dispositivos offline e múltiplas contas                                  |
| Backups/PITR                                                             | Expirar pelo ciclo normal; impedir restauração operacional sem reaplicar exclusões         | Desconhecido                                                                       | Confirmar política real do projeto/plano Supabase                        |

### Decisão do controlador registrada em 10/11/2026

O responsável pelo SkillUp aprovou a exclusão dos dados pessoais e privados da conta, a anonimização ou desvinculação necessária para preservar dados de terceiros e a eliminação dos certificados e registros acadêmicos do titular. A confirmação deverá informar com destaque que esses certificados e registros deixarão de existir e de ser verificáveis. Prazos legais, backups e eventuais obrigações externas continuam sujeitos à revisão jurídica; esta decisão não autoriza deploy em produção.

## Arquitetura recomendada para os próximos lotes

1. **Lote 2 — interface sem efeito destrutivo:** rota em Configurações/Privacidade, explicação honesta, autenticação recente e confirmação. O botão final usa um stub controlado até o backend existir.
2. **Lote 3 — orquestrador seguro:** Edge Function autenticada, tabela de solicitações/etapas com acesso administrativo, idempotência, lock por usuário e Auth removido por último. Nenhuma credencial administrativa no Vite.
3. **Política por relacionamento:** migration revisada para funções de anonimização/exclusão em transação. Não alterar todas as FKs para cascade.
4. **Lote 4 — arquivos e cliente:** apagar prefixos do usuário em buckets pessoais; tratar materiais compartilhados separadamente; centralizar chaves locais e limpar IndexedDB por `owner`.
5. **Reconciliação:** cada etapa deve poder ser repetida; falha de Storage ou Auth mantém estado acionável sem anunciar conclusão.
6. **Lote 5 — retenção:** aprovar a matriz, confirmar backups/PITR no painel/contrato Supabase e somente então criar tarefas agendadas.
7. **Lote 6 — testes:** usar apenas projeto Supabase isolado e contas sintéticas; cobrir FKs, relações entre dois usuários, falhas parciais, Storage, sessão expirada e acesso cruzado.
8. **Lote 7 — produção:** migrations e Edge Function passam por revisão, backup e homologação; execução em produção exige aprovação explícita.

## Critérios de entrada do Lote 2

- Aprovação deste inventário e autorização explícita para avançar.
- Definição do texto provisório da interface sem prometer prazo ainda não aprovado.
- Decisão sobre autenticação recente: por exemplo, reautenticação por senha ou novo OAuth, sem considerar apenas a idade do componente React.
- Confirmação de que o Lote 2 continuará sem chamar exclusão real.

## Validação do Lote 1

- Revisão estática das migrations, políticas, serviços e armazenamento local: concluída.
- Busca por mecanismos existentes de exclusão de Auth: nenhum encontrado.
- Alterações destrutivas ou acesso a produção: não realizados.
- Testes automatizados: não aplicáveis a código funcional neste lote; apenas documentação foi criada.
- Pendências: validar constraints no banco realmente implantado, política/recursos do plano Supabase, bases legais, prazos e tratamento de adolescentes.

**Status do Lote 1: concluído tecnicamente, pendente de revisão jurídica e autorização para iniciar o Lote 2.**

## Lote 2 — interface de exclusão sem efeito destrutivo

### Implementação

- Criada a rota autenticada `/app/config/privacidade`, acessível pela opção Privacidade das configurações.
- Adicionada uma seção “Excluir minha conta” com explicação sobre exclusão, anonimização e retenções ainda sujeitas a validação jurídica.
- Incluído aviso explícito de que o backend ainda não está conectado e de que nenhuma conta será excluída neste lote.
- Contas reais têm a data da última autenticação consultada pela sessão do Supabase. A confirmação só é liberada quando o login ocorreu nos últimos 10 minutos.
- Quando a autenticação não é recente, a interface oferece sair e entrar novamente. O modo de demonstração permanece bloqueado porque não representa uma conta real.
- A confirmação exige digitar `EXCLUIR`, apresenta estados de carregamento/erro e termina em uma mensagem de prévia sem enviar solicitação ao servidor.
- O modal reutiliza os componentes e estilos existentes, preservando foco, fechamento por teclado, responsividade e identidade visual do SkillUp.

### Arquivos do lote

- `src/App.tsx`
- `src/pages/Settings.tsx`
- `src/styles/global.css`
- `tests/account-deletion-ui.test.tsx`
- `docs/EXCLUSAO-RETENCAO-LOTES.md`

### Limites e pendências

- Não há chamada de exclusão, mutation, Edge Function, alteração de RLS, migration ou credencial administrativa neste lote.
- A idade da autenticação é uma barreira de interface, não uma autorização de servidor. O Lote 3 deverá validar novamente a identidade e a sessão no backend.
- O retorno automático à tela de privacidade depois de um novo login e a reautenticação específica de cada provedor devem ser integrados ao contrato seguro do backend.
- Os textos e prazos de retenção continuam dependendo de aprovação do controlador e revisão jurídica.

### Validação do Lote 2

- `npm run check`: aprovado.
- `npm run test -- tests/account-deletion-ui.test.tsx`: 2 testes aprovados. A cobertura inclui confirmação digitada, ausência de logout/exclusão na prévia e bloqueio de login com mais de 10 minutos.
- `npm run build`: aprovado. O Vite apenas informou o aviso já existente de chunk principal acima de 650 kB.
- `npm run test`: 180 testes aprovados e 13 falharam em oito arquivos fora do escopo deste lote. As falhas observadas são expectativas antigas de texto/estado em atividades, fluxos, cadastro, portfólio, prática e introdução de trilha; o teste específico deste lote passou na mesma execução.

**Status do Lote 2: concluído. O Lote 3 não foi iniciado e depende de nova autorização explícita.**

## Lote 3 — backend seguro

### Implementação

- Criada a Edge Function `delete-account`. Ela aceita apenas `POST`, valida a origem configurada, exige token Bearer válido por `auth.getUser`, limita o corpo e exige a confirmação exata `EXCLUIR`.
- A identidade usada no processamento vem exclusivamente do token validado. IDs enviados no corpo são ignorados, impedindo que uma pessoa solicite a exclusão de outra conta.
- A autenticação precisa ter ocorrido nos últimos 10 minutos. A Edge Function verifica `last_sign_in_at` e a RPC repete a verificação diretamente em `auth.users`.
- A chave `SUPABASE_SERVICE_ROLE_KEY` é lida somente pela Edge Function. Ela não foi adicionada ao Vite, ao frontend ou ao repositório.
- Criada a tabela privada `private.account_deletion_requests`, inacessível a `anon` e `authenticated`, com estado, etapa atual, tentativas, código de erro e horários mínimos para reconciliação.
- Solicitações são idempotentes por usuário e protegidas com advisory lock transacional. Repetir a chamada devolve o pedido ativo, sem criar duplicatas.
- O identificador de auditoria é um SHA-256 do UUID. Depois da conclusão, a RPC exige remover o UUID e manter apenas o hash e os metadados mínimos.
- As RPCs administrativas são executáveis apenas por `service_role`. A conclusão exige o estado `ready_for_auth_deletion`.
- A remoção em Supabase Auth está posicionada depois da preparação dos dados. Se a preparação não declarar que todas as etapas foram concluídas, a Edge Function não chama `auth.admin.deleteUser`.
- Há duas travas para execução: `ACCOUNT_DELETION_EXECUTION_ENABLED=true` e a autorização retornada pelo banco. A trava do banco permanece fechada como `awaiting_policy_review`.

### Arquivos do lote

- `supabase/migrations/202611100001_account_deletion_orchestrator.sql`
- `supabase/functions/delete-account/index.ts`
- `supabase/functions/_shared/accountDeletion.ts`
- `supabase/config.toml`
- `scripts/test-rls.mjs`
- `tests/account-deletion-backend.test.ts`
- `docs/EXCLUSAO-RETENCAO-LOTES.md`

### Configuração para homologação futura

- Aplicar a migration somente em um projeto Supabase isolado e revisar o diff antes de qualquer implantação.
- Publicar a função `delete-account` sem desativar as validações implementadas pela própria função.
- Configurar `ALLOWED_ORIGINS` com origens exatas separadas por vírgula, sem caminhos. Exemplo local: `http://localhost:5173`.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` são fornecidos como secrets da Edge Function. A service role nunca deve ser criada como variável `VITE_*`.
- Manter `ACCOUNT_DELETION_EXECUTION_ENABLED` ausente ou `false`. Defini-la como `true` ainda não permite exclusão porque o banco mantém a trava jurídica fechada.
- Não houve deploy, aplicação de migration remota nem uso de conta real neste lote.

### Validação do Lote 3

- `npm run test:rls`: 62 de 62 verificações aprovadas. O teste novo confirma isolamento da tabela privada, RPCs exclusivas de `service_role`, autenticação recente, idempotência e bloqueio da conclusão.
- `npm run check`: aprovado.
- Testes direcionados dos Lotes 2 e 3: 6 de 6 aprovados.
- `npm run build`: aprovado. Permanece apenas o aviso já conhecido do Vite sobre o tamanho do chunk principal.
- `npm run test`: 184 testes aprovados e 13 falharam em oito arquivos fora do fluxo de exclusão. As falhas continuam concentradas em expectativas antigas de rótulos e estados; os seis testes direcionados da exclusão passaram separadamente.

### Bloqueio e riscos restantes

- A matriz de retenção é preliminar e ainda não foi aprovada. Por isso, nenhuma linha de negócio é excluída ou anonimizada e nenhuma identidade Auth pode chegar ao estado de remoção.
- Não é seguro decidir por código se mensagens, certificados, registros acadêmicos, candidaturas e conteúdo profissional devem ser apagados, anonimizados, transferidos ou retidos.
- Storage e dados do dispositivo pertencem ao Lote 4 e não foram modificados.
- A Edge Function ainda não está conectada à interface; essa integração pertence ao Lote 6.
- A substituição da trava `prepare_account_deletion` exige uma migration revisada depois da aprovação da matriz. Essa migration deverá implementar e testar cada relação antes de permitir `ready_for_auth_deletion`.

**Status do Lote 3: parcial e bloqueado pela aprovação da política de retenção. O backend de solicitação e controle está pronto e testado; nenhuma exclusão real está habilitada. O Lote 4 não foi iniciado.**
