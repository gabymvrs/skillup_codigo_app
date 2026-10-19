# Mapa de rotas

Todas as rotas `/app/*` passam por sessão, MFA quando configurado e consulta de `user_roles`. A restrição de dados e de ações continua no PostgreSQL, mesmo que a pessoa force uma URL ou altere o JavaScript. A demonstração fica separada e explicitamente identificada.

| Rota | Página / finalidade | Acesso |
|---|---|---|
| `/` | Boas-vindas | Público; redireciona sessão ativa |
| `/perfis` | Selecionar tipo de cadastro | Público |
| `/cadastro/:role` | Cadastro dos quatro perfis | Público; privilégios dependem de aprovação |
| `/login` | Login de e-mail e senha | Público |
| `/demonstracao` | Entrada explícita nos quatro exemplos | Quando habilitada |
| `/recuperar-senha` | Solicitar recuperação | Público |
| `/redefinir-senha` | Nova senha | Exige sessão de recuperação válida para a operação |
| `/auth/callback` | Confirmação, erro de link e reenvio | Público; SDK verifica a sessão |
| `/ajuda` | FAQ pesquisável | Público |
| `/offline` | Materiais armazenados por conta | Identificação da sessão/dispositivo; não depende do carregamento do banco |
| `/verificar/:code` | Consultar comprovante interno | Público; UUID de verificação exato, resposta mínima |
| `/app` | Redirecionamento | Vai para Home |
| `/app/home` | Home específica de cada perfil | Quatro perfis |
| `/app/aprenda` | Entrada Aprenda | Material para aluno/docente; gestão para instituição; catálogo para recrutador |
| `/app/aprenda/material` | Matérias, busca e recentes | Leitura por RLS; publicação docente/instituição |
| `/app/aprenda/material/:subjectId` | Biblioteca da matéria | Conteúdos publicados e permitidos |
| `/app/aprenda/material/item/:materialId` | Leitura, armazenamento e exportação | Conteúdo permitido |
| `/app/aprenda/pratica` | Exercícios ou fila de avaliações | Estudante pratica; docente/instituição avaliam vínculos |
| `/app/aprenda/trilhas` | Catálogo de trilhas | Leitura permitida; publicação por docente/instituição |
| `/app/aprenda/trilhas/:trackId` | Etapas e pré-requisitos | XP/conclusão real somente estudante; edição pelo dono |
| `/app/aprenda/suporte` | Bot/FAQ, histórico, feedback e fila docente | Histórico próprio; docente recebe somente compartilhamentos explícitos |
| `/app/social` | Redirecionamento | Vai para Início |
| `/app/social/inicio` | Histórias, fórum e ranking | Comunidade autenticada |
| `/app/social/feed` | Publicações e comentários | Comunidade; autoria e remoção próprias |
| `/app/social/foruns` | Categorias, busca e discussão | Comunidade autenticada |
| `/app/social/post/:postId` | Discussão e comentários | Comunidade autenticada |
| `/app/social/projetos` | Projetos e filtros | Comunidade autenticada |
| `/app/social/projetos/:projectId` | Detalhes e participação | Participação própria; status pelo responsável |
| `/app/emprego` | Oportunidades ou gestão de vagas | Leitura dos quatro perfis; publicação recrutador |
| `/app/emprego/:jobId` | Detalhe, candidatura ou edição | Estudante candidata; recrutador edita vaga própria |
| `/app/candidaturas` | Histórico e vagas salvas | Registros do próprio estudante |
| `/app/candidatos` | Perfis e status de candidaturas | Recrutador dono da vaga |
| `/app/config` | Perfil, preferências, privacidade, segurança e logout | Quatro perfis |
| `/app/config/perfil` | Dados e experiências profissionais | Edição própria |
| `/app/config/verificacao` | Solicitação e documentos privados | Própria conta; não aprova cargos |
| `/app/turmas` | Turmas, estudantes e matrículas | Aluno lê vínculo; docente acompanha; instituição gerencia própria organização |
| `/app/atividades` | Envio, histórico, nota e feedback | Estudante envia; responsáveis avaliam |
| `/app/relatorios` | Indicadores e exportação CSV | Dados permitidos pela RLS; sem frequência/contratação externa |
| `/app/certificados` | Conquistas e comprovantes | Aluno próprio; emissão por responsável vinculado após conclusão |
| `/app/mensagens?para=:userId` | Mensagens internas | Somente contas relacionadas; identidade de envio validada no banco |
| `/app/notificacoes` | Notificações e marcação de leitura | Própria conta |
| Qualquer rota desconhecida | Página inexistente | Retorno ao início |

Os editores e confirmações usam diálogos acessíveis, sem gerar URLs artificiais. O botão global Dúvidas abre somente uma das funções por vez: Bot de triagem ou FAQ. Mobile mantém Home, Aprenda, Social, Emprego e Config. na tab bar; desktop utiliza o menu lateral solicitado.

## Persistência

- Dados reais: Supabase e RLS; não há mudança de perfil real por seletor no navegador.
- Sessão real: SDK Supabase com PKCE e renovação; metadata de cadastro não é autorização.
- Demonstração: dados `skillup.demo.v2` em localStorage; perfil escolhido em sessionStorage.
- Triagem e recentes: sessionStorage por conta; mudança de página preserva a conversa.
- Offline: IndexedDB por conta, separado dos exemplos pelo prefixo `demo:`.
- Filtros de tela: estado da página; não são uma preferência persistente nesta versão.

## Relações centrais de autorização

| Perfil | Pode alterar | Não pode conceder a si mesmo |
|---|---|---|
| Estudante | Perfil, experiências, respostas próprias, participação, candidatura, agenda | Nota, XP, certificado, matrícula ou cargo |
| Docente | Conteúdo próprio, trilhas próprias, atividades de turmas vinculadas, correções e respostas recebidas | Outra instituição, cargo administrativo ou correções de outro docente |
| Recrutador | Vagas próprias, status das respectivas candidaturas, mensagens relacionadas | Perfis privados sem candidatura, notas e matrículas |
| Instituição | Turmas/matrículas da própria organização, avaliações e comprovantes vinculados | Outra organização, aprovação do próprio cargo ou acesso geral a documentos privados |

As políticas não substituem uma solução completa de governança: revisão de documentos e provisionamento de cargos continuam reservados ao responsável do ambiente.
