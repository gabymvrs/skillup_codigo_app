import type { Dataset, Attempt } from "../lib/types";
import { localDay, localTimezone } from "./learning";
import { practiceSets } from "../data/catalog";
import { readDemo } from "./repository";
import { requireSupabase } from "./supabase";
export interface PracticeCompletion {
  set_id: string;
  completed_at: string;
}
const key = (user: string) => `skillup.practice.completions.demo.${user}`;
export function practiceMetrics(
  data: Dataset,
  user: string,
  completions: PracticeCompletion[] = [],
  days = 7,
  now = new Date(),
) {
  const questions = new Map(data.questions.map((q) => [q.id, q]));
  const unique = new Map<string, Attempt>();
  for (const a of data.attempts)
    if (
      a.user_id === user &&
      questions.has(a.question_id) &&
      questions.get(a.question_id)?.kind !== "challenge" &&
      Number.isFinite(Date.parse(a.created_at))
    )
      unique.set(a.id, a);
  const attempts = [...unique.values()],
    correct = attempts.filter((a) => a.correct).length,
    total = attempts.length;
  const zone =
      data.learning_settings.find((s) => s.id === user)?.timezone ||
      localTimezone(),
    today = localDay(now, zone);
  const points = Array.from({ length: days }, (_, i) => {
    const date = new Date(today + "T12:00:00Z");
    date.setUTCDate(date.getUTCDate() - days + 1 + i);
    const day = date.toISOString().slice(0, 10);
    const rows = attempts.filter(
        (a) => localDay(new Date(a.created_at), zone) === day,
      ),
      right = rows.filter((a) => a.correct).length;
    return {
      day,
      total: rows.length,
      correct: right,
      wrong: rows.length - right,
      rate: rows.length ? Math.round((right / rows.length) * 100) : null,
    };
  });
  return {
    total,
    correct,
    wrong: total - correct,
    rate: total ? Math.round((correct / total) * 100) : null,
    completed: new Set(completions.map((c) => c.set_id)).size,
    uniqueQuestions: new Set(attempts.map((a) => a.question_id)).size,
    points,
  };
}
export async function loadPracticeCompletions(
  demo: boolean,
  user: string,
): Promise<PracticeCompletion[]> {
  if (demo) {
    try {
      return JSON.parse(localStorage.getItem(key(user)) || "[]");
    } catch {
      return [];
    }
  }
  const { data, error } = await requireSupabase()
    .from("practice_completions")
    .select("set_id,completed_at")
    .eq("user_id", user);
  if (error) throw error;
  return data;
}
export async function recordPracticeCompletion(
  demo: boolean,
  user: string,
  setId: string,
  questionIds: string[],
) {
  if (demo) {
    const d = readDemo();
    const expected =
      practiceSets.find((s) => s.id === setId)?.questionIds ||
      d.questions
        .filter(
          (q) => q.subject_id === setId && q.category === "Prática guiada",
        )
        .map((q) => q.id);
    if (
      expected.length < 5 ||
      expected.length !== questionIds.length ||
      !expected.every(
        (id) =>
          questionIds.includes(id) &&
          d.attempts.some((a) => a.user_id === user && a.question_id === id),
      )
    )
      throw new Error(
        "Responda todas as questões do bloco antes de registrar a conclusão.",
      );
    const rows = await loadPracticeCompletions(true, user);
    if (!rows.some((r) => r.set_id === setId))
      localStorage.setItem(
        key(user),
        JSON.stringify([
          ...rows,
          { set_id: setId, completed_at: new Date().toISOString() },
        ]),
      );
  } else {
    const { error } = await requireSupabase().rpc("complete_practice_set", {
      p_set_id: setId,
      p_question_ids: questionIds,
    });
    if (error) throw error;
  }
  window.dispatchEvent(new Event("skillup:practice-completed"));
}
