import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { useData } from "../state/DataContext";
import { dateLabel, percent } from "../lib/utils";
import {
  ActionFeedback,
  ActionLink,
  Badge,
  Button,
  Card,
  Confirm,
  Empty,
  Heading,
  Icon,
  Modal,
  ProgressBar,
  Ring,
  SectionTitle,
  useAction,
} from "../components/ui";
import { EventEditor } from "../components/EventEditor";
export function Agenda() {
  const { data, remove } = useData(),
    auth = useAuth(),
    [adding, setAdding] = useState(false),
    [selected, setSelected] = useState<string | null>(null),
    [editing, setEditing] = useState<string | null>(null),
    [removing, setRemoving] = useState<string | null>(null);
  const events = data.study_events
    .filter(
      (x) =>
        x.user_id === auth.id ||
        data.enrollments.some(
          (e) => e.class_id === x.class_id && e.user_id === auth.id,
        ) ||
        data.classes.some(
          (c) => c.id === x.class_id && c.teacher_id === auth.id,
        ),
    )
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const current = events.find((x) => x.id === selected);
  return (
    <>
      <SectionTitle
        action={
          <Button variant="ghost" icon="plus" onClick={() => setAdding(true)}>
            Adicionar
          </Button>
        }
      >
        Agenda de estudos
      </SectionTitle>
      <Card>
        <div className="week" aria-label="Semana atual">
          {Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + i);
            return (
              <div
                key={i}
                className={
                  d.toDateString() === new Date().toDateString() ? "today" : ""
                }
              >
                <small>
                  {["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"][i]}
                </small>
                <strong>{d.getDate()}</strong>
              </div>
            );
          })}
        </div>
        {events.slice(0, 5).map((x) => (
          <button
            className="event-row"
            key={x.id}
            onClick={() => setSelected(x.id)}
          >
            <span className="icon-tile">
              <Icon name="calendar" />
            </span>
            <span>
              <strong>{x.title}</strong>
              <small>
                {dateLabel(x.starts_at)} · {x.duration_minutes} min
              </small>
            </span>
            <Icon name="chevron" />
          </button>
        ))}
        {!events.length && (
          <Empty title="Sua agenda começa aqui">
            Reserve um horário curto para seu próximo estudo.
          </Empty>
        )}
      </Card>
      {adding && <EventEditor onClose={() => setAdding(false)} />}{" "}
      {current && (
        <Modal title={current.title} onClose={() => setSelected(null)}>
          <p>
            {dateLabel(current.starts_at)} · {current.duration_minutes} minutos
          </p>
          <p className="pre-wrap">{current.description}</p>
          <ActionLink to="/app/aprenda/pratica">Abrir atividades</ActionLink>
          {current.user_id === auth.id && (
            <div className="actions">
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(current.id);
                  setSelected(null);
                }}
              >
                Editar evento
              </Button>
              <Button
                variant="ghost"
                icon="trash"
                onClick={() => {
                  setRemoving(current.id);
                  setSelected(null);
                }}
              >
                Excluir evento
              </Button>
            </div>
          )}
        </Modal>
      )}
      {editing && (
        <EventEditor
          event={events.find((e) => e.id === editing)}
          onClose={() => setEditing(null)}
        />
      )}
      {removing && (
        <Confirm
          title="Excluir evento?"
          onClose={() => setRemoving(null)}
          onConfirm={() => remove("study_events", removing)}
        >
          O evento será removido da agenda e não poderá ser recuperado.
        </Confirm>
      )}
    </>
  );
}
export function Home() {
  const auth = useAuth();
  return auth.role === "estudante" ? (
    <StudentHome />
  ) : auth.role === "docente" ? (
    <TeacherHome />
  ) : auth.role === "recrutador" ? (
    <RecruiterHome />
  ) : (
    <InstitutionHome />
  );
}
function StudentHome() {
  const auth = useAuth(),
    repo = useData(),
    action = useAction(),
    profile = repo.data.profiles.find((x) => x.id === auth.id);
  const progress = repo.data.progress.filter((x) => x.user_id === auth.id),
    track =
      repo.data.tracks.find((t) =>
        repo.data.modules.some(
          (m) =>
            m.track_id === t.id && progress.some((p) => p.module_id === m.id),
        ),
      ) || repo.data.tracks[0];
  const modules = repo.data.modules
      .filter((x) => x.track_id === track?.id)
      .sort((a, b) => a.position - b.position),
    done = modules.filter((m) => progress.some((p) => p.module_id === m.id)),
    next = modules.find((m) => !done.includes(m));
  const xp =
    progress.reduce(
      (sum, p) =>
        sum + (repo.data.modules.find((m) => m.id === p.module_id)?.xp || 0),
      0,
    ) +
    repo.data.attempts
      .filter((x) => x.user_id === auth.id)
      .reduce((sum, a) => sum + a.xp, 0);
  return (
    <div className="stack">
      <Heading
        title={`Olá, ${profile?.full_name.split(" ")[0] || "estudante"}!`}
        description="Sua jornada técnica está em pleno vapor. Pronto para o próximo desafio?"
      />
      <div className="level-bar">
        <span className="icon-tile">
          <Icon name="award" />
        </span>
        <div>
          <div className="row-between">
            <strong>
              {xp >= 3000 ? "Ouro" : xp >= 1000 ? "Prata" : "Bronze"}
            </strong>
            <span>
              {xp} XP · próximo nível: {(Math.floor(xp / 1000) + 1) * 1000} XP
            </span>
          </div>
          <progress
            value={xp % 1000}
            max={1000}
            aria-label="Experiência até o próximo nível"
          />
        </div>
      </div>
      <div className="home-grid">
        <div className="stack">
          {track ? (
            <Card>
              <div className="module-card">
                <div>
                  <span className="eyebrow">Módulo atual</span>
                  <h2>{track.title}</h2>
                  <p>Próxima etapa: {next?.title || "Trilha concluída"}</p>
                </div>
                <Ring value={percent(done.length, modules.length)} />
              </div>
              <ActionLink to={`/app/aprenda/trilhas/${track.id}`} icon="play">
                Continuar trilha
              </ActionLink>
            </Card>
          ) : (
            <Empty title="Nenhuma trilha publicada">
              Os conteúdos serão disponibilizados pela instituição.
            </Empty>
          )}
          <Agenda />
        </div>
        <div className="stack">
          <Card className="dark">
            <h2>Sugestão de plano</h2>
            <p>
              Quer estudar em blocos curtos? Reserve 15 minutos para exercícios
              e laboratórios nos dias mais ocupados.
            </p>
            <Button
              variant="outline"
              disabled={action.busy}
              onClick={() =>
                action.run(async () => {
                  if (profile)
                    await repo.update("profiles", profile.id, {
                      preferences: {
                        ...profile.preferences,
                        study_minutes: 15,
                      },
                    });
                }, "Plano de 15 minutos salvo nas suas preferências.")
              }
              icon="check"
            >
              {profile?.preferences.study_minutes === 15
                ? "Plano de 15 min selecionado"
                : "Aplicar ajuste"}
            </Button>
            <ActionFeedback action={action} />
          </Card>
          <Card>
            <h3>Suporte ao aluno</h3>
            <div className="list-row">
              <span>Triagem automática</span>
              <Badge>Disponível</Badge>
            </div>
            <div className="list-row">
              <span>Atendimento humano</span>
              <span className="muted">Não conectado</span>
            </div>
            <ActionLink
              to="/app/aprenda/suporte"
              variant="outline"
              icon="message"
            >
              Falar com bot de triagem
            </ActionLink>
          </Card>
          <Card>
            <SectionTitle
              action={<Link to="/app/certificados">Ver todas</Link>}
            >
              Conquistas
            </SectionTitle>
            <div className="achievements">
              {["code", "cpu", "award"].map((icon, i) => (
                <span
                  className={progress.length > i ? "earned" : ""}
                  key={icon}
                  title={
                    progress.length > i
                      ? `${i + 1} etapa(s) concluída(s)`
                      : "Conclua mais etapas"
                  }
                >
                  <Icon name={progress.length > i ? icon : "lock"} size={24} />
                </span>
              ))}
            </div>
          </Card>
          <Card className="career-tip">
            <Icon name="briefcase" />
            <h3>Dica de carreira</h3>
            <p>
              Documente os projetos do seu módulo. Explique o problema, suas
              decisões e o que aprendeu em cada etapa.
            </p>
            <Link to="/app/config/perfil">Atualizar meu perfil</Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
function TeacherHome() {
  const auth = useAuth(),
    { data } = useData(),
    classes = data.classes.filter((c) => c.teacher_id === auth.id);
  const waiting = data.submissions.filter(
    (s) =>
      s.status === "submitted" &&
      data.assignments.some(
        (a) => a.id === s.assignment_id && a.teacher_id === auth.id,
      ),
  );
  return (
    <div className="stack">
      <Heading
        title="Bem-vindo, professor"
        description={`${classes.length} turma(s) · ${waiting.length} atividade(s) aguardando correção`}
      />
      <div className="quick-actions">
        <ActionLink to="/app/turmas" icon="plus" variant="outline">
          Criar aula
        </ActionLink>
        <ActionLink
          to="/app/aprenda/pratica"
          icon="clipboard"
          variant="outline"
        >
          Correção
        </ActionLink>
        <ActionLink to="/app/social/feed?novo=1" icon="bell" variant="outline">
          Enviar aviso
        </ActionLink>
        <ActionLink to="/app/mensagens" icon="message" variant="outline">
          Ver mensagens
        </ActionLink>
      </div>
      <div className="two-columns">
        <div className="stack">
          <Agenda />
        </div>
        <Card>
          <h2>Acompanhamento das turmas</h2>
          {classes.map((c) => (
            <div className="list-row" key={c.id}>
              <div>
                <strong>{c.title}</strong>
                <p>
                  {data.enrollments.filter((e) => e.class_id === c.id).length}{" "}
                  estudante(s)
                </p>
              </div>
              <ActionLink to="/app/turmas" variant="ghost">
                Ver detalhes
              </ActionLink>
            </div>
          ))}
          {!classes.length && (
            <Empty title="Nenhuma turma vinculada">
              A instituição precisa vincular sua conta a uma turma.
            </Empty>
          )}
        </Card>
      </div>
    </div>
  );
}
function RecruiterHome() {
  const auth = useAuth(),
    { data } = useData(),
    profile = data.profiles.find((x) => x.id === auth.id),
    jobs = data.jobs.filter((j) => j.owner_id === auth.id),
    applications = data.applications.filter((a) =>
      jobs.some((j) => j.id === a.job_id),
    );
  return (
    <div className="stack">
      <Heading
        title={`Olá, ${profile?.full_name.split(" ")[0] || "recrutador"}`}
        description="Confira as atualizações do seu processo seletivo."
      />
      <Card className="dark">
        <span className="eyebrow">Panorama geral</span>
        <div className="stats-grid">
          <div>
            <strong>
              {applications.filter((a) => a.status === "submitted").length}
            </strong>
            <span>Novas candidaturas</span>
          </div>
          <div>
            <strong>
              {applications.filter((a) => a.status === "interview").length}
            </strong>
            <span>Em entrevista</span>
          </div>
          <div>
            <strong>{jobs.filter((j) => j.status === "open").length}</strong>
            <span>Vagas abertas</span>
          </div>
        </div>
      </Card>
      <SectionTitle>Atalhos rápidos</SectionTitle>
      <div className="quick-actions">
        <ActionLink to="/app/emprego?nova=1" variant="outline" icon="plus">
          Postar vaga
        </ActionLink>
        <ActionLink to="/app/candidatos" variant="outline" icon="users">
          Ver candidatos
        </ActionLink>
        <ActionLink to="/app/mensagens" variant="outline" icon="message">
          Mensagens
        </ActionLink>
        <ActionLink to="/app/relatorios" variant="outline" icon="chart">
          Relatórios
        </ActionLink>
      </div>
      <SectionTitle>Atividade recente</SectionTitle>
      <Card>
        {applications
          .slice(-5)
          .reverse()
          .map((a) => (
            <Link className="list-row" key={a.id} to="/app/candidatos">
              <Icon name="users" />
              <div>
                <strong>
                  {data.profiles.find((p) => p.id === a.student_id)
                    ?.full_name || "Candidato"}{" "}
                  · {jobs.find((j) => j.id === a.job_id)?.title}
                </strong>
                <small>{dateLabel(a.created_at)}</small>
              </div>
              <Icon name="chevron" />
            </Link>
          ))}
        {!applications.length && (
          <Empty title="Nenhuma candidatura recebida">
            As candidaturas às suas vagas aparecerão aqui.
          </Empty>
        )}
      </Card>
    </div>
  );
}
function InstitutionHome() {
  const auth = useAuth(),
    { data } = useData(),
    classes = data.classes.filter(
      (c) => c.organization_id === auth.organizationId,
    ),
    members = data.user_roles.filter(
      (r) => r.organization_id === auth.organizationId,
    );
  const students = new Set(
    data.enrollments
      .filter((e) => classes.some((c) => c.id === e.class_id))
      .map((e) => e.user_id),
  );
  const submitted = data.submissions.filter((s) =>
    data.assignments.some(
      (a) =>
        a.id === s.assignment_id && classes.some((c) => c.id === a.class_id),
    ),
  );
  return (
    <div className="stack">
      <Heading
        title="Hub institucional"
        description="Uma visão geral dos registros da sua instituição."
      />
      <div className="stats-grid cards">
        <Card>
          <Icon name="graduation" />
          <strong>{classes.length}</strong>
          <span>Turmas ativas</span>
        </Card>
        <Card>
          <Icon name="users" />
          <strong>{students.size}</strong>
          <span>Estudantes matriculados</span>
        </Card>
        <Card>
          <Icon name="book" />
          <strong>{members.filter((x) => x.role === "docente").length}</strong>
          <span>Docentes vinculados</span>
        </Card>
      </div>
      <div className="two-columns">
        <Card>
          <h2>Análise de desempenho</h2>
          <Ring
            value={percent(
              submitted.filter((s) => s.status === "reviewed").length,
              submitted.length,
            )}
          />
          <ProgressBar
            value={percent(
              submitted.filter((s) => s.status === "reviewed").length,
              submitted.length,
            )}
            label="Atividades corrigidas"
          />
          <p className="small muted">
            Calculado sobre {submitted.length} envio(s) visíveis. Ainda não há
            integração de frequência.
          </p>
          <ActionLink to="/app/relatorios" variant="outline">
            Ver relatório
          </ActionLink>
        </Card>
        <Card className="dark">
          <span className="eyebrow">Status de certificação</span>
          <h2>{data.certificates.length} comprovante(s)</h2>
          <p>Registros internos de conclusão emitidos pela instituição.</p>
          <ActionLink to="/app/certificados" variant="outline">
            Revisar certificações
          </ActionLink>
        </Card>
      </div>
      <div className="two-columns">
        <Card>
          <SectionTitle action={<Link to="/app/social/inicio">Ver todos</Link>}>
            Comunicados
          </SectionTitle>
          {data.posts
            .filter((p) => p.kind === "announcement")
            .map((p) => (
              <Link
                key={p.id}
                className="list-row"
                to={`/app/social/post/${p.id}`}
              >
                <div>
                  <strong>{p.title}</strong>
                  <small>{dateLabel(p.created_at)}</small>
                </div>
                <Icon name="chevron" />
              </Link>
            ))}
        </Card>
        <Card>
          <h2>Gestão acadêmica</h2>
          <p>Organize turmas, docentes, estudantes e atividades.</p>
          <ActionLink to="/app/turmas" icon="users">
            Gerenciar turmas
          </ActionLink>
        </Card>
      </div>
    </div>
  );
}
