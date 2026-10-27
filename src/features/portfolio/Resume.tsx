import { useState } from "react";
import { useAuth } from "../../state/AuthContext";
import { useData } from "../../state/DataContext";
import {
  ActionFeedback,
  Button,
  Confirm,
  Modal,
  Notice,
  useAction,
} from "../../components/ui";
import { copyText, downloadBlob, uid } from "../../lib/utils";
import {
  removePortfolioFile,
  removePortfolioRow,
  savePortfolioRow,
  signedFile,
  uploadPortfolioFile,
} from "./service";
import { usePortfolio } from "./usePortfolio";
import type { ResumeSection } from "./resumePdf";
export function ResumePanel() {
  const auth = useAuth(),
    repo = useData(),
    feature = usePortfolio(),
    action = useAction();
  const [deleting, setDeleting] = useState(false),
    [preview, setPreview] = useState(false),
    [url, setUrl] = useState(""),
    [share, setShare] = useState(false);
  const p = repo.data.profiles.find((p) => p.id === auth.id),
    resume = feature.data.student_resumes.find((r) => r.user_id === auth.id),
    portfolio = feature.data.student_portfolios.find((s) => s.id === auth.id);
  if (!p) return null;
  const sections: ResumeSection[] = [
    {
      title: "Habilidades",
      lines: p.skills.length ? [p.skills.join(" · ")] : [],
    },
    {
      title: "Formação",
      lines: portfolio?.education ? [portfolio.education] : [],
    },
    { title: "Sobre mim", lines: p.bio ? [p.bio] : [] },
    {
      title: "Projetos",
      lines: repo.data.projects
        .filter((j) => j.owner_id === auth.id)
        .map((j) => `${j.title}: ${j.description}`),
    },
    {
      title: "Certificados emitidos no SkillUp",
      lines: repo.data.certificates
        .filter((c) => c.user_id === auth.id)
        .map(
          (c) =>
            `${repo.data.tracks.find((t) => t.id === c.track_id)?.title || "Trilha"} · ${c.issued_at.slice(0, 10)} · Código ${c.verification_code}`,
        ),
    },
    {
      title: "Experiências",
      lines: repo.data.experiences
        .filter((e) => e.user_id === auth.id)
        .map(
          (e) =>
            `${e.title} · ${e.organization} (${e.started_on}): ${e.description}`,
        ),
    },
    {
      title: "Destaques declarados",
      lines: feature.data.profile_highlights
        .filter((h) => h.user_id === auth.id)
        .map(
          (h) =>
            `${h.title} · ${h.organization} (${h.started_on}): ${h.description}`,
        ),
    },
  ];
  return (
    <div className="stack">
      <Notice>
        Seu currículo é privado. Envie a uma candidatura ou gere um link de 15
        minutos somente quando quiser compartilhar.
      </Notice>
      {resume ? (
        <>
          <p>
            <strong>{resume.file_name}</strong> ·{" "}
            {Math.ceil(resume.size_bytes / 1024)} KB
          </p>
          <div className="actions">
            <Button
              variant="outline"
              onClick={() =>
                action.run(async () =>
                  setUrl(await signedFile("student-resumes", resume.file_path)),
                )
              }
            >
              Visualizar currículo
            </Button>
            <Button variant="outline" onClick={() => setShare(true)}>
              Compartilhar currículo
            </Button>
            <Button variant="ghost" onClick={() => setDeleting(true)}>
              Excluir currículo
            </Button>
          </div>
        </>
      ) : (
        <p>Nenhum currículo importado.</p>
      )}
      <label>
        {resume ? "Substituir currículo PDF" : "Importar currículo PDF"}
        <input
          type="file"
          accept="application/pdf"
          disabled={auth.demo || action.busy || Boolean(feature.error)}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            void action.run(async () => {
              const path = await uploadPortfolioFile(
                auth.demo,
                auth.id!,
                "student-resumes",
                file,
              );
              try {
                await savePortfolioRow(auth.demo, "student_resumes", {
                  id: resume?.id || uid(),
                  user_id: auth.id!,
                  file_path: path,
                  file_name: file.name.slice(0, 200),
                  size_bytes: file.size,
                  created_at: new Date().toISOString(),
                });
              } catch (error) {
                await removePortfolioFile("student-resumes", path).catch(
                  () => {},
                );
                throw error;
              }
              if (resume)
                await removePortfolioFile("student-resumes", resume.file_path);
              setUrl("");
            }, "Currículo armazenado com acesso privado.");
          }}
        />
      </label>
      {auth.demo && (
        <p className="small muted">
          O envio de arquivos pessoais requer uma conta real. A exportação
          abaixo funciona com os dados da demonstração.
        </p>
      )}
      <Button onClick={() => setPreview(true)} icon="download">
        Pré-visualizar e exportar currículo
      </Button>
      {url && (
        <label>
          Link temporário (15 minutos)
          <input value={url} readOnly onFocus={(e) => e.target.select()} />
          <a href={url} target="_blank" rel="noopener noreferrer">
            Abrir PDF
          </a>
        </label>
      )}
      <ActionFeedback action={action} />
      {preview && (
        <ResumePreview
          name={p.full_name}
          headline={p.headline}
          sections={sections}
          onClose={() => setPreview(false)}
        />
      )}{" "}
      {deleting && resume && (
        <Confirm
          title="Excluir currículo?"
          onClose={() => setDeleting(false)}
          onConfirm={async () => {
            await removePortfolioFile("student-resumes", resume.file_path);
            await removePortfolioRow(auth.demo, "student_resumes", resume.id);
            setUrl("");
          }}
        >
          O arquivo será removido e deixará de estar anexado às candidaturas.
        </Confirm>
      )}
      {share && resume && (
        <Confirm
          title="Compartilhar currículo por 15 minutos?"
          onClose={() => setShare(false)}
          onConfirm={async () => {
            const link = await signedFile("student-resumes", resume.file_path);
            setUrl(link);
            await copyText(link);
          }}
        >
          Qualquer pessoa que receber o link poderá abrir o arquivo durante esse
          período. Depois de enviado, o link permanece válido até expirar ou o
          arquivo ser excluído.
        </Confirm>
      )}
    </div>
  );
}
function ResumePreview({
  name,
  headline,
  sections,
  onClose,
}: {
  name: string;
  headline: string;
  sections: ResumeSection[];
  onClose: () => void;
}) {
  const [selected, setSelected] = useState(
      sections.map((s, i) => (s.lines.length ? i : -1)).filter((i) => i >= 0),
    ),
    action = useAction();
  return (
    <Modal title="Pré-visualização do currículo" onClose={onClose}>
      <p>
        Revise os dados e autorize as seções que deseja incluir. O PDF será
        salvo no seu dispositivo.
      </p>
      <div className="resume-preview">
        <h2>{name}</h2>
        <p>{headline}</p>
        {sections
          .filter((s) => s.lines.length)
          .map((s) => {
            const i = sections.indexOf(s);
            return (
              <section key={s.title}>
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={selected.includes(i)}
                    onChange={() =>
                      setSelected((old) =>
                        old.includes(i)
                          ? old.filter((n) => n !== i)
                          : [...old, i],
                      )
                    }
                  />
                  Incluir {s.title}
                </label>
                {selected.includes(i) &&
                  s.lines.map((line, index) => <p key={index}>{line}</p>)}
              </section>
            );
          })}
      </div>
      <Button
        disabled={action.busy}
        onClick={() =>
          action.run(async () => {
            const { resumePdf } = await import("./resumePdf");
            downloadBlob(
              await resumePdf(
                name,
                headline,
                sections.filter((_, i) => selected.includes(i)),
              ),
              "curriculo-skillup.pdf",
            );
          }, "PDF gerado a partir das informações autorizadas.")
        }
      >
        Exportar PDF
      </Button>
      <ActionFeedback action={action} />
    </Modal>
  );
}
export function ResumeApplicationField() {
  const auth = useAuth(),
    feature = usePortfolio();
  const r = feature.data.student_resumes.find((r) => r.user_id === auth.id);
  return r ? (
    <label className="check-label">
      <input type="checkbox" name="resume_id" value={r.id} />
      Anexar {r.file_name} e autorizar acesso ao recrutador desta vaga
    </label>
  ) : (
    <p className="small muted">
      Você pode importar um currículo no perfil para anexá-lo à candidatura.
    </p>
  );
}
export function CandidateResume({ resumeId }: { resumeId: string }) {
  const feature = usePortfolio(),
    action = useAction(),
    [url, setUrl] = useState("");
  const r = feature.data.student_resumes.find((r) => r.id === resumeId);
  if (!r) return <p>Currículo removido ou sem acesso.</p>;
  return (
    <div className="stack">
      <Button
        variant="outline"
        onClick={() =>
          action.run(async () =>
            setUrl(await signedFile("student-resumes", r.file_path)),
          )
        }
      >
        Visualizar currículo autorizado
      </Button>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer">
          Abrir PDF · link temporário
        </a>
      )}
      <ActionFeedback action={action} />
    </div>
  );
}
