import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { useAuth } from "../../state/AuthContext";
import type { Comment } from "../../lib/types";
import {
  ActionFeedback,
  Button,
  Modal,
  Notice,
  useAction,
} from "../../components/ui";
import { reportReasons } from "./model";
import { reportComment } from "./service";
export function CommentReport({ comment }: { comment: Comment }) {
  const auth = useAuth(),
    action = useAction();
  const [open, setOpen] = useState(false),
    [sent, setSent] = useState(false);
  if (auth.role !== "estudante") return null;
  return (
    <>
      <details className="comment-menu">
        <summary aria-label={`Opções do comentário de ${comment.author_name}`}>
          <MoreHorizontal size={20} />
        </summary>
        <Button
          variant="ghost"
          onClick={() => {
            setOpen(true);
            setSent(false);
          }}
        >
          Denunciar
        </Button>
      </details>
      {open && (
        <Modal title="Denunciar comentário" onClose={() => setOpen(false)}>
          {sent ? (
            <Notice tone="success">
              {auth.demo
                ? "Denúncia de teste registrada neste navegador."
                : "Denúncia registrada para análise. Sua identidade não é exibida ao autor."}
            </Notice>
          ) : (
            <form
              className="stack"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void action.run(async () => {
                  await reportComment(
                    auth.demo,
                    auth.id!,
                    comment.id,
                    String(f.get("reason")),
                    String(f.get("description")).trim(),
                  );
                  setSent(true);
                });
              }}
            >
              <p>
                O comentário permanece visível até uma decisão de moderação.
                Limite: cinco denúncias por 24 horas.
              </p>
              <label>
                Motivo da denúncia
                <select name="reason" required>
                  <option value="">Selecione</option>
                  {reportReasons.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
              <label>
                Descrição adicional (opcional)
                <textarea name="description" maxLength={2000} />
              </label>
              <div className="actions">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={action.busy}>
                  Enviar denúncia
                </Button>
              </div>
              <ActionFeedback action={action} />
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
