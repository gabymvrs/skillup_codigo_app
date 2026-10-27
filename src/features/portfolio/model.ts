import type { Dataset, Profile, Project } from "../../lib/types";
export type Visibility = "public" | "community" | "private";
export const visibilityLabels = {
  public: "Público",
  community: "Somente comunidade",
  private: "Privado",
};
export const headlines = [
  "Estudante de Desenvolvimento de Sistemas",
  "Desenvolvedor Front-end em formação",
  "Desenvolvedor Back-end em formação",
  "Desenvolvedor Full Stack em formação",
  "UI/UX Designer em formação",
  "Analista de Dados em formação",
  "Profissional de Redes em formação",
  "Técnico em Logística em formação",
  "Estudante de Tecnologia",
];
export const skillSuggestions = [
  "Python",
  "JavaScript",
  "HTML",
  "CSS",
  "React",
  "Git",
  "SQL",
  "UI Design",
  "UX Design",
  "Figma",
  "Prototipagem",
  "Design System",
  "Pesquisa com Usuários",
  "Acessibilidade",
  "Comunicação",
  "Trabalho em Equipe",
  "Resolução de Problemas",
  "Organização",
  "Criatividade",
];
export const reportReasons = [
  "Spam",
  "Assédio ou bullying",
  "Discurso de ódio",
  "Conteúdo inadequado",
  "Divulgação de dados pessoais",
  "Outro",
];
export const highlightKinds = [
  "Certificado",
  "Experiência acadêmica",
  "Experiência profissional",
  "Projeto pessoal",
  "Evento",
  "Curso concluído",
  "Conquista",
];
export interface Portfolio {
  id: string;
  study_area: string;
  education: string;
  interests: string[];
  technologies: string[];
  knowledge_level: string;
  public_portfolio: boolean;
  featured_badges: string[];
}
export interface Highlight {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  organization: string;
  description: string;
  started_on: string;
  ended_on: string | null;
  external_url: string;
  file_path: string | null;
  file_name: string;
  visibility: Visibility;
  pinned: boolean;
  created_at: string;
}
export interface Resume {
  id: string;
  user_id: string;
  file_path: string;
  file_name: string;
  size_bytes: number;
  created_at: string;
}
export interface Achievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
}
export interface Definition {
  id: string;
  name: string;
  description: string;
  icon: string;
}
export interface Signal {
  id: string;
  user_id: string;
  project_id: string;
  saved: boolean;
  viewed_at: string | null;
}
export interface Report {
  id: string;
  comment_id: string;
  reporter_id: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
}
export interface PortfolioData {
  student_portfolios: Portfolio[];
  profile_highlights: Highlight[];
  student_resumes: Resume[];
  student_achievements: Achievement[];
  achievement_definitions: Definition[];
  project_signals: Signal[];
  comment_reports: Report[];
}
export const definitions: Definition[] = [
  {
    id: "first_lesson",
    name: "Primeiros Passos",
    description: "Concluir a primeira lição.",
    icon: "book",
  },
  {
    id: "first_code",
    name: "Programador Iniciante",
    description: "Concluir corretamente uma prática de código.",
    icon: "code",
  },
  {
    id: "streak7",
    name: "Estudante Dedicado",
    description: "Estudar por 7 dias consecutivos.",
    icon: "flame",
  },
  {
    id: "explorer",
    name: "Explorador",
    description: "Iniciar 3 trilhas diferentes.",
    icon: "compass",
  },
  {
    id: "creator",
    name: "Criador",
    description: "Publicar o primeiro projeto público ou da comunidade.",
    icon: "briefcase",
  },
  {
    id: "weekly_top3",
    name: "Destaque Semanal",
    description: "Terminar uma semana entre os três primeiros do ranking.",
    icon: "trophy",
  },
];
export const emptyPortfolioData = (): PortfolioData => ({
  student_portfolios: [],
  profile_highlights: [],
  student_resumes: [],
  student_achievements: [],
  achievement_definitions: definitions,
  project_signals: [],
  comment_reports: [],
});
export const defaultPortfolio = (id: string): Portfolio => ({
  id,
  study_area: "",
  education: "",
  interests: [],
  technologies: [],
  knowledge_level: "iniciante",
  public_portfolio: false,
  featured_badges: [],
});
export function uniqueSkills(values: string[], limit = 30) {
  const clean = values.map((s) => s.trim()).filter(Boolean);
  if (clean.some((s) => s.length > 60) || clean.length > limit)
    throw Error(`Use até ${limit} habilidades, com até 60 caracteres cada.`);
  return [...new Map(clean.map((s) => [s.toLocaleLowerCase(), s])).values()];
}
const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
export function recommendProjects(
  projects: Project[],
  profile: Profile,
  portfolio: Portfolio,
  signals: Signal[],
  limit = 4,
) {
  const history = signals
    .filter((s) => s.user_id === profile.id && (s.saved || s.viewed_at))
    .flatMap((s) => projects.find((p) => p.id === s.project_id)?.skills || []);
  const own = new Set(
    [
      ...profile.skills,
      ...portfolio.interests,
      ...portfolio.technologies,
      portfolio.study_area,
    ]
      .map(norm)
      .filter(Boolean),
  );
  return projects
    .filter(
      (p) =>
        p.owner_id !== profile.id &&
        p.status !== "archived" &&
        (p.visibility || "community") !== "private",
    )
    .map((p) => {
      const tags = [p.category, ...p.skills],
        direct = tags.filter((t) => own.has(norm(t))),
        related = tags.filter((t) => history.map(norm).includes(norm(t)));
      const personalized = own.size > 0 || history.length > 0;
      const level =
        personalized && p.knowledge_level === portfolio.knowledge_level;
      return {
        project: p,
        score: direct.length * 3 + related.length + (level ? 1 : 0),
        reason: direct.length
          ? `Combina com ${direct.slice(0, 3).join(", ")}.`
          : related.length
            ? `Relacionado aos projetos que você visualizou ou salvou: ${related[0]}.`
            : level
              ? "Adequado ao seu nível de conhecimento."
              : "Sugestão inicial para explorar a comunidade.",
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score || a.project.title.localeCompare(b.project.title),
    )
    .slice(0, limit);
}
export function demoAchievements(d: Dataset, userId: string): string[] {
  const earned: string[] = [];
  if (d.progress.some((p) => p.user_id === userId)) earned.push("first_lesson");
  if (
    d.attempts.some(
      (a) =>
        a.user_id === userId &&
        a.correct &&
        d.questions.some(
          (q) => q.id === a.question_id && q.activity_type === "code_practice",
        ),
    )
  )
    earned.push("first_code");
  if (
    new Set(
      d.track_enrollments
        .filter((e) => e.user_id === userId)
        .map((e) => e.track_id),
    ).size >= 3
  )
    earned.push("explorer");
  if (
    d.projects.some(
      (p) =>
        p.owner_id === userId &&
        p.visibility !== "private" &&
        p.status !== "archived",
    )
  )
    earned.push("creator");
  const days = [
    ...new Set(
      d.study_days
        .filter((s) => s.user_id === userId)
        .map((s) => Date.parse(s.day) / 86400000),
    ),
  ].sort((a, b) => a - b);
  let streak = 0;
  days.forEach((day, i) => {
    streak = i && day === days[i - 1] + 1 ? streak + 1 : 1;
    if (streak >= 7 && !earned.includes("streak7")) earned.push("streak7");
  });
  // Weekly award is intentionally server-only; no fabricated demo podium.
  return earned;
}
