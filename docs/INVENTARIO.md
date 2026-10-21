# Inventário de referência — antes da implementação

Analisados os 67 PDFs (39 mobile, 28 web) do ZIP **SkillUp wireframe (21)(1).zip** e todas as 27 páginas de **Case study UIUX (7)(1).pdf**, recebidos em 19/10/2026. O pedido menciona versões anteriores (78 telas / ZIP do case). Estes anexos atuais são a fonte desta implementação. Leitura: extração de texto das 67 telas, inspeção visual de todas e renderização/OCR das pranchas do case. A página 19 contém apenas uma miniatura/ligação do fluxo externo; não é possível reconstruir setas ilegíveis como regras confirmadas.

## Código existente

Base `f8e9de76a1a3c9bd3557bbb12ac8188ae555f246`. HTML/JS estático com overrides CSS. Funciona: navegação estudante, leitura de 16 materiais, exportação HTML, FAQ, triagem local, persistência de nome/progresso. Limites encontrados: login aceita qualquer e-mail; permissões locais; ações com toast genérico; filtro que não filtra; porcentagens fixas; download marcado sem comprovação de armazenamento; fonte Inter, diferente da Lexend documentada. Código anterior será preservado em `legacy/`; materiais e comportamentos úteis serão portados.

## Telas fornecidas

| Nº | Tela | Dimensões em pt do PDF |
|---|---|---|
| 01 | Mobile · Acesso · Cadastro Instituição 1/2 | 393 × 856 |
| 02 | Mobile · Acesso · Cadastro Instituição 2/2 | 393 × 852 |
| 03 | Mobile · Acesso · Cadastro docente | 393 × 852 |
| 04 | Mobile · Acesso · Cadastro estudante | 393 × 852 |
| 05 | Mobile · Acesso · Cadastro recrutador | 393 × 852 |
| 06 | Mobile · Acesso · Cadastro | 393 × 852 |
| 07 | Mobile · Acesso · Login | 393 × 852 |
| 08 | Mobile · Acesso · Tela inicial | 393 × 852 |
| 09 | Mobile · Docente · Aprenda · Material | 393 × 1208 |
| 10 | Mobile · Docente · Aprenda · Prática | 393 × 2552 |
| 11 | Mobile · Docente · Aprenda · Suporte | 393 × 999 |
| 12 | Mobile · Docente · Aprenda · Trilhas | 393 × 1729 |
| 13 | Mobile · Docente · Emprego | 393 × 2832 |
| 14 | Mobile · Docente · Home | 393 × 941 |
| 15 | Mobile · Docente · Social · Feed | 393 × 2042 |
| 16 | Mobile · Docente · Social · Fóruns | 393 × 1189 |
| 17 | Mobile · Docente · Social · Início | 393 × 2536 |
| 18 | Mobile · Docente · Social · Projetos | 393 × 2689 |
| 19 | Mobile · Estudante · Aprenda · Material | 393 × 985 |
| 20 | Mobile · Estudante · Aprenda · Prática | 393 × 859 |
| 21 | Mobile · Estudante · Aprenda · Suporte | 393 × 1375 |
| 22 | Mobile · Estudante · Aprenda · Trilhas | 393 × 1957 |
| 23 | Mobile · Estudante · Configurações | 393 × 1100 |
| 24 | Mobile · Estudante · Emprego | 393 × 1914 |
| 25 | Mobile · Estudante · Home | 393 × 2081 |
| 26 | Mobile · Estudante · Social · Feed | 393 × 1300 |
| 27 | Mobile · Estudante · Social · Fóruns | 393 × 1088 |
| 28 | Mobile · Estudante · Social · Início | 393 × 2261 |
| 29 | Mobile · Estudante · Social · Projetos | 393 × 2494 |
| 30 | Mobile · Instituição · Aprenda | 393 × 2977 |
| 31 | Mobile · Instituição · Configurações | 393 × 1692 |
| 32 | Mobile · Instituição · Emprego | 393 × 1819 |
| 33 | Mobile · Instituição · Home | 393 × 2237 |
| 34 | Mobile · Instituição · Social | 393 × 2979 |
| 35 | Mobile · Recrutador · Aprenda | 393 × 1431 |
| 36 | Mobile · Recrutador · Configurações | 393 × 2406 |
| 37 | Mobile · Recrutador · Emprego | 393 × 1351 |
| 38 | Mobile · Recrutador · Home | 393 × 1141 |
| 39 | Mobile · Recrutador · Social | 393 × 2193 |
| 40 | Web · Acesso · Cadastro Instituição 1/2 | 1440 × 1000 |
| 41 | Web · Acesso · Cadastro Instituição 2/2 | 1440 × 1000 |
| 42 | Web · Acesso · Cadastro docente | 1440 × 1000 |
| 43 | Web · Acesso · Cadastro estudante | 1440 × 1000 |
| 44 | Web · Acesso · Cadastro recrutador | 1440 × 1000 |
| 45 | Web · Acesso · Cadastro | 1440 × 1000 |
| 46 | Web · Acesso · Login | 1440 × 1000 |
| 47 | Web · Acesso · Tela inicial | 1440 × 1000 |
| 48 | Web · Docente · Aprenda · Material | 1440 × 1000 |
| 49 | Web · Docente · Aprenda · Prática | 1440 × 1204 |
| 50 | Web · Docente · Aprenda · Suporte | 1440 × 1000 |
| 51 | Web · Docente · Aprenda · Trilhas | 1440 × 1076 |
| 52 | Web · Docente · Home | 1440 × 1000 |
| 53 | Web · Docente · Social · Feed | 1440 × 1452 |
| 54 | Web · Docente · Social · Fóruns | 1440 × 1000 |
| 55 | Web · Docente · Social · Início | 1440 × 1544 |
| 56 | Web · Docente · Social · Projetos | 1440 × 1124 |
| 57 | Web · Estudante · Home | 1440 × 1231 |
| 58 | Web · Instituição · Aprenda | 1440 × 1466 |
| 59 | Web · Instituição · Configurações | 1440 × 1172 |
| 60 | Web · Instituição · Emprego | 1440 × 1076 |
| 61 | Web · Instituição · Home | 1440 × 1263 |
| 62 | Web · Instituição · Social | 1440 × 1388 |
| 63 | Web · Recrutador · Aprenda | 1440 × 1000 |
| 64 | Web · Recrutador · Configurações | 1440 × 1240 |
| 65 | Web · Recrutador · Emprego | 1440 × 1004 |
| 66 | Web · Recrutador · Home | 1440 × 1026 |
| 67 | Web · Recrutador · Social | 1440 × 1402 |

