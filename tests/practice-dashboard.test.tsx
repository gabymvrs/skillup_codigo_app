import { expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../src/state/AuthContext";
import { AppRoutes } from "../src/App";
import { PracticeDashboard } from "../src/components/PracticeDashboard";
import { createDemo } from "../src/data/demo";
import { id } from "../src/data/catalog";

it("shows one dashboard by default and retains the period when collapsed", async () => {
  const user = userEvent.setup();
  const data = createDemo();
  const preferenceKey = `skillup.practice.charts-expanded:${id(1)}`;
  localStorage.removeItem(preferenceKey);
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
  const view = render(
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
  const toggle = screen.getByRole("button", { name: "Recolher" });
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  const chart = screen.getByRole("heading", { name: "Evolução de desempenho" });
  expect(chart).toBeVisible();
  expect(screen.getByText("de acertos")).toBeVisible();
  expect(screen.queryByText("Práticas concluídas")).not.toBeInTheDocument();
  expect(
    screen.queryByText("Ver dados do gráfico em tabela"),
  ).not.toBeInTheDocument();
  const chartPoint = screen.getByLabelText(/100%, 1 acertos/);
  await user.hover(chartPoint);
  expect(screen.getByRole("tooltip")).toHaveTextContent("100% de acertos");
  await user.unhover(chartPoint);
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  const donut = screen.getByRole("img", { name: /100% de acertos/ });
  await user.hover(donut);
  expect(screen.getByRole("tooltip")).toHaveTextContent("Acertos");
  expect(screen.getByRole("tooltip")).toHaveTextContent("1 questão");
  await user.unhover(donut);
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  const title = screen.getByRole("heading", {
    name: "Seu progresso na prática",
  });
  expect(title.closest("header")).toContainElement(toggle);
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Período" }),
    "30",
  );
  await user.click(toggle);
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(chart).not.toBeVisible();
  await user.click(screen.getByRole("button", { name: "Expandir" }));
  expect(chart).toBeVisible();
  expect(screen.getByRole("combobox", { name: "Período" })).toHaveValue("30");
  await user.click(screen.getByRole("button", { name: "Recolher" }));
  expect(localStorage.getItem(preferenceKey)).toBe("collapsed");
  view.unmount();

  const collapsedView = render(
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
  expect(screen.getByRole("button", { name: "Expandir" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await user.click(screen.getByRole("button", { name: "Expandir" }));
  expect(localStorage.getItem(preferenceKey)).toBe("expanded");
  collapsedView.unmount();

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
  expect(screen.getByRole("button", { name: "Recolher" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
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
it("places combined filters below actions and allows changing them", async () => {
  const user = userEvent.setup();
  app();
  const action = await screen.findByRole("heading", { name: "Ações rápidas" }),
    filters = screen.getByRole("region", { name: "Filtros da prática" });
  expect(
    action.compareDocumentPosition(filters) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  const subject = screen.getByRole("combobox", { name: "Disciplina" }),
    format = screen.getByRole("combobox", { name: "Formato de exercício" }),
    difficulty = screen.getByRole("combobox", { name: "Dificuldade" }),
    status = screen.getByRole("combobox", { name: "Status do bloco" });

  await user.selectOptions(
    subject,
    "00000000-0000-4000-8000-000000000010",
  );
  expect(
    screen.getAllByRole("button", { name: "Iniciar prática" }),
  ).toHaveLength(1);
  await user.selectOptions(subject, "");
  const allSets = screen.getAllByRole("button", {
    name: "Iniciar prática",
  }).length;
  expect(allSets).toBeGreaterThan(1);

  await user.selectOptions(format, "blank");
  expect(format).toHaveValue("blank");
  await user.selectOptions(format, "");
  expect(format).toHaveValue("");
  expect(
    screen.getAllByRole("button", { name: "Iniciar prática" }),
  ).toHaveLength(allSets);

  await user.selectOptions(difficulty, "advanced");
  await screen.findByText("Nenhum bloco encontrado");
  await user.selectOptions(difficulty, "");
  expect(
    screen.getAllByRole("button", { name: "Iniciar prática" }),
  ).toHaveLength(allSets);

  await user.selectOptions(status, "done");
  expect(
    screen.queryAllByRole("button", { name: "Iniciar prática" }),
  ).toHaveLength(0);
  await user.selectOptions(status, "");
  expect(
    screen.getAllByRole("button", { name: "Iniciar prática" }),
  ).toHaveLength(allSets);

  expect(subject).toHaveValue("");
  expect(format).toHaveValue("");
  expect(difficulty).toHaveValue("");
  expect(status).toHaveValue("");
});
