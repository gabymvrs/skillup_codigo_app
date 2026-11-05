import { activityType, activityKind, numericAnswer } from "./activities";
import type { Dataset, ExerciseAnswer, Question } from "../lib/types";
import { demoAnswers, exerciseAnswers } from "../data/catalog";
import { uid } from "../lib/utils";
export const localTimezone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo";
export function localDay(date: Date, zone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return ["year", "month", "day"]
    .map((k) => parts.find((p) => p.type === k)!.value)
    .join("-");
}
export function previousDay(day: string) {
  const d = new Date(day + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
export function streakStats(days: string[], today: string) {
  const unique = [...new Set(days)].filter((d) => d <= today).sort();
  let current = 0,
    best = 0,
    previous = "";
  for (const day of unique) {
    current = previous === previousDay(day) ? current + 1 : 1;
    best = Math.max(best, current);
    previous = day;
  }
  if (previous !== today && previous !== previousDay(today)) current = 0;
  return { current, best };
}
export function learningStats(data: Dataset, user: string, now = new Date()) {
  const zone =
    data.learning_settings.find((s) => s.id === user)?.timezone ||
    localTimezone();
  const rewards = data.reward_events.filter((r) => r.user_id === user);
  const xp = rewards.reduce((sum, r) => sum + r.xp, 0);
  return {
    xp,
    level: Math.floor(xp / 1000) + 1,
    next: 1000 - (xp % 1000),
    rewards,
    zone,
    ...streakStats(
      data.study_days.filter((d) => d.user_id === user).map((d) => d.day),
      localDay(now, zone),
    ),
  };
}
export function awardDemo(
  data: Dataset,
  user: string,
  source: string,
  xp: number,
  label: string,
  now = new Date(),
  eligible = true,
) {
  if (data.reward_events.some((r) => r.user_id === user && r.source === source))
    return 0;
  data.reward_events.push({
    id: uid(),
    user_id: user,
    source,
    xp,
    label,
    created_at: now.toISOString(),
  });
  if (!eligible) return xp;
  let settings = data.learning_settings.find((s) => s.id === user);
  if (!settings) {
    settings = { id: user, timezone: localTimezone() };
    data.learning_settings.push(settings);
  }
  const day = localDay(now, settings.timezone);
  if (!data.study_days.some((d) => d.user_id === user && d.day === day))
    data.study_days.push({ id: uid(), user_id: user, day });
  const { current } = learningStats(data, user, now);
  const bonus =
    ({ 1: 10, 3: 30, 7: 75, 14: 150, 30: 350 } as Record<number, number>)[
      current
    ] || 0;
  let start = day;
  for (let i = 1; i < current; i++) start = previousDay(start);
  if (bonus)
    awardDemo(
      data,
      user,
      `streak:${start}:${current}`,
      bonus,
      `Ofensiva de ${current} dia(s)`,
      now,
      false,
    );
  return xp;
}
export function evaluateDemo(q: Question, response: ExerciseAnswer) {
  if (activityType(q) === "code_practice")
    throw new Error("Valide o código no ambiente de execução.");
  if (activityType(q) === "calculation") {
    const expected = exerciseAnswers[q.id] as {
      value: number;
      tolerance: number;
    };
    const value = typeof response === "string" ? numericAnswer(response) : NaN;
    return (
      !!expected &&
      Number.isFinite(value) &&
      Math.abs(value - expected.value) <= expected.tolerance + Number.EPSILON
    );
  }
  q = { ...q, kind: activityKind(q) };
  if ((q.kind || "choice") === "choice")
    return (
      typeof response === "number" &&
      Number.isInteger(response) &&
      response >= 0 &&
      response < q.options.length &&
      response ===
        (demoAnswers[q.id] ??
          (exerciseAnswers as Record<string, unknown>)[q.id])
    );
  if (q.kind === "challenge")
    return (
      typeof response === "object" &&
      !Array.isArray(response) &&
      response.text.trim().length >= (q.payload?.minLength || 120) &&
      response.text.length <= 8000 &&
      response.checks.length === q.payload?.criteria?.length &&
      response.checks.every((x) => x === true)
    );
  const expected = (exerciseAnswers as Record<string, unknown>)[q.id];
  if (q.kind === "blank")
    return (
      typeof response === "string" &&
      response.trim().toLowerCase() === String(expected).trim().toLowerCase()
    );
  return JSON.stringify(response) === JSON.stringify(expected);
}
export function hydrateDemoLearning(d: Dataset) {
  d.reward_events ??= [];
  d.study_days ??= [];
  d.learning_settings ??= [];
  d.track_enrollments ??= [];
  d.material_reads ??= [];
  // Preserve legacy progress and XP without creating fictitious activity today.
  for (const p of d.progress) {
    const m = d.modules.find((m) => m.id === p.module_id);
    if (m) {
      awardDemo(
        d,
        p.user_id,
        `module:${m.id}`,
        m.xp,
        `Módulo: ${m.title}`,
        new Date(p.completed_at),
        false,
      );
      if (
        !d.track_enrollments.some(
          (e) => e.user_id === p.user_id && e.track_id === m.track_id,
        )
      )
        d.track_enrollments.push({
          id: uid(),
          user_id: p.user_id,
          track_id: m.track_id,
          created_at: p.completed_at,
        });
    }
  }
  for (const a of d.attempts.filter((a) => a.xp > 0))
    awardDemo(
      d,
      a.user_id,
      `question:${a.question_id}`,
      a.xp,
      "Exercício concluído",
      new Date(a.created_at),
      false,
    );
  return d;
}
export interface RankingRow {
  user_id: string;
  full_name: string;
  avatar_path?: string | null;
  avatar_demo?: string | null;
  xp: number;
  previous_xp: number;
  position: number;
}
export function demoRanking(d: Dataset, now = new Date()): RankingRow[] {
  // Same Monday boundary as SQL, Brazil time; offsets are explicit, not the browser locale.
  const today = localDay(now, "America/Sao_Paulo");
  const day = new Date(today + "T12:00:00Z").getUTCDay();
  const start = new Date(today + "T00:00:00-03:00");
  start.setUTCDate(start.getUTCDate() - ((day + 6) % 7));
  const previous = start.getTime() - 7 * 86400000;
  const rows = d.profiles
    .filter(
      (p) =>
        p.public_profile &&
        d.user_roles.find((r) => r.user_id === p.id)?.role === "estudante",
    )
    .map((p) => ({
      user_id: p.id,
      full_name: p.full_name,
      avatar_path: p.avatar_path,
      avatar_demo: p.avatar_demo,
      xp: d.reward_events
        .filter((r) => r.user_id === p.id && new Date(r.created_at) >= start)
        .reduce((s, r) => s + r.xp, 0),
      previous_xp: d.reward_events
        .filter(
          (r) =>
            r.user_id === p.id &&
            +new Date(r.created_at) >= previous &&
            new Date(r.created_at) < start,
        )
        .reduce((s, r) => s + r.xp, 0),
      position: 0,
    }))
    .filter((r) => r.xp > 0)
    .sort((a, b) => b.xp - a.xp || a.user_id.localeCompare(b.user_id));
  return rows.map((r, i) => ({
    ...r,
    position: rows.findIndex((x) => x.xp === r.xp) + 1,
  }));
}
