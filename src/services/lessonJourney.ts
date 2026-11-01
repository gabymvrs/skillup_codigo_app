import { missionReady } from "../lib/guidedLearning";
import plans from "../data/lesson-plans.json";
import resources from "../data/learning-resources.json";
import type {
  LessonPlan,
  LessonState,
  LearningResource,
} from "../lib/lessonTypes";
import type { ExerciseAnswer } from "../lib/types";
import { requireSupabase } from "./supabase";
import { readDemo, writeDemo } from "./repository";
import { awardDemo, evaluateDemo } from "./learning";
import { activityType } from "./activities";
import { exerciseAnswers, demoAnswers } from "../data/catalog";
import { uid } from "../lib/utils";
export const demoPlans = plans as LessonPlan[];
export const learningResources = resources as LearningResource[];
const key = (user: string, module: string) =>
  `skillup.lesson.demo.${user}.${module}`;
export async function lessonAction(
  demo: boolean,
  user: string,
  module: string,
  action: string,
  payload: unknown = null,
): Promise<{ plan: LessonPlan; session: LessonState }> {
  if (!demo) {
    const { data, error } = await requireSupabase().rpc("lesson_action", {
      p_module_id: module,
      p_action: action,
      p_payload: payload,
    });
    if (error) throw error;
    return data;
  }
  const plan = demoPlans.find((p) => p.module_id === module);
  const d = readDemo(),
    m = d.modules.find((m) => m.id === module);
  if (!plan || !m) throw new Error("Conteúdo desta atividade indisponível.");
  if (
    m.prerequisite_id &&
    !d.progress.some(
      (p) => p.user_id === user && p.module_id === m.prerequisite_id,
    )
  )
    throw new Error("Conclua a etapa anterior.");
  let s: LessonState = {
    module_id: module,
    stage: "theory",
    results: {},
    xp: 0,
  };
  try {
    s = JSON.parse(localStorage.getItem(key(user, module)) || "null") || s;
  } catch {
    /* recover only this demo session */
  }
  const valid =
    action === "get" ||
    (action === "theory" && s.stage === "theory") ||
    ((action === "answer" || action === "practice") &&
      s.stage === "practice") ||
    (action === "finish" && (s.stage === "dynamic" || s.stage === "completed"));
  if (!valid) throw new Error("Ação incompatível com a parte atual.");
  if (action === "theory" && s.stage === "theory") s.stage = "practice";
  if (action === "answer") {
    if (s.stage !== "practice") throw new Error("Abra a parte de prática.");
    const { question_id, response } = payload as {
      question_id: string;
      response: ExerciseAnswer;
    };
    const q = d.questions.find((q) => q.id === question_id);
    if (!q || !plan.question_ids.includes(q.id))
      throw new Error("Exercício inválido.");
    const verdict =
      activityType(q) === "code_practice"
        ? await (
            await import("./codeRunner")
          ).gradeDemoCode(q, String(response))
        : { correct: evaluateDemo(q, response), explanation: q.explanation };
    const old = s.results[q.id];
    s.results[q.id] = {
      ...verdict,
      firstResponse: old ? old.firstResponse : response,
      response,
      expected:
        activityType(q) === "code_practice"
          ? undefined
          : (exerciseAnswers[q.id] ?? demoAnswers[q.id]),
      objective: q.kind !== "challenge",
      firstCorrect: old?.firstCorrect ?? verdict.correct,
      tries: (old?.tries || 0) + 1,
    };
    d.attempts.push({
      id: uid(),
      user_id: user,
      question_id: q.id,
      selected_index: typeof response === "number" ? response : -1,
      response,
      correct: verdict.correct,
      xp: 0,
      created_at: new Date().toISOString(),
      lesson_module_id: module,
    });
    writeDemo(d);
  }
  if (action === "practice" && s.stage === "practice") {
    if (!plan.question_ids.every((q) => s.results[q]?.correct))
      throw new Error("Confira e corrija todos os exercícios.");
    s.stage = "dynamic";
  }
  if (action === "finish" && s.stage === "dynamic") {
    const response = payload as { text: string; checks: boolean[] };
    if (
      !response ||
      typeof response.text !== "string" ||
      response.text.trim().length < plan.dynamic.minLength ||
      response.text.length > 8000 ||
      !Array.isArray(response.checks) ||
      response.checks.length !== plan.dynamic.criteria.length ||
      !response.checks.every((x) => x === true)
    )
      throw new Error("Complete o relato e revise todos os critérios.");
    if (
      plan.dynamic.kind === "trace" &&
      !missionReady(
        (
          payload as {
            interaction?: import("../lib/guidedLearning").LearningInputs;
          }
        ).interaction,
      )
    )
      throw new Error("Organize e teste a sequência com duas notas válidas.");
    s.dynamic_response = response;
    s.stage = "completed";
    if (!d.progress.some((p) => p.user_id === user && p.module_id === module)) {
      d.progress.push({
        id: uid(),
        user_id: user,
        module_id: module,
        completed_at: new Date().toISOString(),
      });
      s.xp = awardDemo(d, user, `module:${module}`, m.xp, `Módulo: ${m.title}`);
      if (
        !d.track_enrollments.some(
          (e) => e.user_id === user && e.track_id === m.track_id,
        )
      )
        d.track_enrollments.push({
          id: uid(),
          user_id: user,
          track_id: m.track_id,
          created_at: new Date().toISOString(),
        });
      writeDemo(d);
    }
  }
  localStorage.setItem(key(user, module), JSON.stringify(s));
  return { plan, session: s };
}
export async function answerLesson(
  demo: boolean,
  user: string,
  module: string,
  question: string,
  response: ExerciseAnswer,
) {
  if (demo)
    return lessonAction(true, user, module, "answer", {
      question_id: question,
      response,
    });
  // The server decides whether this is a code activity; the browser cannot submit a verdict.
  const { data: spec, error: specError } = await requireSupabase()
    .from("questions")
    .select("activity_type")
    .eq("id", question)
    .single();
  if (specError) throw specError;
  if (spec.activity_type === "code_practice") {
    const { data, error } = await requireSupabase().functions.invoke(
      "grading-code",
      { body: { question_id: question, source: response, module_id: module } },
    );
    if (error) {
      const detail =
        error.context instanceof Response
          ? await error.context
              .clone()
              .json()
              .catch(() => null)
          : null;
      throw new Error(
        detail?.error || "Não foi possível validar o código. Tente novamente.",
      );
    }
    void data;
    return lessonAction(false, user, module, "get");
  }
  return lessonAction(false, user, module, "answer", {
    question_id: question,
    response,
  });
}
export async function savedResourceIds(
  demo: boolean,
  user: string,
): Promise<string[]> {
  if (demo) {
    try {
      return JSON.parse(
        localStorage.getItem(`skillup.resources.demo.${user}`) || "[]",
      );
    } catch {
      return [];
    }
  }
  const { data, error } = await requireSupabase()
    .from("saved_learning_resources")
    .select("resource_id")
    .eq("user_id", user);
  if (error) throw error;
  return data.map((r) => r.resource_id);
}
export async function saveResource(
  demo: boolean,
  user: string,
  id: string,
  save: boolean,
) {
  if (demo) {
    const ids = await savedResourceIds(true, user);
    localStorage.setItem(
      `skillup.resources.demo.${user}`,
      JSON.stringify(
        save ? [...new Set([...ids, id])] : ids.filter((x) => x !== id),
      ),
    );
    return;
  }
  const table = requireSupabase().from("saved_learning_resources");
  const { error } = await (save
    ? table.upsert(
        { user_id: user, resource_id: id },
        { onConflict: "user_id,resource_id" },
      )
    : table.delete().eq("user_id", user).eq("resource_id", id));
  if (error) throw error;
}

export async function saveLessonDraft(
  demo: boolean,
  user: string,
  module: string,
  draft: NonNullable<LessonState["draft"]>,
) {
  if (demo) {
    const raw = localStorage.getItem(key(user, module));
    if (!raw) return;
    const s = JSON.parse(raw);
    s.draft = draft;
    localStorage.setItem(key(user, module), JSON.stringify(s));
    return;
  }
  const { error } = await requireSupabase().rpc("save_lesson_draft", {
    p_module_id: module,
    p_draft: draft,
  });
  if (error) throw error;
}
