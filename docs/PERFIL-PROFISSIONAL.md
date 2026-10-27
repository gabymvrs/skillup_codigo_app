# Perfil profissional do estudante — 27/10/2026

Implementação incremental do pedido “Perfil profissional, projetos e interações do aluno”. Branch: `dev/skillup-modular-20261019`. Nenhuma conta ou tabela existente é apagada. O menu principal mantém as cinco abas.

## Acesso

Config. → **Meu perfil profissional**. No modo de teste, selecione Estudante em `/teste`. Dados demonstrativos continuam identificados; arquivos pessoais e links externos reais não são enviados nessa modalidade.

## Funcionalidades entregues

| Recurso | Comportamento |
| --- | --- |
| Denúncias | Menu de três pontos nos comentários, motivo, descrição, confirmação e erros. RPC autenticada grava a fila `comment_reports`; identidade acessível somente ao denunciante e à administração. Uma denúncia por comentário e pessoa, até cinco em 24 horas. Não remove o comentário. Comentários de projetos compartilhados usam o mesmo fluxo. |
| Compartilhamento | Cards e detalhes oferecem copiar link, compartilhamento nativo quando disponível e publicação no feed. Prévia com capa ou espaço reservado, título, descrição, autor, habilidades e link. Projetos novos podem receber capa e link externo. Público, comunidade ou privado; alterações de visibilidade afetam também publicações e comentários associados. |
| Recomendações | Social → início. Pontuação determinística por tags de área, habilidades, interesses, tecnologias, nível e histórico de projetos vistos/salvos. Cada sugestão informa a justificativa. Sem dados, sugestões iniciais; sem projetos, estado vazio. Vagas continuam comparando habilidades declaradas, sem porcentagens fictícias. |
| Conquistas | Seis definições; desbloqueio por função do servidor sobre lições, práticas de código, dias de estudo, trilhas, projetos e semanas encerradas do ranking. Registro único por aluno/conquista. Até três conquistadas no topo; nenhuma permissão de escrita direta nas conquistas. |
| Apresentação | Dropdown em Editar Perfil, opção personalizada até 160 caracteres e identificação como autodeclaração. Reutiliza `profiles.headline`. |
| Habilidades | Busca, seleção múltipla, chips removíveis, limite de 30 e validação de duplicatas no banco. Reutiliza `profiles.skills`, também usada nas vagas. |
| Currículo | PDF até 5 MB, visualização, substituição e exclusão; bucket privado. Prévia com escolha de seções e geração de PDF real com jsPDF carregado sob demanda. Compartilhamento temporário de 15 minutos mediante confirmação. Anexo opcional na candidatura; somente seu recrutador recebe acesso enquanto a candidatura não estiver retirada. |
| Destaques | Certificados, experiências, projetos, eventos, cursos e conquistas declaradas. Criar, editar, excluir, anexar documento/imagem, compartilhar e fixar até três; visibilidade individual. Certificados declarados não recebem selo de verificação. Certificados já emitidos no SkillUp preservam sua consulta de autenticidade. |

## Rotas

- `/app/perfil`: perfil do aluno e controles privados.
- `/app/perfil/:userId`: perfil visível à conta autenticada, sujeito à RLS.
- `/app/config/perfil`: editor existente, com dropdown e multisseleção.
- `/app/destaques/:id`: destaque permitido à comunidade.
- `/perfil/:id`: projeção pública, somente após opção explícita do proprietário.
- `/projetos/:id`: projeto público.
- `/destaques/:id`: destaque público.
- Social, projetos, feed e candidaturas reutilizam suas rotas existentes.

## Ativação no Supabase

1. As migrações **001 a 008** devem já estar aplicadas.
2. Abra **SQL Editor → New query** no projeto SkillUp.
3. Copie **todo** o arquivo `supabase/migrations/202610260009_student_portfolio.sql`, começando em `begin;` e terminando em `commit;`, e execute uma única vez. Não execute apenas trechos de funções.
4. Aguarde a confirmação de sucesso e recarregue o app.
5. Não é necessário criar uma Edge Function nova, alterar chaves públicas nem executar novamente o seed para estas funcionalidades.

A migração adiciona sete tabelas, campos em projetos/publicações/candidaturas, funções e políticas. Reutiliza perfis, habilidades, experiências, certificados, projetos, comentários e registros de aprendizagem existentes. Cria os buckets privados `student-resumes` e `portfolio-files`, com limite de 5 MB e tipos MIME permitidos. O banco rejeita referências a objetos inexistentes ou caminhos de outro proprietário. O cliente também confere assinaturas de PDF/imagens antes de enviar.

A nova área mantém mensagens de erro e não bloqueia o restante do aplicativo se a migração ainda estiver pendente. Não foi executada uma migração no Supabase hospedado nesta entrega: não há conexão administrativa disponível no ambiente. Não enviar chaves `service_role` pelo chat ou para o frontend.

## Decisões e limites

- As páginas públicas usam projeções explícitas via RPC. Não retornam e-mail da conta, preferências, documentos de verificação, currículo ou destaques privados. A foto pública exige a mesma opção explícita do portfólio público.
- O currículo só é compartilhado após ação explícita. Substituí-lo atualiza o documento referenciado pelas candidaturas existentes; excluir remove os anexos dessas candidaturas. Links já emitidos podem continuar válidos até sua expiração; excluir o objeto remove o arquivo. Links de avatar têm duração do componente existente (30 minutos).
- A exportação usa PDF textual legível, com quebra de página e seções autorizadas. A interface preserva Lexend e tokens SkillUp; o PDF usa Helvetica por compatibilidade. Conteúdos e experiências permanecem autodeclarados quando não houver validação real.
- O ranking para a conquista semanal considera semanas encerradas no horário de Recife, registros de XP e participantes que atualmente optaram pelo ranking; não há snapshot histórico de alterações dessa preferência. O modo demonstrativo não inventa a conquista de Top 3.
- A fila de denúncias está preparada no banco para moderação futura. Não há painel de moderador nem promessa de atendimento humano imediato.
- Storage aplica limite de tamanho/MIME e RLS; não foi adicionado antivírus ou serviço de validação documental. A checagem de assinatura binária adicional é no cliente.
- Links públicos exigem a migração e um projeto Supabase configurado; não transformam os exemplos locais da demonstração em publicações reais.

## Testes e evidências

- **142/142 testes Vitest**: suíte completa, incluindo 16 novos testes para perfil, habilidades, recomendações, denúncias, conquistas, destaques e geração PDF. Relatório: `portfolio-test-results.json`.
- **51/51 verificações PostgreSQL/RLS**: incluindo dez grupos novos de isolamento, projeções públicas, compartilhamentos, denúncias, limites, conquistas, arquivos, currículos e candidaturas. Relatório: `rls-results.json`.
- `npm run build`: aprovado; permanece aviso de tamanho do bundle principal. PDF e editor de código são carregados separadamente.
- Navegador local: entrada como aluno, acesso por Config., criação de destaque privado e persistência após navegação. Layout de perfil inspecionado em desktop e iframe de 320, 393 e 768 px; nenhuma rolagem horizontal do documento nas medições. Fixture: `tests/browser-portfolio.html`, somente desenvolvimento.
- Ainda requer homologação no Supabase hospedado: upload/download real no Storage, links temporários com duas contas e acesso público fora da demonstração. Os testes de SQL usam PostgreSQL/PGlite com Auth e Storage simulados; não equivalem a testar o serviço hospedado.
- Não foi feita auditoria WCAG completa, teste em aparelhos físicos ou revisão externa de segurança.
