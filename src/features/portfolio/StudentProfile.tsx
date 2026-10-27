import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../state/AuthContext";
import { useData } from "../../state/DataContext";
import { Avatar } from "../../components/Avatar";
import { Experiences } from "../../components/Experiences";
import {
  ActionFeedback,
  ActionLink,
  Badge,
  Button,
  Card,
  Empty,
  Heading,
  Icon,
  Modal,
  Notice,
  useAction,
} from "../../components/ui";
import { copyText, dateLabel } from "../../lib/utils";
import { defaultPortfolio, type Portfolio } from "./model";
import { savePortfolioRow } from "./service";
import { usePortfolio } from "./usePortfolio";
import { Highlights } from "./Highlights";
import { ResumePanel } from "./Resume";
import { ProjectSave, ProjectShare, PortfolioImage } from "./ProjectTools";
export function StudentProfile() {
  const auth = useAuth(),
    repo = useData(),
    feature = usePortfolio(),
    { userId } = useParams(),
    action = useAction();
  const id = userId || auth.id!,
    own = id === auth.id && auth.role === "estudante",
    profile = repo.data.profiles.find((p) => p.id === id);
  const [editing, setEditing] = useState(false),
    [shareLink, setShareLink] = useState("");
  const portfolio =
      feature.data.student_portfolios.find((p) => p.id === id) ||
      defaultPortfolio(id),
    earned = feature.data.student_achievements.filter((a) => a.user_id === id),
    projects = repo.data.projects.filter(
      (p) =>
        p.owner_id === id &&
        p.status !== "archived" &&
        (own || p.visibility !== "private"),
    );
  if (!profile)
    return (
      <Empty title="Perfil indisponível">
        Este perfil não está visível para sua conta.
      </Empty>
    );
  const role = repo.data.user_roles.find((r) => r.user_id === id),
    org = repo.data.organizations.find((o) => o.id === role?.organization_id);
  return (
    <div className="stack portfolio-page">
      <Heading
        title={own ? "Meu perfil profissional" : "Perfil do estudante"}
        description="Trajetória acadêmica, competências e experiências."
      />
      <Card>
        <div className="portfolio-identity">
          <Avatar
            name={profile.full_name}
            path={profile.avatar_path}
            demoImage={profile.avatar_demo}
            size={80}
          />
          <div>
            <h2>{profile.full_name}</h2>
            <p>
              {profile.headline ||
                "Apresentação profissional ainda não informada"}
            </p>
            {(org?.name || portfolio.study_area) && (
              <p className="small muted">
                {[org?.name, portfolio.study_area].filter(Boolean).join(" · ")}
              </p>
            )}
            <div className="chips">
              {earned
                .filter((a) =>
                  portfolio.featured_badges.includes(a.achievement_id),
                )
                .map((a) => (
                  <Badge key={a.id}>
                    <Icon name="award" />
                    {
                      feature.data.achievement_definitions.find(
                        (d) => d.id === a.achievement_id,
                      )?.name
                    }
                  </Badge>
                ))}
            </div>
          </div>
        </div>
        {profile.bio && <p>{profile.bio}</p>}
        {own && (
          <div className="actions">
            <ActionLink to="/app/config/perfil" variant="outline">
              Editar Perfil
            </ActionLink>
            <Button
              variant="outline"
              disabled={Boolean(feature.error)}
              onClick={() => setEditing(true)}
            >
              Interesses e privacidade
            </Button>
            {portfolio.public_portfolio && (
              <Button
                variant="ghost"
                onClick={() =>
                  action.run(async () => {
                    if (auth.demo)
                      throw Error(
                        "A demonstração não publica perfis na internet.",
                      );
                    const url = `${location.origin}/perfil/${id}`;
                    if (!(await copyText(url))) setShareLink(url);
                  }, "Link do perfil público copiado.")
                }
              >
                Compartilhar perfil público
              </Button>
            )}
          </div>
        )}
        {shareLink && (
          <input
            aria-label="Link público do perfil"
            value={shareLink}
            readOnly
            onFocus={(e) => e.target.select()}
          />
        )}
        <ActionFeedback action={action} />
      </Card>
      <Card>
        <h2>Habilidades</h2>
        <div className="chips">
          {profile.skills.map((s) => (
            <Badge key={s}>{s}</Badge>
          ))}
        </div>
        {!profile.skills.length && (
          <p>
            Adicione habilidades em Editar Perfil para personalizar suas
            recomendações.
          </p>
        )}
        <p className="small muted">Competências autodeclaradas.</p>
      </Card>
      {feature.loading ? (
        <p role="status">Carregando portfólio…</p>
      ) : feature.error ? (
        <Notice tone="warning">{feature.error}</Notice>
      ) : (
        <>
          <details className="card">
            <summary>Conquistas</summary>
            <p className="small muted">
              Desbloqueios calculados a partir de atividades registradas.
              Destaque até três conquistas.
            </p>
            <div className="achievement-grid">
              {feature.data.achievement_definitions.map((d) => {
                const a = earned.find((a) => a.achievement_id === d.id),
                  featured = portfolio.featured_badges.includes(d.id);
                return (
                  <div
                    className={`achievement ${a ? "earned" : "locked"}`}
                    key={d.id}
                  >
                    <Icon name={a ? d.icon : "lock"} size={28} />
                    <h3>{d.name}</h3>
                    <p>{d.description}</p>
                    <small>
                      {a
                        ? `Conquistado em ${dateLabel(a.earned_at)}`
                        : "Bloqueado"}
                    </small>
                    {own && a && (
                      <Button
                        variant="ghost"
                        disabled={
                          action.busy ||
                          (!featured && portfolio.featured_badges.length >= 3)
                        }
                        onClick={() =>
                          action.run(() =>
                            savePortfolioRow(auth.demo, "student_portfolios", {
                              ...portfolio,
                              featured_badges: featured
                                ? portfolio.featured_badges.filter(
                                    (x) => x !== d.id,
                                  )
                                : [...portfolio.featured_badges, d.id],
                            }),
                          )
                        }
                      >
                        {featured ? "Retirar do topo" : "Destacar no topo"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </details>
          <details className="card">
            <summary>Projetos em destaque</summary>
            <div className="portfolio-grid">
              {projects.map((p) => (
                <Card key={p.id}>
                  <PortfolioImage
                    path={p.cover_path}
                    fallback={p.image}
                    alt={p.title}
                  />
                  <h3>{p.title}</h3>
                  <p>{p.description.slice(0, 180)}</p>
                  <ActionLink
                    to={`/app/social/projetos/${p.id}`}
                    variant="outline"
                  >
                    Ver projeto
                  </ActionLink>
                  {own && <ProjectShare project={p} />}
                </Card>
              ))}
            </div>
            {!projects.length && <p>Nenhum projeto visível por enquanto.</p>}
            {own && (
              <ActionLink to="/app/social/projetos" variant="ghost">
                Gerenciar projetos
              </ActionLink>
            )}
          </details>
          <details className="card" open>
            <summary>Certificados, experiências e publicações</summary>
            <Highlights userId={id} editable={own} />
            {repo.data.certificates
              .filter((c) => c.user_id === id)
              .map((c) => (
                <Card key={c.id}>
                  <Badge>Emitido no SkillUp</Badge>
                  <h3>
                    {repo.data.tracks.find((t) => t.id === c.track_id)?.title}
                  </h3>
                  <p>{dateLabel(c.issued_at)}</p>
                  <Link to={`/verificar/${c.verification_code}`}>
                    Consultar autenticidade
                  </Link>
                </Card>
              ))}
            <Experiences userId={id} editable={own} />
          </details>
          {own && (
            <>
              <details className="card">
                <summary>Projetos salvos</summary>
                {feature.data.project_signals
                  .filter((s) => s.user_id === id && s.saved)
                  .map((s) => {
                    const p = repo.data.projects.find(
                      (p) => p.id === s.project_id,
                    );
                    return p ? (
                      <div key={s.id}>
                        <Link to={`/app/social/projetos/${p.id}`}>
                          {p.title}
                        </Link>
                        <ProjectSave project={p} />
                      </div>
                    ) : null;
                  })}
              </details>
              <details className="card">
                <summary>Currículo · privado</summary>
                <ResumePanel />
              </details>
            </>
          )}
        </>
      )}
      {editing && (
        <PortfolioEditor value={portfolio} onClose={() => setEditing(false)} />
      )}
    </div>
  );
}
function PortfolioEditor({
  value,
  onClose,
}: {
  value: Portfolio;
  onClose: () => void;
}) {
  const auth = useAuth(),
    action = useAction();
  return (
    <Modal title="Interesses e privacidade" onClose={onClose}>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget),
            list = (key: string) =>
              [
                ...new Set(
                  String(f.get(key))
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                ),
              ].slice(0, 20);
          void action.run(async () => {
            await savePortfolioRow(auth.demo, "student_portfolios", {
              ...value,
              study_area: String(f.get("area")).trim(),
              education: String(f.get("education")).trim(),
              interests: list("interests"),
              technologies: list("technologies"),
              knowledge_level: String(f.get("level")),
              public_portfolio: f.get("public") === "on",
            });
            onClose();
          });
        }}
      >
        <label>
          Curso ou área de estudo
          <input name="area" maxLength={120} defaultValue={value.study_area} />
        </label>
        <label>
          Formação
          <textarea
            name="education"
            maxLength={2000}
            defaultValue={value.education}
          />
        </label>
        <label>
          Interesses profissionais (separados por vírgula)
          <input
            name="interests"
            maxLength={500}
            defaultValue={value.interests.join(", ")}
          />
        </label>
        <label>
          Tecnologias de interesse (separadas por vírgula)
          <input
            name="technologies"
            maxLength={500}
            defaultValue={value.technologies.join(", ")}
          />
        </label>
        <label>
          Nível de conhecimento
          <select name="level" defaultValue={value.knowledge_level}>
            <option value="iniciante">Iniciante</option>
            <option value="intermediario">Intermediário</option>
            <option value="avancado">Avançado</option>
          </select>
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            name="public"
            defaultChecked={value.public_portfolio}
          />
          Permitir acesso ao meu perfil profissional por link público
        </label>
        <Notice>
          O link público mostra nome, apresentação, habilidades, formação e
          itens definidos como públicos. Currículo e destaques privados não são
          incluídos. A visibilidade na comunidade continua em Configurações →
          Privacidade.
        </Notice>
        <Button type="submit" disabled={action.busy}>
          Salvar interesses e privacidade
        </Button>
        <ActionFeedback action={action} />
      </form>
    </Modal>
  );
}
