import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { configured, demoEnabled, requireSupabase } from "../services/supabase";
import { roleLabels, type Role } from "../lib/types";
import { MfaChallenge } from "../components/Layout";
import {
  ActionFeedback,
  ActionLink,
  Button,
  Icon,
  Modal,
  Notice,
  useAction,
} from "../components/ui";
const allRoles = Object.keys(roleLabels) as Role[];
function AuthFrame({
  children,
  description,
  back = true,
}: {
  children: React.ReactNode;
  description: string;
  back?: boolean;
}) {
  const [policy, setPolicy] = useState("");
  return (
    <main className="auth-page">
      <div className="auth-panel">
        {back && (
          <Link
            to="/"
            className="auth-back icon-button"
            aria-label="Voltar ao início"
          >
            <Icon name="arrow" />
          </Link>
        )}
        <img
          className="app-logo"
          src="/assets/skillup-logo.png"
          alt="SkillUp"
        />
        <h1>Bem-vindo!</h1>
        <p className="auth-description">{description}</p>
        {children}
        <footer>
          {["Termos", "Privacidade", "Políticas"].map((x) => (
            <button className="text-link" key={x} onClick={() => setPolicy(x)}>
              {x}
            </button>
          ))}
        </footer>
      </div>
      {policy && (
        <Modal title={policy} onClose={() => setPolicy("")}>
          <p>
            Esta é uma versão de desenvolvimento do SkillUp. A demonstração
            mantém dados de exemplo neste navegador. Contas reais usam o projeto
            Supabase configurado pela instituição responsável.
          </p>
          <p>
            Os documentos institucionais definitivos de {policy.toLowerCase()}{" "}
            ainda precisam ser fornecidos pelo responsável pela implantação.
            Este texto não declara conformidade ou reconhecimento institucional.
          </p>
          <p>
            Materiais salvos no app podem ser removidos em Biblioteca offline.
            Sair remove essas cópias da conta neste dispositivo.
          </p>
        </Modal>
      )}
    </main>
  );
}
export function Welcome() {
  const auth = useAuth();
  if (auth.id && auth.role) return <Navigate to="/app/home" replace />;
  return (
    <AuthFrame
      description="Selecione como deseja entrar no aplicativo."
      back={false}
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
          <Link to="/demonstracao">Explorar a demonstração</Link>
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
      Ambiente de demonstração disponível. Não cria uma conta real.
    </p>
  );
}
export function RolePicker() {
  return (
    <AuthFrame description="Selecione com qual tipo de conta você mais se identifica.">
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
    navigate = useNavigate();
  if (!demoEnabled) return <Navigate to="/login" replace />;
  if (auth.id && !auth.demo) return <Navigate to="/app/home" replace />;
  return (
    <AuthFrame description="Conheça os quatro espaços com dados de exemplo.">
      <Notice>
        Todos os registros e alterações deste modo ficam neste navegador. Não há
        autenticação, candidatura ou atendimento real.
      </Notice>
      <div className="auth-options">
        {allRoles.map((role) => (
          <Button
            variant="outline"
            key={role}
            onClick={() => {
              auth.startDemo(role);
              navigate("/app/home");
            }}
          >
            {roleLabels[role]}
          </Button>
        ))}
      </div>
    </AuthFrame>
  );
}
export function Login() {
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
      navigate("/app/home");
    });
  }
  return (
    <AuthFrame description="Complete as informações para entrar na sua conta.">
      {!configured && (
        <Notice>
          O acesso real ainda não foi configurado. Você pode explorar a
          demonstração.
        </Notice>
      )}
      <form className="auth-form" onSubmit={submit}>
        <label>
          E-mail
          <input
            name="email"
            autoComplete="email"
            type="email"
            placeholder="seu@email.com"
            required
          />
        </label>
        <label>
          Senha
          <input
            name="password"
            autoComplete="current-password"
            type="password"
            required
          />
        </label>
        <Link className="text-link" to="/recuperar-senha">
          Esqueci minha senha
        </Link>
        <Button type="submit" disabled={!configured || action.busy}>
          {action.busy ? "Entrando…" : "Fazer login"}
        </Button>
        <ActionFeedback action={action} />
      </form>
      <Link to="/perfis">Não tenho uma conta</Link>
      {demoEnabled && <Link to="/demonstracao">Entrar na demonstração</Link>}
    </AuthFrame>
  );
}
export function Signup() {
  const { role: input } = useParams(),
    role = allRoles.includes(input as Role) ? (input as Role) : "estudante",
    action = useAction(),
    [done, setDone] = useState(false),
    [email, setEmail] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      password = String(f.get("password"));
    if (password !== f.get("confirm")) {
      action.setError("As senhas precisam ser iguais.");
      return;
    }
    await action.run(async () => {
      const { error } = await requireSupabase().auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: String(f.get("name")).trim(),
            requested_role: role,
            organization_name: String(f.get("organization") || ""),
            registration_number: String(f.get("registration") || ""),
            cnae: String(f.get("cnae") || ""),
          },
        },
      });
      if (error) throw error;
      setDone(true);
    });
  }
  return (
    <AuthFrame description={`Cadastro de ${roleLabels[role].toLowerCase()}.`}>
      {done ? (
        <div className="stack">
          <Notice tone="success">
            Verifique sua caixa de entrada. Se o endereço puder receber um
            cadastro, você receberá as instruções para confirmar o e-mail.
          </Notice>
          <p>
            Depois da confirmação, entre para completar seu perfil
            {role === "estudante"
              ? "."
              : " e anexar a documentação para análise."}
          </p>
          <ActionLink to="/login">Ir para login</ActionLink>
        </div>
      ) : (
        <>
          <Notice>
            {role === "estudante"
              ? "A conta será ativada após a confirmação de e-mail."
              : "O acesso profissional depende de aprovação. A seleção deste perfil não libera permissões administrativas."}
          </Notice>
          <form className="auth-form" onSubmit={submit}>
            <label>
              Nome completo
              <input
                name="name"
                autoComplete="name"
                minLength={2}
                maxLength={80}
                required
              />
            </label>
            <label>
              E-mail
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>
            <label>
              Senha
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
              />
              <small>Mínimo de 8 caracteres.</small>
            </label>
            <label>
              Confirmar senha
              <input
                type="password"
                name="confirm"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            {role !== "estudante" && (
              <>
                <label>
                  {role === "instituicao"
                    ? "Razão social"
                    : "Instituição ou empresa vinculada"}
                  <input name="organization" maxLength={160} required />
                </label>
                {role !== "docente" && (
                  <label>
                    CNPJ ou registro institucional
                    <input name="registration" maxLength={32} required />
                  </label>
                )}
                {role === "instituicao" && (
                  <label>
                    CNAE
                    <input name="cnae" maxLength={30} required />
                  </label>
                )}
                <p className="small muted">
                  Os documentos serão anexados na segunda etapa, após confirmar
                  sua conta.
                </p>
              </>
            )}
            <Button type="submit" disabled={!configured || action.busy}>
              {action.busy ? "Aguarde…" : "Criar conta"}
            </Button>
            <ActionFeedback action={action} />
            {!configured && (
              <Notice>
                A autenticação real não está configurada nesta implantação.
              </Notice>
            )}
          </form>
          <Link to="/login">Já tenho uma conta</Link>
        </>
      )}
    </AuthFrame>
  );
}
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
          <ActionLink to="/app/home">Continuar</ActionLink>
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
