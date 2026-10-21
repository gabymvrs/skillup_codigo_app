import { describe, it, expect } from "vitest";
import { emptyDataset } from "../src/lib/types";
import {
  awardDemo,
  learningStats,
  streakStats,
  localDay,
  evaluateDemo,
  hydrateDemoLearning,
  demoRanking,
} from "../src/services/learning";
import {
  id,
  questions,
  tracks,
  modules,
  materials,
  subjects,
} from "../src/data/catalog";
import { createDemo } from "../src/data/demo";
import { validateAvatar } from "../src/services/avatars";
const at = (day: number, hour = 12) => new Date(Date.UTC(2026, 9, day, hour));
describe("Recorded XP and streaks", () => {
  it("never awards merely opening, repeats, or extra days for activities in the same local day", () => {
    const d = emptyDataset();
    d.learning_settings = [{ id: id(1), timezone: "America/Sao_Paulo" }];
    expect(learningStats(d, id(1), at(1)).xp).toBe(0);
    awardDemo(d, id(1), "q:1", 40, "Atividade", at(1));
    awardDemo(d, id(1), "q:1", 40, "Atividade", at(2));
    awardDemo(d, id(1), "q:2", 40, "Outra", at(1, 18));
    expect(d.reward_events.reduce((s, r) => s + r.xp, 0)).toBe(90);
    expect(d.study_days).toHaveLength(1);
  });
  it("awards each milestone once per sequence; breaks only after a full missed day", () => {
    const d = emptyDataset();
    d.learning_settings = [{ id: id(1), timezone: "America/Sao_Paulo" }];
    for (let day = 1; day <= 30; day++)
      awardDemo(d, id(1), `q:${day}`, 40, "Atividade", at(day));
    expect(learningStats(d, id(1), at(30))).toMatchObject({
      current: 30,
      best: 30,
      xp: 1815,
      level: 2,
    });
    expect(
      d.reward_events.filter((r) => r.source.startsWith("streak:")),
    ).toHaveLength(5);
    expect(learningStats(d, id(1), at(31)).current).toBe(30);
    expect(learningStats(d, id(1), at(32)).current).toBe(0);
    awardDemo(d, id(1), "restart", 40, "Nova sequência", at(32));
    expect(learningStats(d, id(1), at(32))).toMatchObject({
      current: 1,
      best: 30,
      xp: 1865,
    });
  });
  it("uses IANA local dates across UTC midnight and daylight saving", () => {
    expect(localDay(new Date("2026-10-21T01:00Z"), "America/Sao_Paulo")).toBe(
      "2026-10-20",
    );
    expect(localDay(new Date("2026-10-21T01:00Z"), "Pacific/Kiritimati")).toBe(
      "2026-10-21",
    );
    expect(
      streakStats(["2026-03-07", "2026-03-08", "2026-03-09"], "2026-03-09"),
    ).toEqual({ current: 3, best: 3 });
  });
  it("preserves old points without inventing current study days and uses only this week for ranking", () => {
    const d = hydrateDemoLearning(createDemo());
    expect(learningStats(d, id(1)).xp).toBe(200);
    expect(d.study_days).toHaveLength(0);
    d.reward_events = [];
    awardDemo(
      d,
      id(1),
      "old",
      200,
      "Antes",
      new Date("2026-10-18T20:00Z"),
      false,
    );
    awardDemo(
      d,
      id(1),
      "new",
      40,
      "Agora",
      new Date("2026-10-19T12:00Z"),
      false,
    );
    const row = demoRanking(d, new Date("2026-10-21T12:00Z")).find(
      (r) => r.user_id === id(1),
    );
    expect(row).toMatchObject({ xp: 40, previous_xp: 200, position: 1 });
  });
});
describe("Curriculum", () => {
  it("has six formats in each of eight disciplines, distinct track questions and retained content", () => {
    expect(subjects).toHaveLength(8);
    for (const s of subjects) {
      expect(
        new Set(
          questions
            .filter(
              (q) => q.subject_id === s.id && q.category === "Prática guiada",
            )
            .map((q) => q.kind),
        ).size,
      ).toBe(6);
      expect(materials.some((m) => m.subject_id === s.id)).toBe(true);
    }
    expect(tracks.length).toBe(11);
    expect(new Set(modules.map((m) => m.id)).size).toBe(modules.length);
    const linked = modules
      .filter((m) => m.question_id)
      .map((m) => m.question_id);
    expect(new Set(linked).size).toBe(linked.length);
    for (const m of modules)
      if (m.prerequisite_id)
        expect(modules.find((p) => p.id === m.prerequisite_id)?.track_id).toBe(
          m.track_id,
        );
  });
  it("validates every format and rejects incomplete or incorrect answers", () => {
    const answers = [
      1,
      [true, false],
      " substantivo ",
      [0, 1, 2],
      [0, 1, 2],
      {
        text: "Relato de um projeto escolar com revisão de pontuação e uma ideia principal apresentada com clareza. Também utilizei um exemplo concreto para sustentar o argumento.",
        checks: [true, true, true],
      },
    ];
    answers.forEach((a, i) => {
      const q = questions.find((q) => q.id === id(6000 + i))!;
      expect(evaluateDemo(q, a)).toBe(true);
      expect(evaluateDemo(q, [])).toBe(false);
    });
  });
});
describe("Avatar validation", () => {
  it("rejects forged images and oversized files", async () => {
    await expect(
      validateAvatar(
        new File(["not an image"], "x.png", { type: "image/png" }),
      ),
    ).rejects.toThrow(/conteúdo/);
    await expect(
      validateAvatar(
        new File([new Uint8Array(2097153)], "x.jpg", { type: "image/jpeg" }),
      ),
    ).rejects.toThrow(/2 MB/);
  });
  it("accepts a valid PNG and returns a persistent data URL for the explicit demo", async () => {
    const bytes = Uint8Array.from(
      atob(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aGXkAAAAASUVORK5CYII=",
      ),
      (c) => c.charCodeAt(0),
    );
    expect(
      await validateAvatar(
        new File([bytes], "avatar.png", { type: "image/png" }),
      ),
    ).toMatch(/^data:image\/png;base64,/);
  });
});
