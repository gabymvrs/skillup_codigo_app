import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../src/state/AuthContext";
import { AppRoutes } from "../src/App";
import { questions, tracks, modules, id } from "../src/data/catalog";
import { activityType, activityKind } from "../src/services/activities";
import { evaluateDemo } from "../src/services/learning";
import { ActivityRenderer } from "../src/components/ActivityRenderer";
import { initialAnswer } from "../src/components/ExerciseFields";
import { createDemo } from "../src/data/demo";
import { DEMO_KEY } from "../src/services/repository";
function app(path: string) {
  sessionStorage.setItem("skillup.demo.role", "estudante");
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}
describe("Activities selected by pedagogical type", () => {
  it("never adds code to unrelated tracks and retains non-code lessons within programming courses", () => {
    for (const track of tracks) {
      const qs = modules
        .filter((m) => m.track_id === track.id)
        .map((m) => questions.find((q) => q.id === m.question_id))
        .filter((q) => q !== undefined);
      if (
        ![
          "Desenvolvimento Web",
          "Python: primeiros programas",
          "JavaScript: lógica e prática",
        ].includes(track.title)
      )
        expect(qs.every((q) => activityType(q) !== "code_practice")).toBe(true);
      else {
        expect(qs.some((q) => activityType(q) === "code_practice")).toBe(true);
        expect(qs.some((q) => activityType(q) !== "code_practice")).toBe(true);
      }
    }
    expect(questions.every((q) => Boolean(q.activity_type))).toBe(true);
  });
  it("uses activity_type even without the legacy kind", () => {
    const q = {
      ...questions.find((q) => q.id === id(12003))!,
      kind: undefined,
    };
    expect(activityKind(q)).toBe("ordering");
    render(
      <ActivityRenderer
        q={q}
        value={initialAnswer(q)}
        onChange={() => {}}
        disabled={false}
      />,
    );
    expect(screen.getAllByRole("button", { name: /Subir/ })).toHaveLength(4);
    expect(
      screen.queryByRole("textbox", { name: /Código/ }),
    ).not.toBeInTheDocument();
  });
  it.each([12007, 12009, 12015])(
    "renders an accessible domain image for activity %s without a code editor",
    (n) => {
      const q = questions.find((q) => q.id === id(n))!;
      render(
        <ActivityRenderer
          q={q}
          value={initialAnswer(q)}
          onChange={() => {}}
          disabled={false}
        />,
      );
      expect(screen.getByRole("img")).toHaveAttribute(
        "alt",
        q.payload!.imageAlt,
      );
      expect(
        screen.queryByRole("textbox", { name: /Código/ }),
      ).not.toBeInTheDocument();
    },
  );
  it("grades calculations, accepts decimal commas and rejects unit strings", () => {
    const q = questions.find((q) => q.id === id(12017))!;
    expect(evaluateDemo(q, "2,0")).toBe(true);
    expect(evaluateDemo(q, "4")).toBe(false);
    expect(evaluateDemo(q, "2 m/s")).toBe(false);
  });
  it("loads CodePractice only for an explicit code activity", async () => {
    const q = questions.find((q) => q.id === id(12002))!;
    const view = render(
      <ActivityRenderer
        q={questions[0]}
        value={-1}
        onChange={() => {}}
        disabled={false}
      />,
    );
    expect(
      screen.queryByRole("textbox", { name: "Código python" }),
    ).not.toBeInTheDocument();
    view.rerender(
      <ActivityRenderer
        q={q}
        value={initialAnswer(q)}
        onChange={() => {}}
        disabled={false}
      />,
    );
    expect(
      await screen.findByRole("textbox", { name: "Código python" }),
    ).toBeInTheDocument();
  });
  it("records feedback, XP and lesson completion for a non-code calculation", async () => {
    const demo = createDemo();
    for (const m of demo.modules.filter(
      (m) => m.track_id === id(2004) && m.id !== id(4011) && m.position < 3,
    ))
      demo.progress.push({
        id: crypto.randomUUID(),
        user_id: id(1),
        module_id: m.id,
        completed_at: new Date().toISOString(),
      });
    localStorage.setItem(DEMO_KEY, JSON.stringify(demo));
    const user = userEvent.setup();
    app(`/app/aprenda/trilhas/${id(2004)}`);
    await user.click(
      await screen.findByRole("button", {
        name: /Calcular estoque disponível/,
      }),
    );
    await user.click(
      screen.getByRole("button", { name: "Abrir exercício da etapa" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "Resultado (unidades)" }),
      "31",
    );
    await user.click(screen.getByRole("button", { name: "Conferir resposta" }));
    await screen.findByText("Vamos revisar.");
    await user.click(
      screen.getByRole("button", { name: "Praticar novamente" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "Resultado (unidades)" }),
      "30",
    );
    await user.click(screen.getByRole("button", { name: "Conferir resposta" }));
    await user.click(
      await screen.findByRole("button", { name: "Concluir etapa" }),
    );
    await waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem(DEMO_KEY)!).progress.some(
          (p: { module_id: string }) => p.module_id === id(4011),
        ),
      ).toBe(true),
    );
    expect(
      screen.getByRole("button", { name: /Organizar a expedição/ }),
    ).toBeEnabled();
  });
  it("has no independent laboratory section", async () => {
    app("/app/aprenda/pratica");
    await screen.findByRole("heading", { name: "Prática" });
    expect(
      screen.queryByRole("button", { name: "Laboratório" }),
    ).not.toBeInTheDocument();
  });
});
