import foundationLessons from "../src/data/foundation-lessons.json";
import { evaluateDemo, hydrateDemoLearning } from "../src/services/learning";
import { DEMO_KEY } from "../src/services/repository";
import { beforeEach, expect, it } from "vitest";
import {
  lessonAction,
  savedResourceIds,
  saveResource,
  demoPlans,
} from "../src/services/lessonJourney";
import { readDemo, writeDemo } from "../src/services/repository";
import { createDemo } from "../src/data/demo";
import { id, modules, questions, exerciseAnswers } from "../src/data/catalog";
import { safeResourceUrl } from "../src/components/LearningResources";
beforeEach(() => {
  localStorage.clear();
  const d = createDemo();
  d.progress = [4100, 4101, 4102, 4103, 4106, 4107, 4108, 4104, 4105].map(
    (n) => ({
      id: "prereq-" + n,
      user_id: id(1),
      module_id: id(n),
      completed_at: new Date().toISOString(),
    }),
  );
  d.reward_events = [];
  d.attempts = [];
  d.study_days = [];
  writeDemo(d);
});
it("reopens incomplete practice after a saved demo lesson gains questions", async () => {
  const module = id(4000), user = id(1), qid = id(12000);
  const results = { [qid]: { correct: true, firstCorrect: false, tries: 2 } };
  localStorage.setItem(`skillup.lesson.demo.${user}.${module}`, JSON.stringify({
    module_id: module, stage: "dynamic", theory_completed: true, results, xp: 0,
  }));
  const resumed = await lessonAction(true, user, module, "get");
  expect(resumed.session.stage).toBe("practice");
  expect(resumed.session.theory_completed).toBe(true);
  expect(resumed.session.results).toEqual(results);
  const added = resumed.plan.question_ids.find((q) => q !== qid)!;
  await expect(lessonAction(true, user, module, "answer", {
    question_id: added, response: exerciseAnswers[added],
  })).resolves.toMatchObject({ session: { stage: "practice" } });
  expect(readDemo().reward_events.some((r) => r.source === `module:${module}`)).toBe(false);
  for (const question_id of resumed.plan.question_ids.filter((q) => q !== qid && q !== added))
    await lessonAction(true, user, module, "answer", { question_id, response: exerciseAnswers[question_id] });
  await lessonAction(true, user, module, "practice");
  await lessonAction(true, user, module, "finish", { text: "Um caso concreto de decisão compara a nota ao limite informado e mostra o caminho escolhido. Verifiquei o resultado com notas abaixo e acima do limite.", checks: [true, true] });
  await lessonAction(true, user, module, "finish");
  expect(readDemo().reward_events.filter((r) => r.source === `module:${module}`)).toHaveLength(1);
});
it("keeps a completed legacy lesson completed when new questions are added", async () => {
  localStorage.setItem(`skillup.lesson.demo.${id(1)}.${id(4000)}`, JSON.stringify({
    module_id: id(4000), stage: "completed", results: {}, xp: 100,
  }));
  const { session } = await lessonAction(true, id(1), id(4000), "get");
  expect(session.stage).toBe("completed");
  expect(session.xp).toBe(100);
});
it("retains wrong first answers, resumes the stage and awards only after the dynamic", async () => {
  const mid = id(4000),
    qid = id(12000),
    user = id(1),
    call = (action: string, payload?: unknown) =>
      lessonAction(true, user, mid, action, payload);
  await expect(
    call("finish", { text: "x".repeat(140), checks: [true, true] }),
  ).rejects.toThrow();
  await call("theory");
  await call("answer", { question_id: qid, response: 1 });
  const correct = await call("answer", { question_id: qid, response: 0 });
  expect(correct.session.results[qid]).toMatchObject({
    firstCorrect: false,
    correct: true,
    tries: 2,
  });
  expect(
    readDemo().reward_events.filter((r) => r.source === `module:${mid}`),
  ).toHaveLength(0);
  for (const other of demoPlans
    .find((p) => p.module_id === mid)!
    .question_ids.filter((q) => q !== qid))
    await call("answer", {
      question_id: other,
      response: exerciseAnswers[other],
    });
  await call("practice");
  expect((await call("get")).session.stage).toBe("dynamic");
  await expect(
    call("finish", { text: "short", checks: [true, true] }),
  ).rejects.toThrow();
  await call("finish", {
    text: "Exemplo explicado com uma condição, os valores de entrada e três casos de teste para verificar o comportamento nos limites da regra.",
    checks: [true, true],
  });
  expect(
    readDemo().progress.some((p) => p.user_id === user && p.module_id === mid),
  ).toBe(true);
  await call("finish");
  expect(
    readDemo().reward_events.filter((r) => r.source === `module:${mid}`),
  ).toHaveLength(1);
});
it("all plans reference real linked exercises with increasing requirements", () => {
  for (const p of demoPlans) {
    expect(modules.find((m) => m.id === p.module_id)?.question_id).toBe(
      p.question_ids[0],
    );
    expect(questions.some((q) => q.id === p.question_ids[0])).toBe(true);
    expect(p.dynamic.minLength).toBeGreaterThanOrEqual(100);
  }
});
it("saves references per demo account and rejects unsafe external links", async () => {
  await saveResource(true, id(1), "python-control", true);
  expect(await savedResourceIds(true, id(5))).toEqual([]);
  expect(await savedResourceIds(true, id(1))).toEqual(["python-control"]);
  await saveResource(true, id(1), "python-control", false);
  expect(await savedResourceIds(true, id(1))).toEqual([]);
  expect(safeResourceUrl("javascript:alert(1)")).toBeNull();
  expect(safeResourceUrl("https://user:secret@example.org")).toBeNull();
});

