import { describe, it, expect } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../src/state/AuthContext";
import { AppRoutes } from "../src/App";
import { demoUsers } from "../src/data/demo";
import {
  practiceSets,
  questions,
  exerciseAnswers,
  subjects,
} from "../src/data/catalog";
import { evaluateDemo } from "../src/services/learning";
import { DEMO_KEY, readDemo } from "../src/services/repository";
import { ActionFeedback, Button, useAction } from "../src/components/ui";
function app(path = "/app/aprenda/pratica", role = "estudante") {
  sessionStorage.setItem("skillup.demo.role", role);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}
const stored = () => JSON.parse(localStorage.getItem(DEMO_KEY)!);
function seedPracticeAttempts() {
  const data = readDemo();
  data.attempts = [
    {
      id: "practice-attempt-1",
      user_id: demoUsers.estudante,
      question_id: questions[0].id,
      selected_index: 0,
      correct: true,
      xp: 20,
      created_at: "2026-10-24T12:00:00.000Z",
    },
    {
      id: "practice-attempt-2",
      user_id: demoUsers.estudante,
      question_id: questions[0].id,
      selected_index: 1,
      correct: false,
      xp: 0,
      created_at: "2026-10-24T12:01:00.000Z",
    },
    {
      id: "practice-attempt-3",
      user_id: demoUsers.estudante,
      question_id: questions[1].id,
      selected_index: 0,
      correct: true,
      xp: 30,
      created_at: "2026-10-24T12:02:00.000Z",
    },
  ];
  localStorage.setItem(DEMO_KEY, JSON.stringify(data));
}
describe("Complete practice blocks", () => {
  it("contains at least five distinct questions per practice and ten per advanced exam, with valid answers", () => {
    for (const set of practiceSets) {
      expect(new Set(set.questionIds).size).toBe(set.questionIds.length);
      expect(set.questionIds.length).toBeGreaterThanOrEqual(
        set.category === "Exames" ? 10 : 5,
      );
      for (const id of set.questionIds) {
        const q = questions.find((q) => q.id === id)!;
        expect(q).toBeDefined();
        if (exerciseAnswers[id] !== undefined) {
          expect(evaluateDemo(q, exerciseAnswers[id] as number)).toBe(true);
          expect(
            evaluateDemo(
              q,
              ((exerciseAnswers[id] as number) + 1) % q.options.length,
            ),
          ).toBe(false);
        }
      }
    }
    for (const s of subjects)
      expect(
        questions.filter(
          (q) => q.category === "Prática guiada" && q.subject_id === s.id,
        ).length,
      ).toBeGreaterThanOrEqual(5);
  });
  it("shows the optional student dashboard collapsed and reveals real metrics with Ver mais", async () => {
    seedPracticeAttempts();
    const user = userEvent.setup();
    app();
    const dashboard = await screen.findByRole("region", {
      name: "Painel de prática do aluno",
    });
    const toggle = within(dashboard).getByRole("button", { name: "Ver mais" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(
      dashboard.querySelector("#practice-dashboard-details"),
    ).toHaveAttribute("hidden");
    await user.click(toggle);
    expect(
      within(dashboard).getByRole("button", { name: "Ver menos" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      within(dashboard)
        .getAllByRole("definition")
        .map((item) => item.textContent?.trim()),
    ).toEqual(["2", "3", "2 67% de aproveitamento", "1", "50 XP"]);
    await user.click(
      within(dashboard).getByRole("button", { name: "Ver menos" }),
    );
    expect(
      dashboard.querySelector("#practice-dashboard-details"),
    ).toHaveAttribute("hidden");
    expect(stored().attempts).toHaveLength(3);
  });
  it("does not show the student dashboard for a recruiter", async () => {
    app("/app/aprenda/pratica", "recrutador");
    await screen.findByRole("heading", { name: "Prática" });
    expect(
      screen.queryByRole("region", { name: "Painel de prática do aluno" }),
    ).not.toBeInTheDocument();
  });
  it("allows skipping, revisiting and editing exam responses, then grades only at the end", async () => {
    const user = userEvent.setup();
    app();
    await user.click(await screen.findByRole("button", { name: "Exames" }));
    await user.click(
      screen.getAllByRole("button", { name: "Iniciar exame" })[0],
    );
    const dialog = within(screen.getByRole("dialog"));
    await user.click(dialog.getByRole("button", { name: "Próxima" }));
    expect(
      dialog.getByRole("heading", { name: /Questão 2 de 10/ }),
    ).toBeInTheDocument();
    await user.click(dialog.getByRole("radio", { name: "7" }));
    await user.click(
      dialog.getByRole("button", { name: "Questão 10: não respondida" }),
    );
    await user.click(
      dialog.getByRole("radio", { name: "Nota 8, presença 70" }),
    );
    await user.click(dialog.getByRole("button", { name: "Revisar respostas" }));
    const review = dialog.getByText("2. Busca binária e limite — Respondida");
    await user.click(review);
    const item = within(review.closest("details")!);
    expect(item.getByRole("radio", { name: "7" })).toBeChecked();
    await user.click(item.getByRole("button", { name: "Editar questão 2" }));
    await user.click(dialog.getByRole("radio", { name: "8" }));
    await user.click(
      dialog.getByRole("button", { name: "Questão 1: não respondida" }),
    );
    await user.click(dialog.getByRole("radio", { name: "36" }));
    // No answer has reached the repository before final confirmation.
    expect(
      localStorage.getItem(DEMO_KEY) === null || stored().attempts.length === 0,
    ).toBe(true);
    await user.click(dialog.getByRole("button", { name: "Revisar respostas" }));
    await user.click(
      dialog.getByRole("button", { name: "Finalizar e corrigir" }),
    );
    await dialog.findByRole("heading", { name: "Resultado do bloco" });
    expect(
      dialog.getByText(/2 acerto\(s\) de 10 questões/),
    ).toBeInTheDocument();
    expect(stored().attempts).toHaveLength(3);
    expect(
      stored().attempts.filter((a: { correct: boolean }) => a.correct),
    ).toHaveLength(2);
    expect(stored().study_days).toHaveLength(1);
    expect(
      document.querySelector(".header-learning .streak-flame.active"),
    ).toBeInTheDocument();
    await user.click(dialog.getByRole("button", { name: "Concluir revisão" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("protects answers when closing an unfinished practice", async () => {
    const user = userEvent.setup();
    app();
    await user.click(await screen.findByRole("button", { name: "Exercício" }));
    await user.click(screen.getByRole("button", { name: "Iniciar prática" }));
    await user.click(screen.getByRole("radio", { name: "double" }));
    await user.click(screen.getByRole("button", { name: "Fechar" }));
    await user.click(
      screen.getByRole("button", { name: "Continuar respondendo" }),
    );
    expect(screen.getByRole("radio", { name: "double" })).toBeChecked();
  });
  it("toggles job interest on, off and on, persists it and reflects the pressed state", async () => {
    const user = userEvent.setup();
    const view = app("/app/emprego");
    const button = (
      await screen.findAllByRole("button", { name: "Tenho interesse" })
    )[0];
    await user.click(button);
    await waitFor(() => expect(button).toHaveAttribute("aria-pressed", "true"));
    expect(stored().saved_jobs).toHaveLength(1);
    await user.click(button);
    await waitFor(() =>
      expect(button).toHaveAttribute("aria-pressed", "false"),
    );
    expect(stored().saved_jobs).toHaveLength(0);
    await user.click(button);
    await waitFor(() => expect(button).toHaveAttribute("aria-pressed", "true"));
    expect(stored().saved_jobs).toHaveLength(1);
    view.unmount();
    app("/app/emprego");
    expect(
      await screen.findByRole("button", { name: "Interesse marcado" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
  it("can dismiss feedback and shows the same message again after another action", async () => {
    function Example() {
      const action = useAction();
      return (
        <>
          <Button
            onClick={() => action.run(async () => {}, "Alteração salva.")}
          >
            Salvar
          </Button>
          <ActionFeedback action={action} />
        </>
      );
    }
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    await user.click(
      await screen.findByRole("button", { name: "Fechar aviso" }),
    );
    expect(screen.queryByText("Alteração salva.")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Alteração salva.")).toBeInTheDocument();
  });
});
