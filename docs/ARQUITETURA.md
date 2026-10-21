# Arquitetura e decisões

## Organização

| Caminho | Responsabilidade |
|---|---|
| `src/App.tsx` | Rotas, composição de providers e recuperação de erro da interface |
| `src/pages/` | Páginas de autenticação, aprendizagem, social, carreira e gestão |
| `src/components/` | Componentes, shell, diálogos, suporte, experiências e agenda |
| `src/state/AuthContext.tsx` | Sessão, perfil de servidor, MFA e modo demo separado |
| `src/state/DataContext.tsx` | Carregamento, mutações, operações por RPC e sincronização |
| `src/services/repository.ts` | Persistência real ou demonstrativa, páginas completas dos registros acessíveis |
| `src/services/offline.ts` | IndexedDB, confirmação de gravação e fila por conta |
| `src/services/triage.ts` | Intenção, perguntas, urgência, orientações e resumo |
| `src/services/supabase.ts` | Cliente público configurável; rejeição de chaves administrativas conhecidas |
| `src/styles/` | Tokens transcritos e estilos responsivos reutilizáveis |
| `src/data/` | Catálogo didático e fixtures demonstrativas explícitas |
| `supabase/` | Cinco migrations, seed opcional e roteiro administrativo |
| `scripts/` | Build do Service Worker, geração do seed e testes SQL |
| `tests/` | Interações DOM, autenticação simulada, IndexedDB e lógica |
| `legacy/` | Arquivos originais preservados integralmente |

O bundle da demonstração contém respostas dos quatro exercícios de exemplo. O banco real corrige por RPC com gabarito na schema privada. Esses exercícios introdutórios não devem ser reutilizados como prova sigilosa ou certificação formal.

## Modelo relacional

| Domínio | Tabelas e relações |
|---|---|
| Identidade | `profiles → auth.users`; `user_roles → profiles, organizations`; `role_requests → profiles` |
| Aprendizagem | `materials → subjects, profiles, organizations`; `modules → tracks`, pré-requisito na mesma trilha; `progress → profiles, modules` |
| Prática | `attempts → profiles, questions`; `private.question_answers → questions` |
| Ensino | `classes → organizations, profiles`; `enrollments → classes, profiles`; `assignments → classes, profiles`; `submissions → assignments, profiles` |
| Comunidade | `posts → profiles`; `comments, reactions → posts, profiles`; `projects → profiles`; `project_members → projects, profiles` |
| Carreira | `jobs → profiles`; `applications, saved_jobs → jobs, profiles`; `experiences → profiles` |
| Acompanhamento | `study_events → profiles, classes`; `certificates → profiles, tracks`; `support_tickets → profiles` (autor e docente escolhido) |
| Comunicação | `messages → profiles` (remetente/destinatário); `notifications → profiles` |

Há 29 tabelas públicas, mais o gabarito privado. Índices cobrem os relacionamentos e os filtros usados pelas políticas. Conclusão por módulo, matrícula, candidatura por vaga, participação e primeiro prêmio de XP têm restrições de unicidade. Pré-requisitos precisam apontar para etapas anteriores da mesma trilha.

## Autorização

Todas as tabelas públicas têm RLS, grants explícitos e uma política restritiva para MFA. Se a conta possuir fator verificado, as tabelas e RPCs exigem `aal2`; ocultar a tela de MFA no cliente não libera dados.

O gatilho de cadastro cria estudante. `requested_role` é apenas uma solicitação. `user_roles` não tem grants de escrita para o navegador. `private.current_role()` consulta a associação do banco; `user_metadata` nunca decide permissões.

Operações protegidas são funções com `security definer`, `search_path` vazio, verificação de sessão/vínculo e execução revogada de `PUBLIC`:

- `complete_module`: valida trilha e pré-requisito; lock por usuário e conflito idempotente.
- `submit_answer`: consulta gabarito privado; repetições corretas não duplicam XP.
- `grade_submission`: aceita apenas docente/instituição responsável, nota 0–10 e feedback válido.
- `set_application_status`: aluno pode retirar; recrutador dono administra status; candidatura retirada não é reativada pelo recrutador.
- `issue_certificate`: exige vínculo e todos os módulos concluídos; gera registro interno.
- `route_support_ticket` e `answer_support_ticket`: compartilhamento explícito com docente da turma; somente destinatário vinculado responde.
- `community_leaderboard`: ranking de participantes que optaram por perfil público; somente nome e XP.
- `verify_certificate`: exceção pública; aceita UUID exato e retorna nome, trilha e emissão. O titular deve tratar o código como link de compartilhamento do registro.

Nomes de autores de posts/comentários e datas de criação relevantes são carimbados no servidor. Sem perfis fabricados por cliente nem status de candidatura/nota escritos diretamente.

Experiências são privadas para o titular e recrutadores das vagas às quais ele se candidatou. A confirmação de candidatura informa esse compartilhamento. Retirar uma candidatura altera seu estado; não apaga o registro nem revoga automaticamente a relação histórica com o recrutador. Política de retenção e exclusão precisa ser definida pela instituição.

## Offline e sessão

O cache do Service Worker guarda somente arquivos públicos listados no build, identificados por hash de conteúdo. Não intercepta Supabase, respostas privadas, blobs pessoais ou mutações. A nova versão respeita o ciclo normal do navegador; não força atualização de abas durante o uso.

IndexedDB usa uma chave `conta:material` e armazena texto, metadados e Blob quando aplicável. A transação precisa concluir; o registro é relido antes de anunciar disponibilidade. Remoção e logout afetam somente a conta correspondente. A fila guarda IDs de módulos, sem nota ou XP: o servidor valida a conclusão depois da reconexão.

Essa é uma estratégia de leitura offline, não uma réplica de todo o backend. Vagas, mensagens, publicações e cadastros reais dependem de rede. O primeiro acesso sem rede e sem shell previamente armazenado não é suportado. O navegador pode limpar dados; a interface não promete armazenamento permanente ou criptografia local.

## Responsividade e acessibilidade

Tokens de cor/tipografia vêm das pranchas 20–23. Preto e branco são superfícies/textos presentes nos vetores originais. Raios, foco e breakpoints são decisões registradas de implementação. Mobile usa áreas de toque de pelo menos 44 px, tab bar com safe area e reserva de espaço. O botão Dúvidas fica acima da tab bar. Desktop usa sidebar de 216 px, grids limitados e conteúdo de até 1160 px.

Há labels de formulário, mensagens de status/erro, `aria-current`, link para pular conteúdo, navegação de rota com foco, `<dialog>` nativo, retorno de foco e preferência por movimentos reduzidos. Cor não é o único sinal de erro ou estado. Acessibilidade assistiva real e contraste de todos os estados ainda precisam de homologação; testes DOM não comprovam WCAG integral.

## Limites de escala e operação

O repositório pagina consultas para não truncar indicadores em 300 registros, mas esta versão carrega o conjunto de dados permitido por conta no provider e o atualiza após mutações. Para grande volume, separar consultas por rota, paginação visível e agregações de servidor. Não houve teste de carga.

Não há upload de imagem arbitrária em publicações: as imagens atuais são assets extraídos das referências. Não há execução de código livre nos laboratórios. O laboratório implementado simula busca linear com entrada numérica validada.

Questões de exame, entrevistas por vídeo, parceiros, emissão oficial, moderação completa, exclusão/portabilidade regulatória, backups e governança não são simulados como serviços disponíveis. Consulte `ENTREGA.md` antes de liberar para uso institucional.
