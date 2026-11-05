import { Avatar } from "../../components/Avatar";
import { PortfolioImage } from "./ProjectTools";
import { useParams } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../state/AuthContext";
import { useData } from "../../state/DataContext";
import {
  ActionFeedback,
  Badge,
  Button,
  Card,
  Confirm,
  Empty,
  Modal,
  Notice,
  useAction,
} from "../../components/ui";
import { copyText, dateLabel, safeUrl, uid } from "../../lib/utils";
import { highlightKinds, visibilityLabels, type Highlight } from "./model";
import { VisibilityField } from "./Fields";
import {
  removePortfolioFile,
  removePortfolioRow,
  savePortfolioRow,
  signedFile,
  uploadPortfolioFile,
} from "./service";
import { usePortfolio } from "./usePortfolio";
const calendarDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`));
export function Attachment({ path, name }: { path: string; name: string }) {
  const action = useAction();
  const [url, setUrl] = useState("");
  return (
    <>
      <Button
        variant="outline"
        icon="file"
        disabled={action.busy}
        onClick={() =>
          action.run(async () =>
            setUrl(await signedFile("portfolio-files", path)),
          )
        }
      >
        Visualizar {name || "anexo"}
      </Button>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer">
          Abrir anexo · link válido por 15 minutos
        </a>
      )}
      <ActionFeedback action={action} />
    </>
  );
}
export function HighlightCard({
  item,
  editable = false,
  onEdit,
}: {
  item: Highlight;
  editable?: boolean;
  onEdit?: (h: Highlight) => void;
}) {
  const auth = useAuth(),
    action = useAction();
  const [deleting, setDeleting] = useState(false),
    [shared, setShared] = useState("");
  return (
    <Card>
      <div className="row-between">
        <Badge>
          {item.kind}
          {item.pinned ? " · Fixado" : ""}
        </Badge>
        <small>{dateLabel(item.created_at)}</small>
      </div>
      <h3>{item.title}</h3>
      <p>
        {item.organization} · {calendarDate(item.started_on)}
        {item.ended_on ? ` — ${calendarDate(item.ended_on)}` : ""}
      </p>
      <p className="pre-wrap">{item.description}</p>
      {item.file_path && /\.(png|jpg|webp)$/.test(item.file_path) && (
        <PortfolioImage path={item.file_path} alt={item.title} />
      )}
      <p className="small muted">
        Informação declarada pelo estudante ·{" "}
        {visibilityLabels[item.visibility]}
      </p>
      {item.file_path && (
        <Attachment path={item.file_path} name={item.file_name} />
      )}{" "}
      {safeUrl(item.external_url) && (
        <a
          className="text-link"
          href={safeUrl(item.external_url)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {item.kind === "Certificado"
            ? "Consultar validação na instituição emissora"
            : "Abrir link externo"}
        </a>
      )}
      <div className="actions">
        {editable && (
          <>
            <Button variant="ghost" onClick={() => onEdit?.(item)}>
              Editar destaque
            </Button>
            <Button
              variant="ghost"
              disabled={action.busy}
              onClick={() =>
                action.run(() =>
                  savePortfolioRow(auth.demo, "profile_highlights", {
                    ...item,
                    pinned: !item.pinned,
                  }),
                )
              }
            >
              {item.pinned ? "Desafixar" : "Fixar destaque"}
            </Button>
            <Button variant="ghost" onClick={() => setDeleting(true)}>
              Excluir destaque
            </Button>
          </>
        )}{" "}
        {item.visibility !== "private" && (
          <Button
            variant="ghost"
            onClick={() =>
              action.run(async () => {
                if (auth.demo)
                  throw Error(
                    "Links demonstrativos só funcionam neste navegador.",
                  );
                const url = `${location.origin}${item.visibility === "public" ? "/destaques/" : "/app/destaques/"}${item.id}`;
                if (!(await copyText(url))) setShared(url);
              }, "Link do destaque copiado.")
            }
          >
            Compartilhar destaque
          </Button>
        )}
      </div>
      {shared && (
        <input
          aria-label="Link do destaque"
          value={shared}
          readOnly
          onFocus={(e) => e.target.select()}
        />
      )}
      <ActionFeedback action={action} />
      {deleting && (
        <Confirm
          title="Excluir destaque?"
          onClose={() => setDeleting(false)}
          onConfirm={async () => {
            await removePortfolioRow(auth.demo, "profile_highlights", item.id);
            if (!auth.demo && item.file_path)
              await removePortfolioFile("portfolio-files", item.file_path);
          }}
        >
          A publicação e seu anexo serão removidos.
        </Confirm>
      )}
    </Card>
  );
}
export function Highlights({
  userId,
  editable = false,
}: {
  userId: string;
  editable?: boolean;
}) {
  const feature = usePortfolio(),
    repo = useData();
  const [editing, setEditing] = useState<Highlight | null | undefined>(
    undefined,
  );
  const profile = repo.data.profiles.find((p) => p.id === userId);
  const rows = feature.data.profile_highlights
    .filter(
      (h) => h.user_id === userId && (editable || h.visibility !== "private"),
    )
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        b.created_at.localeCompare(a.created_at),
    );
  return (
    <div className="stack">
      {editable && (
        <Button
          icon="plus"
          disabled={Boolean(feature.error)}
          onClick={() => setEditing(null)}
        >
          Adicionar destaque
        </Button>
      )}
      <p className="small muted">
        Certificados, experiências, eventos e projetos. Até três destaques
        fixados.
      </p>
      {rows.map((h) => (
        <div id={`destaque-${h.id}`} key={h.id}>
          <div className="post-author">
            <Avatar
              name={profile?.full_name || "Estudante"}
              path={profile?.avatar_path}
              demoImage={profile?.avatar_demo}
            />
            <div>
              <strong>{profile?.full_name}</strong>
              <small>{profile?.headline}</small>
            </div>
          </div>
          <HighlightCard item={h} editable={editable} onEdit={setEditing} />
        </div>
      ))}
      {!rows.length && (
        <Empty title="Nenhum destaque publicado">
          Compartilhe uma experiência ou um certificado com a visibilidade que
          preferir.
        </Empty>
      )}
      {editing !== undefined && (
        <HighlightEditor item={editing} onClose={() => setEditing(undefined)} />
      )}
    </div>
  );
}
function HighlightEditor({
  item,
  onClose,
}: {
  item: Highlight | null;
  onClose: () => void;
}) {
  const auth = useAuth(),
    feature = usePortfolio(),
    action = useAction();
  const [file, setFile] = useState<File | null>(null);
  return (
    <Modal
      title={item ? "Editar destaque" : "Adicionar destaque"}
      onClose={onClose}
    >
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          void action.run(async () => {
            const external_url = String(f.get("url")).trim();
            if (external_url && !safeUrl(external_url))
              throw Error("Use um link HTTPS válido.");
            if (
              f.get("pinned") &&
              feature.data.profile_highlights.filter(
                (h) => h.user_id === auth.id && h.pinned && h.id !== item?.id,
              ).length >= 3
            )
              throw Error("Você pode fixar até três destaques.");
            let uploaded: string | null = null;
            const remove = f.get("remove_file") === "on";
            try {
              if (file)
                uploaded = await uploadPortfolioFile(
                  auth.demo,
                  auth.id!,
                  "portfolio-files",
                  file,
                );
              await savePortfolioRow(auth.demo, "profile_highlights", {
                id: item?.id || uid(),
                user_id: auth.id!,
                kind: String(f.get("kind")),
                title: String(f.get("title")).trim(),
                organization: String(f.get("organization")).trim(),
                description: String(f.get("description")).trim(),
                started_on: String(f.get("started")),
                ended_on: String(f.get("ended")) || null,
                external_url,
                file_path:
                  uploaded || (remove ? null : item?.file_path || null),
                file_name:
                  file?.name.slice(0, 200) ||
                  (remove ? "" : item?.file_name || ""),
                visibility: String(
                  f.get("visibility"),
                ) as Highlight["visibility"],
                pinned: f.get("pinned") === "on",
                created_at: item?.created_at || new Date().toISOString(),
              });
            } catch (error) {
              if (uploaded)
                await removePortfolioFile("portfolio-files", uploaded).catch(
                  () => {},
                );
              throw error;
            }
            if (!auth.demo && item?.file_path && (uploaded || remove))
              await removePortfolioFile("portfolio-files", item.file_path);
            onClose();
          });
        }}
      >
        <label>
          Tipo de destaque
          <select name="kind" defaultValue={item?.kind || "Certificado"}>
            {highlightKinds.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        <label>
          Título
          <input
            name="title"
            defaultValue={item?.title}
            required
            minLength={2}
            maxLength={160}
          />
        </label>
        <label>
          Instituição ou organização
          <input
            name="organization"
            defaultValue={item?.organization}
            required
            minLength={2}
            maxLength={160}
          />
        </label>
        <label>
          Descrição
          <textarea
            name="description"
            defaultValue={item?.description}
            maxLength={4000}
          />
        </label>
        <label>
          Data de emissão ou início
          <input
            type="date"
            name="started"
            defaultValue={item?.started_on}
            required
          />
        </label>
        <label>
          Data final (opcional)
          <input type="date" name="ended" defaultValue={item?.ended_on || ""} />
        </label>
        <label>
          Link externo ou de validação
          <input
            name="url"
            type="url"
            defaultValue={item?.external_url}
            maxLength={2000}
          />
        </label>
        <label>
          Imagem ou documento · até 5 MB
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            disabled={auth.demo}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
        {auth.demo && (
          <Notice>
            Envio de arquivos disponível apenas em contas reais. Você pode
            testar os campos e a publicação sem anexos.
          </Notice>
        )}
        {item?.file_path && (
          <label className="check-label">
            <input type="checkbox" name="remove_file" />
            Remover anexo atual: {item.file_name}
          </label>
        )}
        <VisibilityField value={item?.visibility || "private"} />
        <label className="check-label">
          <input type="checkbox" name="pinned" defaultChecked={item?.pinned} />
          Fixar no perfil (máximo três)
        </label>
        <div className="actions">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={action.busy}>
            Salvar destaque
          </Button>
        </div>
        <ActionFeedback action={action} />
      </form>
    </Modal>
  );
}

export function CommunityHighlight() {
  const { id } = useParams(),
    feature = usePortfolio();
  const h = feature.data.profile_highlights.find((h) => h.id === id);
  return feature.loading ? (
    <p role="status">Carregando destaque…</p>
  ) : h ? (
    <HighlightCard item={h} />
  ) : (
    <Empty title="Destaque indisponível" />
  );
}
