import type { LearningInputs } from "./guidedLearning";
export const logicKinds = [
  "condition",
  "comparison",
  "approval",
  "or",
  "not",
  "grouping",
  "truth-table",
  "de-morgan",
] as const;
export type LogicKind = (typeof logicKinds)[number];
export function isLogicKind(kind: string): kind is LogicKind {
  return (logicKinds as readonly string[]).includes(kind);
}
export function numericInput(raw: string, max: number) {
  const value = raw.trim().replace(",", ".");
  if (value.length > 10 || !/^\d+(\.\d+)?$/.test(value)) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= max ? n : null;
}
export function approvalResult(value: LearningInputs) {
  const grade = numericInput(value.first, 10),
    attendance = numericInput(value.second, 100);
  return grade === null || attendance === null
    ? null
    : {
        grade: grade >= 7,
        attendance: attendance >= 75,
        approved: grade >= 7 && attendance >= 75,
      };
}
export function compareNumbers(a: number, b: number, op: string) {
  switch (op) {
    case "==":
      return a === b;
    case "!=":
      return a !== b;
    case ">":
      return a > b;
    case "<":
      return a < b;
    case ">=":
      return a >= b;
    case "<=":
      return a <= b;
    default:
      throw new Error("Comparação desconhecida.");
  }
}
export const truthRows = [false, true].flatMap((a) =>
  [false, true].map((b) => ({
    a,
    b,
    and: a && b,
    or: a || b,
    notAnd: !(a && b),
    notAOrNotB: !a || !b,
    notOr: !(a || b),
    notAAndNotB: !a && !b,
  })),
);
export function logicMissionReady(kind: string, value?: LearningInputs) {
  if (!value?.ran) return false;
  if (kind === "approval") return approvalResult(value) !== null;
  if (kind === "comparison")
    return (
      numericInput(value.first, 100) !== null &&
      numericInput(value.second, 100) !== null
    );
  return (
    ["true", "false"].includes(value.first) &&
    ["true", "false"].includes(value.second) &&
    (kind !== "grouping" || ["true", "false"].includes(value.third || ""))
  );
}
