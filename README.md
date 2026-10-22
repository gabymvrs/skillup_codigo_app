# SkillUp

Aplicação de educação técnica em React, TypeScript e Vite, com quatro perfis, integração configurável com Supabase e demonstração local identificada.

Esta entrega é uma **branch de desenvolvimento para revisão**. Build e testes automatizados foram executados. Autenticação hospedada, e-mails, uploads reais, validação visual em navegador e homologação nos dispositivos ainda precisam de um ambiente configurado. Não é uma declaração de conclusão integral das 78 telas mencionadas no pedido.

## Começar

Requer Node.js **22.18+**; validado com Node 24.19.0 e npm 11.9.0.

```bash
git clone https://github.com/gabymvrs/skillup_codigo_app.git
cd skillup_codigo_app
git checkout dev/skillup-modular-20261019
npm ci
cp .env.example .env.local
npm run dev
```

Abra o endereço que o Vite imprimir. Sem credenciais, use **Explorar a demonstração** na tela inicial. Selecione Estudante, Docente, Recrutador ou Instituição. A demonstração não exige senha, não cria contas e não envia dados a empresas ou docentes reais. Os dados de exemplo ficam no navegador. Login real permanece indisponível até a configuração.

No Windows, copie `.env.example` para `.env.local` pelo explorador ou pelo editor. No Chromebook sem terminal, use o repositório na Vercel para abrir um Preview Deployment; o passo a passo está abaixo.

## Supabase

1. Crie um projeto de desenvolvimento separado. As migrations iniciais pressupõem um banco novo para este aplicativo. Não execute sobre tabelas de produção homônimas sem uma migração específica e backup.
2. Execute os arquivos em `supabase/migrations/`, na ordem numérica **001 → 006**, pelo SQL Editor ou por um fluxo de migrations da Supabase CLI.
3. Opcionalmente, execute `supabase/seed.sql`: oito matérias, 16 leituras, duas trilhas, dez módulos e quatro exercícios introdutórios. O seed não cria pessoas, vagas ou testemunhos como se fossem reais. Revise o conteúdo educacional antes de publicação institucional.
4. Preencha `.env.local`:

```dotenv
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUA_CHAVE_PUBLICA
VITE_ENABLE_DEMO=true
```

Uma chave legada `anon` também é aceita. Nunca coloque `service_role`, `sb_secret`, senha do banco ou tokens administrativos em variáveis `VITE_`. Chaves administrativas conhecidas são rejeitadas pelo cliente; a segurança efetiva depende das políticas SQL.

**Atualização de segurança (20/10/2026):** se os arquivos 001–005 já foram executados, rode apenas `supabase/migrations/202610200006_session_security.sql`. Ela verifica confirmação de e-mail, conta não anônima/não banida, sessão existente e não expirada, perfil provisionado e MFA nas políticas existentes. Não recrie o banco. Veja [a revisão de autenticação](docs/SEGURANCA-AUTENTICACAO.md).

5. Em Authentication, habilite o provedor de e-mail e **confirmação de e-mail**. Configure SMTP e limites para seu ambiente; não conte com entrega real antes de testar.
6. Configure Site URL e Redirect URLs para o domínio escolhido e, no desenvolvimento local, para `http://localhost:5173/auth/callback` e `http://localhost:5173/redefinir-senha`. No domínio publicado, use as mesmas duas rotas com HTTPS. Autorize cada domínio de preview usado. O cliente usa PKCE; conclua o link no navegador que iniciou o fluxo. Revise templates personalizados para preservar o redirecionamento da Supabase.
7. Reinicie o Vite após alterar variáveis. No Vercel, faça novo deployment: as variáveis são incorporadas durante o build.

### Perfis, vínculos e aprovação

Toda nova conta recebe **estudante** no banco. Escolher docente, recrutador ou instituição no formulário cria uma solicitação pendente; não concede privilégios.

Depois da confirmação de e-mail, a pessoa pode anexar documentos privados em Configurações → Verificação. O responsável pelo projeto deve analisar a solicitação e os documentos fora do cliente público. A aprovação é uma ação administrativa explícita no SQL Editor/backend confiável.

Use `supabase/provision-profile.example.sql` como roteiro: informe o UUID da conta, a organização e o perfil revisado. O arquivo aborta enquanto estiver sem UUID. Crie a organização pelo responsável do banco e vincule docentes/estudantes à mesma organização antes de matricular. Não há interface pública que conceda a si mesma permissões institucionais.

O aplicativo mantém uma organização principal por conta nesta versão. Turmas, matrículas, atividades e correções respeitam os vínculos. Os detalhes estão em [ARQUITETURA.md](docs/ARQUITETURA.md).

### Arquivos e mensagens

As migrations criam dois buckets privados: `learning-materials` (PDF/TXT, até 10 MB) e `profile-documents` (PDF/PNG/JPEG, até 5 MB). Os caminhos começam com o UUID de quem enviou. O aplicativo não gera URLs públicas para documentos pessoais.

Mensagens usam contas relacionadas por turma, gestão institucional ou candidatura. A migration habilita a tabela `messages` no Realtime, caso a publicação exista. A interface também permite atualização manual. Não há integração de e-mail, WhatsApp ou push para essas mensagens.

O bot salva resumos pessoais. Um estudante pode **confirmar** o compartilhamento com o docente de sua turma. Somente após o RPC confirmar a gravação a interface mostra o compartilhamento; a disponibilidade e o prazo de resposta do docente não são garantidos.

## Publicar na Vercel