## Componentes e fluxos explícitos

- Acesso: marca, boas-vindas, seleção dos quatro perfis, login, formulários de documentos, instituição em duas etapas.
- Estrutura: cabeçalho, indicador de conexão, notificações, cinco abas; subabas de aprendizagem e social para aluno/docente.
- Home estudante: saudação, nível, módulo, agenda, plano, suporte, conquistas, carreira.
- Aprenda estudante: oito matérias, recentes; quatro ações práticas e desafio; caminho de módulos com bloqueios; suporte/feedback.
- Social: histórias, ranking, fóruns com categorias, projetos com filtros, feed e interações.
- Emprego: vagas, selo, histórico de sucesso; docente orienta; recrutador gerencia; instituição conecta parcerias.
- Docente: criar aula, correção, avisos; biblioteca, fila de atividades, desempenho de turmas, trilhas e suporte por prioridade.
- Instituição: turmas, alunos, professores, indicadores, certificações, catálogo, conteúdos, projetos, comunicados, permissões.
- Recrutador: vagas, candidatos, entrevistas, mensagens, relatórios; competências; perfil corporativo e equipe.
- Configurações: perfil, preferências, privacidade, segurança, exportação e saída.

## Decisões de implementação (não descritas como fatos do Figma)

| Item | Decisão | Motivo / fonte |
|---|---|---|
| Desktop | Menu lateral a partir de 1024 px | Instrução explícita do pedido; PDFs web mostram barra superior. |
| Responsividade | Mobile 320–767, tablet 768–1023, desktop ≥1024 | Breakpoints não especificados. |
| Autenticação | Supabase configurável; demonstração em entrada separada e identificada | Não há credenciais fornecidas. Nunca aceitar senha fictícia como login real. |
| Perfis privilegiados | Solicitação pendente e aprovação no servidor; estudante é padrão | Seleção de perfil do cadastro não concede cargo. |
| Documentos | Upload privado após confirmação de e-mail; sem coleta no modo demo | Evita documentos órfãos e dados pessoais sem conta. |
| Novas telas | Recuperação, confirmação, detalhes, editores e estados vazios | Necessários para tornar os fluxos acionáveis; não há PDFs detalhados. |
| Offline | IndexedDB para materiais aprovados; cache apenas do shell público | Não armazenar automaticamente respostas autenticadas. |
| Bot | Triagem determinística com intenção, urgência e resumo | Sem integração de IA ou atendimento humano contratada. |
| Candidaturas | Persistência no banco quando configurado; confirmação antes do envio | Sem anunciar envio a serviços de recrutamento externos. |
| Certificados | Comprovante interno consultável; nenhuma validação MEC/SENAI ou blockchain | O case expressa intenção, não comprova integração. |
| Métricas | Calculadas dos registros acessíveis; exemplos rotulados no modo demo | Não copiar 92%/88%, depoimentos e contratações como fatos. |
| Preferências e notificações | Persistência de preferências; sem prometer push/e-mail não conectado | Os serviços precisam ser configurados. |

## Design system transcrito

Páginas 20–23 do case: primária 100–500 `#BBD1FB`, `#78A2F8`, `#3474F4`, `#0C50D9`, `#081998`; secundária `#8BA0F0`, `#5271E9`, `#1C44DD`, `#1532A3`, `#0C1C5D`; terciária `#F8FBFF`, `#EEF5FF`, `#E0ECFF`, `#D2E4FF`, `#C6DAFE`; neutra `#F1F5F9`, `#E2E8F0`, `#CBD5E1`, `#94A3B8`, `#64748B`. Semântica substituída pela instrução atual: erro `#F90001`, sucesso `#2CB76D`, atenção `#F3B701`. Lexend: 32/600, 24/500, 18/400, 14/400, 12/500. Superfícies brancas e texto escuro como nos PDFs. Espaços 4/8; raios/bordas e foco são tokens de implementação quando não há medidas explícitas.

## Leitura do case por prancha

1 capa; 2 índice; 3 método (descoberta/estruturação/resolução); 4 problema de visibilidade do ensino técnico; 5 objetivo; 6 benchmarking; 7–8 pesquisa e links; 9 CSD; 10–11 soluções UX; 12 funcionalidades; 13–14 stakeholders; 15 necessidades/HMW; 16–17 sitemap; 18–19 fluxo; 20 cores; 21 tokens; 22 componentes; 23 tipografia; 24 wireframes; 25–26 protótipo; 27 encerramento.

Pesquisa sustenta organização dos conteúdos, práticas reais, suporte, flexibilidade, visibilidade da formação técnica e conexão com trabalho. Reconhecimento oficial, tutores disponíveis, IA e integração com empregadores exigem acordos externos.
