import guides from "../data/guided-theories.json";
import curriculum from "../data/beginner-curriculum.json";
export interface TheoryStep {
  title: string;
  text: string;
  code?: string;
  annotations?: string[];
  experiment?: string;
  variables?: { name: string; value: string; type: string }[];
  trace?: string[];
  preview?: string;
}
export interface GuidedTheory {
  objective: string;
  prerequisites: string;
  competency: string;
  next: string;
  steps: TheoryStep[];
}
export const guidedTheories = { ...guides, ...curriculum.guides } as Record<
  string,
  GuidedTheory
>;
export const algorithmOrder = ["read", "sum", "mean", "show"];
export interface LearningInputs {
  first: string;
  second: string;
  order?: string[];
  ran?: boolean;
  third?: string;
  operator?: string;
}
export function parseGrade(raw: string) {
  const normalized = raw.trim().replace(",", ".");
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) && value >= 0 && value <= 10 ? value : null;
}
export function traceAverage(inputs: LearningInputs, order = algorithmOrder) {
  const a = parseGrade(inputs.first),
    b = parseGrade(inputs.second);
  if (a === null || b === null)
    return {
      error:
        "Informe duas notas de 0 a 10. Um campo vazio não é uma nota zero.",
      rows: [] as string[],
      mean: undefined as number | undefined,
    };
  const rows: string[] = [];
  let read = false,
    sum: number | undefined,
    mean: number | undefined;
  for (const step of order) {
    if (step === "read") {
      read = true;
      rows.push(`Entrada: ${a} e ${b}. As duas notas são válidas.`);
    } else if (step === "sum") {
      if (!read)
        return {
          error: "Ainda não há entradas para somar. Leia as notas antes.",
          rows,
          mean: undefined,
        };
      sum = a + b;
      rows.push(`Soma: ${a} + ${b} = ${sum}.`);
    } else if (step === "mean") {
      if (sum === undefined)
        return {
          error: "Ainda não há soma para dividir. Calcule a soma antes.",
          rows,
          mean: undefined,
        };
      mean = sum / 2;
      rows.push(`Processamento: ${sum} / 2 = ${mean}.`);
    } else if (step === "show") {
      if (mean === undefined)
        return {
          error:
            "A média ainda não foi calculada. Mostrar precisa vir depois da divisão.",
          rows,
          mean: undefined,
        };
      rows.push(`Saída: média ${mean}.`);
    } else return { error: "Instrução desconhecida.", rows, mean: undefined };
  }
  return { error: "", rows, mean };
}
export function missionReady(value?: LearningInputs) {
  return (
    !!value?.ran &&
    JSON.stringify(value.order) === JSON.stringify(algorithmOrder) &&
    parseGrade(value.first) !== null &&
    parseGrade(value.second) !== null
  );
}
