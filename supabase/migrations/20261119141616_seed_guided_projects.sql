-- Curated SkillUp projects have no student owner and cannot be edited through
-- the regular owner-only policies. Re-running this migration is safe.
begin;

alter table public.projects
  alter column owner_id drop not null,
  add column if not exists resources jsonb not null default '[]'::jsonb;

alter table public.projects
  drop constraint if exists projects_resources_valid,
  add constraint projects_resources_valid check (
    jsonb_typeof(resources) = 'array' and jsonb_array_length(resources) <= 10
  );

insert into public.projects (
  id, owner_id, title, description, category, skills, status, image,
  visibility, knowledge_level, cover_path, external_url, resources
)
values
(
  '00000000-0000-4000-8000-000000000700', null,
  'Portal de Sustentabilidade',
  'Crie uma interface para acompanhar indicadores ambientais com dados de exemplo. Entregáveis: protótipo navegável, página responsiva, código e instruções para executar o projeto.',
  'Web', array['React','HTML','CSS'], 'open', '/assets/network.webp',
  'public', 'iniciante', null, '',
  '[{"title":"Curso de HTML5 e CSS3","url":"https://www.youtube.com/playlist?list=PLHz_AreHm4dkZ9-atkcmcBaMZdmLHft8n","type":"video","source":"Curso em Vídeo · YouTube"},{"title":"Seu primeiro site","url":"https://developer.mozilla.org/pt-BR/docs/Learn_web_development/Getting_started/Your_first_website","type":"article","source":"MDN Web Docs"}]'::jsonb
),
(
  '00000000-0000-4000-8000-000000000701', null,
  'Estufa Inteligente IoT',
  'Desenvolva uma simulação de monitoramento de temperatura e umidade. Entregáveis: leitura de dados simulados, painel com alertas, testes e documentação das regras usadas.',
  'IA', array['Python','Hardware','Dados'], 'review', '/assets/iot.webp',
  'public', 'intermediario', null, '',
  '[{"title":"Curso de Python 3 · Mundo 1","url":"https://www.youtube.com/playlist?list=PLHz_AreHm4dlKP6QQCekuIPky1CiwmdI6","type":"video","source":"Curso em Vídeo · YouTube"},{"title":"Tutorial oficial de Python","url":"https://docs.python.org/pt-br/3/tutorial/","type":"article","source":"Python Software Foundation"}]'::jsonb
),
(
  '00000000-0000-4000-8000-000000000702', null,
  'Redesign de biblioteca escolar',
  'Investigue como estudantes procuram materiais e crie um protótipo acessível. Entregáveis: roteiro de pesquisa, fluxo principal, telas responsivas e registro das decisões de acessibilidade.',
  'Design', array['Figma','Pesquisa','Acessibilidade'], 'open', '/assets/lab.webp',
  'public', 'iniciante', null, '',
  '[{"title":"Vídeos sobre acessibilidade digital","url":"https://www.youtube.com/@w3c_wai/videos","type":"video","source":"W3C Web Accessibility Initiative · YouTube"},{"title":"Tutoriais de acessibilidade para interfaces","url":"https://www.w3.org/WAI/tutorials/","type":"article","source":"W3C Web Accessibility Initiative"}]'::jsonb
),
(
  '00000000-0000-4000-8000-000000000703', null,
  'Painel de controle de estoque',
  'Monte um painel que registre entradas e saídas e calcule o saldo de produtos. Entregáveis: modelo dos dados, formulário validado, histórico de movimentações e testes dos cálculos.',
  'Web', array['JavaScript','React','Testes'], 'open', '/assets/code.webp',
  'public', 'iniciante', null, '',
  '[{"title":"Curso de JavaScript","url":"https://www.youtube.com/playlist?list=PLHz_AreHm4dlsK3Nr9GVvXCbpQyHQl1o1","type":"video","source":"Curso em Vídeo · YouTube"},{"title":"Guia de JavaScript","url":"https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide","type":"article","source":"MDN Web Docs"}]'::jsonb
),
(
  '00000000-0000-4000-8000-000000000704', null,
  'Mapa de pontos de descarte eletrônico',
  'Crie uma aplicação mobile para localizar pontos de descarte usando uma lista de endereços de exemplo. Entregáveis: fluxo de busca, mapa ou lista acessível, filtros e protótipo responsivo.',
  'Mobile', array['UX','Mobile','Geolocalização'], 'open', '/assets/network.webp',
  'public', 'iniciante', null, '',
  '[{"title":"Curso de Git e GitHub","url":"https://www.youtube.com/playlist?list=PLHz_AreHm4dm7ZULPAmadvNhH6vk9oNZA","type":"video","source":"Curso em Vídeo · YouTube"},{"title":"API de Geolocalização","url":"https://developer.mozilla.org/pt-BR/docs/Web/API/Geolocation_API","type":"article","source":"MDN Web Docs"}]'::jsonb
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  skills = excluded.skills,
  status = excluded.status,
  image = excluded.image,
  visibility = excluded.visibility,
  knowledge_level = excluded.knowledge_level,
  resources = excluded.resources;

commit;
