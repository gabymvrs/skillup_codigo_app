import { GuidedTheory } from "../src/components/GuidedTheory";
import { expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import curriculum from "../src/data/beginner-curriculum.json";
import { LogicExperiment } from "../src/components/LogicExperiment";
import {
  approvalResult,
  truthRows,
  compareNumbers,
  logicMissionReady,
} from "../src/lib/logicLearning";
import { guidedTheories, type LearningInputs } from "../src/lib/guidedLearning";
import { id, questions, modules, exerciseAnswers } from "../src/data/catalog";
import { demoPlans } from "../src/services/lessonJourney";
import { evaluateDemo } from "../src/services/learning";
import originalPlans from "../src/data/lesson-plans.json";
import enrichment from "../src/data/enrichment.json";
import trackActivities from "../src/data/track-activities.json";

const pendingLessons = [3040,3041,3042,4011,4012,3060,3061,3062,4015,4016,3070,3071,3072,4017,4018];

it("provides at least five exercises and four guided steps in all 86 lesson plans", () => {
  expect(demoPlans).toHaveLength(86);
  for (const plan of demoPlans) {
    expect(plan.question_ids.length, plan.module_id).toBeGreaterThanOrEqual(5);
    const guide = guidedTheories[plan.module_id];
    expect(guide?.steps.length ?? 0, plan.module_id).toBeGreaterThanOrEqual(4);
    for (const qid of plan.question_ids) {
      const question = questions.find((q) => q.id === qid)!;
      expect(question, qid).toBeDefined();
      if (question.activity_type === "code_practice") continue;
      const answer = exerciseAnswers[qid];
      const response = question.activity_type === "calculation"
        ? String((answer as { value: number; tolerance: number }).value)
        : question.kind === "challenge"
          ? { text: "Registro da atividade com observações, procedimento e resultado. ".repeat(8), checks: question.payload!.criteria!.map(() => true) }
          : answer;
      expect(evaluateDemo(question, response as never), `${qid}: ${question.prompt}`).toBe(true);
    }
  }
});

it("aligns logistics, biology and physics to their topics while retaining original questions and rewards", () => {
  const moved = new Map([[8018,3061], [8019,3062], [8022,3070]]);
  for (const n of pendingLessons) {
    const module = modules.find((m) => m.id === id(n))!;
    const original = [...enrichment.modules, ...trackActivities.modules].find((m) => m.id === id(n))!;
    expect(module.position).toBe(original.position);
    expect(module.prerequisite_id).toBe(original.prerequisite_id);
    expect(module.xp).toBe(original.xp);
    const plan = demoPlans.find((p) => p.module_id === id(n))!;
    expect(curriculum.guides[id(n) as keyof typeof curriculum.guides].steps).toHaveLength(5);
    expect(plan.dynamic.prompt).not.toMatch(/código|programa|software/iu);
    for (const qid of originalPlans.find((p) => p.module_id === id(n))!.question_ids) {
      const target = moved.get(Number(qid.slice(-4))) ?? n;
      expect(demoPlans.find((p) => p.module_id === id(target))!.question_ids).toContain(qid);
      const oldQuestion = [...enrichment.questions, ...trackActivities.questions].find((q) => q.id === qid)!;
      expect(questions.find((q) => q.id === qid)!.xp).toBe(oldQuestion.xp);
      expect(exerciseAnswers[qid]).toEqual(({ ...enrichment.answers, ...trackActivities.answers } as Record<string, unknown>)[qid]);
    }
    for (const qid of plan.question_ids)
      expect(questions.find((q) => q.id === qid)!.activity_type).not.toBe("code_practice");
  }
  const plan = (n: number) => demoPlans.find((p) => p.module_id === id(n))!;
  expect(plan(3060).question_ids).not.toContain(id(8018));
  expect(plan(3061).question_ids).not.toContain(id(8019));
  expect(plan(3071).question_ids).not.toContain(id(8022));
  const text = (n: number) => curriculum.guides[id(n) as keyof typeof curriculum.guides].steps.map((s) => s.text).join(" ");
  expect(text(3060)).toMatch(/membrana.*citoplasma.*núcleo/iu);
  expect(text(3060)).not.toMatch(/briófitas|angiospermas/iu);
  expect(text(4011)).toContain("120 + 80 − 135 − 15 − 20 = 30");
  expect(text(4015)).toMatch(/1.*membrana.*2.*núcleo.*3.*citoplasma/iu);
  expect(text(3071)).toMatch(/distância.*tempo/iu);
  expect(text(4017)).toContain("180 m / 90 s = 2 m/s");
  expect(modules.find((m) => m.id === id(4017))!.title).toBe("Calcular rapidez média");
});
it("tests limits and rejects empty, invalid and out-of-range inputs", () => {
  expect(approvalResult({ first: "7", second: "75" })).toEqual({
    grade: true,
    attendance: true,
    approved: true,
  });
  expect(approvalResult({ first: "8", second: "74" })?.approved).toBe(false);
  expect(approvalResult({ first: "6", second: "80" })?.approved).toBe(false);
  for (const v of [
    { first: "", second: "75" },
    { first: "11", second: "75" },
    { first: "7", second: "101" },
    { first: "NaN", second: "80" },
  ])
    expect(approvalResult(v)).toBeNull();
  expect(approvalResult({ first: "0", second: "0" })).toEqual({
    grade: false,
    attendance: false,
    approved: false,
  });
  expect(compareNumbers(7, 7, ">")).toBe(false);
  expect(compareNumbers(7, 7, ">=")).toBe(true);
});
it("checks all truth rows against both De Morgan laws", () => {
  expect(truthRows).toHaveLength(4);
  for (const r of truthRows) {
    expect(r.notAnd).toBe(r.notAOrNotB);
    expect(r.notOr).toBe(r.notAAndNotB);
  }
});
it("introduces prerequisites before composed negation and keeps E exercises within the taught content", () => {
  const guide = curriculum.guides[id(332) as keyof typeof curriculum.guides];
  const text = guide.steps.map((s) => s.text).join(" ");
  expect(text).toContain(">=");
  expect(text).toContain("&&");
  expect(text).not.toMatch(/\|\||De Morgan|!true/);
  const plan = demoPlans.find((p) => p.module_id === id(332))!;
  expect(plan.question_ids).toHaveLength(5);
  for (const qid of plan.question_ids) {
    const q = questions.find((q) => q.id === qid)!;
    expect(evaluateDemo(q, exerciseAnswers[qid] as number)).toBe(true);
    expect(q.prompt).not.toMatch(/\|\||De Morgan/);
  }
  const ordered = modules
    .filter((m) => m.track_id === id(200))
    .sort((a, b) => a.position - b.position);
  expect(ordered.map((m) => m.id)).toEqual(
    [
      300, 301, 302, 330, 331, 332, 333, 334, 335, 336, 337, 304, 305, 306, 338,
      303,
    ].map(id),
  );
  for (const [i, m] of ordered.entries())
    expect(m.prerequisite_id).toBe(i ? ordered[i - 1].id : null);
});
it("updates individual and combined results and invalidates a tested mission after an edit", async () => {
  function Harness() {
    const [value, onChange] = useState<LearningInputs>({
      first: "7",
      second: "75",
    });
    return (
      <>
        <LogicExperiment
          kind="approval"
          value={value}
          onChange={onChange}
          mission
        />
        <output>
          {logicMissionReady("approval", value) ? "Pronta" : "Pendente"}
        </output>
      </>
    );
  }
  const user = userEvent.setup();
  render(<Harness />);
  expect(screen.getByText("Pendente")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Testar simulação" }));
  expect(screen.getByText("Pronta")).toBeVisible();
  const field = screen.getByRole("textbox", { name: "Frequência (0 a 100%)" });
  await user.clear(field);
  await user.type(field, "74");
  expect(screen.getByText("Pendente")).toBeVisible();
  expect(screen.getByText(/a frequência está abaixo de 75%/)).toBeVisible();
});

it("teaches all declared prerequisites in the same track before requiring them", () => {
  const metadata = curriculum.pedagogy as Record<
    string,
    { concepts: string[]; requires: string[] }
  >;
  for (const track of new Set(
    curriculum.modules.map((m) => modules.find((x) => x.id === m.id)!.track_id),
  )) {
    const known = new Set<string>();
    for (const m of modules
      .filter((x) => x.track_id === track)
      .sort((a, b) => a.position - b.position)) {
      const entry = metadata[m.id];
      if (!entry) continue;
      for (const required of entry.requires)
        expect(known.has(required), `${m.title} requires ${required}`).toBe(
          true,
        );
      entry.concepts.forEach((concept) => known.add(concept));
    }
  }
});
it("starts Python with output and input before conditions and keeps five valid exercises per lesson", () => {
  const python = modules
    .filter((m) => m.track_id === id(2100))
    .sort((a, b) => a.position - b.position);
  expect(python.map((m) => m.id)).toEqual(
    [
      4100, 4101, 4102, 4103, 4106, 4107, 4108, 4000, 4001, 4104, 4105, 4002,
    ].map(id),
  );
  for (const m of python) {
    const plan = demoPlans.find((p) => p.module_id === m.id)!;
    expect(plan.question_ids).toHaveLength(5);
    for (const qid of plan.question_ids) {
      const q = questions.find((q) => q.id === qid)!;
      if (q.activity_type !== "code_practice")
        expect(evaluateDemo(q, exerciseAnswers[qid] as never)).toBe(true);
    }
  }
});

it("prepares HTML before semantic structure and CSS before responsive layout", () => {
  const web = modules
    .filter((m) => m.track_id === id(2000))
    .sort((a, b) => a.position - b.position);
  expect(web.map((m) => m.id)).toEqual(
    [4200, 4201, 4202, 4203, 3000, 4204, 4205, 3001, 3002, 4006].map(id),
  );
  for (const m of web) {
    const plan = demoPlans.find((p) => p.module_id === m.id)!;
    expect(plan.question_ids).toHaveLength(5);
    for (const qid of plan.question_ids) {
      const q = questions.find((q) => q.id === qid)!;
      if (q.kind !== "challenge" && q.activity_type !== "code_practice")
        expect(evaluateDemo(q, exerciseAnswers[qid] as never)).toBe(true);
    }
  }
});

it("isolates the HTML teaching preview without allowing scripts", () => {
  render(
    <GuidedTheory
      moduleId={id(4201)}
      step={3}
      onStep={() => {}}
      inputs={{ first: "6", second: "8" }}
      onInputs={() => {}}
      onComplete={() => {}}
      resourceIds={[]}
      disabled={false}
    />,
  );
  const preview = screen.getByTitle("Exemplo: Agora um parágrafo");
  expect(preview).toHaveAttribute("sandbox", "");
  expect(preview).toHaveAttribute(
    "srcdoc",
    expect.stringContaining("<h1>Meu curso</h1>"),
  );
});

it("introduces JavaScript input and conversion before debugging and the final code challenge", () => {
  const js = modules
    .filter((m) => m.track_id === id(2101))
    .sort((a, b) => a.position - b.position);
  expect(js.map((m) => m.id)).toEqual(
    [4300, 4301, 4003, 4004, 4305, 4302, 4303, 4304, 4005].map(id),
  );
  for (const [index, module] of js.entries()) {
    expect(module.prerequisite_id).toBe(index ? js[index - 1].id : null);
    const plan = demoPlans.find((p) => p.module_id === module.id)!;
    expect(plan.question_ids).toHaveLength(5);
    for (const qid of plan.question_ids) {
      const question = questions.find((q) => q.id === qid)!;
      if (question.activity_type !== "code_practice")
        expect(evaluateDemo(question, exerciseAnswers[qid] as never)).toBe(true);
    }
    expect(curriculum.guides[module.id as keyof typeof curriculum.guides].steps.length).toBeGreaterThanOrEqual(5);
  }
  const final = demoPlans.find((p) => p.module_id === id(4005))!;
  expect(final.question_ids.at(-1)).toBe(id(12005));
  expect(curriculum.guides[id(4003) as keyof typeof curriculum.guides].steps.map((s) => s.text).join(" ")).toContain("não é uma função padrão");
});

it("keeps the non-code disciplines' original questions after four contextual checks", () => {
  const originals = [
    3010, 3011, 3012, 4007, 4008, 3050, 3051, 3052, 4013, 4014,
    3080, 3081, 3082,
  ];
  for (const number of originals) {
    const module = modules.find((m) => m.id === id(number))!;
    const plan = demoPlans.find((p) => p.module_id === module.id)!;
    expect(plan.question_ids, module.title).toHaveLength(5);
    expect(curriculum.guides[module.id as keyof typeof curriculum.guides].steps).toHaveLength(5);
    for (const qid of plan.question_ids) {
      const question = questions.find((q) => q.id === qid)!;
      expect(question.activity_type).not.toBe("code_practice");
      if (question.kind !== "challenge")
        expect(evaluateDemo(question, exerciseAnswers[qid] as never)).toBe(true);
    }
  }
  expect(questions.find((q) => q.id === id(8017))?.explanation).toContain("parágrafo");
});

it("teaches networks and low-voltage electronics before their applied cases", () => {
  for (const [track, order] of [
    [2002, [3020, 3021, 3022, 4009, 4010]],
    [2003, [3030, 3031, 3032]],
    [201, [320, 321, 322]],
  ] as const) {
    const ordered = modules.filter((m) => m.track_id === id(track)).sort((a,b) => a.position-b.position);
    expect(ordered.map((m) => m.id)).toEqual(order.map(id));
    for (const [index, m] of ordered.entries()) {
      expect(m.prerequisite_id).toBe(index ? ordered[index - 1].id : null);
      const plan = demoPlans.find((p) => p.module_id === m.id)!;
      expect(plan.question_ids.length).toBeGreaterThanOrEqual(5);
      expect(curriculum.guides[m.id as keyof typeof curriculum.guides].steps).toHaveLength(5);
      for (const qid of plan.question_ids) {
        const q = questions.find((item) => item.id === qid)!;
        if (q.kind !== "challenge" && q.activity_type !== "code_practice")
          expect(evaluateDemo(q, exerciseAnswers[qid] as never)).toBe(true);
      }
    }
  }
  const electronics = [3030, 3031, 3032].map((n) => curriculum.guides[id(n) as keyof typeof curriculum.guides].steps.map((s) => s.text).join(" ")).join(" ");
  expect(electronics).toContain("0,02 A");
  expect(electronics).toContain("Não use a rede elétrica");
});
