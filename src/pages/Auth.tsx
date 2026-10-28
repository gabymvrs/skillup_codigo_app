import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { configured, demoEnabled, requireSupabase } from "../services/supabase";
import { roleLabels, type Role } from "../lib/types";
import { MfaChallenge } from "../components/Layout";
import {
  ActionFeedback,
  ActionLink,
  Button,
  Notice,
  useAction,
} from "../components/ui";
import { AuthFrame } from "../components/auth/AuthFrame";
import { PasswordField } from "../components/auth/PasswordField";
import { SocialSignIn } from "../components/auth/SocialSignIn";
const allRoles: Role[] = ["estudante", "instituicao", "docente", "recrutador"];
export function Welcome() {
  const auth = useAuth();
  if (auth.id && auth.role) return <Navigate to="/app/home" replace />;
  return (
    <AuthFrame
      description="Selecione como deseja entrar no aplicativo."
      back={false}
      variant="welcome"
    >
      <div className="auth-options">
        <ActionLink to="/perfis" variant="outline">
          Criar conta
        </ActionLink>
        <ActionLink to="/login" variant="outline">
          Entrar na conta
        </ActionLink>
      </div>
      {demoEnabled && (
        <div className="demo-entry">
          <BadgeDemo />
          <ActionLink to="/demonstracao" variant="outline">
            Explorar sem login
          </ActionLink>
        </div>
      )}
      <Link className="text-link" to="/ajuda">
        Precisa de ajuda? Clique aqui!
      </Link>
      <Link className="text-link" to="/offline">
        Abrir biblioteca offline
      </Link>
    </AuthFrame>
  );
}
function BadgeDemo() {
  return (
    <p className="small muted">
      Demonstração com dados de exemplo. Não precisa criar uma conta.
    </p>
  );
}
export function RolePicker() {
  return (
    <AuthFrame
      description="Selecione com qual tipo de conta você mais se identifica."
      back={false}
      variant="roles"
    >
      <div className="auth-options">
        {allRoles.map((role) => (
          <ActionLink
            key={role}
            to={`/cadastro/${role}`}
            variant="outline"
            icon={
              {
                estudante: "graduation",
                docente: "users",
                recrutador: "briefcase",
                instituicao: "building",
              }[role]
            }
          >
            {roleLabels[role]}
          </ActionLink>
        ))}
      </div>
      <Link to="/login">Já tenho uma conta</Link>
    </AuthFrame>
  );
}
export function DemoPicker() {
  const auth = useAuth(),
    navigate = useNavigate(),
    action = useAction();
  if (!demoEnabled) return <Navigate to="/login" replace />;
  if (auth.loading) return <p role="status">Preparando versão de teste…</p>;
  const signedIn = Boolean(auth.id && !auth.demo);
  const descriptions: Record<Role, string> = {
    estudante: "Aprendizagem, trilhas, práticas, comunidade e oportunidades.",
    docente: "Turmas, atividades e acompanhamento dos estudantes.",
    recrutador: "Vagas, candidatos e mensagens profissionais.",
    instituicao: "Gestão de turmas, docentes, estudantes e indicadores.",
  };
  return (
    <AuthFrame
      title="Versão de teste"
      description="Escolha um perfil para explorar a navegação. Não precisa criar uma conta."
    >
      <Notice>
        Dados demonstrativos. As alterações ficam neste navegador e não afetam
        contas reais. Você pode trocar de perfil durante o teste.
      </Notice>
      {signedIn ? (
        <div className="stack">
          <Notice tone="warning">
            Você está em uma conta real. Para testar outros perfis, saia dessa
            conta primeiro. Isso encerra suas sessões reais.
          </Notice>
          <Button
            disabled={action.busy}
            onClick={() => action.run(auth.logout)}
          >
            Sair da conta e liberar teste
          </Button>
          <Link to="/app/home">Voltar à minha conta</Link>
          <ActionFeedback action={action} />
        </div>
      ) : (
        <div className="demo-profile-list">
          {allRoles.map((role) => (
            <div className="demo-profile-option" key={role}>
              <Button
                variant="outline"
                onClick={() => {
                  auth.startDemo(role);
                  navigate("/app/home", { replace: true });
                }}
              >
                {roleLabels[role]}
              </Button>
              <p className="small muted">{descriptions[role]}</p>
            </div>
          ))}
          <Link to="/login">Entrar com uma conta real</Link>
        </div>
      )}
    </AuthFrame>
  );
}
export function Login() {
  const [search] = useSearchParams();
  const auth = useAuth(),
    navigate = useNavigate(),
    action = useAction();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await action.run(async () => {
      await auth.signIn(
        String(form.get("email")).trim(),
        String(form.get("password")),
      );
      navigate(
        search.get("cadastro") === "1" ? "/cadastro/documentos" : "/app/home",
      );
    });
  }
  return (
    <AuthFrame
      description="Complete as informações para concluir o Login."
      back={false}
      variant="login"
    >
      {!configured && (
        <Notice>
          O acesso real ainda não foi configurado. Você pode explorar a
          demonstração.
        </Notice>
      )}
      <form className="auth-form" onSubmit={submit}>
        <label>
          E-mail:
          <input
            name="email"
            autoComplete="email"
            type="email"
            placeholder="Ex: Aluno@gmail.com"
            required
          />
        </label>
        <PasswordField />
        <Link className="auth-account-link" to="/perfis">
          Não tenho uma conta
        </Link>
        <Button type="submit" disabled={!configured || action.busy}>
          {action.busy ? "Entrando…" : "Fazer Login"}
        </Button>
        <ActionFeedback action={action} />
      </form>
      <Link className="auth-recovery-link" to="/recuperar-senha">
        Esqueci minha senha
      </Link>
      <SocialSignIn />
      {demoEnabled && <Link to="/demonstracao">Explorar sem login</Link>}
    </AuthFrame>
  );
}
export { Signup } from "./Registration";
export function Recover() {
  const action = useAction();
  return (
    <AuthFrame description="Receba um link para redefinir sua senha.">
      <form
        className="auth-form"
        onSubmit={(e) => {
          e.preventDefault();
          const email = String(new FormData(e.currentTarget).get("email"));
          void action.run(async () => {
            const { error } =
              await requireSupabase().auth.resetPasswordForEmail(email, {
                redirectTo: `${location.origin}/redefinir-senha`,
              });
            if (error) throw error;
          }, "Se houver uma conta com esse e-mail, as instruções serão enviadas.");
        }}
      >
        <label>
          E-mail
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <Button type="submit" disabled={!configured || action.busy}>
          Enviar link de recuperação
        </Button>
        <ActionFeedback action={action} />
      </form>
      <Link to="/login">Voltar ao login</Link>
    </AuthFrame>
  );
}
export function ResetPassword() {
  const auth = useAuth(),
    action = useAction(),
    [done, setDone] = useState(false);
  if (auth.loading)
    return (
      <AuthFrame description="Verificando sua sessão…">
        <p>Aguarde…</p>
      </AuthFrame>
    );
  if (!auth.demo && auth.mfaRequired) return <MfaChallenge />;
  return (
    <AuthFrame description="Escolha uma nova senha para sua conta.">
      {done ? (
        <div className="stack">
          <Notice tone="success">
            Senha atualizada. Entre novamente com a nova senha.
          </Notice>
          <ActionLink to="/login">Ir para login</ActionLink>
        </div>
      ) : !auth.id || auth.demo ? (
        <Notice>
          Abra o link enviado ao seu e-mail para iniciar a recuperação.
        </Notice>
      ) : (
        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            if (f.get("password") !== f.get("confirm")) {
              action.setError("As senhas precisam ser iguais.");
              return;
            }
            void action.run(async () => {
              const { error } = await requireSupabase().auth.updateUser({
                password: String(f.get("password")),
              });
              if (error) throw error;
              // Explicit global sign-out revokes the recovery session too.
              await auth.logout();
              auth.setRecovery(false);
              setDone(true);
            }, "Senha atualizada.");
          }}
        >
          <label>
            Nova senha
            <input
              name="password"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
            />
          </label>
          <label>
            Confirmar senha
            <input
              name="confirm"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
            />
          </label>
          <Button type="submit" disabled={action.busy || auth.demo}>
            Salvar nova senha
          </Button>
          <ActionFeedback action={action} />
        </form>
      )}
    </AuthFrame>
  );
}
export function AuthCallback() {
  const auth = useAuth();
  return (
    <AuthFrame description="Confirmação do seu acesso.">
      {auth.loading ? (
        <p>Verificando sua sessão…</p>
      ) : auth.error ? (
        <Notice tone="error">{auth.error}</Notice>
      ) : auth.id && !auth.demo ? (
        <>
          <Notice tone="success">Sessão confirmada.</Notice>
          <ActionLink to="/cadastro/documentos">Continuar cadastro</ActionLink>
          <Link to="/app/home">Ir para o aplicativo</Link>
        </>
      ) : (
        <>
          <Notice>
            Não foi possível confirmar a sessão. O link pode ter expirado.
            Solicite um novo e-mail abaixo.
          </Notice>
          <ResendConfirmation />
        </>
      )}
      <Link to="/login">Ir para login</Link>
    </AuthFrame>
  );
}
export function ResendConfirmation() {
  const action = useAction();
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        const email = String(new FormData(e.currentTarget).get("email"));
        void action.run(async () => {
          const { error } = await requireSupabase().auth.resend({
            type: "signup",
            email,
            options: { emailRedirectTo: `${location.origin}/auth/callback` },
          });
          if (error) throw error;
        }, "Se aplicável, um novo e-mail de confirmação foi enviado.");
      }}
    >
      <label>
        E-mail
        <input type="email" name="email" required />
      </label>
      <Button type="submit" disabled={!configured || action.busy}>
        Reenviar confirmação
      </Button>
      <ActionFeedback action={action} />
    </form>
  );
}
