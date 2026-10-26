import { describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../src/state/AuthContext";
import { AppRoutes } from "../src/App";
const roles = [
  ["Estudante", "estudante"],
  ["Docente", "docente"],
  ["Recrutador", "recrutador"],
  ["Instituição", "instituicao"],
] as const;
function app(path = "/teste") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}
describe("Test navigation for all account types", () => {
  it.each(roles)(
    "enters %s without real authentication and navigates every tab",
    async (label, role) => {
      const user = userEvent.setup();
      app();
      await user.click(await screen.findByRole("button", { name: label }));
      const toolbar = await screen.findByRole("region", {
        name: "Navegação de teste",
      });
      expect(
        within(toolbar).getByRole("combobox", { name: "Testar como" }),
      ).toHaveValue(role);
      expect(sessionStorage.getItem("skillup.demo.role")).toBe(role);
      const nav = screen.getByRole("navigation", {
        name: "Navegação principal mobile",
      });
      for (const name of ["Aprenda", "Social", "Emprego", "Config.", "Home"]) {
        await user.click(within(nav).getByRole("link", { name }));
        await waitFor(() =>
          expect(
            screen.queryByText("Carregando seu espaço…"),
          ).not.toBeInTheDocument(),
        );
        expect(within(nav).getByRole("link", { name })).toHaveAttribute(
          "aria-current",
          "page",
        );
        expect(
          screen.queryByText("Não foi possível abrir esta tela"),
        ).not.toBeInTheDocument();
      }
    },
  );
  it("switches roles from an inner route, returns home and exits the demonstration", async () => {
    sessionStorage.setItem("skillup.demo.role", "estudante");
    const user = userEvent.setup();
    app("/app/aprenda/trilhas");
    await screen.findByRole("heading", { name: "Trilhas de aprendizagem" });
    for (const [, role] of roles.slice(1)) {
      await user.selectOptions(
        screen.getByRole("combobox", { name: "Testar como" }),
        role,
      );
      await waitFor(() =>
        expect(
          screen.queryByText("Carregando seu espaço…"),
        ).not.toBeInTheDocument(),
      );
      expect(sessionStorage.getItem("skillup.demo.role")).toBe(role);
      const nav = screen.getByRole("navigation", {
        name: "Navegação principal mobile",
      });
      expect(within(nav).getByRole("link", { name: "Home" })).toHaveAttribute(
        "aria-current",
        "page",
      );
    }
    await user.click(screen.getByRole("button", { name: "Sair do teste" }));
    await screen.findByRole("heading", { name: "Versão de teste" });
    expect(sessionStorage.getItem("skillup.demo.role")).toBeNull();
    expect(
      screen.queryByRole("region", { name: "Navegação de teste" }),
    ).not.toBeInTheDocument();
  });
  it("shows the testing entry on the welcome page", async () => {
    app("/");
    expect(
      await screen.findByRole("link", { name: "Testar tipos de conta" }),
    ).toHaveAttribute("href", "/teste");
  });
});
