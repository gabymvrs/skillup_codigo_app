import type { ActivityType, ExerciseKind, Question } from "../lib/types";
export const activityByKind: Record<ExerciseKind, ActivityType> = {
  choice: "multiple_choice",
  true_false: "true_false",
  blank: "fill_blank",
  matching: "matching",
  ordering: "ordering",
  challenge: "case_study",
};
export const activityType = (q: Question): ActivityType =>
  q.activity_type || activityByKind[q.kind || "choice"];
export const activityLabels: Record<ActivityType, string> = {
  multiple_choice: "Múltipla escolha",
  true_false: "Verdadeiro ou falso",
  fill_blank: "Completar",
  matching: "Relacionar conceitos",
  ordering: "Ordenar etapas",
  image_identification: "Interpretar imagem",
  calculation: "Cálculo",
  case_study: "Estudo de caso",
  code_practice: "Prática de código",
};
export function numericAnswer(value: string) {
  const normalized = value.trim().replace(",", ".");
  return /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(normalized)
    ? Number(normalized)
    : NaN;
}
export function activityKind(q: Question): ExerciseKind {
  const type = activityType(q);
  if (type === "case_study")
    return q.kind === "challenge" || q.payload?.criteria
      ? "challenge"
      : "choice";
  return (
    {
      multiple_choice: "choice",
      true_false: "true_false",
      fill_blank: "blank",
      matching: "matching",
      ordering: "ordering",
      image_identification: "choice",
      calculation: "blank",
      code_practice: "blank",
    } as const
  )[type];
}
