import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { RegistrationDocuments } from "../src/pages/Registration";
import { UploadField } from "../src/components/auth/UploadField";
import type { Role } from "../src/lib/types";
const mocks = vi.hoisted(() => ({
  auth: { id: "user", email: "person@example.test", demo: false },
  load: vi.fn(),
  save: vi.fn(),
}));
vi.mock("../src/state/AuthContext", () => ({ useAuth: () => mocks.auth }));
vi.mock("../src/services/registration", async (original) => ({
  ...(await original<typeof import("../src/services/registration")>()),
  loadRegistration: mocks.load,
  saveRegistration: mocks.save,
}));
const pdf = () =>
  new File(["%PDF-1.7 sample"], "documento.pdf", { type: "application/pdf" });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.demo = false;
  mocks.save.mockResolvedValue({});
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});
function show(role: Role) {
  mocks.load.mockResolvedValue({ role, request: null, accepted: false });
  render(
    <MemoryRouter>
      <RegistrationDocuments />
    </MemoryRouter>,
  );
}
describe("Reference registration screens", () => {
  it("preserves institution fields and files when moving between both steps", async () => {
    const user = userEvent.setup();
    show("instituicao");
    await user.type(
      await screen.findByLabelText("Razão Social:"),
      "Escola de teste",
    );
    await user.type(screen.getByLabelText("CNPJ:"), "60.311.238/0001-98");
    await user.type(screen.getByLabelText("CNAE:"), "85.13-9-00");
    await user.click(screen.getByRole("button", { name: "Avançar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Anexe a Declaração",
    );
    await user.upload(
      screen.getByLabelText("Declaração institucional", { exact: true }),
      pdf(),
    );
    await user.click(screen.getByRole("button", { name: "Avançar" }));
    expect(screen.getByLabelText("Etapa 2 de 2")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Alvará de funcionamento", { exact: true }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Credenciamento no MEC", { exact: true }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Voltar à etapa anterior" }),
    );
    expect(screen.getByLabelText("Razão Social:")).toHaveValue(
      "Escola de teste",
    );
    expect(screen.getByText("documento.pdf")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Avançar" }));
    for (const label of [
      "Alvará de funcionamento",
      "Contrato social",
      "Credenciamento no MEC",
    ])
      await user.upload(screen.getByLabelText(label, { exact: true }), pdf());
    await user.click(screen.getByRole("button", { name: "Concluir cadastro" }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledOnce());
    expect(mocks.save.mock.calls[0][0]).toMatchObject({
      role: "instituicao",
      info: { organization_name: "Escola de teste", cnae: "85.13-9-00" },
    });
    expect(Object.keys(mocks.save.mock.calls[0][0].files)).toHaveLength(4);
  });
  it("includes the teacher's linked institution, declaration and work card", async () => {
    show("docente");
    expect(
      await screen.findByLabelText("Instituição vinculada:"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Declaração Institucional", { exact: true }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Carteira de trabalho", { exact: true }),
    ).toBeInTheDocument();
  });
  it("requires the recruiter's responsibility agreement and displays its content", async () => {
    const user = userEvent.setup();
    show("recrutador");
    await user.type(
      await screen.findByLabelText("CNPJ/ CPF:"),
      "60.311.238/0001-98",
    );
    for (const label of ["Declaração Institucional", "Contrato social"])
      await user.upload(screen.getByLabelText(label, { exact: true }), pdf());
    await user.click(screen.getByRole("button", { name: "Concluir cadastro" }));
    expect(mocks.save).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", {
        name: "Ler Declaração de responsabilidades",
      }),
    );
    expect(await screen.findByRole("dialog")).toHaveTextContent(
      "Texto provisório",
    );
    await user.click(screen.getByRole("button", { name: "Li e concordo" }));
    await user.click(screen.getByRole("button", { name: "Concluir cadastro" }));
    expect(mocks.save.mock.calls[0][0].accepted).toBe(true);
  });
  it("does not collect personal documents in demo mode", () => {
    mocks.auth.demo = true;
    show("estudante");
    expect(
      screen.getByText(/A demonstração não recebe arquivos/),
    ).toBeInTheDocument();
    expect(mocks.load).not.toHaveBeenCalled();
    expect(
      screen.queryByLabelText("Carteira de estudante"),
    ).not.toBeInTheDocument();
  });
  it("leaves files available for retry when saving fails", async () => {
    mocks.save.mockRejectedValue(new Error("Falha de armazenamento"));
    const user = userEvent.setup();
    show("estudante");
    await user.upload(
      await screen.findByLabelText("Carteira de estudante"),
      pdf(),
    );
    await user.click(
      screen.getByRole("button", { name: "Completar Cadastro" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Falha de armazenamento",
    );
    expect(screen.getByText("documento.pdf")).toBeInTheDocument();
    expect(
      screen.queryByText("Documentos armazenados no seu cadastro."),
    ).not.toBeInTheDocument();
  });
  it("rejects unsupported attachments without claiming an upload", async () => {
    const onChange = vi.fn(),
      user = userEvent.setup({ applyAccept: false });
    render(<UploadField label="Documento" onChange={onChange} />);
    await user.upload(
      screen.getByLabelText("Documento", { exact: true }),
      new File(["<script>"], "arquivo.html", { type: "text/html" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "PDF, PNG ou JPEG",
    );
    expect(onChange).not.toHaveBeenCalled();
  });
});
