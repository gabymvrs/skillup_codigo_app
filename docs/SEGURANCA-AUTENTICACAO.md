# Revisão de autenticação — 20/10/2026

## Resultado e escopo

Revisão do código da branch `dev/skillup-modular-20261019`, políticas SQL executadas em PostgreSQL via PGlite, testes DOM com API Auth simulada e sondagens HTTP sem autenticação no projeto Supabase informado pela responsável. Não é certificação de segurança nem teste de invasão completo.

A atualização do cliente será distribuída pelo deployment da branch. **A migration 006 ainda precisa ser executada no Supabase hospedado.** Apenas a chave pública está disponível; ela não permite modificar funções, políticas ou configurações administrativas do Auth.

## Evidências no ambiente hospedado

- `/auth/v1/settings`: HTTP 200; provedor e-mail ativo; cadastro habilitado; confirmação de e-mail obrigatória (`mailer_autoconfirm=false`); acesso anônimo desativado.
- GET em `profiles`, `user_roles`, `support_tickets` e `experiences`, com chave pública e sem sessão, retorna HTTP 401 / SQLSTATE 42501. Consultas usaram `limit=0`, sem coletar dados pessoais.
- `/auth/v1/user` sem token de sessão: HTTP 401.
- `/storage/v1/bucket` sem sessão: lista vazia. Isso não comprova sozinho a privacidade de todos os objetos; as regras de Storage foram verificadas no SQL local.
- O deployment informado (`skillup-codigo-4gulseyg4-gabymaveira-5664s-projects.vercel.app`) redireciona para login da Vercel. O HTML/cabeçalhos dessa página pertencem à Vercel e não foram usados como evidência da segurança do aplicativo.
- Não foram criadas contas, enviadas mensagens de recuperação ou realizadas tentativas repetidas de senha no serviço real.

## Correções

1. **Sessões revogadas e estado da conta:** migration `202610200006_session_security.sql` substitui `private.session_allowed()`. Exige conta com e-mail confirmado, não anônima, não banida, perfil provisionado e `session_id` correspondente à própria conta em `auth.sessions`. Recusa sessões cujo `not_after` expirou. Mantém exigência de AAL2 para contas com fator verificado. A função é usada pelas políticas restritivas de todas as tabelas do app, políticas de arquivos e RPCs autenticados. Antes, o helper conferia identidade e MFA; um JWT podia continuar aceito até expirar após logout. Consultar a sessão acrescenta uma leitura indexada no Auth; esse custo é aceito para esta implantação. Não implementa um prazo de inatividade próprio.
2. **Estado do cliente:** restauração inicial permanece em carregamento; eventos recentes prevalecem sobre respostas antigas; respostas tardias de consulta de perfil não reabrem acesso após logout. Permissões/MFA são revalidados quando o token muda, inclusive para a mesma conta.
3. **Demonstração:** implantação com Supabase configurado só habilita demonstração com `VITE_ENABLE_DEMO=true` explícito. Confirmação e recuperação reais substituem a identidade demonstrativa. O callback não afirma que uma sessão de demonstração foi autenticada. Selecionar demonstração não troca o perfil de uma sessão real.
4. **Senha e MFA:** tela de troca de senha pede o segundo fator quando necessário e não oferece troca para identidade de demonstração. Após sucesso, executa logout global explícito e solicita novo login. O backend Auth continua sendo responsável pela autorização da atualização de senha; controles de tela não substituem o servidor.
5. **Testes isolados:** a suíte DOM ignora as credenciais de `.env.local`. Uma primeira execução identificou que o teste de ambiente não configurado estava herdando a URL real; o isolamento foi corrigido, e a suíte completa passou.

## Proteções existentes preservadas

- PKCE, renovação de sessão pelo SDK e senhas tratadas pelo Supabase Auth.
- Papel efetivo em `user_roles`, protegido por RLS e privilégios de coluna; `user_metadata` não concede privilégios. Novo cadastro sempre começa como estudante; perfil profissional gera solicitação pendente.
- Nenhuma chave administrativa adicionada ao cliente/repositório. A chave `sb_publishable_` é pública por definição; RLS controla o acesso.
- Isolamento entre pessoas e instituições, avaliação/XP no servidor, Storage privado e MFA obrigatório no banco quando cadastrado.
- React renderiza textos sem inserção de HTML arbitrário; CSP configurada restringe scripts à própria origem e impede incorporação em frames. Não há uso de `dangerouslySetInnerHTML`, `eval` ou `document.write` no código de produção revisado.

## Verificação

- `npm test -- --reporter=default --reporter=json --outputFile=docs/ui-test-results.json`: **52/52**.
- `npm run test:rls`: **29/29**; SQL real, schemas Auth/Storage de teste simulados.
- Regressões SQL cobrem confirmação pendente, banimento, conta anônima, sessão revogada/expirada/de outra conta, ausência de identificador de sessão e ausência de perfil. Verificam bloqueio de leitura, escrita, RPC e arquivos, além de MFA e das permissões dos quatro perfis.
- `npm run build`: passou (aviso de tamanho do bundle com integração real habilitada; não é erro de segurança).
- `npm audit --omit=dev --json`: **0 vulnerabilidades conhecidas** reportadas nas dependências de produção nesta execução. Isso não garante ausência de vulnerabilidades não publicadas.

## Ativação e limites pendentes

1. Com 001–005 já aplicados, executar **somente 006** no SQL Editor. Não excluir tabelas nem repetir o esquema inicial.
2. Abrir o novo deployment da branch na Vercel. As variáveis públicas precisam estar disponíveis em Preview. URLs de callback devem corresponder ao endereço realmente usado. Preferir um endereço estável da branch para evitar reconfigurar a cada deployment.
3. No painel Auth, revisar regras de senha (recomendação: mínimo 12 caracteres), troca segura de senha/reauthentication, confirmação segura da troca de e-mail, limites de tentativas/envio, SMTP e expiração de links. Esses ajustes administrativos não foram lidos nem alterados com a chave pública. O formulário atual aceita mínimo de 8 caracteres; a política efetiva é do servidor.
4. Antes de abrir cadastros ao público, avaliar CAPTCHA com integração completa e testar a entrega de e-mail. Nenhum CAPTCHA é declarado ativo nesta revisão. Proteção contra senhas vazadas pode depender do plano contratado.
5. Testar no navegador autorizado: cadastro, confirmar e-mail no mesmo navegador do fluxo PKCE, login, logout, recuperar senha, login com a nova senha, MFA e os quatro perfis com contas de teste aprovadas. Testes autenticados no projeto hospedado ainda não foram realizados.
6. Sessões no navegador usam o armazenamento do SDK. Arquivos autorizados podem existir offline no dispositivo; não há criptografia de disco. Logout pela tela de configurações remove as cópias locais previstas pelo app. Controle do dispositivo e prevenção de XSS continuam relevantes.
7. Sem acesso administrativo ao Supabase e sem atravessar o login da Vercel, não é possível confirmar todas as configurações nem declarar o fluxo publicado homologado.

## Referências primárias

- https://supabase.com/docs/guides/auth/sessions — JWT, `session_id` e verificação de revogação.
- https://supabase.com/docs/guides/auth/password-security — política de senhas e controles administrativos.
- https://supabase.com/docs/guides/auth/auth-mfa — exigência de MFA com RLS.
- https://supabase.com/docs/guides/database/postgres/row-level-security — autorização no banco.
