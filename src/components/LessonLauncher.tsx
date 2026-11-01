import { guidedTheories } from "../lib/guidedLearning";
import { useEffect, useState } from "react";
import type { Module } from "../lib/types";
import { useAuth } from "../state/AuthContext";
import { lessonAction } from "../services/lessonJourney";
import { Modal, Button, Notice } from "./ui";
export function LessonLauncher({
  module,
  onStart,
  onClose,
}: {
  module: Module;
  onStart: () => void;
  onClose: () => void;
}) {
  const auth = useAuth(),
    [stage, setStage] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    lessonAction(auth.demo, auth.id!, module.id, "get")
      .then((r) => {
        if (active)
          setStage(
            r.session.stage === "theory" &&
              (r.session.draft?.theoryStep || 0) > 0
              ? "theory_started"
              : r.session.stage,
          );
      })
      .catch((e) => {
        if (active)
          setError(e.message || "Não foi possível abrir esta atividade.");
      });
    return () => {
      active = false;
    };
  }, [auth.id, auth.demo, module.id]);
  return (
    <Modal title={module.title} onClose={onClose}>
      <div className="stack">
        <p>
          Uma atividade completa com três partes: teoria, prática e dinâmica.
        </p>
        {guidedTheories[module.id] && (
          <p>
            <strong>Objetivo:</strong> {guidedTheories[module.id].objective}
          </p>
        )}
        <p>
          Consulte a teoria quando precisar. Conclua a prática e a dinâmica para
          registrar a atividade e receber XP.
        </p>
        {error ? (
          <Notice tone="warning">{error}</Notice>
        ) : !stage ? (
          <p role="status">Consultando seu progresso…</p>
        ) : (
          <>
            <p>
              {stage === "completed"
                ? "Atividade já concluída. Consulte o resultado."
                : stage === "theory"
                  ? "Escolha por onde começar. Você pode pular a teoria."
                  : "Seu progresso está salvo. Continue de onde parou."}
            </p>
            <Button onClick={onStart}>
              {stage === "completed"
                ? "Ver resultado"
                : stage === "theory"
                  ? "Começar"
                  : "Continuar atividade"}
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
