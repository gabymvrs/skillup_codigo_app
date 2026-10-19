import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import {
  Login,
  Signup,
  Recover,
  ResetPassword,
  AuthCallback,
} from "../src/pages/Auth";
const mocks = vi.hoisted(() => ({
  auth: {
    id: null as string | null,
    role: null,
    loading: false,
    error: "",
    demo: false,
    signIn: vi.fn(),
    setRecovery: vi.fn(),
  },
  api: {
    signUp: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    resend: vi.fn(),
  },
}));
vi.mock("../src/state/AuthContext", () => ({ useAuth: () => mocks.auth }));
vi.mock("../src/services/supabase", () => ({
  configured: true,
  demoEnabled: true,
  requireSupabase: () => ({ auth: mocks.api }),
}));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.id = null;
  mocks.auth.error = "";
  mocks.auth.signIn.mockResolvedValue(undefined);
  for (const fn of Object.values(mocks.api))
    fn.mockResolvedValue({ error: null });
});
function show(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro/:role" element={<Signup />} />
        <Route path="/recuperar-senha" element={<Recover />} />
        <Route path="/redefinir-senha" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/app/home"
          element={<h1>Acesso autorizado pela sessão</h1>}
        />
      </Routes>
    </MemoryRouter>,
  );
}
describe("Auth forms with a mocked Supabase contract (not live authentication)", () => {
  it("keeps the login form visible on rejected credentials", async () => {
    mocks.auth.signIn.mockRejectedValue(new Error("Invalid login credentials"));
    const user = userEvent.setup();
    show("/login");
    await user.type(screen.getByLabelText("E-mail"), "aluno@example.test");
    await user.type(screen.getByLabelText("Senha"), "invalid-pass");
    await user.click(screen.getByRole("button", { name: "Fazer login" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /E-mail ou senha incorretos/,
    );
    expect(
      screen.queryByText("Acesso autorizado pela sessão"),
    ).not.toBeInTheDocument();
  });
  it("navigates only after signIn succeeds", async () => {
    const user = userEvent.setup();
    show("/login");
    await user.type(screen.getByLabelText("E-mail"), "aluno@example.test");
    await user.type(screen.getByLabelText("Senha"), "example-pass");
    await user.click(screen.getByRole("button", { name: "Fazer login" }));
    expect(
      await screen.findByRole("heading", {
        name: "Acesso autorizado pela sessão",
      }),
    ).toBeInTheDocument();
    expect(mocks.auth.signIn).toHaveBeenCalledWith(
      "aluno@example.test",
      "example-pass",
    );
  });
  it.each(["estudante", "docente", "recrutador", "instituicao"])(
    "sends a %s request and requires email confirmation",
    async (role) => {
      const user = userEvent.setup();
      show(`/cadastro/${role}`);
      await user.type(
        screen.getByLabelText("Nome completo"),
        "Pessoa de teste",
      );
      await user.type(screen.getByLabelText("E-mail"), "pessoa@example.test");
      await user.type(screen.getByLabelText(/^Senha/), "example-pass");
      await user.type(screen.getByLabelText("Confirmar senha"), "example-pass");
      if (role !== "estudante")
        await user.type(
          screen.getByLabelText(
            role === "instituicao"
              ? "Razão social"
              : "Instituição ou empresa vinculada",
          ),
          "Instituição de teste",
        );
      if (["recrutador", "instituicao"].includes(role))
        await user.type(
          screen.getByLabelText("CNPJ ou registro institucional"),
          "registro exemplo",
        );
      if (role === "instituicao")
        await user.type(screen.getByLabelText("CNAE"), "exemplo");
      await user.click(screen.getByRole("button", { name: "Criar conta" }));
      expect(
        await screen.findByText(/Verifique sua caixa de entrada/),
      ).toBeInTheDocument();
      const request = mocks.api.signUp.mock.calls[0][0];
      expect(request.options.data.requested_role).toBe(role);
      expect(request.options.data.role).toBeUndefined();
      expect(request.options.emailRedirectTo).toContain("/auth/callback");
    },
  );
  it("rejects different passwords before contacting the service", async () => {
    const user = userEvent.setup();
    show("/cadastro/estudante");
    await user.type(screen.getByLabelText("Nome completo"), "Pessoa de teste");
    await user.type(screen.getByLabelText("E-mail"), "pessoa@example.test");
    await user.type(screen.getByLabelText(/^Senha/), "example-pass");
    await user.type(screen.getByLabelText("Confirmar senha"), "different-pass");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "As senhas precisam ser iguais.",
    );
    expect(mocks.api.signUp).not.toHaveBeenCalled();
  });
  it("does not confirm recovery when the service fails", async () => {
    mocks.api.resetPasswordForEmail.mockResolvedValue({
      error: new Error("Falha de conexão"),
    });
    const user = userEvent.setup();
    show("/recuperar-senha");
    await user.type(screen.getByLabelText("E-mail"), "pessoa@example.test");
    await user.click(
      screen.getByRole("button", { name: "Enviar link de recuperação" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Falha de conexão",
    );
    expect(
      screen.queryByText(/as instruções serão enviadas/),
    ).not.toBeInTheDocument();
  });
  it("requires a recovery session and confirms only a successful password update", async () => {
    mocks.auth.id = "session-user";
    const user = userEvent.setup();
    show("/redefinir-senha");
    await user.type(screen.getByLabelText("Nova senha"), "new-example-pass");
    await user.type(
      screen.getByLabelText("Confirmar senha"),
      "new-example-pass",
    );
    await user.click(screen.getByRole("button", { name: "Salvar nova senha" }));
    expect(await screen.findByText("Senha atualizada.")).toBeInTheDocument();
    expect(mocks.api.updateUser).toHaveBeenCalledWith({
      password: "new-example-pass",
    });
    expect(mocks.auth.setRecovery).toHaveBeenCalledWith(false);
  });
  it("offers resending confirmation when callback has no valid session", async () => {
    const user = userEvent.setup();
    show("/auth/callback");
    expect(screen.getByText(/O link pode ter expirado/)).toBeInTheDocument();
    await user.type(screen.getByLabelText("E-mail"), "pessoa@example.test");
    await user.click(
      screen.getByRole("button", { name: "Reenviar confirmação" }),
    );
    await waitFor(() =>
      expect(mocks.api.resend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "signup",
          email: "pessoa@example.test",
        }),
      ),
    );
  });
});
