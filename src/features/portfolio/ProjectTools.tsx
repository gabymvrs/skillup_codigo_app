import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Project } from "../../lib/types";
import { useAuth } from "../../state/AuthContext";
import { useData } from "../../state/DataContext";
import {
  ActionFeedback,
  ActionLink,
  Badge,
  Button,
  Card,
  Empty,
  Modal,
  Notice,
  SectionTitle,
  useAction,
} from "../../components/ui";
import { copyText, uid } from "../../lib/utils";
import { defaultPortfolio, recommendProjects } from "./model";
import { savePortfolioRow, signedFile } from "./service";
import { usePortfolio } from "./usePortfolio";
export function PortfolioImage({
  path,
  fallback,
  alt,
}: {
  path?: string | null;
  fallback?: string | null;
  alt: string;
}) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let active = true;
    setUrl("");
    if (path)
      void signedFile("portfolio-files", path)
        .then((u) => {
          if (active) setUrl(u);
        })
        .catch(() => {});
    return () => {
      active = false;
    };
  }, [path]);
  return url || fallback ? (
    <img
      className="portfolio-cover"
      src={url || fallback!}
      alt={alt}
      loading="lazy"
    />
  ) : (
    <div
      className="portfolio-cover-placeholder"
      aria-label="Projeto sem imagem de capa"
    >
      Projeto · SkillUp
    </div>
  );
}
export function ProjectShare({ project }: { project: Project }) {
  const auth = useAuth(),
    repo = useData(),
    action = useAction();
  const [open, setOpen] = useState(false),
    [manual, setManual] = useState("");
  if (auth.role !== "estudante") return null;
  const isPrivate = project.visibility === "private",
    link = `${location.origin}${project.visibility === "public" ? "/projetos/" : "/app/social/projetos/"}${project.id}`;
  async function copy() {
    if (auth.demo)
      throw Error(
        "Links da demonstração não são públicos. Use uma conta real para compartilhar.",
      );
    if (!(await copyText(link))) setManual(link);
  }
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Compartilhar projeto
      </Button>
      {open && (
        <Modal title="Compartilhar projeto" onClose={() => setOpen(false)}>
          <PortfolioImage
            path={project.cover_path}
            fallback={project.image}
            alt={project.title}
          />
          <h3>{project.title}</h3>
          <p>{project.description.slice(0, 180)}</p>
          <p className="small">
            Por{" "}
            {repo.data.profiles.find((p) => p.id === project.owner_id)
              ?.full_name || "Estudante da comunidade"}
          </p>
          <div className="chips">
            {project.skills.map((s) => (
              <Badge key={s}>{s}</Badge>
            ))}
          </div>
          {isPrivate ? (
            <Notice>
              Este projeto é privado. Altere a visibilidade nos detalhes antes
              de compartilhá-lo.
            </Notice>
          ) : (
            <div className="stack">
              <p>
                {project.visibility === "public"
                  ? "Qualquer pessoa com o link poderá ver a prévia pública."
                  : "Este link exige uma conta autenticada no SkillUp."}
              </p>
              <Button
                variant="outline"
                onClick={() =>
                  action.run(copy, "Link preparado para compartilhamento.")
                }
              >
                Copiar link do projeto
              </Button>
              {typeof navigator.share === "function" && (
                <Button
                  variant="outline"
                  onClick={() =>
                    action.run(async () => {
                      if (auth.demo)
                        throw Error(
                          "Compartilhamento externo indisponível na demonstração.",
                        );
                      await navigator.share({
                        title: project.title,
                        text: project.description.slice(0, 160),
                        url: link,
                      });
                    })
                  }
                >
                  Compartilhar no dispositivo
                </Button>
              )}
              <Button
                disabled={action.busy}
                onClick={() =>
                  action.run(
                    async () => {
                      await repo.add("posts", {
                        id: uid(),
                        user_id: auth.id!,
                        author_name:
                          repo.data.profiles.find((p) => p.id === auth.id)
                            ?.full_name || "Estudante",
                        kind: "feed",
                        category: project.category,
                        title: "Projeto compartilhado",
                        body: "Conheça este projeto da comunidade.",
                        image: null,
                        project_id: project.id,
                        created_at: new Date().toISOString(),
                      });
                    },
                    auth.demo
                      ? "Projeto publicado no feed demonstrativo."
                      : "Projeto publicado no feed do SkillUp.",
                  )
                }
              >
                Publicar projeto no feed
              </Button>
            </div>
          )}
          {manual && (
            <label>
              Copie este link
              <input
                readOnly
                value={manual}
                onFocus={(e) => e.target.select()}
              />
            </label>
          )}
          <ActionFeedback action={action} />
        </Modal>
      )}
    </>
  );
}
export function ProjectSave({ project }: { project: Project }) {
  const auth = useAuth(),
    feature = usePortfolio(),
    action = useAction();
  const signal = feature.data.project_signals.find(
    (s) => s.project_id === project.id && s.user_id === auth.id,
  );
  if (auth.role !== "estudante") return null;
  return (
    <>
      <Button
        variant="ghost"
        disabled={action.busy || Boolean(feature.error)}
        aria-pressed={Boolean(signal?.saved)}
        onClick={() =>
          action.run(
            () =>
              savePortfolioRow(auth.demo, "project_signals", {
                id: signal?.id || uid(),
                user_id: auth.id!,
                project_id: project.id,
                viewed_at: signal?.viewed_at || null,
                saved: !signal?.saved,
              }),
            signal?.saved ? "Projeto removido dos salvos." : "Projeto salvo.",
          )
        }
      >
        {signal?.saved ? "Remover dos salvos" : "Salvar projeto"}
      </Button>
      <ActionFeedback action={action} />
    </>
  );
}
export function ProjectViewed({ project }: { project: Project }) {
  const auth = useAuth(),
    feature = usePortfolio();
  const signal = feature.data.project_signals.find(
    (s) => s.project_id === project.id && s.user_id === auth.id,
  );
  useEffect(() => {
    if (
      auth.role !== "estudante" ||
      feature.loading ||
      feature.error ||
      signal?.viewed_at
    )
      return;
    void savePortfolioRow(auth.demo, "project_signals", {
      id: signal?.id || uid(),
      user_id: auth.id!,
      project_id: project.id,
      saved: signal?.saved || false,
      viewed_at: new Date().toISOString(),
    }).catch(() => {});
  }, [
    auth.id,
    auth.role,
    auth.demo,
    feature.loading,
    feature.error,
    signal,
    project.id,
  ]);
  return null;
}
export function ProjectRecommendations() {
  const auth = useAuth(),
    repo = useData(),
    feature = usePortfolio();
  const profile = repo.data.profiles.find((p) => p.id === auth.id);
  if (auth.role !== "estudante" || !profile) return null;
  const rows = recommendProjects(
    repo.data.projects,
    profile,
    feature.data.student_portfolios.find((s) => s.id === auth.id) ||
      defaultPortfolio(auth.id!),
    feature.data.project_signals,
  );
  return (
    <section className="stack">
      <SectionTitle
        action={<Link to="/app/perfil">Ajustar meus interesses</Link>}
      >
        Projetos recomendados para você
      </SectionTitle>
      {feature.error && <Notice>{feature.error}</Notice>}
      <div className="portfolio-grid">
        {rows.map(({ project: p, reason }) => (
          <Card key={p.id}>
            <PortfolioImage
              path={p.cover_path}
              fallback={p.image}
              alt={p.title}
            />
            <Badge>{p.category}</Badge>
            <h3>{p.title}</h3>
            <p className="small">
              Por{" "}
              {repo.data.profiles.find((x) => x.id === p.owner_id)?.full_name ||
                "Estudante da comunidade"}
            </p>
            <div className="chips">
              {p.skills.map((s) => (
                <Badge key={s}>{s}</Badge>
              ))}
            </div>
            <p className="small muted">{reason}</p>
            <ActionLink to={`/app/social/projetos/${p.id}`} variant="outline">
              Visualizar projeto
            </ActionLink>
            <ProjectSave project={p} />
          </Card>
        ))}
      </div>
      {!rows.length && (
        <Empty title="Ainda não há projetos para recomendar">
          As sugestões aparecerão quando a comunidade publicar projetos. Nenhuma
          publicação é criada artificialmente.
        </Empty>
      )}
    </section>
  );
}
