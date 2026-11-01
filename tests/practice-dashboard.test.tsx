import { expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../src/state/AuthContext";
import { AppRoutes } from "../src/App";
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
