# Evolução do SkillUp — inventário e decisões

Fonte: Texto colado(2).txt e imagens Material/Suporte fornecidas em 21/10/2026; inventário original em INVENTARIO.md e reference-index.json. A implementação amplia a branch de desenvolvimento, preservando autenticação, permissões, material offline, mensagens, turmas, empregos e bot global.

| Área              | Documentado                                                            | Decisão necessária de implementação                                                                                          |
| ----------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Suporte acadêmico | Assistente azul-marinho; docente; horários; feedback; central de ajuda | Sem provedor IA, orientação local identificada; docente real vem da matrícula. Nunca inventar disponibilidade ou entrega.    |
| Home              | Três histórias ilustrativas e ranking semanal                          | Ilustrações SVG próprias; ranking só de perfis participantes e XP registrado, semana segunda a domingo em America/Sao_Paulo. |
| Ofensiva          | Dias locais; marcos 1/3/7/14/30 e bônus 10/30/75/150/350               | Fuso IANA fixado no início para impedir alteração retroativa; reconhecimento offline na data da sincronização.               |
| Perfil            | Nome, foto, prévia, cancelar, remover, conquistas                      | JPEG/PNG/WebP até 2 MB; bucket privado; leitura conforme acesso ao perfil.                                                   |
| Materiais         | Oito matérias, cores e ordem; dois conteúdos recentes                  | Acrescentar títulos do protótipo sem remover artigos anteriores; sugestões iniciais identificadas, nunca falsas visitas.     |
| Exercícios        | Seis tipos e oito matérias                                             | Gabaritos privados; desafio autodeclarado com critérios explícitos, sem alegar avaliação semântica.                          |
| Trilhas           | Dez áreas, módulos e progresso separados                               | Preservar duas trilhas existentes e acrescentar nove; IDs próprios; exercícios vinculados por módulo.                        |

Fluxos: Home → ranking/histórias; Aprenda → Material → matéria → leitura/salvar/exportar; Prática → disciplina/tipo → resposta → resultado; Trilhas → iniciar → módulo → exercício → conclusão; Suporte → docente → mensagem ou feedback → detalhes; Config. → perfil → prévia → salvar/cancelar/remover.

Componentes compartilhados planejados: Avatar, WeeklyRanking, LearningProgress, AcademicSupport, ExerciseFields/QuestionDialog. O bot flutuante continua independente do suporte docente.

Validação e diferenças visuais serão registradas ao finalizar. Não existe comparação visual concluída antes da inspeção e dos testes.

## Implementado

- Suporte acadêmico: assistente local explicitamente demonstrativo, perguntas rápidas e resposta por assunto; docente da matrícula, especialidade/horário quando informado; composição de mensagem e histórico; nota/comentário e detalhes; formulário técnico que salva somente no histórico até o compartilhamento explícito. Fila docente e bot global preservados.
- Home: três histórias fictícias com ilustrações SVG; ranking semanal compartilhado com Social; nível, ofensiva atual/melhor e recompensas. Dados reais não são preenchidos com depoimentos ou classificações fictícias.
- Recompensas: registro imutável de XP; serialização por usuário e unicidade por origem; primeiro acerto 40 XP no banco novo, desafio autodeclarado 10 XP, módulo 100 XP, atividade com nota >=7 recebe 100 XP uma vez. Exercícios/módulos antigos conservam seus valores. Bônus de sequência conforme tabela do pedido.
- Ofensiva: só a primeira conclusão elegível de um exercício/módulo concede um dia. Repetições não concedem XP nem mantêm a sequência. Abrir páginas e iniciar trilhas não concede dias. Correções docentes dão XP, mas não inventam presença no dia da correção. Fuso IANA capturado no primeiro uso e fixado; mudança futura requer suporte administrativo. A fila offline usa a data em que o servidor valida a conclusão. Pontos antigos são migrados sem fabricar ofensivas históricas.
- Perfil: JPEG/PNG/WebP até 2 MB, assinatura de arquivo validada, prévia, salvar/cancelar, confirmação de remoção. Demonstração usa imagem persistente local; contas reais usam bucket privado e URLs temporárias autorizadas. Não se apaga a nova foto se apenas o recarregamento dos dados falhar após a gravação.
- Material: oito cores/ordem preservadas; 18 conteúdos, incluindo Gramática ortográfica e Tipos de plantas. Sugestões iniciais identificadas; histórico e conclusão de leitura persistidos. Download HTML válido, cópia IndexedDB e exportação para o dispositivo permanecem distintos.
- Prática: 48 questões gerais (seis tipos × oito matérias), mais 27 exercícios de etapas e quatro exercícios anteriores: 79 no total. Respostas são validadas em RPC, com gabarito privado no banco. Desafios registram relato e checklist, sem prometer julgamento semântico. Estatísticas mostram tentativas, questões distintas, acertos/erros e desempenho.
- Trilhas: 11 no total (duas anteriores e nove novas); 37 módulos. As novas etapas têm exercícios exclusivos, pré-requisitos e IDs separados. Matrícula independente e continuidade registradas.

