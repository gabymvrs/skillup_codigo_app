import { describe, expect, it } from "vitest";
import {
  render,
  screen,
  waitFor,
  within,
  fireEvent,
} from "@testing-library/react";
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
  it("opens the student profile from the account area and closes the drawer", async () => {
    sessionStorage.setItem("skillup.demo.role", "estudante");
    const user = userEvent.setup();
    app("/app/home");
    await user.click(await screen.findByRole("button", { name: "Abrir menu" }));
    const link = await screen.findByRole("link", {
      name: "Ver perfil de Alex Silva",
    });
    expect(link).toHaveAttribute("href", "/app/perfil");
    await user.click(link);
    await screen.findByRole("heading", { name: "Meu perfil profissional" });
    expect(screen.getByLabelText("Menu lateral")).not.toHaveClass("open");
  });
  it("dismisses the drawer with a left swipe but not a vertical or short gesture", async () => {
    sessionStorage.setItem("skillup.demo.role", "estudante");
    const user = userEvent.setup();
    app("/app/home");
    const button = await screen.findByRole("button", { name: "Abrir menu" });
    await user.click(button);
    const menu = screen.getByLabelText("Menu lateral");
    const swipe = (x: number, y: number) => {
      fireEvent.touchStart(menu, { touches: [{ clientX: 200, clientY: 200 }] });
      fireEvent.touchMove(menu, { touches: [{ clientX: x, clientY: y }] });
      fireEvent.touchEnd(menu);
    };
    swipe(190, 100);
    expect(menu).toHaveClass("open");
    swipe(170, 200);
    expect(menu).toHaveClass("open");
    swipe(80, 205);
    expect(menu).not.toHaveClass("open");
    expect(button).toHaveAttribute("aria-expanded", "false");
    await user.click(button);
    await user.keyboard("{Escape}");
    expect(menu).not.toHaveClass("open");
    expect(button).toHaveFocus();
  });
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
  it.each(["/", "/login"])(
    "shows the demonstration entry on %s",
    async (path) => {
      app(path);
      expect(
        await screen.findByRole("link", { name: "Explorar sem login" }),
      ).toHaveAttribute("href", "/demonstracao");
    },
  );
});
