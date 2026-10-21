import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { useData } from "../state/DataContext";
import type { Material } from "../lib/types";
import { downloadBlob, matches, uid } from "../lib/utils";
import {
  getSaved,
  listSaved,
  materialHtml,
  removeSaved,
  saveMaterial,
  type SavedMaterial,
} from "../services/offline";
import { requireSupabase } from "../services/supabase";
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
  Notice,
  SearchField,
  SectionTitle,
  ProgressBar,
  useAction,
} from "../components/ui";
const offlineOwner = (id: string | null, demo: boolean) =>
  `${demo ? "demo:" : ""}${id}`;
export function Materials() {
  const auth = useAuth(),
    repo = useData(),
    { subjectId } = useParams(),
    [query, setQuery] = useState(""),
    [create, setCreate] = useState(false),
    [saved, setSaved] = useState<SavedMaterial[]>([]),
    action = useAction();
  const owner = offlineOwner(auth.id, auth.demo),
    subject = repo.data.subjects.find((s) => s.id === subjectId),
    canWrite = auth.role === "docente" || auth.role === "instituicao";
  useEffect(() => {
    listSaved(owner)
      .then(setSaved)
      .catch(() => {});
  }, [owner]);
  const visible = repo.data.materials.filter(
    (m) =>
      (!subjectId || m.subject_id === subjectId) &&
      matches(query, m.title, m.summary),
  );
  let recent: string[] = [];
  try {
    recent = JSON.parse(
      localStorage.getItem(`skillup.recent.${owner}`) || "[]",
    );
  } catch {
    /* no recent history */
  }
  const recorded = repo.data.material_reads
    .filter((r) => r.user_id === auth.id)
    .sort((a, b) => b.last_opened_at.localeCompare(a.last_opened_at))
    .map((r) => r.material_id);
  recent = [...new Set([...recorded, ...recent])];
  const suggested = !recent.length;
  const shownRecent = suggested
    ? repo.data.materials
        .filter((m) =>
          ["Gramática ortográfica", "Tipos de plantas"].includes(m.title),
        )
        .map((m) => m.id)
    : recent;
  return (
    <div className="stack">
      {subjectId && (
        <Link className="back-link" to="/app/aprenda/material">
          <Icon name="arrow" />
          Todas as matérias
        </Link>
      )}
      <Heading
        title={
          subject?.name ||
          (canWrite ? "Material de estudo" : "Biblioteca de materiais")
        }
        description={
          subject
            ? "Artigos e materiais organizados para a sua revisão."
            : canWrite
              ? "Organize os conteúdos para suas turmas."
              : "Escolha uma matéria e continue aprendendo."
        }
        action={
          canWrite ? (
            <Button icon="plus" onClick={() => setCreate(true)}>
              Novo material
            </Button>
          ) : (
            <ActionLink variant="outline" to="/offline" icon="download">
              Biblioteca offline
            </ActionLink>
          )
        }
      />
      <SearchField value={query} onChange={setQuery} label="Buscar materiais" />
      <ActionFeedback action={action} />
      {!subjectId && !query && (
        <>
          <SectionTitle>Vistos recentemente</SectionTitle>
          {suggested && (
            <p className="small muted">
              Sugestões para sua primeira leitura. Ao abrir um conteúdo, ele
              passa a aparecer no histórico.
            </p>
          )}
          {shownRecent.length ? (
            <div className="recent-grid">
              {shownRecent
                .slice(0, 2)
                .map((id) => repo.data.materials.find((m) => m.id === id))
                .filter((x): x is Material => Boolean(x))
                .map((m) => (
                  <Link
                    className="card recent-card"
                    key={m.id}
                    to={`/app/aprenda/material/item/${m.id}`}
                  >
                    <Badge>{m.kind}</Badge>
                    <h3>
                      {
                        repo.data.subjects.find((s) => s.id === m.subject_id)
                          ?.name
                      }
                    </h3>
                    <p>{m.title}</p>
                  </Link>
                ))}
            </div>
          ) : (
            <p className="muted">
              Os últimos materiais que você abrir aparecerão aqui.
            </p>
          )}
          <SectionTitle>Matérias</SectionTitle>
          <div className="subject-grid">
            {repo.data.subjects.map((s, i) => (
              <Link
                key={s.id}
                className={`subject ${[2, 3].includes(i) ? "dark-text" : ""}`}
                style={{ backgroundColor: s.color }}
                to={`/app/aprenda/material/${s.id}`}
              >
                <Icon name={s.icon} size={28} />
                <strong>{s.name}</strong>
              </Link>
            ))}
          </div>
        </>
      )}
      {(subjectId || query || canWrite) && (
        <div className="material-grid">
          {visible.map((m) => (
            <Card key={m.id}>
              <div className="row-between">
                <Badge>{m.kind}</Badge>
                {saved.some((s) => s.material.id === m.id) && (
                  <Badge tone="success">Salvo no app</Badge>
                )}
              </div>
              <h3>{m.title}</h3>
              <p>{m.summary}</p>
              <ProgressBar
                value={
                  repo.data.material_reads.some(
                    (r) =>
                      r.user_id === auth.id &&
                      r.material_id === m.id &&
                      r.completed_at,
                  )
                    ? 100
                    : 0
                }
                label={
                  repo.data.material_reads.some(
                    (r) =>
                      r.user_id === auth.id &&
                      r.material_id === m.id &&
                      r.completed_at,
                  )
                    ? "Leitura concluída"
                    : "Leitura ainda não concluída"
                }
              />
              <div className="actions">
                <ActionLink
                  to={`/app/aprenda/material/item/${m.id}`}
                  variant="outline"
                  icon="book"
                >
                  Abrir material
                </ActionLink>
                <Button
                  icon="download"
                  disabled={action.busy || !m.allow_offline}
                  onClick={() =>
                    action.run(async () => {
                      await saveMaterial(owner, m);
                      setSaved(await listSaved(owner));
                    }, "Gravação confirmada. O material está disponível offline no app.")
                  }
                >
                  Salvar no app
                </Button>
              </div>
              {!m.allow_offline && (
                <small>O autor não autorizou uma cópia offline.</small>
              )}
            </Card>
          ))}
          {!visible.length && (
            <Empty title="Nenhum material encontrado">
              Tente outra palavra ou volte para todas as matérias.
            </Empty>
          )}
        </div>
      )}
      {create && <MaterialEditor onClose={() => setCreate(false)} />}
    </div>
  );
}
export function MaterialReader() {
  const { materialId } = useParams(),
    auth = useAuth(),
    repo = useData(),
    { data } = repo,
    action = useAction(),
    [saved, setSaved] = useState<SavedMaterial>(),
    [loading, setLoading] = useState(true);
  const owner = offlineOwner(auth.id, auth.demo),
    material =
      data.materials.find((m) => m.id === materialId) || saved?.material;
  useEffect(() => {
    let active = true;
    getSaved(owner, materialId!)
      .then((x) => {
        if (active) setSaved(x);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    try {
      const key = `skillup.recent.${owner}`,
        old = JSON.parse(localStorage.getItem(key) || "[]");
      localStorage.setItem(
        key,
        JSON.stringify(
          [materialId, ...old.filter((x: string) => x !== materialId)].slice(
            0,
            10,
          ),
        ),
      );
    } catch {
      /* optional recent history */
    }
    return () => {
      active = false;
    };
  }, [owner, materialId]);
  useEffect(() => {
    if (material && (auth.demo || navigator.onLine))
      void repo
        .recordRead(material.id)
        .catch(() =>
          action.setError(
            "O material abriu, mas não foi possível sincronizar o histórico de leitura.",
          ),
        );
  }, [materialId, auth.id, auth.demo, Boolean(material)]);
  if (loading && !material) return <p>Carregando material…</p>;
  if (!material)
    return (
      <Empty
        title="Material não encontrado"
        action={
          <ActionLink to="/app/aprenda/material">
            Voltar à biblioteca
          </ActionLink>
        }
      />
    );
  async function exportFile() {
    let blob = saved?.blob;
    if (material!.file_path && !blob) {
      const response = await requireSupabase()
        .storage.from("learning-materials")
        .download(material!.file_path);
      if (response.error) throw response.error;
      blob = response.data;
    }
    downloadBlob(
      blob ||
        new Blob([materialHtml(material!)], {
          type: "text/html;charset=utf-8",
        }),
      material!.file_path?.split("/").pop() ||
        `${material!.title.replace(/[^\p{L}\p{N}]+/gu, "-")}.html`,
    );
  }
  return (
    <div className="stack">
      <Link
        className="back-link"
        to={`/app/aprenda/material/${material.subject_id}`}
      >
        <Icon name="arrow" />
        Voltar à matéria
      </Link>
      <Heading title={material.title} description={material.summary} />
      <div className="actions">
        <Badge>{material.kind}</Badge>
        {saved && <Badge tone="success">Cópia salva no app</Badge>}
      </div>
      <article className="reading-content card">
        {material.body.split("\n\n").map((p, i) => (
          <p className="pre-wrap" key={i}>
            {p}
          </p>
        ))}
        {material.file_path && (
          <Notice>
            O arquivo anexado pode ser exportado abaixo. O texto acima é a
            descrição acessível do material.
          </Notice>
        )}
      </article>
      <ProgressBar
        value={
          data.material_reads.some(
            (r) =>
              r.user_id === auth.id &&
              r.material_id === material.id &&
              r.completed_at,
          )
            ? 100
            : 0
        }
        label="Progresso de leitura"
      />
      <Button
        variant="outline"
        icon="check"
        disabled={
          action.busy ||
          data.material_reads.some(
            (r) =>
              r.user_id === auth.id &&
              r.material_id === material.id &&
              r.completed_at,
          )
        }
        onClick={() =>
          action.run(
            () => repo.recordRead(material.id, true),
            "Leitura concluída e registrada.",
          )
        }
      >
        Marcar leitura como concluída
      </Button>
      <div className="actions">
        <Button
          disabled={action.busy || !material.allow_offline}
          icon="download"
          onClick={() =>
            action.run(
              async () => setSaved(await saveMaterial(owner, material)),
              "Gravação offline confirmada.",
            )
          }
        >
          {saved ? "Atualizar cópia no app" : "Salvar no app"}
        </Button>
        <Button
          variant="outline"
          icon="external"
          disabled={action.busy || !material.allow_offline}
          onClick={() =>
            action.run(
              exportFile,
              "Arquivo preparado para download. Confira a pasta Downloads do dispositivo.",
            )
          }
        >
          Exportar arquivo
        </Button>
      </div>
      <p className="small muted">
        Salvar no app permite a leitura na biblioteca offline. Exportar arquivo
        entrega uma cópia para o navegador salvar no dispositivo.
      </p>
      <ActionFeedback action={action} />
    </div>
  );
}
export function OfflineLibrary() {
  const auth = useAuth(),
    [saved, setSaved] = useState<SavedMaterial[]>([]),
    [open, setOpen] = useState<SavedMaterial | null>(null),
    [remove, setRemove] = useState<SavedMaterial | null>(null),
    [loading, setLoading] = useState(true),
    [estimate, setEstimate] = useState(""),
    action = useAction();
  const owner = offlineOwner(auth.id, auth.demo);
  async function refresh() {
    if (auth.id) setSaved(await listSaved(owner));
  }
  useEffect(() => {
    refresh()
      .catch((e) => action.setError(String(e)))
      .finally(() => setLoading(false));
    navigator.storage
      ?.estimate?.()
      .then((x) =>
        setEstimate(
          `${((x.usage || 0) / 1024 / 1024).toFixed(1)} MB usados pelo site`,
        ),
      )
      .catch(() => {});
  }, [owner]);
  return (
    <main className="standalone stack">
      <Link
        className="back-link"
        to={auth.role ? "/app/aprenda/material" : "/"}
      >
        <Icon name="arrow" />
        Voltar ao SkillUp
      </Link>
      <Heading
        title="Biblioteca offline"
        description="Conteúdos que você escolheu manter neste navegador."
      />
      <Notice>
        O navegador pode remover dados quando faltar espaço. Exporte uma cópia
        dos materiais importantes. Ao sair da conta, as cópias do app são
        removidas deste dispositivo.
      </Notice>
      <p className="small muted">
        {saved.length} material(is) ·{" "}
        {(saved.reduce((s, m) => s + m.bytes, 0) / 1024).toFixed(1)} KB de
        conteúdo{estimate && ` · ${estimate}`}
      </p>
      <ActionFeedback action={action} />
      {loading ? (
        <p>Verificando a biblioteca…</p>
      ) : !auth.id ? (
        <Empty
          title="Entre para ver seus materiais"
          action={<ActionLink to="/login">Entrar</ActionLink>}
        >
          A biblioteca é separada por conta neste navegador.
        </Empty>
      ) : !saved.length ? (
        <Empty
          title="Você ainda não salvou materiais"
          action={
            <ActionLink to="/app/aprenda/material">
              Escolher materiais
            </ActionLink>
          }
        >
          Abra uma matéria e selecione “Salvar no app”.
        </Empty>
      ) : (
        <div className="material-grid">
          {saved.map((s) => (
            <Card key={s.key}>
              <Badge tone="success">Armazenado no app</Badge>
              <h2>{s.material.title}</h2>
              <p>{s.material.summary}</p>
              <div className="actions">
                <Button onClick={() => setOpen(s)} icon="book">
                  Ler offline
                </Button>
                <Button
                  variant="ghost"
                  icon="trash"
                  onClick={() => setRemove(s)}
                >
                  Remover
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      {open && (
        <Modal title={open.material.title} onClose={() => setOpen(null)}>
          <article className="reading-content pre-wrap">
            {open.material.body}
          </article>
          <Button
            variant="outline"
            onClick={() =>
              action.run(async () => {
                downloadBlob(
                  open.blob ||
                    new Blob([materialHtml(open.material)], {
                      type: "text/html",
                    }),
                  open.material.file_path?.split("/").pop() ||
                    "material-skillup.html",
                );
              }, "Arquivo preparado para download.")
            }
            icon="download"
          >
            Exportar cópia
          </Button>
          <ActionFeedback action={action} />
        </Modal>
      )}
      {remove && (
        <Confirm
          title="Remover cópia offline?"
          onClose={() => setRemove(null)}
          onConfirm={async () => {
            await removeSaved(owner, remove.material.id);
            await refresh();
          }}
        >
          O material continuará no catálogo online. A cópia deste navegador será
          removida.
        </Confirm>
      )}
    </main>
  );
}
export function MaterialEditor({ onClose }: { onClose: () => void }) {
  const auth = useAuth(),
    repo = useData(),
    action = useAction(),
    navigate = useNavigate();
  return (
    <Modal title="Novo material" onClose={onClose}>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          void action.run(async () => {
            const id = uid(),
              file = f.get("file") as File | null;
            let file_path: string | null = null;
            if (file?.size) {
              if (auth.demo)
                throw new Error(
                  "Anexos de arquivos exigem uma conta real. Use o conteúdo em texto na demonstração.",
                );
              if (
                file.size > 10 * 1024 * 1024 ||
                !["application/pdf", "text/plain"].includes(file.type)
              )
                throw new Error("Envie PDF ou TXT de até 10 MB.");
              file_path = `${auth.id}/${id}/${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
              const { error } = await requireSupabase()
                .storage.from("learning-materials")
                .upload(file_path, file);
              if (error) throw error;
            }
            try {
              await repo.add("materials", {
                id,
                subject_id: String(f.get("subject")),
                title: String(f.get("title")).trim(),
                summary: String(f.get("summary")).trim(),
                body: String(f.get("body")),
                kind: file_path ? "arquivo" : "artigo",
                file_path,
                allow_offline: f.get("offline") === "on",
                published: true,
                owner_id: auth.id!,
                organization_id: auth.organizationId,
              });
            } catch (error) {
              if (file_path)
                await requireSupabase()
                  .storage.from("learning-materials")
                  .remove([file_path]);
              throw error;
            }
            onClose();
            navigate(`/app/aprenda/material/item/${id}`);
          });
        }}
      >
        <label>
          Título
          <input name="title" maxLength={120} required />
        </label>
        <label>
          Matéria
          <select name="subject" required>
            {repo.data.subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Resumo
          <input name="summary" maxLength={240} required />
        </label>
        <label>
          Conteúdo ou descrição acessível
          <textarea
            name="body"
            rows={8}
            minLength={30}
            maxLength={30000}
            required
          />
        </label>
        <label>
          Anexo (PDF ou TXT, até 10 MB)
          <input
            name="file"
            type="file"
            accept="application/pdf,text/plain"
            disabled={auth.demo}
          />
          {auth.demo && <small>Upload disponível com uma conta real.</small>}
        </label>
        <label className="check-label">
          <input type="checkbox" name="offline" defaultChecked />
          Autorizo salvar e exportar este conteúdo para estudo offline.
        </label>
        <Button type="submit" disabled={action.busy}>
          {action.busy ? "Salvando…" : "Publicar material"}
        </Button>
        <ActionFeedback action={action} />
      </form>
    </Modal>
  );
}
