# Escopo entregue e pendências

Esta branch entrega um aplicativo executável e modular para desenvolvimento/homologação. Não declara o produto integralmente concluído, as 67 telas visualmente aprovadas, autenticação real validada ou serviços externos integrados.

## Implementado no código

| Área | Comportamento implementado |
|---|---|
| Acesso | Boas-vindas, quatro cadastros, login antes do app, confirmação/reenvio de e-mail, recuperação, nova senha, logout, sessão persistente, proteção de rotas e MFA TOTP |
| Perfis | Experiências distintas, associação no servidor, solicitações/documentos privados e roteiro de aprovação administrativa |
| Navegação | Cinco abas, subabas de aprendizagem/social, sidebar desktop, estados ativos e safe area |
| Home | Progresso/nível, módulo, continuidade, agenda com edição/exclusão, preferência de estudo, conquistas e carreira; variantes por papel |
| Materiais | Oito matérias, recentes, busca, leitor, publicação de texto e arquivos, exportação, biblioteca offline e remoção confirmada |
| Prática | Quatro categorias com exemplos, resposta/feedback, XP sem duplicação, laboratório numérico, histórico e atividades da turma |
| Trilhas | Catálogo, criação de trilha/módulo, sequência e pré-requisito validados, conclusão idempotente e continuidade |
| Ensino | Turmas, matrícula institucional, atividades, envio/edição antes de corrigir, nota e feedback vinculados ao docente |
| Suporte | Bot determinístico, intenção/perguntas/urgência, resumo/cópia com alternativa manual, FAQ buscável, histórico e fila de dúvidas compartilhadas explicitamente com docente |
| Social | Feed, fóruns, categorias, posts/comentários/curtidas, projetos/participação, histórias e ranking opt-in de XP |
| Carreira | Busca/filtros, vagas salvas, detalhes, habilidades em comum com critério explícito, candidatura interna confirmada, histórico, retirada e gestão de status |
| Perfil profissional | Resumo, habilidades, portfólio e experiências com edição/remoção; acesso do recrutador a partir de candidatura |
| Conquistas | Etapas e trilhas concluídas; comprovante interno emitido por responsável e consultável por código |
| Mensagens | Conversas internas entre contas relacionadas, Realtime configurável e atualização manual |
| Gestão | Indicadores calculados e CSV, preferências, privacidade, exportação dos registros incluídos e notificações internas |
| Backend | 29 tabelas públicas, gabarito privado, chaves/índices/checks, cinco migrations, RLS, grants e RPCs |
| Offline | Service Worker de shell, cache versionado, IndexedDB confirmado por conta e fila de conclusão validada na reconexão |
| Preservação | 13 arquivos originais em `legacy/`, 16 leituras portadas, importação opcional de progresso antigo apenas para demo |

Os testes automatizados cobrem os fluxos listados em `TESTES.md`. A existência de uma implementação não significa teste real de todas as integrações ou aprovação visual.

## Precisa de ambiente e validação reais

| Pendência | O que falta |
|---|---|
| Supabase hospedado | URL, chave pública, migrations aplicadas e contas reais dos quatro perfis com vínculos revisados |
| Auth/e-mail | SMTP, confirmação, recuperação, reenvio, expiração, renovação, logout e MFA testados no projeto real |
| Storage | Testar limites, permissões, falhas, upload/download e acesso de outra conta contra a API real |
| Candidaturas e mensagens | Duas contas reais para verificar visibilidade, status, notificações e Realtime |
| Offline no navegador | Confirmar instalação/atualização do SW, PDF salvo, modo avião, reload, fila e isolamento/logout em Chrome/Safari |
| Fidelidade e responsividade | Capturas comparadas por tela em mobile/web; ausência de overflow e sobreposição em dispositivos reais |
| Acessibilidade | Teclado completo, foco nativo dos diálogos, leitor de tela, contraste, zoom 200% e teclado virtual |
| Deploy | Preview Vercel, variáveis, Redirect URLs, deep links e cabeçalhos validados |

Não há credenciais fornecidas para executar essas integrações. A skill Sites limita o preview à ferramenta control-browser, indisponível neste ambiente; por isso não foi feita validação visual em navegador.

## Ainda não desenvolvido como funcionalidade completa

- Simulados cronometrados com composição de provas, banco de questões editável, correção de respostas abertas por rubrica e recomendações adaptativas. A prática atual usa exemplos introdutórios e atividades publicadas pelo docente.
- Laboratórios com execução de Dart/JavaScript, hardware ou ambientes remotos. O laboratório atual é uma simulação numérica de busca linear.
- Hospedagem/streaming de vídeos, podcasts e gerenciamento completo de slides. Upload atual: PDF/TXT; leituras estruturadas em texto.
- Agenda de entrevistas externa e videoconferência. A agenda interna permite criar, consultar, editar e excluir eventos próprios.
- Moderação de denúncias, busca global de pessoas, chat entre quaisquer membros, mural de tarefas e arquivos de projetos colaborativos.
- Diretório verificado de empresas/parceiros, campanhas, convites corporativos, onboarding de equipe e múltiplas organizações por conta.
- Indicadores de frequência, empregabilidade efetiva ou séries históricas vindas de sistemas institucionais. Percentuais de compatibilidade algorítmica não são inventados.
- Certificação oficial, assinatura digital, blockchain, selo reconhecido por empregadores ou integração MEC/SENAI. O comprovante é interno.
- OAuth, notificações push, automação de e-mail, atendimento humano com escala/SLA e IA generativa no bot.
- Interface administrativa de aprovação de cargos/documentos, logs/auditoria completos, troca de e-mail, recuperação/remoção de MFA, exclusão definitiva de conta e fluxo completo de retenção de dados. O exportador atual inclui perfil, experiências, progresso, tentativas, posts, comentários, candidaturas, suporte e agenda; não deve ser anunciado como portabilidade regulatória completa.
- Paginação visível e carregamento por rota para grande volume; teste de carga, observabilidade e moderação/antispam de produção.

Os termos, a política de privacidade e as responsabilidades institucionais definitivas precisam ser fornecidos pelo responsável. O rodapé informa que o conteúdo atual é de desenvolvimento, sem declarar uma conformidade não verificada.

## Próximo marco de aceite

Configurar um projeto de homologação, executar o roteiro real dos quatro perfis e comparar visualmente cada referência. Depois, resolver as diferenças priorizadas pela autora antes de integrar à `main` ou chamar a aplicação de produto completo.
