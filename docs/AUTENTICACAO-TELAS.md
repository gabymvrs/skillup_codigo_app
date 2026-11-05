# Autenticação — atualização de 20/10/2026

Referência recebida: `SkillUp wireframe (21)(2).zip`, 67 PDFs. Foram extraídas e inspecionadas visualmente as 16 pranchas `Acesso`: oito mobile e oito web. Os textos também foram extraídos. As demais áreas não fazem parte desta alteração.

## Inventário e correspondência

Cada linha representa as versões `Mobile · Acesso · …` e `Web · Acesso · …` do arquivo.

| Tela de referência | Elementos documentados | Implementação |
|---|---|---|
| Tela inicial | Logo, Bem-vindo, criar conta, entrar, ajuda, termos, privacidade, políticas | `/`, componentes compartilhados de autenticação |
| Login | E-mail, senha, não tenho conta, Fazer Login, Facebook, Google, rodapé | `/login`, login Supabase, senha com visibilidade controlada, OAuth condicionado à configuração real |
| Cadastro | Estudante, Instituição, Docente, Recrutador, já tenho conta | `/perfis`, na ordem do wireframe |
| Cadastro estudante | E-mail, senha, já tenho conta, carteira de estudante, Completar Cadastro, voltar | `/cadastro/estudante`, seleção local de arquivo; envio autenticado em `/cadastro/documentos` |
| Cadastro docente | Instituição vinculada, Declaração Institucional, Carteira de trabalho, concluir, voltar | `/cadastro/documentos`, solicitação de docente da conta autenticada |
| Cadastro recrutador | Declaração Institucional, Contrato social, CNPJ/CPF, declaração de responsabilidades, concluir | `/cadastro/documentos`, checkbox com texto acessível e confirmação persistida como autodeclaração |
| Cadastro Instituição 1/2 | Razão Social, CNPJ, CNAE, Declaração institucional, Avançar | `/cadastro/documentos`, primeira etapa, validação antes de avançar |
| Cadastro Instituição 2/2 | Alvará de funcionamento, Contrato social, Credenciamento no MEC, concluir | `/cadastro/documentos`, segunda etapa, retorno preserva campos e arquivos na memória |

O logo de autenticação foi extraído da região visível do PDF de Login. A imagem anterior incluía fundo azul e texto adicional não presentes nessa região do protótipo; ela permanece disponível para outros locais. Os cinzas `#f1f1f1`, `#696868` e `#898989` foram obtidos das cores de preenchimento do PDF. O azul primário permanece o token documentado `#081998`. Lexend, logo centralizado, formulários estreitos, botões arredondados e espaçamentos seguem as referências. O CSS é isolado em `src/styles/auth.css`.

## Decisões de implementação e diferenças explícitas

- As telas profissionais não mostram a criação de credenciais. Foi adicionada uma etapa anterior de e-mail e senha para os três perfis; depois da confirmação, o usuário acessa a tela documental correspondente.
- O wireframe não define quando enviar arquivos em relação à confirmação do e-mail. A seleção inicial de carteira é opcional, fica somente na memória e expira em 30 minutos. Nenhum documento é enviado anonimamente. Outra aba ou recarga exige nova seleção, com aviso na interface.
- Carteira de estudante opcional preserva o comportamento anterior, pois o arquivo não especifica obrigatoriedade. Documentos profissionais são exigidos pelo formulário para concluir a solicitação; não concedem cargos.
- O nome completo e a confirmação de senha extras foram retirados da tela inicial de cadastro para acompanhar o wireframe. O nome continua editável no perfil; o banco usa seu valor padrão até ser atualizado. Recuperação de senha mantém confirmação da nova senha.
- Mostrar/ocultar senha, ajuda sobre tamanho/formato de arquivo, erro, carregamento, recuperação, reenvio de confirmação, acessibilidade e disponibilidade de OAuth complementam estados não documentados. O contraste dos placeholders foi aumentado para leitura.
- Os ícones de perfil são SVGs Lucide equivalentes, não uma extração vetorial exata dos ícones do Figma. Não há emojis.
- Textos definitivos de termos/privacidade/políticas e a redação da Declaração de responsabilidades não foram fornecidos. Os diálogos dizem isso claramente; a declaração provisória deve ser revisada pelo responsável antes de produção.
- O aceite do recrutador é salvo em metadata da própria conta, com versão e data, como autodeclaração. Metadata editável não é prova de aprovação, autorização ou auditoria imutável. Privilégios continuam vindo de `user_roles` e das políticas RLS.
- Um documento só aparece como armazenado após confirmação do Storage **e** do vínculo na solicitação. Falha no vínculo tenta remover a cópia enviada; falha de limpeza é informada. Substituições removem a cópia anterior depois de salvar a nova.
- Uploads usam o bucket privado existente `profile-documents` e caminhos por usuário/solicitação. PDF, PNG e JPEG de até 5 MB; sem mudança de permissões. A escolha de perfil nunca aprova o próprio cargo.
- O retorno da confirmação oferece continuar o cadastro. `/login?cadastro=1` leva à documentação após entrar; configurações também têm acesso ao fluxo. O acesso comum continua levando à Home.

## Configuração e publicação

Não há migration nova nesta alteração: requer as migrations 001–006 já existentes. O domínio atual da Vercel precisa continuar autorizado no Supabase para `/auth/callback` e `/redefinir-senha`.

Consulta somente de leitura ao endpoint público `/auth/v1/settings` do projeto configurado: HTTP 200, `external.google=false`, `external.facebook=false`. Os dois botões ficam desabilitados com explicação. A interface consulta essa disponibilidade em runtime: habilitar os provedores corretamente no Supabase permite usar o OAuth sem inventar sessão nem colocar segredos de provedores no front-end.

## Validação

- Testes de interface e serviços com contratos Supabase simulados: **69 aprovados**. Incluem os quatro cadastros, rejeição de credenciais/cadastro, OAuth habilitado/desabilitado, visibilidade de senha, recuperação e MFA, retorno entre etapas, preservação de arquivos, aceite do recrutador, bloqueio de upload em demo, tipos/tamanhos, usuário confirmado, propriedade da solicitação, falha do Storage, rollback e falha de limpeza.
- Testes SQL/RLS: **29 aprovados** com `npm run test:rls`, resultado em `rls-results.json`.
- Build TypeScript/Vite: **aprovado** com `npm run build`; permanece aviso de tamanho do bundle. Os resultados finais estão registrados em `TESTES.md`.
- Os PDFs originais foram renderizados e inspecionados. A interface implementada foi testada em DOM simulado; **ainda não foi capturada em navegador para comparação visual lado a lado** nem validada fisicamente em Android/iOS/Chromebook.
- Não foram criadas contas reais, enviados e-mails ou documentos pessoais durante estes testes. Os testes simulados não comprovam entrega de e-mail, configuração do provedor ou autorização dos redirects do deployment.

Limitação da inspeção visual: a skill Sites instrui, no ambiente gerenciado, a não iniciar preview nem improvisar controle de navegador quando `control-browser` não está disponível. Essa capacidade não está disponível nesta sessão. A implementação e a publicação prosseguem com testes de interface, TypeScript e SQL, sem declarar aprovação visual completa.

### Verificação manual restante

Abrir `/`, `/perfis`, `/login` e os quatro `/cadastro/:role` em 320, 393, 768 e 1440 px. Confirmar e-mail de teste e conferir os documentos dos quatro perfis, inclusive ida e volta das duas etapas da instituição, upload com falha/retry, teclado, zoom e mensagens de erro. Aprovação profissional continua sendo operação administrativa separada no servidor.
