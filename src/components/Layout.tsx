import { learningStats } from "../services/learning";
import { Avatar } from "./Avatar";
import { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { useData } from "../state/DataContext";
import { roleLabels } from "../lib/types";
import { requireSupabase } from "../services/supabase";
import { GlobalSupport } from "./Support";
import {
  ActionLink,
  Button,
  Icon,
  Loading,
  Notice,
  useAction,
  ActionFeedback,
} from "./ui";
const nav = [
  ["home", "Home", "home"],
  ["aprenda", "Aprenda", "book"],
  ["social", "Social", "users"],
  ["emprego", "Emprego", "briefcase"],
  ["config", "Config.", "settings"],
];
export function AuthGate() {
  const auth = useAuth(),
    action = useAction(),
    location = useLocation();
  if (auth.loading) return <Loading />;
  if (auth.recovery) return <Navigate to="/redefinir-senha" replace />;
  if (!auth.id)
    return (
      <Navigate
        to={
          location.pathname === "/cadastro/documentos"
            ? "/login?cadastro=1"
            : "/login"
        }
        replace
      />
    );
  if (auth.mfaRequired) return <MfaChallenge />;
  if (auth.error || !auth.role)
    return (
      <main className="standalone stack">
        <h1>Precisamos validar seu acesso</h1>
        <Notice tone="error">
          {auth.error || "Seu perfil ainda não está disponível."}
        </Notice>
        <Button onClick={() => action.run(auth.refreshRole)}>
          Tentar novamente
        </Button>
        <ActionLink to="/offline" variant="outline">
          Abrir materiais offline
        </ActionLink>
        <Button variant="ghost" onClick={() => action.run(auth.logout)}>
          Voltar ao login
        </Button>
        <ActionFeedback action={action} />
      </main>
    );
  return <Outlet />;
}
export function MfaChallenge() {
  const auth = useAuth(),
    action = useAction(),
    [code, setCode] = useState("");
  return (
    <main className="standalone stack narrow">
      <h1>Confirme seu acesso</h1>
      <p>Digite o código de seis dígitos do seu aplicativo autenticador.</p>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          void action.run(async () => {
            const { data, error } =
              await requireSupabase().auth.mfa.listFactors();
            if (error) throw error;
            const factor = data.totp.find((f) => f.status === "verified");
            if (!factor) throw new Error("Autenticador não encontrado.");
            const result = await requireSupabase().auth.mfa.challengeAndVerify({
              factorId: factor.id,
              code,
            });
            if (result.error) throw result.error;
            await auth.refreshRole();
          });
        }}
      >
        <label>
          Código de verificação
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
        </label>
        <Button type="submit" disabled={action.busy}>
          Verificar código
        </Button>
        <ActionFeedback action={action} />
      </form>
      <Button variant="ghost" onClick={() => action.run(auth.logout)}>
        Voltar ao login
      </Button>
    </main>
  );
}
function Navigation({ close }: { close: () => void }) {
  return (
    <>
      {nav.map(([path, label, icon]) => (
        <NavLink
          key={path}
          to={`/app/${path}`}
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          onClick={close}
        >
          <Icon name={icon} size={23} />
          <span>{label}</span>
        </NavLink>
      ))}
    </>
  );
}
export function Layout() {
  const auth = useAuth(),
    repo = useData(),
    location = useLocation(),
    [online, setOnline] = useState(navigator.onLine),
    [menu, setMenu] = useState(false),
    action = useAction();
  const learning = learningStats(repo.data, auth.id!);
  const profile = repo.data.profiles.find((x) => x.id === auth.id),
    unread = repo.data.notifications.filter(
      (x) => x.user_id === auth.id && !x.read_at,
    ).length;
  useEffect(() => {
    document.documentElement.dataset.largeText = String(
      Boolean(profile?.preferences.large_text),
    );
    document.documentElement.dataset.reducedMotion = String(
      Boolean(profile?.preferences.reduced_motion),
    );
    return () => {
      delete document.documentElement.dataset.largeText;
      delete document.documentElement.dataset.reducedMotion;
    };
  }, [profile?.preferences.large_text, profile?.preferences.reduced_motion]);
  useEffect(() => {
    const on = () => setOnline(true),
      off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  useEffect(() => {
    setMenu(false);
    window.scrollTo({ top: 0, behavior: "instant" });
    document.getElementById("page-content")?.focus();
  }, [location.pathname]);
  return (
    <>
      <a className="skip-link" href="#page-content">
        Pular para o conteúdo
      </a>
      <div className="app-layout">
        <aside
          className={`side-nav ${menu ? "open" : ""}`}
          aria-label="Menu lateral"
        >
          <Link to="/app/home" className="wordmark">
            <img src="/assets/skillup-logo.png" alt="" />
            <span>SkillUp</span>
          </Link>
          <nav aria-label="Navegação principal">
            <Navigation close={() => setMenu(false)} />
          </nav>
          <div className="side-footer">
            <Avatar
              name={profile?.full_name || "Sua conta"}
              path={profile?.avatar_path}
              demoImage={profile?.avatar_demo}
            />
            <div>
              <strong>{profile?.full_name || "Sua conta"}</strong>
              <small>{roleLabels[auth.role!]}</small>
            </div>
          </div>
        </aside>
        {menu && (
          <button
            className="nav-backdrop"
            aria-label="Fechar menu"
            onClick={() => setMenu(false)}
          />
        )}
        <div className="app-main">
          <header className="topbar">
            <button
              className="icon-button mobile-menu"
              aria-label={menu ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menu}
              onClick={() => setMenu((v) => !v)}
            >
              <Icon name={menu ? "x" : "menu"} />
            </button>
            <Link className="topbar-title" to="/app/home">
              SkillUp <span>{roleLabels[auth.role!]}</span>
            </Link>
            {auth.role === "estudante" && (
              <div className="header-learning" aria-label="Seu progresso">
                <span>
                  <Icon
                    name="flame"
                    size={14}
                    className={
                      learning.current > 0
                        ? "streak-flame active"
                        : "streak-flame"
                    }
                  />
                  {learning.current}
                </span>
                <span>{learning.xp} XP</span>
              </div>
            )}
            <span
              className={`connection ${online ? "" : "is-offline"}`}
              role="status"
            >
              <Icon name={online ? "wifi" : "offline"} size={14} />
              {online ? "Online" : "Offline"}
            </span>
            <Link
              className="icon-button notification-link"
              to="/app/notificacoes"
              aria-label={`Notificações${unread ? `, ${unread} não lidas` : ""}`}
            >
              <Icon name="bell" />
              {unread > 0 && <span>{unread}</span>}
            </Link>
          </header>
          {auth.demo && (
            <div className="demo-banner">
              <span>
                <strong>Demonstração</strong> · dados de exemplo, salvos neste
                navegador
              </span>
              <Link to="/demonstracao">Trocar perfil</Link>
            </div>
          )}
          {!online && (
            <div className="offline-banner">
              Você está offline.{" "}
              <Link to="/offline">Abrir materiais salvos</Link>
            </div>
          )}
          <main id="page-content" className="page-content" tabIndex={-1}>
            {repo.loading ? (
              <Loading />
            ) : repo.error ? (
              <div className="stack">
                <Notice tone="error">
                  Não foi possível carregar os dados. {repo.error}
                </Notice>
                <Button
                  disabled={action.busy}
                  onClick={() => action.run(repo.reload)}
                >
                  Tentar novamente
                </Button>
                <ActionLink to="/offline" variant="outline">
                  Abrir biblioteca offline
                </ActionLink>
                <ActionFeedback action={action} />
              </div>
            ) : (
              <>
                {repo.syncError && (
                  <Notice tone="warning">{repo.syncError}</Notice>
                )}
                <Outlet />
              </>
            )}
          </main>
        </div>
      </div>
      <nav className="bottom-nav" aria-label="Navegação principal mobile">
        <Navigation close={() => setMenu(false)} />
      </nav>
      {!repo.loading && !repo.error && <GlobalSupport />}
    </>
  );
}
export function LearnLayout() {
  const { role } = useAuth();
  return (
    <>
      {(role === "estudante" || role === "docente") && (
        <nav className="subtabs" aria-label="Seções de aprendizagem">
          {[
            ["material", "Material"],
            ["pratica", "Prática"],
            ["trilhas", "Trilhas"],
            ["suporte", "Suporte"],
          ].map(([path, label]) => (
            <NavLink key={path} to={`/app/aprenda/${path}`}>
              {label}
            </NavLink>
          ))}
        </nav>
      )}
      <Outlet />
    </>
  );
}
export function SocialLayout() {
  const { role } = useAuth();
  return (
    <>
      {(role === "estudante" || role === "docente") && (
        <nav className="subtabs" aria-label="Seções da comunidade">
          {[
            ["inicio", "Início"],
            ["foruns", "Fóruns"],
            ["projetos", "Projetos"],
            ["feed", "Feed"],
          ].map(([path, label]) => (
            <NavLink key={path} to={`/app/social/${path}`}>
              {label}
            </NavLink>
          ))}
        </nav>
      )}
      <Outlet />
    </>
  );
}