1. Conecte o repositório pelo painel da Vercel e selecione a branch de desenvolvimento para revisão. Preserve `main` até aprovar as diferenças e os testes pendentes.
2. Framework: **Vite**; diretório raiz: repositório; comando de build: `npm run build`; saída: `dist`; Node: 24.x ou outra versão compatível com `engines`.
3. Defina as variáveis públicas do Supabase para o ambiente Preview. Configure as Redirect URLs com o domínio do deployment que será testado.
4. Abra o preview e percorra o roteiro de [TESTES.md](docs/TESTES.md), inclusive reload de rotas internas, login de cada perfil e acesso offline.
5. Após homologação, integre a branch à `main` e configure as variáveis e URLs específicas de Production. Em uma implantação com Supabase configurado, a demonstração só aparece se `VITE_ENABLE_DEMO=true` for definido explicitamente. Use `false` para desabilitá-la.

`vercel.json` contém o fallback das rotas SPA, cabeçalhos e política de conteúdo. A política permite o domínio padrão `*.supabase.co`; ajuste `connect-src` e `img-src` caso use um domínio próprio para o Supabase. O Service Worker exige HTTPS ou localhost.

## Offline

- O Service Worker é gerado apenas no build de produção. Seu hash considera os arquivos públicos do build. Ele guarda shell, fonte e imagens, sem cachear respostas da API, credenciais ou documentos pessoais.
- **Salvar no app** grava o material autorizado no IndexedDB por conta. O status só muda depois da confirmação da transação e releitura do registro.
- **Baixar arquivo / Exportar leitura** prepara um download pelo navegador. Isso é diferente de guardar uma cópia na biblioteca do aplicativo; o app não afirma que o usuário concluiu o salvamento no sistema operacional.
- A biblioteca em `/offline` abre as cópias existentes sem carregar todo o banco. É necessário ter acessado o app online antes e manter a identificação da conta no dispositivo.
- Conclusões de módulos feitas sem rede entram numa fila. O servidor valida os pré-requisitos antes de confirmar; XP não é concedido localmente no modo real.
- Sair remove as cópias e a fila daquela conta. A demonstração mantém seus dados de exemplo para retomada. O navegador pode remover armazenamento sob pressão; não substitui backup. IndexedDB não é criptografia de disco.

Para testar a versão de produção localmente: `npm run build` e depois `npm run preview`. Não teste Service Worker usando apenas `npm run dev`.

## Comandos

| Comando            | Resultado                                                             |
| ------------------ | --------------------------------------------------------------------- |
| `npm run dev`      | Desenvolvimento local                                                 |
| `npm run check`    | Verificação TypeScript                                                |
| `npm test`         | Fluxos DOM, contrato de autenticação simulado, armazenamento e lógica |
| `npm run test:rls` | Migrations, seed e políticas executados em PostgreSQL via PGlite      |
| `npm run build`    | TypeScript, bundle de produção e Service Worker versionado            |
| `npm run preview`  | Servir o build para homologação local                                 |
| `npm run format`   | Formatar código e testes com Prettier                                 |

## Entrega e rastreabilidade

- [Inventário das referências](docs/INVENTARIO.md): 67 PDFs recebidos e 27 pranchas do case, componentes e decisões.
- [Mapa de rotas](docs/ROTAS.md).
- [Arquitetura e autorização](docs/ARQUITETURA.md).
- [Comparação por tela](docs/COMPARACAO.md): implementação, diferenças e pendências visuais.
- [Funcionalidades e pendências](docs/ENTREGA.md).
- [Resultados e roteiro de testes](docs/TESTES.md).

O código anterior foi preservado, sem alterações de conteúdo, em `legacy/`. A importação opcional em Configurações recupera nome e etapas de `skillup_fidelity` apenas para a demonstração. Ela não transforma dados locais antigos em XP ou certificados reais.

Referências técnicas usadas: [Vite na Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) e [Storage privado](https://supabase.com/docs/guides/storage/buckets/fundamentals). Configurações de provedor e plano devem ser confirmadas no ambiente da implantação.

### Telas de autenticação e documentação por perfil

As telas de acesso foram atualizadas com base nas 16 pranchas mobile/web do ZIP de referência. Veja o [inventário e as diferenças](docs/AUTENTICACAO-TELAS.md). Cadastro por e-mail e senha, confirmação, seleção dos quatro perfis e documentação privada estão integrados; a instituição tem duas etapas. Não há SQL adicional além das migrations 001–006.

Google e Facebook são exibidos no login e habilitados apenas quando o endpoint público de configurações do Supabase confirma o provedor ativo. Configure os provedores no painel Supabase e mantenha o domínio atual da Vercel autorizado para `/auth/callback`. Nunca adicione segredos de provedores ao front-end. A Declaração de responsabilidades é provisória e precisa de revisão do responsável antes da produção.

### Atualização de aprendizagem, suporte e perfil — outubro/2026

Veja [o inventário, alterações, testes e instruções de atualização](docs/EVOLUCAO-OUTUBRO.md).
Em projetos já configurados com migrations 001–006, aplique **somente a migration 007** e depois o `supabase/seed.sql` atualizado. Não recrie o banco. A atualização adiciona ranking semanal, XP/ofensivas, fotos privadas, leituras e trilhas independentes. A homologação visual e o teste com o Supabase hospedado ainda precisam ser concluídos antes de produção.

### Práticas, exames e interação — 22/10/2026

[Alterações e validação](docs/PRATICAS-EXAMES.md): avisos fecháveis, chama laranja, blocos de 5–6 questões, dois exames avançados de 10 questões com navegação/revisão e interesse reversível. Se a migração 007 já foi aplicada, basta executar o **seed.sql atualizado**, sem reaplicar migrations.