## Arquivos principais

- `src/components/AcademicSupport.tsx`, `Avatar.tsx`, `ExerciseFields.tsx`, `LearningProgress.tsx`, `Stories.tsx`, `WeeklyRanking.tsx`: componentes novos.
- `src/pages/Home.tsx`, `Learning.tsx`, `Materials.tsx`, `Settings.tsx`, `Social.tsx`: integração dos fluxos.
- `src/state/DataContext.tsx`, `src/services/learning.ts`, `avatars.ts`, `repository.ts`, `src/lib/types.ts`: estado, persistência e regras demonstrativas.
- `src/data/enrichment.json`, `catalog.ts`, `demo.ts`, `public/assets/story-*.svg`: conteúdo introdutório e demonstração.
- `supabase/migrations/202610210007_learning_growth.sql`, `supabase/seed.sql`: banco incremental e currículo.
- `tests/learning.test.ts`, `tests/learning-flows.test.tsx`, `scripts/test-learning-rls.mjs`: testes novos; fluxos existentes ajustados à separação do suporte.

## Instalação e publicação

1. O projeto existente precisa das migrations 001–006 já aplicadas. No Supabase → SQL Editor → New query, execute **apenas** `supabase/migrations/202610210007_learning_growth.sql` nesta atualização. Ela preserva perfis, matrículas e progresso; execute uma vez.
2. Em outra consulta, execute o `supabase/seed.sql` atualizado. É idempotente: não substitui registros existentes com os mesmos IDs. Adiciona currículo, questões e gabaritos.
3. Mantenha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` na Vercel. `VITE_ENABLE_DEMO=true` é opcional para explorar a demonstração. Não adicione service_role ao frontend.
4. Localmente: `npm ci`, `npm test`, `npm run test:rls`, `npm run build`, `npm run dev`. Node >=22.18. O build gera o Service Worker versionado.
5. A branch `dev/skillup-modular-20261019` gera preview na Vercel. Teste com contas de teste após aplicar o SQL e só depois integre o PR à main. Nenhuma mudança de main foi feita nesta etapa.

A interface informa quando o banco ainda não recebeu a migration. Não houve acesso administrativo ao Supabase hospedado nesta sessão, portanto SQL, Storage real e envio entre contas reais dependem dessa aplicação e validação posterior.

## Testes e comparação visual

- 97 testes Vitest passaram: autenticação existente, quatro perfis, navegação, suporte docente, modal de feedback, mensagens demonstrativas, histórias, ranking, materiais das oito disciplinas, IndexedDB, foto/nome/cancelamento/remoção, seis formulários de exercícios e duas trilhas independentes.
- 37 verificações PostgreSQL/PGlite passaram: RLS real com sessões/Storage simulados, proteção de XP, gabaritos privados, duplicidade, fuso, dias consecutivos/interrompidos, ranking opt-in, leitura e foto por proprietário, pré-requisitos e isolamento das trilhas.
- TypeScript e build Vite passaram. O bundle principal gera aviso de tamanho (>650 kB não comprimido); não é erro de compilação. Divisão por rotas é uma otimização futura.
- As duas imagens recentes foram abertas e inspecionadas integralmente. Composição de suporte, grade, cores e ordem foram comparadas com o código; documentos anteriores preservam a análise do case study e wireframes.
- **QA visual no navegador não concluído:** o servidor da skill Sites iniciou, mas a ferramenta de navegador expirou ao abrir a prévia. A skill orienta não substituir a infraestrutura de navegador em caso de indisponibilidade; a prévia foi encerrada. Testes DOM não medem overflow, sobreposição, teclado virtual ou geometria renderizada. Validar 320/393/768/1024/1440 px antes de homologar fidelidade.
- Diferenças intencionais: nome/foto/horário do docente vêm da matrícula; avatar ilustrativo na demonstração; assistente local identificado sem IA generativa; Biologia é artigo introdutório, não vídeo inexistente; dica não promete bônus de fórum não implementado; histórias usam ilustrações próprias; acessibilidade e textos de estados ampliam a altura dos cards.
- Integrações pendentes: provedor de IA, presença online/agenda docente, central técnica externa, avaliação qualitativa automática de desafios. Nada afirma envio externo sem confirmação.

Referências técnicas consultadas: [Supabase — buckets privados](https://supabase.com/docs/guides/storage/buckets/fundamentals) e [políticas de Storage](https://supabase.com/docs/guides/storage/security/access-control). URLs assinadas têm duração limitada e o acesso ao objeto segue as políticas do bucket privado.
