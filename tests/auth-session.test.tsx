import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@supabase/supabase-js";
import { AuthProvider, useAuth } from "../src/state/AuthContext";

const mocks = vi.hoisted(() => ({
  event: null as null | ((event: string, session: Session | null) => void),
  getSession: vi.fn(),
  single: vi.fn(),
  assurance: vi.fn(),
  signOut: vi.fn(),
  demoEnabled: true,
}));
vi.mock("../src/services/supabase", () => {
  const client = {
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: (callback: typeof mocks.event) => {
        mocks.event = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
      mfa: { getAuthenticatorAssuranceLevel: mocks.assurance },
      signOut: mocks.signOut,
    },
    from: () => ({ select: () => ({ eq: () => ({ single: mocks.single }) }) }),
  };
  return {
    supabase: client,
    requireSupabase: () => client,
    get demoEnabled() {
      return mocks.demoEnabled;
    },
  };
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}
const session = (token = "token-a") =>
  ({
    access_token: token,
    user: { id: "user-a", email: "student@example.test" },
  }) as Session;
const membership = {
  user_id: "user-a",
  role: "estudante",
  organization_id: null,
};
function Consumer() {
  const auth = useAuth();
  return (
    <>
      <output data-testid="identity">
        {JSON.stringify({
          id: auth.id,
          role: auth.role,
          loading: auth.loading,
          demo: auth.demo,
          recovery: auth.recovery,
          error: auth.error,
        })}
      </output>
      <button
        onClick={() => {
          void auth.refreshRole().catch(() => {});
        }}
      >
        Refresh
      </button>
      <button
        onClick={() => {
          void auth.logout();
        }}
      >
        Logout
      </button>
      <button onClick={() => auth.startDemo("instituicao")}>Demo</button>
    </>
  );
}
const state = () => JSON.parse(screen.getByTestId("identity").textContent!);
const show = () =>
  render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  );
async function emit(event: string, next: Session | null) {
  await act(async () => {
    mocks.event!(event, next);
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.demoEnabled = true;
  mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
  mocks.single.mockResolvedValue({ data: membership, error: null });
  mocks.assurance.mockResolvedValue({
    data: { currentLevel: "aal1", nextLevel: "aal1" },
    error: null,
  });
  mocks.signOut.mockImplementation(async () => {
    mocks.event!("SIGNED_OUT", null);
    return { error: null };
  });
});
describe("Session lifecycle (mocked Auth API)", () => {
  it("keeps initial session restoration pending until the SDK answers", async () => {
    const pending = deferred<unknown>();
    mocks.getSession.mockReturnValue(pending.promise);
    show();
    expect(state().loading).toBe(true);
    await act(async () => {
      pending.resolve({ data: { session: null }, error: null });
    });
    expect(state().loading).toBe(false);
  });
  it("does not restore an old session after a sign-out event", async () => {
    const pending = deferred<unknown>();
    mocks.getSession.mockReturnValue(pending.promise);
    show();
    await emit("SIGNED_OUT", null);
    await act(async () => {
      pending.resolve({ data: { session: session() }, error: null });
    });
    expect(state().id).toBeNull();
    expect(state().role).toBeNull();
  });
  it("discards a late role response when the user signs out", async () => {
    mocks.getSession.mockResolvedValue({
      data: { session: session() },
      error: null,
    });
    show();
    await waitFor(() => expect(state().role).toBe("estudante"));
    const pending = deferred<unknown>();
    mocks.single.mockReturnValueOnce(pending.promise);
    await userEvent.click(screen.getByText("Refresh"));
    await userEvent.click(screen.getByText("Logout"));
    await act(async () => {
      pending.resolve({ data: membership, error: null });
    });
    expect(state().id).toBeNull();
    expect(state().role).toBeNull();
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "global" });
  });
  it("rechecks backend permissions after a token refresh for the same account", async () => {
    mocks.getSession.mockResolvedValue({
      data: { session: session() },
      error: null,
    });
    show();
    await waitFor(() => expect(state().role).toBe("estudante"));
    mocks.single.mockResolvedValue({
      data: null,
      error: new Error("Access revoked"),
    });
    await emit("TOKEN_REFRESHED", session("token-b"));
    await waitFor(() => expect(state().error).toContain("Access revoked"));
    expect(state().role).toBeNull();
  });
  it("real recovery supersedes a previous demonstration identity", async () => {
    sessionStorage.setItem("skillup.demo.role", "instituicao");
    show();
    await emit("PASSWORD_RECOVERY", session());
    await waitFor(() => expect(state().role).toBe("estudante"));
    expect(state().demo).toBe(false);
    expect(state().recovery).toBe(true);
    expect(sessionStorage.getItem("skillup.demo.role")).toBeNull();
  });
  it("cannot enter demonstration over an existing real session", async () => {
    mocks.getSession.mockResolvedValue({
      data: { session: session() },
      error: null,
    });
    show();
    await waitFor(() => expect(state().role).toBe("estudante"));
    await userEvent.click(screen.getByText("Demo"));
    expect(state().demo).toBe(false);
    expect(state().role).toBe("estudante");
  });
  it("ignores a saved demo role when demonstration is disabled", async () => {
    mocks.demoEnabled = false;
    sessionStorage.setItem("skillup.demo.role", "instituicao");
    show();
    await waitFor(() => expect(state().loading).toBe(false));
    await userEvent.click(screen.getByText("Demo"));
    expect(state().demo).toBe(false);
    expect(state().id).toBeNull();
  });
});
