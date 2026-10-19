# Comparação com as referências

## Método e limite da validação

Foram lidas e inspecionadas todas as **67 telas** do anexo atual e as **27 páginas** do case antes de implementar. O inventário registra os nomes completos, incluindo as duas etapas de cadastro institucional. O pedido cita outra versão com 78 telas; não foi inventada cobertura de 11 telas ausentes do ZIP recebido.

A tabela abaixo é uma comparação de **estrutura, componentes e comportamento**, feita com as referências e o código. Não é uma aprovação visual pixel a pixel. Os testes DOM verificam interações selecionadas; não executam layout. **Todas as 67 linhas ainda exigem captura e comparação visual em navegador.** Não há screenshots do aplicativo nesta entrega que provem equivalência.

A skill Sites exige a ferramenta control-browser para preview neste ambiente e proíbe iniciar um servidor de preview ou instalar outro navegador como substituto quando ela está ausente. Essa ferramenta não estava disponível. Foi possível compilar e testar DOM/SQL, mas não realizar aqui a homologação visual solicitada.

## Decisões transversais

- Fonte Lexend local e paleta das pranchas 20–23; sem substituir as cores por uma identidade genérica. Semânticas corrigidas pelo pedido. Cores das oito matérias extraídas dos vetores. Preto/branco presentes no original. Estados de foco, raios, safe area e breakpoints documentados como implementação.
- Cinco abas e quatro subabas preservadas. Os PDFs desktop recebidos mostram navegação superior; a instrução explícita do pedido prioriza menu lateral no desktop, adotado a partir de 1024 px.
- Cards reais ocupam espaço conforme os dados; números, depoimentos e percentual de contratação do protótipo não foram tratados como fatos. Isso altera alturas e algumas métricas.
- Ícones SVG Lucide consistentes, aproximando as funções visuais do protótipo. Não se trata do mesmo arquivo vetorial de cada ícone do Figma.
- Dados de exemplo são rotulados. Autorizações, XP, candidaturas e comprovantes reais dependem do banco e não de informações alteráveis do navegador.
- Cadastro de documentos ocorre depois de autenticar/confirmar e-mail. Aprovação de cargo é administrativa, não um botão de autopromoção.
- Telas de detalhe, recuperação, estados vazios, erro e editores foram implementadas para viabilizar fluxos que os PDFs não detalham. Não são apresentadas como telas originalmente documentadas.

## Correspondência das 67 telas

`Auth.tsx`, `Home.tsx` etc. estão em `src/pages/`; suporte está em `src/components/`.

