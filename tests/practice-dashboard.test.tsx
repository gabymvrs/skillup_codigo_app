import { expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../src/state/AuthContext";
import { AppRoutes } from "../src/App";
import { PracticeDashboard } from "../src/components/PracticeDashboard";
import { createDemo } from "../src/data/demo";
import { id } from "../src/data/catalog";

it("collapses charts while retaining metrics and the selected period", async () => {
  const user = userEvent.setup();
  const data = createDemo();
  data.attempts = [
    {
      id: "chart-attempt",
      user_id: id(1),
      question_id: id(13000),
      selected_index: 1,
      correct: true,
      xp: 0,
      created_at: new Date().toISOString(),
    },
  ];
  render(
    <PracticeDashboard
      data={data}
      user={id(1)}
      demo
      completions={[]}
      loading={false}
      error=""
      onRetry={() => {}}
    />,
  );
  const toggle = screen.getByRole("button", { name: "Expandir" });
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(
    screen.queryByRole("heading", { name: "Evolução de desempenho" }),
  ).not.toBeInTheDocument();
  expect(screen.getByText("Taxa de acertos")).toBeVisible();
  const title = screen.getByRole("heading", {
    name: "Seu progresso na prática",
  });
  expect(title.parentElement).toContainElement(toggle);
  await user.click(toggle);
  const chart = screen.getByRole("heading", { name: "Evolução de desempenho" });
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Período" }),
    "30",
  );
  expect(toggle).toHaveAccessibleName("Recolher");
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  await user.click(toggle);
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(chart).not.toBeVisible();
  expect(screen.getByText("Taxa de acertos")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Expandir" }));
  expect(chart).toBeVisible();
  expect(screen.getByRole("combobox", { name: "Período" })).toHaveValue("30");
});
function app() {
  sessionStorage.setItem("skillup.demo.role", "estudante");
  render(
    <MemoryRouter initialEntries={["/app/aprenda/pratica"]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}
it("places combined filters below actions and clears them back to the available sets", async () => {
  const user = userEvent.setup();
  app();
  const action = await screen.findByRole("heading", { name: "Ações rápidas" }),
    filters = screen.getByRole("region", { name: "Filtros da prática" });
  expect(
    action.compareDocumentPosition(filters) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Exames" }));
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Dificuldade" }),
    "unknown",
  );
  await screen.findByText("Nenhum bloco encontrado");
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Status do bloco" }),
    "done",
  );
  expect(
    screen.queryByRole("button", { name: "Iniciar exame" }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Limpar filtros" }));
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Disciplina" }),
    "00000000-0000-4000-8000-000000000010",
  );
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Formato de exercício" }),
    "blank",
  );
  expect(
    screen.getAllByRole("button", { name: "Iniciar prática" }),
  ).toHaveLength(1);
});
