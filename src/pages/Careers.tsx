import {
  ResumeApplicationField,
  CandidateResume,
} from "../features/portfolio/Resume";
import { Experiences } from "../components/Experiences";
import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { useData } from "../state/DataContext";
import { requireSupabase } from "../services/supabase";
import type { Application, Job } from "../lib/types";
import {
  dateLabel,
  matches,
  normalize,
  percent,
  safeUrl,
  uid,
} from "../lib/utils";
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
  Notice,
  ProgressBar,
  SearchField,
  SectionTitle,
  useAction,
} from "../components/ui";
const statuses: Record<Application["status"], string> = {
  submitted: "Enviada",
  reviewing: "Em análise",
  interview: "Entrevista",
  accepted: "Aprovada",
  rejected: "Não selecionada",
  withdrawn: "Retirada",
};
export function Careers() {
  const auth = useAuth(),
    repo = useData(),
    [params] = useSearchParams(),
    [query, setQuery] = useState(""),
    [mode, setMode] = useState("Todos"),
    [creating, setCreating] = useState(params.has("nova"));
  const management = auth.role === "recrutador",
    jobs = repo.data.jobs.filter(
      (j) =>
        (management ? j.owner_id === auth.id : j.status === "open") &&
        (mode === "Todos" || j.mode === mode) &&
        matches(query, j.title, j.company, j.location, j.skills.join(" ")),
    );
  const profile = repo.data.profiles.find((p) => p.id === auth.id),
    checks = [
      Boolean(profile?.headline),
      Boolean(profile?.skills.length),
      Boolean(profile?.bio),
      Boolean(profile?.website),
    ];
  return (
    <div className="stack">
      <Heading
        title={
          management
            ? "Gestão de oportunidades"
            : auth.role === "instituicao"
              ? "Gestão de empregabilidade"
              : auth.role === "docente"
                ? "Portal de empregabilidade"
                : "Seu próximo passo profissional"
        }
        description={
          management
            ? "Publique vagas e acompanhe as candidaturas recebidas."
            : "Explore oportunidades e prepare sua trajetória profissional."
        }
        action={
          management ? (
            <Button icon="plus" onClick={() => setCreating(true)}>
              Nova oportunidade
            </Button>
          ) : auth.role === "estudante" ? (
            <ActionLink to="/app/candidaturas" variant="outline">
              Minhas candidaturas
            </ActionLink>
          ) : (
            <ActionLink to="/app/relatorios" variant="outline">
              Ver indicadores
            </ActionLink>
          )
        }
      />
      {auth.role === "estudante" && (
        <Card className="career-status">
          <span className="eyebrow">Status de carreira</span>
          <h2>Seu perfil profissional</h2>
          <ProgressBar
            value={percent(checks.filter(Boolean).length, checks.length)}
            label="Informações preenchidas"
          />
          <p>
            Adicione apresentação, habilidades, resumo e portfólio. Este
            indicador mede o preenchimento do perfil e não garante contratação.
          </p>
          <ActionLink to="/app/config/perfil" variant="outline">
            Completar meu perfil
          </ActionLink>
        </Card>
      )}
      <SearchField
        label="Buscar vagas, empresas ou habilidades"
        value={query}
        onChange={setQuery}
      />
      <Chips
        value={mode}
        onChange={setMode}
        items={["Todos", "Remoto", "Híbrido", "Presencial"]}
      />
      <SectionTitle>
        {management ? "Suas vagas" : "Vagas para você"}
      </SectionTitle>
      <div className="job-grid">
        {jobs.map((j) => (
          <JobCard key={j.id} job={j} />
        ))}
      </div>
      {!jobs.length && (
        <Empty title="Nenhuma vaga encontrada">
          Altere a busca ou volte em outro momento.
        </Empty>
      )}
      {management && (
        <ActionLink to="/app/candidatos" variant="outline" icon="users">
          Ver candidatos e candidaturas
        </ActionLink>
      )}
      {["docente", "instituicao"].includes(auth.role!) && (
        <Card>
          <h2>Orientação profissional</h2>
          <p>
            As candidaturas são feitas pelos estudantes. Acompanhe as
            competências e use as mensagens para orientar os alunos vinculados
            às suas turmas.
          </p>
          <ActionLink to="/app/turmas" variant="outline">
            Ver estudantes
          </ActionLink>
        </Card>
      )}
      {creating && management && (
        <JobEditor onClose={() => setCreating(false)} />
      )}
    </div>
  );
}
function JobCard({ job }: { job: Job }) {
  const auth = useAuth(),
    repo = useData(),
    action = useAction(),
    saved = repo.data.saved_jobs.find(
      (s) => s.job_id === job.id && s.user_id === auth.id,
    );
  const profile = repo.data.profiles.find((p) => p.id === auth.id),
    shared = job.skills.filter((s) =>
      profile?.skills.some((x) => normalize(x) === normalize(s)),
    );
  return (
    <Card>
      <div className="row-between">
        <Badge>{job.mode}</Badge>
        {auth.demo && <Badge>Exemplo</Badge>}
      </div>
      <h2>
        <Link to={`/app/emprego/${job.id}`}>{job.title}</Link>
      </h2>
      <p>
        {job.company} · {job.location}
      </p>
      <div className="chips">
        {job.skills.map((s) => (
          <Badge key={s}>{s}</Badge>
        ))}
      </div>
      {auth.role === "estudante" && (
        <p className="small muted">
          {shared.length} de {job.skills.length} habilidade(s) também
          informada(s) no seu perfil.
        </p>
      )}
      <div className="actions">
        <ActionLink to={`/app/emprego/${job.id}`} variant="outline">
          Ver oportunidade
        </ActionLink>
        {auth.role === "estudante" && (
          <Button
            variant="ghost"
            icon={saved ? "check" : "plus"}
            aria-pressed={Boolean(saved)}
            disabled={action.busy}
            onClick={() =>
              action.run(async () => {
                if (saved) await repo.remove("saved_jobs", saved.id);
                else
                  await repo.add("saved_jobs", {
                    id: uid(),
                    job_id: job.id,
                    user_id: auth.id!,
                  });
              })
            }
          >
            {saved ? "Interesse marcado" : "Tenho interesse"}
          </Button>
        )}
      </div>
      <ActionFeedback action={action} />
    </Card>
  );
}
export function JobDetail() {
  const { jobId } = useParams(),
    auth = useAuth(),
    repo = useData(),
    job = repo.data.jobs.find((j) => j.id === jobId),
    action = useAction(),
    [applying, setApplying] = useState(false),
    [external, setExternal] = useState(false),
    [editing, setEditing] = useState(false);
  const application = repo.data.applications.find(
    (a) => a.job_id === jobId && a.student_id === auth.id,
  );
  if (!job) return <Empty title="Vaga não encontrada ou indisponível" />;
  const url = job.application_url && safeUrl(job.application_url);
  return (
    <div className="stack narrow">
      <Link className="back-link" to="/app/emprego">
        <Icon name="arrow" />
        Todas as vagas
      </Link>
      <Heading
        title={job.title}
        description={`${job.company} · ${job.location}`}
      />
      <div className="chips">
        <Badge>{job.mode}</Badge>
        <Badge>
          {job.status === "open"
            ? "Aberta"
            : job.status === "paused"
              ? "Pausada"
              : "Encerrada"}
        </Badge>
        {auth.demo && <Badge>Oportunidade demonstrativa</Badge>}
      </div>
      <Card>
        <h2>Sobre a oportunidade</h2>
        <p className="pre-wrap">{job.description}</p>
        <h3>Habilidades informadas pelo recrutador</h3>
        <div className="chips">
          {job.skills.map((s) => (
            <Badge key={s}>{s}</Badge>
          ))}
        </div>
        {auth.role === "estudante" &&
          (application ? (
            <Notice>
              Você já tem uma candidatura: {statuses[application.status]}.{" "}
              <Link to="/app/candidaturas">Acompanhar</Link>
            </Notice>
          ) : (
            <Button
              disabled={job.status !== "open"}
              icon="briefcase"
              onClick={() => (url ? setExternal(true) : setApplying(true))}
            >
              {url ? "Candidatar no site da empresa" : "Candidatar-se"}
            </Button>
          ))}
        {job.owner_id === auth.id && (
          <>
            <Button variant="outline" onClick={() => setEditing(true)}>
              Editar oportunidade
            </Button>
            <label>
              Status
              <select
                value={job.status}
                onChange={(e) =>
                  action.run(
                    () =>
                      repo.update("jobs", job.id, {
                        status: e.target.value as Job["status"],
                      }),
                    "Status atualizado.",
                  )
                }
              >
                <option value="open">Aberta</option>
                <option value="paused">Pausada</option>
                <option value="closed">Encerrada</option>
              </select>
            </label>
            <ActionLink to="/app/candidatos" variant="outline">
              Ver candidaturas
            </ActionLink>
          </>
        )}
        <ActionFeedback action={action} />
      </Card>
      {applying && (
        <ApplicationForm job={job} onClose={() => setApplying(false)} />
      )}{" "}
      {external && url && (
        <Modal
          title="Continuar no site da empresa"
          onClose={() => setExternal(false)}
        >
          <p>
            A candidatura será concluída fora do SkillUp. Não temos confirmação
            do envio ou do status nesse serviço.
          </p>
          <p className="break-word">Destino: {new URL(url).hostname}</p>
          <a
            className="button primary"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir site da empresa
            <Icon name="external" />
          </a>
        </Modal>
      )}
      {editing && <JobEditor job={job} onClose={() => setEditing(false)} />}
    </div>
  );
}
function ApplicationForm({ job, onClose }: { job: Job; onClose: () => void }) {
  const auth = useAuth(),
    repo = useData(),
    action = useAction(),
    [sent, setSent] = useState(false);
  return (
    <Modal title={`Candidatura: ${job.title}`} onClose={onClose}>
      {sent ? (
        <>
          <Notice tone="success">
            {auth.demo
              ? "Candidatura de exemplo salva neste navegador. Nenhuma empresa recebeu seus dados."
              : "Sua candidatura foi registrada no SkillUp e está disponível para o responsável pela vaga."}
          </Notice>
          <ActionLink to="/app/candidaturas">
            Acompanhar candidaturas
          </ActionLink>
        </>
      ) : (
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void action.run(async () => {
              await repo.add("applications", {
                id: uid(),
                job_id: job.id,
                student_id: auth.id!,
                cover_letter: String(f.get("letter")).trim(),
                ...(f.get("resume_id")
                  ? { resume_id: String(f.get("resume_id")) }
                  : {}),
                status: "submitted",
                created_at: new Date().toISOString(),
              });
              setSent(true);
            });
          }}
        >
          <p>
            Ao confirmar, o responsável pela vaga poderá consultar seu nome,
            apresentação, habilidades, resumo, experiências profissionais e
            portfólio cadastrados no perfil.
          </p>
          <label>
            Sua apresentação para esta oportunidade
            <textarea
              name="letter"
              rows={6}
              minLength={20}
              maxLength={4000}
              required
            />
          </label>
          <ResumeApplicationField />
          <label className="check-label">
            <input type="checkbox" required />
            Concordo em compartilhar meu perfil com o responsável por esta vaga.
          </label>
          <Button type="submit" disabled={action.busy}>
            {action.busy
              ? "Enviando…"
              : auth.demo
                ? "Registrar candidatura de exemplo"
                : "Confirmar e enviar candidatura"}
          </Button>
          <ActionFeedback action={action} />
        </form>
      )}
    </Modal>
  );
}
export function Applications() {
  const auth = useAuth(),
    repo = useData(),
    [withdraw, setWithdraw] = useState<Application | null>(null);
  const applications = repo.data.applications.filter(
    (a) => a.student_id === auth.id,
  );
  return (
    <div className="stack">
      <Heading
        title="Minhas candidaturas"
        description="Acompanhe os registros internos do SkillUp."
      />
      {applications.map((a) => (
        <Card key={a.id}>
          <Badge>{statuses[a.status]}</Badge>
          <h2>
            {repo.data.jobs.find((j) => j.id === a.job_id)?.title ||
              "Oportunidade encerrada"}
          </h2>
          <p>{dateLabel(a.created_at)}</p>
          <p className="pre-wrap">{a.cover_letter}</p>
          <div className="actions">
            <ActionLink to={`/app/emprego/${a.job_id}`} variant="outline">
              Ver vaga
            </ActionLink>
            {!["withdrawn", "rejected", "accepted"].includes(a.status) && (
              <Button variant="ghost" onClick={() => setWithdraw(a)}>
                Retirar candidatura
              </Button>
            )}
          </div>
        </Card>
      ))}
      {!applications.length && (
        <Empty
          title="Nenhuma candidatura registrada"
          action={
            <ActionLink to="/app/emprego">Explorar oportunidades</ActionLink>
          }
        >
          Candidaturas realizadas em sites externos não aparecem automaticamente
          aqui.
        </Empty>
      )}
      <SectionTitle>Vagas salvas</SectionTitle>
      <div className="job-grid">
        {repo.data.jobs
          .filter((j) =>
            repo.data.saved_jobs.some(
              (s) => s.user_id === auth.id && s.job_id === j.id,
            ),
          )
          .map((j) => (
            <JobCard key={j.id} job={j} />
          ))}
      </div>
      {withdraw && (
        <Confirm
          title="Retirar candidatura?"
          onClose={() => setWithdraw(null)}
          onConfirm={async () => {
            if (auth.demo)
              await repo.update("applications", withdraw.id, {
                status: "withdrawn",
              });
            else {
              const { error } = await requireSupabase().rpc(
                "set_application_status",
                { p_application_id: withdraw.id, p_status: "withdrawn" },
              );
              if (error) throw error;
              await repo.reload();
            }
          }}
        >
          O responsável pela vaga verá que você retirou sua candidatura.
        </Confirm>
      )}
    </div>
  );
}
export function Candidates() {
  const auth = useAuth(),
    repo = useData(),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState("Todas"),
    [selected, setSelected] = useState<Application | null>(null),
    action = useAction();
  if (auth.role !== "recrutador")
    return <Empty title="Área exclusiva de recrutamento" />;
  const applications = repo.data.applications
    .filter((a) =>
      repo.data.jobs.some((j) => j.id === a.job_id && j.owner_id === auth.id),
    )
    .filter((a) => {
      const p = repo.data.profiles.find((p) => p.id === a.student_id);
      return (
        (status === "Todas" || statuses[a.status] === status) &&
        matches(
          query,
          p?.full_name || "",
          p?.skills.join(" ") || "",
          repo.data.jobs.find((j) => j.id === a.job_id)?.title || "",
        )
      );
    });
  const candidate = repo.data.profiles.find(
    (p) => p.id === selected?.student_id,
  );
  return (
    <div className="stack">
      <Heading
        title="Candidatos"
        description="Perfis compartilhados em candidaturas às suas vagas."
      />
      <SearchField
        label="Buscar candidatos, vagas ou habilidades"
        value={query}
        onChange={setQuery}
      />
      <Chips
        items={["Todas", ...Object.values(statuses)]}
        value={status}
        onChange={setStatus}
      />
      <Card>
        {applications.map((a) => (
          <button
            className="event-row"
            key={a.id}
            onClick={() => setSelected(a)}
          >
            <span className="icon-tile">
              <Icon name="users" />
            </span>
            <span>
              <strong>
                {repo.data.profiles.find((p) => p.id === a.student_id)
                  ?.full_name || "Candidato"}
              </strong>
              <small>
                {repo.data.jobs.find((j) => j.id === a.job_id)?.title}
              </small>
            </span>
            <Badge>{statuses[a.status]}</Badge>
            <Icon name="chevron" />
          </button>
        ))}
        {!applications.length && (
          <Empty title="Nenhuma candidatura encontrada" />
        )}
      </Card>
      {selected && (
        <Modal
          title={candidate?.full_name || "Candidatura"}
          onClose={() => setSelected(null)}
        >
          <p>{candidate?.headline}</p>
          <p>{candidate?.bio}</p>
          <div className="chips">
            {candidate?.skills.map((s) => (
              <Badge key={s}>{s}</Badge>
            ))}
          </div>
          {candidate?.website && safeUrl(candidate.website) && (
            <a
              className="text-link"
              href={safeUrl(candidate.website)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir portfólio
              <Icon name="external" />
            </a>
          )}
          {candidate && <Experiences userId={candidate.id} />}
          <h3>Apresentação</h3>
          <p className="pre-wrap">{selected.cover_letter}</p>
          {selected.resume_id && (
            <CandidateResume resumeId={selected.resume_id} />
          )}
          <label>
            Status
            <select
              value={selected.status}
              disabled={selected.status === "withdrawn" || action.busy}
              onChange={(e) => {
                const next = e.target.value as Application["status"];
                void action.run(async () => {
                  if (auth.demo)
                    await repo.update("applications", selected.id, {
                      status: next,
                    });
                  else {
                    const { error } = await requireSupabase().rpc(
                      "set_application_status",
                      { p_application_id: selected.id, p_status: next },
                    );
                    if (error) throw error;
                    await repo.reload();
                  }
                  setSelected({ ...selected, status: next });
                }, "Status atualizado.");
              }}
            >
              {Object.entries(statuses).map(([key, label]) => (
                <option key={key} value={key} disabled={key === "withdrawn"}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <ActionLink
            to={`/app/mensagens?para=${selected.student_id}`}
            variant="outline"
            icon="message"
          >
            Abrir conversa
          </ActionLink>
          <ActionFeedback action={action} />
        </Modal>
      )}
    </div>
  );
}
function JobEditor({ job, onClose }: { job?: Job; onClose: () => void }) {
  const auth = useAuth(),
    repo = useData(),
    action = useAction();
  return (
    <Modal
      title={job ? "Editar oportunidade" : "Nova oportunidade"}
      onClose={onClose}
    >
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget),
            external = String(f.get("external") || "").trim();
          if (external && !safeUrl(external)) {
            action.setError(
              "Use um endereço HTTPS válido para a candidatura externa.",
            );
            return;
          }
          void action.run(async () => {
            const fields = {
              title: String(f.get("title")).trim(),
              company: String(f.get("company")).trim(),
              location: String(f.get("location")).trim(),
              mode: String(f.get("mode")),
              description: String(f.get("description")).trim(),
              skills: String(f.get("skills"))
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
              application_url: external || null,
            };
            if (job) await repo.update("jobs", job.id, fields);
            else
              await repo.add("jobs", {
                ...fields,
                id: uid(),
                owner_id: auth.id!,
                status: "open",
                created_at: new Date().toISOString(),
              });
            onClose();
          });
        }}
      >
        <label>
          Cargo
          <input
            name="title"
            defaultValue={job?.title}
            maxLength={120}
            required
          />
        </label>
        <label>
          Empresa
          <input
            name="company"
            defaultValue={job?.company}
            maxLength={120}
            required
          />
        </label>
        <label>
          Localização
          <input
            name="location"
            defaultValue={job?.location}
            maxLength={120}
            required
          />
        </label>
        <label>
          Modalidade
          <select name="mode" defaultValue={job?.mode}>
            {["Remoto", "Híbrido", "Presencial"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Descrição e requisitos
          <textarea
            name="description"
            defaultValue={job?.description}
            rows={7}
            minLength={30}
            maxLength={10000}
            required
          />
        </label>
        <label>
          Habilidades (separadas por vírgula)
          <input
            name="skills"
            defaultValue={job?.skills.join(", ")}
            maxLength={400}
          />
        </label>
        <label>
          Site de candidatura externa (opcional)
          <input
            name="external"
            type="url"
            placeholder="https://"
            defaultValue={job?.application_url || ""}
          />
          <small>
            Deixe vazio para receber candidaturas dentro do SkillUp.
          </small>
        </label>
        <Button type="submit" disabled={action.busy}>
          {job ? "Salvar alterações" : "Publicar oportunidade"}
        </Button>
        <ActionFeedback action={action} />
      </form>
    </Modal>
  );
}
