# Testes executados e homologação pendente

## Resultado automatizado

Execução em Node 24.19.0, npm 11.9.0, Vitest/jsdom e PostgreSQL via PGlite. Nenhuma conta real de Supabase, empresa ou instituição foi usada. Data de trabalho: 19/10/2026 (America/Recife).

| Verificação | Resultado |
|---|---|
| TypeScript estrito + build Vite + geração de SW | Aprovado |
| Interface e lógica — Vitest | **42 testes aprovados**, 5 arquivos |
| Permissões e integridade — PostgreSQL/PGlite | **21 verificações aprovadas** |
| Navegador real / comparação visual | Não executado |
| Supabase hospedado, Auth, e-mails, Storage API e Realtime | Não executado |

Relatórios verificáveis: [`ui-test-results.json`](ui-test-results.json) e [`rls-results.json`](rls-results.json). O JSON de UI contém testes, duração, resultado e ambiente de arquivo; não é um relatório de screenshots.

Reproduzir:

```bash
npm ci
npm run build
npm test -- --reporter=default --reporter=json --outputFile=docs/ui-test-results.json
npm run test:rls
```

## O que foi realmente testado

| Arquivo / suíte | Casos |
|---|---|
| `flows.test.tsx` — 19 | Redirecionamento sem sessão; navegação das cinco abas nos quatro perfis; matéria/leitura/gravação; pré-requisitos; XP repetido; troca exclusiva Bot/FAQ; cópia manual após falha; discussão/comentário; filtro/participação em projeto; candidatura com consentimento; correção docente; perfil; experiência e confirmação de remoção; resposta de suporte atribuída; edição/exclusão de agenda; conversa sincronizada entre painel e página de suporte |
| `auth.test.tsx` — 10 | Rejeição de credencial; navegação após sucesso; contrato de cadastro dos quatro perfis; senhas divergentes; recuperação com falha; atualização de senha; reenvio de confirmação |
| `offline.test.ts` — 6 | Gravação confirmada de dados; isolamento por conta; autorização offline; falha de armazenamento sem falso sucesso; remoção/fila; HTML escapado |
| `triage.test.ts` — 4 | Intenção com acentos; perguntas/urgência/resumo; limites de mensagem; URLs HTTPS seguras |
| `sw.test.ts` — 3 | Precache e limpeza de versões; não interceptar dados privados/mutações; fallback offline e assets em runtime simulado |
| `test-rls.mjs` — 21 | Cadastro não concede cargo; autopromoção bloqueada; perfil próprio; isolamento institucional; matrícula; escrita indevida de vaga/XP; pré-requisito/idempotência; correção no servidor/XP único; autoria e nota de envios; correção vinculada; privacidade de candidato; experiências; status de candidatura; autoria de posts; mensagens relacionadas; documentos privados; emissão de comprovantes; acesso anônimo mínimo; suporte compartilhado; MFA; todas as tabelas com RLS |

O script SQL executa as cinco migrations e o seed no PostgreSQL real embarcado no PGlite. `auth.users`, `auth.uid`, JWT e tabelas Storage são stubs de teste. **Isso valida SQL/RLS, não o serviço Supabase Auth, o Storage HTTP ou a entrega de Realtime.**

Os testes de Auth substituem chamadas do SDK por mocks. Não comprovam envio de e-mails, login em uma conta real ou expiração de tokens. Os testes de SW simulam eventos e Cache API. Não comprovam instalação e funcionamento offline no navegador.

## Defeitos encontrados e corrigidos

- Política de vagas expandia recursivamente a de candidaturas. Consulta foi isolada em helper de servidor; candidatura e visibilidade passaram no PostgreSQL.
- O helper de ações apagava feedback dinâmico de conclusão. Agora preserva a mensagem do fluxo quando não foi fornecida mensagem fixa.
- Erro síncrono de IndexedDB podia deixar a conexão aberta. Transação aborta e fecha sem anunciar download concluído.
- Exclusão de post na demonstração deixava comentários/reações órfãos. Limpeza acompanha o comportamento de cascade do banco.
- Consultas limitadas a 300 registros poderiam produzir métricas incompletas. Agora percorrem páginas permitidas, sem cortar silenciosamente o conjunto.
- Títulos principais duplicados no catálogo institucional foram ajustados para hierarquia de seção.
- Cache dependia apenas do HTML de entrada. A versão agora considera o conteúdo de todos os arquivos públicos do build.

