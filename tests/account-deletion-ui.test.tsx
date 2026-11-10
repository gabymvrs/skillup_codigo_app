import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Privacy } from "../src/pages/Settings";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("../src/state/AuthContext", () => ({
  useAuth: () => ({
    id: "account-owner",
    email: "owner@example.test",
    demo: false,
    logout: mocks.logout,
  }),
}));

vi.mock("../src/services/supabase", () => ({
  requireSupabase: () => ({ auth: { getSession: mocks.getSession } }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getSession.mockResolvedValue({
    data: {
      session: { user: { last_sign_in_at: new Date().toISOString() } },
    },
    error: null,
  });
});

describe("Account deletion interface without destructive backend", () => {
  it("requires recent authentication and an explicit confirmation phrase", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Privacy />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(screen.getByText(/Autenticação recente confirmada/)).toBeVisible(),
    );
    await user.click(
      screen.getByRole("button", { name: "Excluir minha conta" }),
    );
    const confirm = screen.getByRole("button", {
      name: "Confirmar exclusão",
    });
    expect(confirm).toBeDisabled();
    await user.type(
      screen.getByLabelText("Digite EXCLUIR para confirmar"),
      "EXCLUIR",
    );
    expect(confirm).toBeDisabled();
    await user.click(screen.getByLabelText(/não poderei recuperar a conta/i));
    await user.click(
      screen.getByLabelText(/certificados, progresso e registros acadêmicos/i),
    );
    expect(confirm).toBeEnabled();
    await user.click(confirm);
    expect(
      await screen.findByText(/Nenhuma solicitação foi enviada/),
    ).toBeVisible();
    expect(mocks.logout).not.toHaveBeenCalled();
  });

  it("blocks the action when the login is older than ten minutes", async () => {
    mocks.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            last_sign_in_at: new Date(Date.now() - 11 * 60_000).toISOString(),
          },
        },
      },
      error: null,
    });
    render(
      <MemoryRouter>
        <Privacy />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole("button", { name: "Sair e entrar novamente" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Excluir minha conta" }),
    ).toBeDisabled();
  });
});
