import {
  emptyDataset,
  type Dataset,
  type Project,
  type Role,
} from "../lib/types";
import { id, subjects, materials, tracks, modules, questions } from "./catalog";
export const demoUsers: Record<Role, string> = {
  estudante: id(1),
  docente: id(2),
  recrutador: id(3),
  instituicao: id(4),
};
export const demoPortraits: Record<string, string> = {
  [id(1)]: "/assets/portraits/student.jpg",
  [id(2)]: "/assets/portraits/teacher.jpg",
  [id(3)]: "/assets/portraits/recruiter.jpg",
  [id(5)]: "/assets/portraits/student-beatriz.jpg",
  [id(6)]: "/assets/portraits/student-marcos.jpg",
};
export const demoProjects = [
  {
    id: id(700),
    owner_id: id(2),
    title: "Portal de Sustentabilidade",
    description:
      "Crie uma interface para acompanhar indicadores ambientais com dados de exemplo. Entregáveis: protótipo navegável, página responsiva, código e instruções para executar o projeto.",
    category: "Web",
    skills: ["React", "HTML", "CSS"],
    status: "open" as const,
    image: "/assets/network.webp",
    resources: [
      {
        title: "Curso de HTML5 e CSS3",
        url: "https://www.youtube.com/playlist?list=PLHz_AreHm4dkZ9-atkcmcBaMZdmLHft8n",
        type: "video" as const,
        source: "Curso em Vídeo · YouTube",
      },
      {
        title: "Seu primeiro site",
        url: "https://developer.mozilla.org/pt-BR/docs/Learn_web_development/Getting_started/Your_first_website",
        type: "article" as const,
        source: "MDN Web Docs",
      },
    ],
  },
  {
    id: id(701),
    owner_id: id(2),
    title: "Estufa Inteligente IoT",
    description:
      "Desenvolva uma simulação de monitoramento de temperatura e umidade. Entregáveis: leitura de dados simulados, painel com alertas, testes e documentação das regras usadas.",
    category: "IA",
    skills: ["Python", "Hardware", "Dados"],
    status: "review" as const,
    image: "/assets/iot.webp",
    resources: [
      {
        title: "Curso de Python 3 · Mundo 1",
        url: "https://www.youtube.com/playlist?list=PLHz_AreHm4dlKP6QQCekuIPky1CiwmdI6",
        type: "video" as const,
        source: "Curso em Vídeo · YouTube",
      },
      {
        title: "Tutorial oficial de Python",
        url: "https://docs.python.org/pt-br/3/tutorial/",
        type: "article" as const,
        source: "Python Software Foundation",
      },
    ],
  },
  {
    id: id(702),
    owner_id: id(1),
    title: "Redesign de biblioteca escolar",
    description:
      "Investigue como estudantes procuram materiais e crie um protótipo acessível. Entregáveis: roteiro de pesquisa, fluxo principal, telas responsivas e registro das decisões de acessibilidade.",
    category: "Design",
    skills: ["Figma", "Pesquisa", "Acessibilidade"],
    status: "open" as const,
    image: "/assets/lab.webp",
    resources: [
      {
        title: "Vídeos sobre acessibilidade digital",
        url: "https://www.youtube.com/@w3c_wai/videos",
        type: "video" as const,
        source: "W3C Web Accessibility Initiative · YouTube",
      },
      {
        title: "Tutoriais de acessibilidade para interfaces",
        url: "https://www.w3.org/WAI/tutorials/",
        type: "article" as const,
        source: "W3C Web Accessibility Initiative",
      },
    ],
  },
  {
    id: id(703),
    owner_id: id(2),
    title: "Painel de controle de estoque",
    description:
      "Monte um painel que registre entradas e saídas e calcule o saldo de produtos. Entregáveis: modelo dos dados, formulário validado, histórico de movimentações e testes dos cálculos.",
    category: "Web",
    skills: ["JavaScript", "React", "Testes"],
    status: "open" as const,
    image: "/assets/code.webp",
    resources: [
      {
        title: "Curso de JavaScript",
        url: "https://www.youtube.com/playlist?list=PLHz_AreHm4dlsK3Nr9GVvXCbpQyHQl1o1",
        type: "video" as const,
        source: "Curso em Vídeo · YouTube",
      },
      {
        title: "Guia de JavaScript",
        url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide",
        type: "article" as const,
        source: "MDN Web Docs",
      },
    ],
  },
  {
    id: id(704),
    owner_id: id(2),
    title: "Mapa de pontos de descarte eletrônico",
    description:
      "Crie uma aplicação mobile para localizar pontos de descarte usando uma lista de endereços de exemplo. Entregáveis: fluxo de busca, mapa ou lista acessível, filtros e protótipo responsivo.",
    category: "Mobile",
    skills: ["UX", "Mobile", "Geolocalização"],
    status: "open" as const,
    image: "/assets/network.webp",
    resources: [
      {
        title: "Curso de Git e GitHub",
        url: "https://www.youtube.com/playlist?list=PLHz_AreHm4dm7ZULPAmadvNhH6vk9oNZA",
        type: "video" as const,
        source: "Curso em Vídeo · YouTube",
      },
      {
        title: "API de Geolocalização",
        url: "https://developer.mozilla.org/pt-BR/docs/Web/API/Geolocation_API",
        type: "article" as const,
        source: "MDN Web Docs",
      },
    ],
  },
] satisfies Project[];
export function createDemo(): Dataset {
  const data = emptyDataset();
  Object.assign(data, { subjects, materials, tracks, modules, questions });
  data.profiles = [
    "Alex Silva",
    "Prof. Ricardo",
    "Elena Vance",
    "Coordenação SkillUp",
    "Beatriz Costa",
    "Marcos Oliveira",
  ].map((full_name, i) => ({
    id: id(i + 1),
    full_name,
    avatar_demo: demoPortraits[id(i + 1)],
    headline: [
      "Estudante de desenvolvimento",
      "Docente de programação",
      "Aquisição de talentos",
      "Gestão institucional",
      "Estudante de tecnologia",
      "Estudante de redes",
    ][i],
    bio: "Perfil de exemplo para explorar o SkillUp.",
    skills: i === 0 ? ["Dart", "Lógica"] : [],
    website: "",
    public_profile: true,
    preferences: { study_minutes: 15 },
  }));
  data.organizations = [
    { id: id(8), name: "Instituição de demonstração", website: "" },
  ];
  data.user_roles = Object.entries(demoUsers).map(([role, user_id]) => ({
    role: role as Role,
    user_id,
    organization_id: id(8),
  }));
  data.user_roles.push(
    ...[5, 6].map((n) => ({
      user_id: id(n),
      role: "estudante" as const,
      organization_id: id(8),
    })),
  );
  data.profiles[1].preferences.office_hours =
    "Segunda a sexta, 14h–16h (exemplo)";
  data.reward_events = [5, 6].map((n, i) => ({
    id: id(960 + n),
    user_id: id(n),
    source: "demo:example",
    xp: 120 - i * 40,
    label: "Atividade ilustrativa de demonstração",
    created_at: new Date().toISOString(),
  }));
  data.classes = [
    {
      id: id(500),
      organization_id: id(8),
      teacher_id: id(2),
      title: "Desenvolvimento de Sistemas · Turma A",
      subject: "Programação",
    },
  ];
  data.enrollments = [
    {
      id: id(510),
      class_id: id(500),
      user_id: id(1),
      created_at: "2026-10-01T12:00:00Z",
    },
  ];
  data.assignments = [
    {
      id: id(520),
      class_id: id(500),
      teacher_id: id(2),
      title: "Algoritmo de controle de estoque",
      instructions:
        "Descreva a entrada, o cálculo e a saída de um programa que controla três produtos. Inclua um caso com estoque zero.",
      due_at: "2026-10-26T23:59:00-03:00",
    },
  ];
  data.submissions = [
    {
      id: id(530),
      assignment_id: id(520),
      student_id: id(1),
      body: "Entrada: preço e quantidade de cada produto. Processamento: somar preço × quantidade. Saída: valor total do estoque.",
      grade: null,
      feedback: null,
      status: "submitted",
      created_at: "2026-10-18T12:00:00Z",
    },
  ];
  data.assignments.push({
    id: id(521),
    class_id: id(500),
    teacher_id: id(2),
    title: "Módulo: Software Architecture",
    instructions:
      "Documente responsabilidades e a separação das camadas de um sistema.",
    due_at: "2026-10-20T20:00:00Z",
  });
  data.submissions.push({
    id: id(531),
    assignment_id: id(521),
    student_id: id(1),
    body: "Separei apresentação, regras de negócio e persistência; cada camada possui responsabilidades descritas no projeto.",
    grade: 9.5,
    feedback:
      "Excelente aplicação dos padrões de design. Notei uma ótima separação de preocupações na camada de serviços. Como próximo passo, documente os contratos e acrescente testes para falhas de conexão. Avaliação ilustrativa da demonstração.",
    status: "reviewed",
    created_at: "2026-10-20T18:00:00Z",
  });
  data.progress = [
    {
      id: id(540),
      user_id: id(1),
      module_id: id(300),
      completed_at: "2026-10-17T12:00:00Z",
    },
    {
      id: id(541),
      user_id: id(1),
      module_id: id(301),
      completed_at: "2026-10-18T12:00:00Z",
    },
  ];
  data.posts = [
    {
      id: id(600),
      user_id: id(5),
      author_name: "Beatriz Costa",
      kind: "forum",
      category: "Carreira",
      title: "Dicas para o primeiro estágio em Tech",
      body: "Estou montando meu primeiro portfólio. Como vocês organizam os projetos e explicam suas decisões?",
      image: null,
      created_at: "2026-10-18T12:00:00Z",
    },
    {
      id: id(601),
      user_id: id(6),
      author_name: "Marcos Oliveira",
      kind: "forum",
      category: "Hardware",
      title: "Diferenças entre processadores ARM e x86",
      body: "Quais aspectos devemos considerar ao escolher uma arquitetura para um projeto embarcado?",
      image: null,
      created_at: "2026-10-17T13:00:00Z",
    },
    {
      id: id(602),
      user_id: id(2),
      author_name: "Prof. Ricardo",
      kind: "feed",
      category: "Programação",
      title: "Masterclass: Arquitetura de Microserviços",
      body: "Um exercício para a turma: descreva os limites entre os serviços de pedidos, estoque e pagamentos.",
      image: "/assets/code.webp",
      created_at: "2026-10-19T12:00:00Z",
    },
    {
      id: id(603),
      user_id: id(5),
      author_name: "Beatriz Costa",
      kind: "feed",
      category: "Programação",
      title: "Uma dica sobre TypeScript",
      body: "Record<string, unknown> é útil para representar objetos de chaves dinâmicas. Antes de usar os valores, verifique o tipo de cada um.",
      image: null,
      created_at: "2026-10-18T17:00:00Z",
    },
    {
      id: id(604),
      user_id: id(1),
      author_name: "Alex Silva",
      kind: "story",
      category: "Aprendizagem",
      title: "Meu primeiro projeto em equipe",
      body: "Dividimos as tarefas, revisamos o código juntos e documentamos o que aprendemos.",
      image: "/assets/lab.webp",
      created_at: "2026-10-17T17:00:00Z",
    },
    {
      id: id(605),
      user_id: id(4),
      author_name: "Coordenação SkillUp",
      kind: "announcement",
      category: "Institucional",
      title: "Mostra de projetos técnicos",
      body: "Exemplo de comunicado: compartilhe a proposta do seu projeto para receber feedback da turma.",
      image: null,
      created_at: "2026-10-18T15:00:00Z",
    },
  ];
  data.projects = structuredClone(demoProjects);
  data.project_members = [{ id: id(710), project_id: id(700), user_id: id(1) }];
  data.jobs = [
    {
      id: id(800),
      owner_id: id(3),
      title: "Estágio em Desenvolvimento Web",
      company: "Empresa de exemplo",
      location: "Recife, PE",
      mode: "Híbrido",
      description:
        "Oportunidade demonstrativa para praticar a candidatura. Desenvolver interfaces, documentar componentes e colaborar em revisões.",
      skills: ["HTML", "CSS", "JavaScript"],
      status: "open",
      application_url: null,
      created_at: "2026-10-18T12:00:00Z",
    },
    {
      id: id(801),
      owner_id: id(3),
      title: "UX Designer Intern",
      company: "Estúdio de exemplo",
      location: "Remoto",
      mode: "Remoto",
      description:
        "Oportunidade demonstrativa. Apoio em pesquisa, protótipos e testes de usabilidade.",
      skills: ["Figma", "Pesquisa", "Prototipação"],
      status: "open",
      application_url: null,
      created_at: "2026-10-17T12:00:00Z",
    },
  ];
  data.study_events = [
    {
      id: id(900),
      user_id: id(1),
      class_id: null,
      title: "Dinâmica rápida: lógica",
      description: "Revise condições e faça um exercício.",
      starts_at: new Date(new Date().setHours(18, 0, 0, 0)).toISOString(),
      duration_minutes: 15,
    },
  ];
  return structuredClone(data);
}