## Roteiro obrigatório antes da produção

| Etapa | Ação | Critério de aceite |
|---|---|---|
| 1. Cadastro | Criar quatro contas com e-mails de teste; confirmar; solicitar cargos | Sem conta ativa fictícia; profissionais pendentes continuam estudante |
| 2. Recuperação | Link válido, expirado e já usado; senhas divergentes; rede indisponível | Erro específico, sem falso sucesso; senha alterada somente por sessão válida |
| 3. Cargos | Aprovar no servidor; vincular duas organizações | Nenhuma autopromoção; nenhuma turma, documento, nota ou candidatura de organização indevida |
| 4. MFA | Configurar TOTP; sair/entrar; tentar consultar API com aal1 | Segundo fator exigido também pela RLS |
| 5. Aprendizagem | Publicar PDF/TXT, abrir, exportar, salvar e remover | Arquivo real íntegro; cópia offline só após commit; limite de tamanho respeitado |
| 6. Offline | Abrir build online, salvar leitura/PDF, desligar rede e recarregar `/offline` | Shell e material abrem; API não vira cache; logout remove apenas cópias da conta |
| 7. Sincronização | Concluir etapa offline e reconectar; repetir requisição | Confirmação só após servidor; sem XP duplicado |
| 8. Ensino | Matricular, publicar atividade, enviar, corrigir e tentar alterar nota pelo aluno | Nota protegida; feedback visível; envio corrigido não editável |
| 9. Social | Criar/remover post, comentar, curtir, criar/participar de projeto | Persistência, confirmação destrutiva, autoria correta, estados vazios e erro |
| 10. Suporte | Buscar FAQ; concluir triagem; copiar; compartilhar e responder com duas contas | Um painel por vez; consentimento; leitura restrita; resposta realmente persistida |
| 11. Carreira | Publicar vaga, salvar, candidatar, revisar, retirar | Consentimento; histórico real; recrutador vê somente suas candidaturas; sem reativar retirada |
| 12. Mensagens | Trocar mensagem entre relacionados e tentar conta sem vínculo | Atualização manual/Realtime; envio não autorizado bloqueado |
| 13. Responsividade | 320, 393, 768, 1024 e 1440 px; Android, iOS, Chromebook e desktop | Sem overflow; rótulos legíveis; safe area; FAB/tab bar não cobrem conteúdo |
| 14. Acessibilidade | Tab/Shift+Tab/Enter/Esc, leitor de tela, zoom 200%, contraste e movimento reduzido | Ordem e foco previsíveis; diálogo contém foco; erros anunciados; todas ações alcançáveis |
| 15. Referências | Captura mobile/web de cada linha em `COMPARACAO.md` | Diferenças medidas e aprovadas; não considerar concluída somente por build |
| 16. Deploy | Abrir deep link, atualizar página, versão nova do SW e falha de rede | Fallback correto, assets íntegros e sem erros reais de console/rede |

Não foram feitos teste de carga, auditoria externa de segurança, certificação WCAG ou teste de usabilidade com participantes. Não há resultado inventado para essas etapas.


## Atualização de autenticação — 20/10/2026

Após as correções de sessão: 52 testes do aplicativo e 29 verificações SQL passaram. Build aprovado; npm audit de produção sem vulnerabilidades conhecidas. Sondagens públicas no Supabase confirmaram bloqueio de tabelas privadas e confirmação de e-mail ativa. Fluxos autenticados no deployment ainda não foram homologados. Evidências e limitações: [SEGURANCA-AUTENTICACAO.md](SEGURANCA-AUTENTICACAO.md).