it("every current module has exactly one complete plan, and each legacy upgrade has five valid graded questions", () => {
  expect(demoPlans).toHaveLength(modules.length);
  expect(new Set(demoPlans.map((p) => p.module_id)).size).toBe(modules.length);
  for (const m of modules)
    expect(demoPlans.some((p) => p.module_id === m.id)).toBe(true);
  for (const m of foundationLessons.modules) {
    const plan = demoPlans.find((p) => p.module_id === m.id)!;
    expect(plan.question_ids).toHaveLength(5);
    for (const qid of plan.question_ids) {
      const q = questions.find((q) => q.id === qid)!;
      expect(evaluateDemo(q, exerciseAnswers[qid] as any)).toBe(true);
    }
  }
});
it("upgrades a saved legacy demo without changing old completions or duplicating XP", () => {
  const d = hydrateDemoLearning(createDemo());
  const m = d.modules.find((m) => m.id === id(300))!;
  m.question_id = null;
  m.body = "Conteúdo antigo";
  const progress = structuredClone(d.progress),
    rewards = structuredClone(d.reward_events);
  localStorage.setItem(DEMO_KEY, JSON.stringify(d));
  const upgraded = readDemo();
  expect(upgraded.modules.find((m) => m.id === id(300))?.question_id).toBe(
    id(13000),
  );
  expect(upgraded.progress).toEqual(progress);
  expect(upgraded.reward_events).toEqual(rewards);
});
it("requires all five answers in a legacy lesson before the dynamic and preserves existing completion", async () => {
  const mid = id(300),
    user = id(1),
    plan = demoPlans.find((p) => p.module_id === mid)!;
  const call = (action: string, payload?: unknown) =>
    lessonAction(true, user, mid, action, payload);
  await call("theory");
  for (const [i, qid] of plan.question_ids.entries()) {
    if (i > 0) await expect(call("practice")).rejects.toThrow();
    await call("answer", {
      question_id: qid,
      response: exerciseAnswers[qid] as any,
    });
  }
  await call("practice");
  expect((await call("get")).session.stage).toBe("dynamic");
});