| Nº | Referência original | Rota | Código principal | Cobertura e diferença concreta |
|---|---|---|---|---|
| 01 | Mobile · Acesso · Cadastro Instituição 1/2 | `/cadastro/instituicao` | `Auth.tsx; Settings.tsx (documentos)` | Razão social, registro e CNAE; coleta de documentos transferida para depois da confirmação de e-mail. |
| 02 | Mobile · Acesso · Cadastro Instituição 2/2 | `/app/config/verificacao` | `Auth.tsx; Settings.tsx (documentos)` | Uploads privados e status; perfil continua estudante até revisão do responsável. |
| 03 | Mobile · Acesso · Cadastro docente | `/cadastro/docente` | `Auth.tsx; Settings.tsx (documentos)` | Dados de conta e instituição; documentação posterior ao e-mail. Contrato de Auth testado com mock. |
| 04 | Mobile · Acesso · Cadastro estudante | `/cadastro/estudante` | `Auth.tsx; Settings.tsx (documentos)` | E-mail, senha, nome e confirmação; documento opcional em Verificação. Nome/confirmação são decisões de implementação. |
| 05 | Mobile · Acesso · Cadastro recrutador | `/cadastro/recrutador` | `Auth.tsx; Settings.tsx (documentos)` | Conta e registro; termos institucionais definitivos pendentes; documentação privada após confirmar e-mail. |
| 06 | Mobile · Acesso · Cadastro | `/perfis` | `Auth.tsx; Settings.tsx (documentos)` | Quatro opções preservadas; seleção solicita perfil e não concede privilégios. |
| 07 | Mobile · Acesso · Login | `/login` | `Auth.tsx; Settings.tsx (documentos)` | E-mail/senha; recuperação e demonstração separadas adicionadas. Auth real não homologado. |
| 08 | Mobile · Acesso · Tela inicial | `/` | `Auth.tsx; Settings.tsx (documentos)` | Marca e entradas preservadas; acesso explícito à demonstração e biblioteca offline acrescentados. |
| 09 | Mobile · Docente · Aprenda · Material | `/app/aprenda/material` | `Materials.tsx` | Oito matérias, busca, recentes, leitura e cópias verificadas. Docente publica texto/PDF/TXT; biblioteca completa de vídeos, podcasts e slides não implementada. |
| 10 | Mobile · Docente · Aprenda · Prática | `/app/aprenda/pratica` | `Learning.tsx / Workspace.tsx` | Aluno: quatro exercícios de exemplo e laboratório de busca. Docente: envios, filtros, nota e feedback. Não é uma plataforma completa de simulados cronometrados. |
| 11 | Mobile · Docente · Aprenda · Suporte | `/app/aprenda/suporte` | `Support.tsx / SupportHistory.tsx` | Bot/FAQ, resumo, histórico e compartilhamento explícito. Docente filtra fila por urgência e responde. Sem tutor ao vivo ou SLA fictício. |
| 12 | Mobile · Docente · Aprenda · Trilhas | `/app/aprenda/trilhas` | `Learning.tsx` | Etapas, bloqueios, conclusão e publicação por responsável. Percurso vertical adaptável; ilustrações/arranjo exato do mapa ainda precisam de comparação visual. |
| 13 | Mobile · Docente · Emprego | `/app/emprego` | `Careers.tsx` | Busca, vagas salvas, candidatura interna e gestão. Selo virou indicador de preenchimento, sem garantia de contratação. Diretório de parceiros e integrações externas pendentes. |
| 14 | Mobile · Docente · Home | `/app/home` | `Home.tsx` | Ações rápidas, agenda, turmas e correções. Sem simular aulas ao vivo ou mensagens externas. |
| 15 | Mobile · Docente · Social · Feed | `/app/social/feed` | `Social.tsx` | Publicação, curtida, comentários e remoção própria. Conteúdo demonstrativo rotulado; sem repostagem automática em redes externas. |
| 16 | Mobile · Docente · Social · Fóruns | `/app/social/foruns` | `Social.tsx` | Busca, categoria, nova discussão e respostas. Moderação de denúncias ainda não implementada. |
| 17 | Mobile · Docente · Social · Início | `/app/social/inicio` | `Social.tsx` | Histórias, posts, fórum e ranking por XP opt-in. Composição compartilhada entre perfis; blocos corporativos/institucionais específicos do PDF são parciais. |
| 18 | Mobile · Docente · Social · Projetos | `/app/social/projetos` | `Social.tsx` | Filtros, criação, detalhes, participação e status. Repositório compartilhado e tarefas/arquivos do projeto ainda não implementados. |
| 19 | Mobile · Estudante · Aprenda · Material | `/app/aprenda/material` | `Materials.tsx` | Oito matérias, busca, recentes, leitura e cópias verificadas. Docente publica texto/PDF/TXT; biblioteca completa de vídeos, podcasts e slides não implementada. |
| 20 | Mobile · Estudante · Aprenda · Prática | `/app/aprenda/pratica` | `Learning.tsx / Workspace.tsx` | Aluno: quatro exercícios de exemplo e laboratório de busca. Docente: envios, filtros, nota e feedback. Não é uma plataforma completa de simulados cronometrados. |
| 21 | Mobile · Estudante · Aprenda · Suporte | `/app/aprenda/suporte` | `Support.tsx / SupportHistory.tsx` | Bot/FAQ, resumo, histórico e compartilhamento explícito. Docente filtra fila por urgência e responde. Sem tutor ao vivo ou SLA fictício. |
| 22 | Mobile · Estudante · Aprenda · Trilhas | `/app/aprenda/trilhas` | `Learning.tsx` | Etapas, bloqueios, conclusão e publicação por responsável. Percurso vertical adaptável; ilustrações/arranjo exato do mapa ainda precisam de comparação visual. |
| 23 | Mobile · Estudante · Configurações | `/app/config` | `Settings.tsx` | Perfil, experiências, preferências, privacidade, MFA, dados e saída. Gestão de equipe por convite, conectores e auditoria avançada do mockup estão pendentes. |
| 24 | Mobile · Estudante · Emprego | `/app/emprego` | `Careers.tsx` | Busca, vagas salvas, candidatura interna e gestão. Selo virou indicador de preenchimento, sem garantia de contratação. Diretório de parceiros e integrações externas pendentes. |
| 25 | Mobile · Estudante · Home | `/app/home` | `Home.tsx` | Saudação, nível, trilha, agenda, plano, suporte, conquistas e carreira. Números derivados; organização responsiva implementada, geometria não homologada. |
| 26 | Mobile · Estudante · Social · Feed | `/app/social/feed` | `Social.tsx` | Publicação, curtida, comentários e remoção própria. Conteúdo demonstrativo rotulado; sem repostagem automática em redes externas. |
| 27 | Mobile · Estudante · Social · Fóruns | `/app/social/foruns` | `Social.tsx` | Busca, categoria, nova discussão e respostas. Moderação de denúncias ainda não implementada. |
| 28 | Mobile · Estudante · Social · Início | `/app/social/inicio` | `Social.tsx` | Histórias, posts, fórum e ranking por XP opt-in. Composição compartilhada entre perfis; blocos corporativos/institucionais específicos do PDF são parciais. |
| 29 | Mobile · Estudante · Social · Projetos | `/app/social/projetos` | `Social.tsx` | Filtros, criação, detalhes, participação e status. Repositório compartilhado e tarefas/arquivos do projeto ainda não implementados. |
| 30 | Mobile · Instituição · Aprenda | `/app/aprenda` | `Workspace.tsx / Learning.tsx` | Instituição: turmas, conteúdos, avaliações, trilhas e emissão interna. Recrutador: catálogo de competências. Curadoria institucional avançada e cursos corporativos não implementados. |
| 31 | Mobile · Instituição · Configurações | `/app/config` | `Settings.tsx` | Perfil, experiências, preferências, privacidade, MFA, dados e saída. Gestão de equipe por convite, conectores e auditoria avançada do mockup estão pendentes. |
| 32 | Mobile · Instituição · Emprego | `/app/emprego` | `Careers.tsx` | Busca, vagas salvas, candidatura interna e gestão. Selo virou indicador de preenchimento, sem garantia de contratação. Diretório de parceiros e integrações externas pendentes. |
| 33 | Mobile · Instituição · Home | `/app/home` | `Home.tsx` | Turmas, matrícula e indicadores internos; frequência externa e comparações históricas do mockup não implementadas. |
| 34 | Mobile · Instituição · Social | `/app/social/inicio` | `Social.tsx` | Histórias, posts, fórum e ranking por XP opt-in. Composição compartilhada entre perfis; blocos corporativos/institucionais específicos do PDF são parciais. |
| 35 | Mobile · Recrutador · Aprenda | `/app/aprenda` | `Workspace.tsx / Learning.tsx` | Instituição: turmas, conteúdos, avaliações, trilhas e emissão interna. Recrutador: catálogo de competências. Curadoria institucional avançada e cursos corporativos não implementados. |
| 36 | Mobile · Recrutador · Configurações | `/app/config` | `Settings.tsx` | Perfil, experiências, preferências, privacidade, MFA, dados e saída. Gestão de equipe por convite, conectores e auditoria avançada do mockup estão pendentes. |
| 37 | Mobile · Recrutador · Emprego | `/app/emprego` | `Careers.tsx` | Busca, vagas salvas, candidatura interna e gestão. Selo virou indicador de preenchimento, sem garantia de contratação. Diretório de parceiros e integrações externas pendentes. |
| 38 | Mobile · Recrutador · Home | `/app/home` | `Home.tsx` | Vagas, candidaturas e ações reais internas; estatísticas estáticas do mockup removidas. Entrevista é status, sem videoconferência. |
| 39 | Mobile · Recrutador · Social | `/app/social/inicio` | `Social.tsx` | Histórias, posts, fórum e ranking por XP opt-in. Composição compartilhada entre perfis; blocos corporativos/institucionais específicos do PDF são parciais. |
| 40 | Web · Acesso · Cadastro Instituição 1/2 | `/cadastro/instituicao` | `Auth.tsx; Settings.tsx (documentos)` | Razão social, registro e CNAE; coleta de documentos transferida para depois da confirmação de e-mail. |
| 41 | Web · Acesso · Cadastro Instituição 2/2 | `/app/config/verificacao` | `Auth.tsx; Settings.tsx (documentos)` | Uploads privados e status; perfil continua estudante até revisão do responsável. |
| 42 | Web · Acesso · Cadastro docente | `/cadastro/docente` | `Auth.tsx; Settings.tsx (documentos)` | Dados de conta e instituição; documentação posterior ao e-mail. Contrato de Auth testado com mock. |
| 43 | Web · Acesso · Cadastro estudante | `/cadastro/estudante` | `Auth.tsx; Settings.tsx (documentos)` | E-mail, senha, nome e confirmação; documento opcional em Verificação. Nome/confirmação são decisões de implementação. |
| 44 | Web · Acesso · Cadastro recrutador | `/cadastro/recrutador` | `Auth.tsx; Settings.tsx (documentos)` | Conta e registro; termos institucionais definitivos pendentes; documentação privada após confirmar e-mail. |
| 45 | Web · Acesso · Cadastro | `/perfis` | `Auth.tsx; Settings.tsx (documentos)` | Quatro opções preservadas; seleção solicita perfil e não concede privilégios. |
| 46 | Web · Acesso · Login | `/login` | `Auth.tsx; Settings.tsx (documentos)` | E-mail/senha; recuperação e demonstração separadas adicionadas. Auth real não homologado. |
| 47 | Web · Acesso · Tela inicial | `/` | `Auth.tsx; Settings.tsx (documentos)` | Marca e entradas preservadas; acesso explícito à demonstração e biblioteca offline acrescentados. |
| 48 | Web · Docente · Aprenda · Material | `/app/aprenda/material` | `Materials.tsx` | Oito matérias, busca, recentes, leitura e cópias verificadas. Docente publica texto/PDF/TXT; biblioteca completa de vídeos, podcasts e slides não implementada. |
| 49 | Web · Docente · Aprenda · Prática | `/app/aprenda/pratica` | `Learning.tsx / Workspace.tsx` | Aluno: quatro exercícios de exemplo e laboratório de busca. Docente: envios, filtros, nota e feedback. Não é uma plataforma completa de simulados cronometrados. |
| 50 | Web · Docente · Aprenda · Suporte | `/app/aprenda/suporte` | `Support.tsx / SupportHistory.tsx` | Bot/FAQ, resumo, histórico e compartilhamento explícito. Docente filtra fila por urgência e responde. Sem tutor ao vivo ou SLA fictício. |
| 51 | Web · Docente · Aprenda · Trilhas | `/app/aprenda/trilhas` | `Learning.tsx` | Etapas, bloqueios, conclusão e publicação por responsável. Percurso vertical adaptável; ilustrações/arranjo exato do mapa ainda precisam de comparação visual. |
| 52 | Web · Docente · Home | `/app/home` | `Home.tsx` | Ações rápidas, agenda, turmas e correções. Sem simular aulas ao vivo ou mensagens externas. |
| 53 | Web · Docente · Social · Feed | `/app/social/feed` | `Social.tsx` | Publicação, curtida, comentários e remoção própria. Conteúdo demonstrativo rotulado; sem repostagem automática em redes externas. |
| 54 | Web · Docente · Social · Fóruns | `/app/social/foruns` | `Social.tsx` | Busca, categoria, nova discussão e respostas. Moderação de denúncias ainda não implementada. |
| 55 | Web · Docente · Social · Início | `/app/social/inicio` | `Social.tsx` | Histórias, posts, fórum e ranking por XP opt-in. Composição compartilhada entre perfis; blocos corporativos/institucionais específicos do PDF são parciais. |
| 56 | Web · Docente · Social · Projetos | `/app/social/projetos` | `Social.tsx` | Filtros, criação, detalhes, participação e status. Repositório compartilhado e tarefas/arquivos do projeto ainda não implementados. |
| 57 | Web · Estudante · Home | `/app/home` | `Home.tsx` | Saudação, nível, trilha, agenda, plano, suporte, conquistas e carreira. Números derivados; organização responsiva implementada, geometria não homologada. |
| 58 | Web · Instituição · Aprenda | `/app/aprenda` | `Workspace.tsx / Learning.tsx` | Instituição: turmas, conteúdos, avaliações, trilhas e emissão interna. Recrutador: catálogo de competências. Curadoria institucional avançada e cursos corporativos não implementados. |
| 59 | Web · Instituição · Configurações | `/app/config` | `Settings.tsx` | Perfil, experiências, preferências, privacidade, MFA, dados e saída. Gestão de equipe por convite, conectores e auditoria avançada do mockup estão pendentes. |
| 60 | Web · Instituição · Emprego | `/app/emprego` | `Careers.tsx` | Busca, vagas salvas, candidatura interna e gestão. Selo virou indicador de preenchimento, sem garantia de contratação. Diretório de parceiros e integrações externas pendentes. |
| 61 | Web · Instituição · Home | `/app/home` | `Home.tsx` | Turmas, matrícula e indicadores internos; frequência externa e comparações históricas do mockup não implementadas. |
| 62 | Web · Instituição · Social | `/app/social/inicio` | `Social.tsx` | Histórias, posts, fórum e ranking por XP opt-in. Composição compartilhada entre perfis; blocos corporativos/institucionais específicos do PDF são parciais. |
| 63 | Web · Recrutador · Aprenda | `/app/aprenda` | `Workspace.tsx / Learning.tsx` | Instituição: turmas, conteúdos, avaliações, trilhas e emissão interna. Recrutador: catálogo de competências. Curadoria institucional avançada e cursos corporativos não implementados. |
| 64 | Web · Recrutador · Configurações | `/app/config` | `Settings.tsx` | Perfil, experiências, preferências, privacidade, MFA, dados e saída. Gestão de equipe por convite, conectores e auditoria avançada do mockup estão pendentes. |
| 65 | Web · Recrutador · Emprego | `/app/emprego` | `Careers.tsx` | Busca, vagas salvas, candidatura interna e gestão. Selo virou indicador de preenchimento, sem garantia de contratação. Diretório de parceiros e integrações externas pendentes. |
| 66 | Web · Recrutador · Home | `/app/home` | `Home.tsx` | Vagas, candidaturas e ações reais internas; estatísticas estáticas do mockup removidas. Entrevista é status, sem videoconferência. |
| 67 | Web · Recrutador · Social | `/app/social/inicio` | `Social.tsx` | Histórias, posts, fórum e ranking por XP opt-in. Composição compartilhada entre perfis; blocos corporativos/institucionais específicos do PDF são parciais. |

## O que falta para aprovar fidelidade

Capturar as variantes em 393 px e 1440 px, confrontar com os PDFs de mesmo nome, revisar 320/768/1024 px, conferir tipografia real, textos longos, foco, safe area, bot aberto, tab bar e teclado virtual. Medir diferenças e corrigir antes de chamar qualquer tela de visualmente homologada. Pranchas com estados indisponíveis de serviços devem ser aprovadas pela autora considerando as substituições transparentes descritas acima.
