import { WeeklyRanking } from "../components/WeeklyRanking";
import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { useData } from "../state/DataContext";
import type { Post, Project } from "../lib/types";
import { dateLabel, initials, matches, uid } from "../lib/utils";
import {
  ActionFeedback,
  ActionLink,
  Badge,
  Button,
  Card,
  Chips,
  Confirm,
  Empty,
  Heading,
  Icon,
  Modal,
  SearchField,
  SectionTitle,
  useAction,
} from "../components/ui";
const categories = [
  "Todas",
  "Programação",
  "Hardware",
  "Carreira",
  "Dúvidas Gerais",
  "Data Science",
  "UI/UX Design",
  "Institucional",
];
export function SocialPage({
  section,
}: {
  section: "inicio" | "foruns" | "feed";
}) {
  const auth = useAuth(),
    { data } = useData(),
    [params] = useSearchParams(),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("Todas"),
    [creating, setCreating] = useState(params.has("novo"));
  const kind =
      section === "foruns" ? "forum" : section === "inicio" ? "story" : "feed",
    posts = data.posts
      .filter(
        (p) =>
          (section === "inicio"
            ? auth.role === "instituicao"
              ? p.kind === "announcement"
              : ["story", "feed"].includes(p.kind)
            : section === "foruns"
              ? p.kind === "forum"
              : ["feed", "announcement"].includes(p.kind)) &&
          (category === "Todas" || p.category === category) &&
          matches(query, p.title, p.body, p.author_name),
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return (
    <div className="stack">
      <Heading
        title={
          auth.role === "instituicao"
            ? "Comunidade institucional"
            : auth.role === "recrutador"
              ? "Espaço do recrutador"
              : section === "inicio"
                ? "Sua comunidade"
                : section === "foruns"
                  ? "Fóruns de discussão"
                  : "Feed de atividades"
        }
        description="Compartilhe aprendizados, troque experiências e construa em conjunto."
        action={
          <Button icon="plus" onClick={() => setCreating(true)}>
            {section === "foruns"
              ? "Nova discussão"
              : section === "inicio"
                ? "Postar história"
                : "Criar publicação"}
          </Button>
        }
      />
      {auth.role === "recrutador" && (
        <Card className="dark">
          <h2>Conecte talentos e oportunidades</h2>
          <p>
            Publique vagas com requisitos claros e acompanhe as candidaturas
            recebidas.
          </p>
          <ActionLink to="/app/emprego?nova=1" variant="outline">
            Publicar vaga de emprego
          </ActionLink>
        </Card>
      )}
      <SearchField
        value={query}
        onChange={setQuery}
        label={
          section === "foruns"
            ? "Pesquisar discussões e tópicos"
            : "Pesquisar publicações e pessoas"
        }
      />
      {section === "foruns" && (
        <Chips value={category} onChange={setCategory} items={categories} />
      )}
      <div className={section === "inicio" ? "social-grid" : "post-grid"}>
        <div className="stack">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
          {!posts.length && (
            <Empty title="Nenhuma publicação por aqui">
              Compartilhe um aprendizado ou tente outra busca.
            </Empty>
          )}
        </div>
        {section === "inicio" && (
          <aside className="stack">
            <Leaderboard />
            <Card>
              <SectionTitle
                action={<Link to="/app/social/projetos">Ver todos</Link>}
              >
                Projetos em grupo
              </SectionTitle>
              {data.projects
                .filter((p) => p.status === "open")
                .slice(0, 2)
                .map((p) => (
                  <Link
                    className="project-teaser"
                    key={p.id}
                    to={`/app/social/projetos/${p.id}`}
                  >
                    {p.image && <img src={p.image} alt="" loading="lazy" />}
                    <h3>{p.title}</h3>
                    <p>{p.description}</p>
                  </Link>
                ))}
            </Card>
            <Card>
              <h3>Fóruns temáticos</h3>
              <p>Converse sobre programação, hardware, carreira e design.</p>
              <ActionLink to="/app/social/foruns" variant="outline">
                Ver fóruns
              </ActionLink>
            </Card>
          </aside>
        )}
      </div>
      {creating && (
        <PostEditor
          kind={auth.role === "instituicao" ? "announcement" : kind}
          onClose={() => setCreating(false)}
        />
      )}
    </div>
  );
}
export function PostCard({
  post,
  detail = false,
}: {
  post: Post;
  detail?: boolean;
}) {
  const auth = useAuth(),
    repo = useData(),
    action = useAction(),
    [deleting, setDeleting] = useState(false);
  const reaction = repo.data.reactions.find(
      (r) => r.user_id === auth.id && r.post_id === post.id,
    ),
    count = repo.data.reactions.filter((r) => r.post_id === post.id).length;
  return (
    <Card className="post-card">
      <div className="post-author">
        <span className="avatar">{initials(post.author_name)}</span>
        <div>
          <strong>{post.author_name}</strong>
          <small>
            {dateLabel(post.created_at)} · {post.category}
          </small>
        </div>
        {post.user_id === auth.id && (
          <button
            className="icon-button"
            aria-label="Excluir publicação"
            onClick={() => setDeleting(true)}
          >
            <Icon name="trash" />
          </button>
        )}
      </div>
      {detail ? (
        <h2>{post.title}</h2>
      ) : (
        <Link className="post-title" to={`/app/social/post/${post.id}`}>
          <h2>{post.title}</h2>
        </Link>
      )}
      <p className="pre-wrap">{post.body}</p>
      {post.image && (
        <img
          className="post-image"
          src={post.image}
          alt="Imagem ilustrativa do projeto"
          loading="lazy"
        />
      )}
      <div className="post-actions">
        <button
          className={reaction ? "liked" : ""}
          aria-label={reaction ? "Remover curtida" : "Curtir publicação"}
          aria-pressed={Boolean(reaction)}
          disabled={action.busy}
          onClick={() =>
            action.run(async () => {
              if (reaction) await repo.remove("reactions", reaction.id);
              else
                await repo.add("reactions", {
                  id: uid(),
                  post_id: post.id,
                  user_id: auth.id!,
                });
            })
          }
        >
          <Icon name="heart" />
          {count}
        </button>
        <Link to={`/app/social/post/${post.id}`} aria-label="Abrir comentários">
          <Icon name="message" />
          {repo.data.comments.filter((c) => c.post_id === post.id).length}
        </Link>
        <Badge>
          {post.kind === "story"
            ? "História"
            : post.kind === "forum"
              ? "Discussão"
              : post.kind === "announcement"
                ? "Comunicado"
                : "Publicação"}
        </Badge>
      </div>
      <ActionFeedback action={action} />
      {deleting && (
        <Confirm
          title="Excluir publicação?"
          onClose={() => setDeleting(false)}
          onConfirm={() => repo.remove("posts", post.id)}
        >
          A publicação e seus comentários serão removidos.
        </Confirm>
      )}
    </Card>
  );
}
export function PostDetail() {
  const { postId } = useParams(),
    auth = useAuth(),
    repo = useData(),
    post = repo.data.posts.find((p) => p.id === postId),
    action = useAction(),
    [body, setBody] = useState("");
  if (!post)
    return (
      <Empty
        title="Publicação não encontrada"
        action={
          <ActionLink to="/app/social/inicio">Voltar à comunidade</ActionLink>
        }
      />
    );
  return (
    <div className="stack narrow">
      <Link className="back-link" to="/app/social/inicio">
        <Icon name="arrow" />
        Comunidade
      </Link>
      <PostCard post={post} detail />
      <SectionTitle>Comentários</SectionTitle>
      {repo.data.comments
        .filter((c) => c.post_id === postId)
        .map((c) => (
          <Card key={c.id}>
            <strong>{c.author_name}</strong>
            <p className="pre-wrap">{c.body}</p>
            <small className="muted">{dateLabel(c.created_at)}</small>
          </Card>
        ))}
      <form
        className="card stack"
        onSubmit={(e) => {
          e.preventDefault();
          void action.run(
            async () => {
              await repo.add("comments", {
                id: uid(),
                post_id: postId!,
                user_id: auth.id!,
                author_name:
                  repo.data.profiles.find((p) => p.id === auth.id)?.full_name ||
                  "Usuário",
                body: body.trim(),
                created_at: new Date().toISOString(),
              });
              setBody("");
            },
            auth.demo
              ? "Comentário salvo nesta demonstração."
              : "Comentário publicado.",
          );
        }}
      >
        <label>
          Seu comentário
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={3000}
            required
          />
        </label>
        <Button
          type="submit"
          disabled={action.busy || !body.trim()}
          icon="send"
        >
          Comentar
        </Button>
        <ActionFeedback action={action} />
      </form>
    </div>
  );
}
function PostEditor({
  kind,
  onClose,
}: {
  kind: Post["kind"];
  onClose: () => void;
}) {
  const auth = useAuth(),
    repo = useData(),
    action = useAction();
  return (
    <Modal
      title={
        kind === "forum" ? "Nova discussão" : "Compartilhar com a comunidade"
      }
      onClose={onClose}
    >
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          void action.run(async () => {
            await repo.add("posts", {
              id: uid(),
              user_id: auth.id!,
              author_name:
                repo.data.profiles.find((p) => p.id === auth.id)?.full_name ||
                "Usuário",
              kind,
              category: String(f.get("category")),
              title: String(f.get("title")).trim(),
              body: String(f.get("body")).trim(),
              image: null,
              created_at: new Date().toISOString(),
            });
            onClose();
          });
        }}
      >
        <label>
          Título
          <input name="title" maxLength={160} required />
        </label>
        <label>
          Categoria
          <select name="category">
            {categories.slice(1).map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          O que você quer compartilhar?
          <textarea
            name="body"
            rows={7}
            maxLength={5000}
            minLength={5}
            required
          />
        </label>
        <p className="small muted">
          Sua publicação ficará visível à comunidade autenticada. Evite dados
          pessoais de terceiros.
        </p>
        <Button type="submit" disabled={action.busy}>
          {action.busy ? "Publicando…" : "Publicar"}
        </Button>
        <ActionFeedback action={action} />
      </form>
    </Modal>
  );
}
function Leaderboard() {
  return <WeeklyRanking />;
}
export function Projects() {
  const auth = useAuth(),
    { data } = useData(),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("Todos"),
    [creating, setCreating] = useState(false);
  const projects = data.projects.filter(
    (p) =>
      p.status !== "archived" &&
      (category === "Todos" || p.category === category) &&
      matches(query, p.title, p.description, p.skills.join(" ")),
  );
  return (
    <div className="stack">
      <Heading
        title={
          auth.role === "docente"
            ? "Gestão de projetos"
            : "Projetos colaborativos"
        }
        description="Aprenda construindo soluções com outras pessoas."
        action={
          <Button icon="plus" onClick={() => setCreating(true)}>
            Novo projeto
          </Button>
        }
      />
      <SearchField
        label="Pesquisar projetos e tópicos"
        value={query}
        onChange={setQuery}
      />
      <Chips
        items={["Todos", "Design", "Web", "Mobile", "IA"]}
        value={category}
        onChange={setCategory}
      />
      <div className="project-grid">
        {projects.map((p) => (
          <Card key={p.id} className="project-card">
            {p.image && (
              <img
                src={p.image}
                alt="Imagem ilustrativa do projeto"
                loading="lazy"
              />
            )}
            <Badge>
              {p.category} ·{" "}
              {p.status === "review"
                ? "Em revisão"
                : p.status === "completed"
                  ? "Concluído"
                  : "Inscrições abertas"}
            </Badge>
            <h2>{p.title}</h2>
            <p>{p.description}</p>
            <div className="chips">
              {p.skills.map((s) => (
                <Badge key={s}>{s}</Badge>
              ))}
            </div>
            <p className="small muted">
              {data.project_members.filter((m) => m.project_id === p.id).length}{" "}
              participante(s)
            </p>
            <ActionLink to={`/app/social/projetos/${p.id}`}>
              Ver detalhes
            </ActionLink>
          </Card>
        ))}
      </div>
      {!projects.length && <Empty title="Nenhum projeto encontrado" />}
      {creating && <ProjectEditor onClose={() => setCreating(false)} />}
    </div>
  );
}
export function ProjectDetail() {
  const { projectId } = useParams(),
    auth = useAuth(),
    repo = useData(),
    project = repo.data.projects.find((p) => p.id === projectId),
    action = useAction(),
    [leaving, setLeaving] = useState(false);
  const membership = repo.data.project_members.find(
    (p) => p.project_id === projectId && p.user_id === auth.id,
  );
  if (!project) return <Empty title="Projeto não encontrado" />;
  return (
    <div className="stack narrow">
      <Link className="back-link" to="/app/social/projetos">
        <Icon name="arrow" />
        Todos os projetos
      </Link>
      <Heading title={project.title} description={project.category} />
      {project.image && (
        <img
          className="project-hero"
          src={project.image}
          alt="Imagem ilustrativa do projeto"
        />
      )}
      <Card>
        <p className="pre-wrap">{project.description}</p>
        <div className="chips">
          {project.skills.map((s) => (
            <Badge key={s}>{s}</Badge>
          ))}
        </div>
        <p>
          {
            repo.data.project_members.filter((p) => p.project_id === projectId)
              .length
          }{" "}
          participante(s)
        </p>
        {membership ? (
          <Button variant="outline" onClick={() => setLeaving(true)}>
            Sair do projeto
          </Button>
        ) : (
          <Button
            disabled={action.busy || project.status !== "open"}
            icon="users"
            onClick={() =>
              action.run(
                () =>
                  repo.add("project_members", {
                    id: uid(),
                    project_id: projectId!,
                    user_id: auth.id!,
                  }),
                "Participação registrada.",
              )
            }
          >
            {project.status === "open"
              ? "Participar do projeto"
              : "Inscrições encerradas"}
          </Button>
        )}
        {project.owner_id === auth.id && (
          <label>
            Status do projeto
            <select
              value={project.status}
              onChange={(e) =>
                action.run(() =>
                  repo.update("projects", project.id, {
                    status: e.target.value as Project["status"],
                  }),
                )
              }
            >
              <option value="open">Aberto</option>
              <option value="review">Em revisão</option>
              <option value="completed">Concluído</option>
              <option value="archived">Arquivado</option>
            </select>
          </label>
        )}
        <ActionFeedback action={action} />
      </Card>
      {leaving && (
        <Confirm
          title="Sair do projeto?"
          onClose={() => setLeaving(false)}
          onConfirm={() => repo.remove("project_members", membership!.id)}
        >
          Sua participação será removida. Você poderá voltar enquanto as
          inscrições estiverem abertas.
        </Confirm>
      )}
    </div>
  );
}
function ProjectEditor({ onClose }: { onClose: () => void }) {
  const auth = useAuth(),
    repo = useData(),
    action = useAction();
  return (
    <Modal title="Novo projeto colaborativo" onClose={onClose}>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          void action.run(async () => {
            await repo.add("projects", {
              id: uid(),
              owner_id: auth.id!,
              title: String(f.get("title")).trim(),
              description: String(f.get("description")).trim(),
              category: String(f.get("category")),
              skills: String(f.get("skills"))
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
              status: "open",
              image: null,
            });
            onClose();
          });
        }}
      >
        <label>
          Nome do projeto
          <input name="title" maxLength={160} required />
        </label>
        <label>
          Objetivo e entregáveis
          <textarea
            name="description"
            rows={6}
            minLength={20}
            maxLength={5000}
            required
          />
        </label>
        <label>
          Categoria
          <select name="category">
            {["Design", "Web", "Mobile", "IA"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Habilidades (separadas por vírgula)
          <input name="skills" maxLength={300} />
        </label>
        <Button type="submit" disabled={action.busy}>
          Criar projeto
        </Button>
        <ActionFeedback action={action} />
      </form>
    </Modal>
  );
}
