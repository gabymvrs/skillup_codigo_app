import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import type { Role, UserRole } from "../lib/types";
import { demoEnabled, requireSupabase, supabase } from "../services/supabase";
import { demoUsers } from "../data/demo";
import { errorMessage } from "../lib/utils";
const roles: Role[] = ["estudante", "docente", "recrutador", "instituicao"];
function savedDemo(): Role | null {
  try {
    const r = sessionStorage.getItem("skillup.demo.role") as Role;
    return demoEnabled && roles.includes(r) ? r : null;
  } catch {
    return null;
  }
}
interface AuthValue {
  id: string | null;
  email: string;
  role: Role | null;
  organizationId: string | null;
  demo: boolean;
  loading: boolean;
  error: string;
  recovery: boolean;
  mfaRequired: boolean;
  setRecovery: (v: boolean) => void;
  startDemo: (r: Role) => void;
  logout: () => Promise<void>;
  refreshRole: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
}
const AuthContext = createContext<AuthValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [demoRole, setDemoRole] = useState(savedDemo),
    [session, setSession] = useState<Session | null>(null),
    [membership, setMembership] = useState<UserRole | null>(null),
    [loading, setLoading] = useState(Boolean(supabase && !demoRole)),
    [error, setError] = useState(""),
    [recovery, setRecovery] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [initialized, setInitialized] = useState(!supabase);
  const currentSession = useRef(session);
  currentSession.current = session;
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    let authEventReceived = false;
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (active && !authEventReceived) {
          currentSession.current = data.session;
          setSession(data.session);
          setInitialized(true);
          if (error) setError(error.message);
          if (!data.session) setLoading(false);
        }
      })
      .catch((e) => {
        if (active && !authEventReceived) {
          setError(errorMessage(e));
          setInitialized(true);
          setLoading(false);
        }
      });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, next) => {
      if (!active) return;
      authEventReceived = true;
      currentSession.current = next;
      setSession(next);
      setInitialized(true);
      // Confirmation/recovery must never be hidden by a previous demo visit.
      if (next) {
        sessionStorage.removeItem("skillup.demo.role");
        setDemoRole(null);
      }
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      if (event === "SIGNED_OUT") {
        setMembership(null);
        setLoading(false);
        setRecovery(false);
        setMfaRequired(false);
        setError("");
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  async function refreshRole() {
    if (!session || demoRole) return;
    const token = session.access_token;
    setMembership(null);
    setLoading(true);
    try {
      const assurance =
        await requireSupabase().auth.mfa.getAuthenticatorAssuranceLevel();
      if (assurance.error) throw assurance.error;
      if (currentSession.current?.access_token !== token) return;
      const needsMfa =
        assurance.data.nextLevel === "aal2" &&
        assurance.data.currentLevel !== "aal2";
      setMfaRequired(needsMfa);
      if (needsMfa) return;
      const { data, error } = await requireSupabase()
        .from("user_roles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();
      if (error) throw error;
      if (currentSession.current?.access_token !== token) return;
      setMembership(data as UserRole);
      setError("");
    } catch (e) {
      if (currentSession.current?.access_token === token)
        setError(errorMessage(e));
      throw e;
    } finally {
      if (currentSession.current?.access_token === token) setLoading(false);
    }
  }
  useEffect(() => {
    if (demoRole) {
      setLoading(false);
      return;
    }
    if (!session) {
      setMembership(null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    setMembership(null);
    requireSupabase()
      .auth.mfa.getAuthenticatorAssuranceLevel()
      .then(async (assurance) => {
        if (!active) return;
        if (assurance.error) throw assurance.error;
        const needsMfa =
          assurance.data.nextLevel === "aal2" &&
          assurance.data.currentLevel !== "aal2";
        setMfaRequired(needsMfa);
        if (needsMfa) {
          setLoading(false);
          return;
        }
        const { data, error } = await requireSupabase()
          .from("user_roles")
          .select("*")
          .eq("user_id", session.user.id)
          .single();
        if (!active) return;
        if (error)
          setError(
            "Não foi possível validar seu perfil no servidor. " +
              errorMessage(error),
          );
        else setMembership(data as UserRole);
        setLoading(false);
      })
      .catch((e) => {
        if (active) {
          setError(errorMessage(e));
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [session?.access_token, demoRole]);
  function startDemo(role: Role) {
    if (!demoEnabled || currentSession.current || !roles.includes(role)) return;
    sessionStorage.setItem("skillup.demo.role", role);
    setDemoRole(role);
    setError("");
    setMfaRequired(false);
  }
  async function logout() {
    if (session && supabase) {
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) throw error;
    }
    sessionStorage.removeItem("skillup.demo.role");
    setDemoRole(null);
    setSession(null);
    currentSession.current = null;
    setMembership(null);
    setRecovery(false);
    setMfaRequired(false);
  }
  async function signIn(email: string, password: string) {
    const { error } = await requireSupabase().auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    sessionStorage.removeItem("skillup.demo.role");
    setDemoRole(null);
  }
  return (
    <AuthContext.Provider
      value={{
        id: demoRole ? demoUsers[demoRole] : session?.user.id || null,
        email: demoRole ? "" : session?.user.email || "",
        role:
          demoRole ||
          (membership?.user_id === session?.user.id
            ? membership?.role
            : null) ||
          null,
        organizationId: demoRole
          ? "00000000-0000-4000-8000-000000000008"
          : membership?.organization_id || null,
        demo: Boolean(demoRole),
        loading: loading || (!initialized && !demoRole),
        error,
        recovery,
        mfaRequired,
        setRecovery,
        startDemo,
        logout,
        refreshRole,
        signIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider ausente");
  return value;
}
