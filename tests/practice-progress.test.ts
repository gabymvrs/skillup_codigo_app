import { expect, it } from "vitest";
import { createDemo } from "../src/data/demo";
import { id } from "../src/data/catalog";
import {
  practiceMetrics,
  recordPracticeCompletion,
  loadPracticeCompletions,
} from "../src/services/practiceProgress";
import { writeDemo, DEMO_KEY } from "../src/services/repository";
it("counts evaluated attempts, excludes open work and other users, and distinguishes zero from missing dates", () => {
  const d = createDemo();
  d.attempts = [
    {
      id: "a",
      user_id: id(1),
      question_id: id(13000),
      selected_index: 1,
      correct: true,
      xp: 0,
      created_at: "2026-11-01T15:00:00Z",
    },
    {
      id: "b",
      user_id: id(1),
      question_id: id(13000),
      selected_index: 0,
      correct: false,
      xp: 0,
      created_at: "2026-11-01T15:01:00Z",
    },
    {
      id: "c",
      user_id: id(5),
      question_id: id(13000),
      selected_index: 1,
      correct: true,
      xp: 0,
      created_at: "2026-11-01T15:00:00Z",
    },
  ];
  d.attempts.push({ ...d.attempts[0], id: "open", question_id: id(6005) });
  d.attempts.push({ ...d.attempts[0] });
  d.learning_settings = [{ id: id(1), timezone: "America/Recife" }];
  const s = practiceMetrics(
    d,
    id(1),
    [
      { set_id: "x", completed_at: "" },
      { set_id: "x", completed_at: "" },
    ],
    7,
    new Date("2026-11-01T20:00Z"),
  );
  expect(s).toMatchObject({
    total: 2,
    correct: 1,
    wrong: 1,
    rate: 50,
    completed: 1,
    uniqueQuestions: 1,
  });
  expect(s.points.at(-1)?.rate).toBe(50);
  expect(s.points[0].rate).toBeNull();
  d.attempts = [];
  expect(practiceMetrics(d, id(1)).rate).toBeNull();
});
it("never infers block completion from a partial attempt and isolates stored completions", async () => {
  const d = createDemo();
  d.attempts = [];
  writeDemo(d);
  await expect(
    recordPracticeCompletion(true, id(1), "logica", [id(400)]),
  ).rejects.toThrow();
  expect(await loadPracticeCompletions(true, id(5))).toEqual([]);
});
it("persists only one completion for a repeatedly finalized block and never grants XP", async () => {
  const d = createDemo();
  const ids = [
    "00000000-0000-4000-8000-000000000400",
    ...Array.from({ length: 4 }, (_, i) => id(10000 + i)),
  ];
  d.attempts = ids.map((q, i) => ({
    id: "complete-" + i,
    user_id: id(1),
    question_id: q,
    selected_index: 0,
    correct: false,
    xp: 0,
    created_at: new Date().toISOString(),
  }));
  writeDemo(d);

  await recordPracticeCompletion(true, id(1), "logica", ids);
  await recordPracticeCompletion(true, id(1), "logica", ids);
  expect(await loadPracticeCompletions(true, id(1))).toHaveLength(1);
  expect(await loadPracticeCompletions(true, id(5))).toHaveLength(0);
  expect(JSON.parse(localStorage.getItem(DEMO_KEY)!).reward_events).toEqual(
    d.reward_events,
  );
});
