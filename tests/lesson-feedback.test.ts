import { expect, it } from "vitest";
import {
  performanceLabel,
  formatLessonAnswer,
} from "../src/components/LessonFeedback";
import { lessonAction, saveLessonDraft } from "../src/services/lessonJourney";
import { id, questions } from "../src/data/catalog";
it("uses the specified performance bands including boundaries", () => {
  expect([100, 90, 89, 70, 69, 50, 49, 0].map(performanceLabel)).toEqual([
    "Excelente desempenho",
    "Excelente desempenho",
    "Muito bom",
    "Muito bom",
    "Bom começo, com pontos a melhorar",
    "Bom começo, com pontos a melhorar",
    "Revisão recomendada",
    "Revisão recomendada",
  ]);
});
it("shows the chosen option and never invents a missing historical answer", () => {
  const q = questions.find((q) => q.id === id(12000));
  expect(formatLessonAnswer(q, 0)).toBe(q?.options[0]);
  expect(formatLessonAnswer(q, undefined)).toMatch(/Não disponível/);
});
it("persists the exact question and unfinished work separately from completion", async () => {
  await lessonAction(true, id(1), id(4000), "get");
  await saveLessonDraft(true, id(1), id(4000), {
    index: 0,
    answers: { [id(12000)]: 1 },
    text: "Rascunho em andamento",
    checks: [false],
    savedAt: 100,
  });
  const next = await lessonAction(true, id(1), id(4000), "get");
  expect(next.session.stage).toBe("theory");
  expect(next.session.draft?.text).toBe("Rascunho em andamento");
  expect(next.session.draft?.answers?.[id(12000)]).toBe(1);
});
