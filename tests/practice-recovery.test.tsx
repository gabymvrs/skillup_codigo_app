import { it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PracticeSession } from "../src/components/PracticeSession";
import { practiceSets, questions } from "../src/data/catalog";
const { answer } = vi.hoisted(() => ({ answer: vi.fn() }));
vi.mock("../src/state/DataContext", () => ({
  useData: () => ({ data: { questions }, answer }),
}));
it("keeps selected answers after a failure and retries only unconfirmed submissions", async () => {
  const user = userEvent.setup();
  answer
    .mockReset()
    .mockResolvedValueOnce({
      correct: true,
      xp: 80,
      explanation: "Primeira corrigida.",
    })
    .mockRejectedValueOnce(new Error("Sem conexão"))
    .mockResolvedValueOnce({
      correct: true,
      xp: 80,
      explanation: "Segunda corrigida.",
    });
  const set = practiceSets.find((s) => s.category === "Exames")!;
  render(<PracticeSession set={set} onClose={() => {}} />);
  await user.click(screen.getByRole("radio", { name: "36" }));
  await user.click(screen.getByRole("button", { name: "Próxima" }));
  await user.click(screen.getByRole("radio", { name: "7" }));
  await user.click(screen.getByRole("button", { name: "Revisar respostas" }));
  await user.click(
    screen.getByRole("button", { name: "Finalizar e corrigir" }),
  );
  await screen.findByText("Sem conexão");
  expect(answer).toHaveBeenCalledTimes(2);
  expect(screen.queryByText("Primeira corrigida.")).not.toBeInTheDocument();
  await user.click(
    screen.getByRole("button", { name: "Tentar concluir novamente" }),
  );
  await screen.findByRole("heading", { name: "Resultado do bloco" });
  expect(answer).toHaveBeenCalledTimes(3);
  expect(answer.mock.calls.map((c) => c[0])).toEqual([
    set.questionIds[0],
    set.questionIds[1],
    set.questionIds[1],
  ]);
  expect(answer.mock.calls[2][1]).toBe(1);
});
it("does not start a shortened exam when its database catalogue is incomplete", async () => {
  const set = practiceSets.find((s) => s.category === "Exames")!;
  render(
    <PracticeSession
      set={{ ...set, questionIds: [...set.questionIds, "missing"] }}
      onClose={() => {}}
    />,
  );
  expect(
    screen.getByText(/O conteúdo deste bloco ainda não foi disponibilizado/),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Próxima" }),
  ).not.toBeInTheDocument();
});
