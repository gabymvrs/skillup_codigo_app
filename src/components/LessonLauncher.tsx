import { guidedTheories } from "../lib/guidedLearning";
import { useEffect, useState } from "react";
import type { LessonPlan } from "../lib/lessonTypes";
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
    [plan, setPlan] = useState<LessonPlan | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    lessonAction(auth.demo, auth.id!, module.id, "get")
      .then((r) => {
        if (active) {
          setPlan(r.plan);
          setStage(
            r.session.stage === "theory" &&
              (r.session.draft?.theoryStep || 0) > 0
              ? "theory_started"
              : r.session.stage,
          );
        }
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
        {guidedTheories[module.id] && (
          <p>{guidedTheories[module.id].objective}</p>
        )}
        {plan && (
          <section className="stack lesson-context">
            <h3>{plan.dynamic.title}</h3>
            <p className="pre-wrap">{plan.dynamic.prompt}</p>
          </section>
        )}
        <p>
          Conclua a teoria, a prática e a dinâmica para registrar a etapa e
          receber {module.xp} XP na primeira conclusão.
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
                  ? "Você pode começar pela prática e voltar à teoria quando precisar."
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
