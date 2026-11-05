import { Avatar } from "../../components/Avatar";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { requireSupabase } from "../../services/supabase";
import { ActionLink, Badge, Card, Empty, Notice } from "../../components/ui";
import { safeUrl } from "../../lib/utils";
import { HighlightCard } from "./Highlights";
import { PortfolioImage } from "./ProjectTools";
import type { Highlight } from "./model";
interface PublicProject {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  image: string | null;
  cover_path: string | null;
  external_url: string;
  author: string;
}
interface PublicStudent {
  avatar_path?: string | null;
  id: string;
  full_name: string;
  headline: string;
  bio: string;
  skills: string[];
  education: string;
  study_area: string;
  highlights: Highlight[];
  projects: PublicProject[];
  achievements: {
    name: string;
    description: string;
    earned_at: string;
    featured: boolean;
  }[];
}
export function PublicPortfolio({
  kind,
}: {
  kind: "project" | "profile" | "highlight";
}) {
  const { id } = useParams();
  const [data, setData] = useState<
      | PublicProject
      | PublicStudent
      | { highlight: Highlight; full_name: string; headline: string }
      | null
    >(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setData(null);
    setError("");
    (async () => {
      try {
        const r = await requireSupabase().rpc(
          kind === "project"
            ? "public_project"
            : kind === "profile"
              ? "public_student_portfolio"
              : "public_highlight",
          { p_id: id },
        );
        if (r.error) throw r.error;
        if (active) setData(r.data);
      } catch {
        if (active)
          setError(
            "Não foi possível carregar esta página. Confira a conexão ou tente novamente mais tarde.",
          );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, kind]);
  return (
    <main className="standalone stack">
      <Link to="/">SkillUp · Início</Link>
      {loading ? (
        <p role="status">Carregando…</p>
      ) : error ? (
        <Notice tone="error">{error}</Notice>
      ) : !data ? (
        <Empty title="Conteúdo indisponível">
          O conteúdo pode ser privado, removido ou não autorizado para acesso
          público.
        </Empty>
      ) : kind === "project" ? (
        <PublicProjectCard project={data as PublicProject} />
      ) : kind === "highlight" ? (
        <>
          <h1>{(data as { full_name: string }).full_name}</h1>
          <p>{(data as { headline: string }).headline}</p>
          <HighlightCard item={(data as { highlight: Highlight }).highlight} />
        </>
      ) : (
        <StudentContent profile={data as PublicStudent} />
      )}
    </main>
  );
}
function PublicProjectCard({ project: p }: { project: PublicProject }) {
  return (
    <Card>
      <PortfolioImage path={p.cover_path} fallback={p.image} alt={p.title} />
      <Badge>{p.category}</Badge>
      <h1>{p.title}</h1>
      <p>Por {p.author}</p>
      <p className="pre-wrap">{p.description}</p>
      <div className="chips">
        {p.skills.map((s) => (
          <Badge key={s}>{s}</Badge>
        ))}
      </div>
      {safeUrl(p.external_url) && (
        <a
          href={safeUrl(p.external_url)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Visualizar projeto externo
        </a>
      )}
      <ActionLink to={`/app/social/projetos/${p.id}`} variant="outline">
        Abrir na comunidade
      </ActionLink>
    </Card>
  );
}
function StudentContent({ profile: p }: { profile: PublicStudent }) {
  return (
    <>
      <Card>
        <Avatar name={p.full_name} path={p.avatar_path} size={80} />
        <h1>{p.full_name}</h1>
        <p>{p.headline}</p>
        <p>{p.study_area}</p>
        <p className="pre-wrap">{p.bio}</p>
        <div className="chips">
          {p.skills.map((s) => (
            <Badge key={s}>{s}</Badge>
          ))}
        </div>
        <p className="small muted">
          Apresentação e habilidades declaradas pelo estudante.
        </p>
      </Card>
      {p.education && (
        <Card>
          <h2>Formação</h2>
          <p className="pre-wrap">{p.education}</p>
        </Card>
      )}
      <Card>
        <h2>Conquistas</h2>
        {p.achievements.map((a) => (
          <p key={a.name}>
            <strong>
              {a.name}
              {a.featured ? " · Destaque" : ""}
            </strong>{" "}
            — {a.description}
          </p>
        ))}
      </Card>
      <h2>Projetos públicos</h2>
      {p.projects.map((project) => (
        <PublicProjectCard key={project.id} project={project} />
      ))}
      <h2>Destaques públicos</h2>
      {p.highlights.map((h) => (
        <HighlightCard key={h.id} item={h} />
      ))}
    </>
  );
}
