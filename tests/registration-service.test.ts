import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RoleRequest } from "../src/lib/types";
import {
  saveRegistration,
  clearRegistrationDraft,
  stageStudentDocument,
  stagedStudentDocument,
  validateDocument,
} from "../src/services/registration";
const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
  updateUser: vi.fn(),
}));
vi.mock("../src/services/supabase", () => ({
  requireSupabase: () => ({
    auth: { getUser: mocks.getUser, updateUser: mocks.updateUser },
    from: mocks.from,
    storage: { from: () => ({ upload: mocks.upload, remove: mocks.remove }) },
  }),
}));
const request: RoleRequest = {
  id: "request-id",
  user_id: "owner-id",
  requested_role: "estudante",
  status: "pending",
  organization_name: "",
  registration_number: "",
  cnae: "",
  document_paths: [],
  created_at: "2026-10-20",
};
const options = () => ({
  request,
  role: "estudante" as const,
  info: { organization_name: "", registration_number: "", cnae: "" },
  files: {
    0: new File(["%PDF example"], "carteira.pdf", { type: "application/pdf" }),
  },
  accepted: false,
  onProgress: vi.fn(),
});
function databaseResult(
  data: RoleRequest | null = request,
  error: Error | null = null,
) {
  const query = {
    update: vi.fn(),
    eq: vi.fn(),
    select: vi.fn(),
    single: vi.fn().mockResolvedValue({ data, error }),
  };
  query.update.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.select.mockReturnValue(query);
  return query;
}
beforeEach(() => {
  vi.clearAllMocks();
  clearRegistrationDraft();
  mocks.getUser.mockResolvedValue({
    data: {
      user: {
        id: "owner-id",
        email_confirmed_at: "2026-10-20",
        is_anonymous: false,
      },
    },
    error: null,
  });
  mocks.upload.mockResolvedValue({ error: null });
  mocks.remove.mockResolvedValue({ error: null });
  mocks.updateUser.mockResolvedValue({ error: null });
});
describe("Private document submission contract", () => {
  it("requires a confirmed account before touching database or storage", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "owner-id", email_confirmed_at: null } },
      error: null,
    });
    await expect(saveRegistration(options())).rejects.toThrow(
      "Confirme seu e-mail",
    );
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it("rejects a request belonging to another user", async () => {
    await expect(
      saveRegistration({
        ...options(),
        request: { ...request, user_id: "other" },
      }),
    ).rejects.toThrow("não pertence");
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("does not store paths or completion when upload is rejected", async () => {
    mocks.from.mockReturnValue(databaseResult());
    mocks.upload.mockResolvedValue({
      error: new Error("Storage indisponível"),
    });
    const input = options();
    await expect(saveRegistration(input)).rejects.toThrow(
      "Storage indisponível",
    );
    expect(mocks.from).toHaveBeenCalledTimes(1);
    expect(input.onProgress).toHaveBeenCalledWith(request);
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
  it("removes an uploaded file if linking it fails", async () => {
    mocks.from
      .mockReturnValueOnce(databaseResult())
      .mockReturnValueOnce(databaseResult(null, new Error("Vínculo recusado")));
    await expect(saveRegistration(options())).rejects.toThrow(
      "Vínculo recusado",
    );
    const path = mocks.upload.mock.calls[0][0];
    expect(path).toMatch(/^owner-id\/request-id\/0-.*\.pdf$/);
    expect(mocks.remove).toHaveBeenCalledWith([path]);
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
  it("reports a failed cleanup honestly", async () => {
    mocks.from
      .mockReturnValueOnce(databaseResult())
      .mockReturnValueOnce(databaseResult(null, new Error("Vínculo recusado")));
    mocks.remove.mockResolvedValue({ error: new Error("offline") });
    await expect(saveRegistration(options())).rejects.toThrow(
      "cópia privada pode ter permanecido",
    );
  });
  it("marks a document stored only after storage and database confirmation", async () => {
    const saved = {
      ...request,
      document_paths: ["owner-id/request-id/0-example.pdf"],
    };
    mocks.from
      .mockReturnValueOnce(databaseResult())
      .mockReturnValueOnce(databaseResult(saved));
    const input = options();
    await saveRegistration(input);
    expect(input.onProgress).toHaveBeenLastCalledWith(saved, 0);
    expect(
      mocks.updateUser.mock.calls[0][0].data.skillup_registration.request_id,
    ).toBe(request.id);
    expect(
      mocks.from.mock.calls.every(([table]) => table === "role_requests"),
    ).toBe(true);
  });
  it("requires all professional documents before writes", async () => {
    const input = options();
    await expect(
      saveRegistration({
        ...input,
        role: "docente",
        info: { ...input.info, organization_name: "Escola" },
        request: { ...request, requested_role: "docente" },
      }),
    ).rejects.toThrow("todos os documentos");
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("keeps staged documents scoped to the email and clears them", () => {
    const file = options().files[0];
    stageStudentDocument("Owner@example.test", file);
    expect(stagedStudentDocument("owner@example.test")).toBe(file);
    expect(stagedStudentDocument("other@example.test")).toBeUndefined();
    clearRegistrationDraft();
    expect(stagedStudentDocument("owner@example.test")).toBeUndefined();
  });
  it("rejects oversized and empty files", () => {
    expect(() =>
      validateDocument(new File([], "empty.pdf", { type: "application/pdf" })),
    ).toThrow();
    expect(() =>
      validateDocument(
        new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.pdf", {
          type: "application/pdf",
        }),
      ),
    ).toThrow();
  });
});
