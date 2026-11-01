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
        if (active) setStage(r.session.stage);
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
        <p>
          Estude o conceito, aplique na prática e registre sua entrega. O XP da
          atividade é concedido após as três partes.
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
                  ? "Comece pela teoria."
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
