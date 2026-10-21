import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { AuthFrame } from "../components/auth/AuthFrame";
import { PasswordField } from "../components/auth/PasswordField";
import { UploadField } from "../components/auth/UploadField";
import {
  ActionFeedback,
  ActionLink,
  Button,
  Modal,
  Notice,
  useAction,
} from "../components/ui";
import { roleLabels, type Role, type RoleRequest } from "../lib/types";
import { useAuth } from "../state/AuthContext";
import { configured, requireSupabase } from "../services/supabase";
import {
  documentPath,
  loadRegistration,
  registrationDocuments,
  responsibilityText,
  saveRegistration,
  stagedStudentDocument,
  stageStudentDocument,
} from "../services/registration";
export function Signup() {
  const { role: input } = useParams();
  const role: Role = Object.hasOwn(roleLabels, input || "")
    ? (input as Role)
    : "estudante";
  return <SignupForm key={role} role={role} />;
}
function SignupForm({ role }: { role: Role }) {
  const action = useAction(),
    auth = useAuth();
  const [done, setDone] = useState(false),
    [file, setFile] = useState<File>();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      f = new FormData(form),
      email = String(f.get("email")).trim();
    await action.run(async () => {
      const { error } = await requireSupabase().auth.signUp({
        email,
        password: String(f.get("password")),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { requested_role: role },
        },
      });
      if (error) throw error;
      if (role === "estudante") stageStudentDocument(email, file);
      form.reset();
      setDone(true);
    });
  }
  if (auth.id && !auth.demo && !done)
    return <Navigate to="/cadastro/documentos" replace />;
  return (
    <AuthFrame
      description="Complete as informações para concluir o cadastro."
      backTo="/perfis"
      footer={false}
      variant="signup"
    >
      {done ? (
        <div className="stack registration-result">
          <Notice tone="success">
            Verifique sua caixa de entrada. Se o endereço puder receber um
            cadastro, você receberá as instruções para confirmar o e-mail.
          </Notice>
          <p>
            Depois da confirmação, continue o cadastro para enviar seus
            documentos.
          </p>
          {file && (
            <p>
              Seu arquivo está apenas selecionado nesta aba por até 30 minutos.
              Se abrir outra aba ou recarregar, selecione-o novamente após
              entrar.
            </p>
          )}
          <ActionLink
            to={
              auth.id && !auth.demo
                ? "/cadastro/documentos"
                : "/login?cadastro=1"
            }
          >
            Já confirmei meu e-mail
          </ActionLink>
          <Link to="/auth/callback">Reenviar confirmação</Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={submit}>
          {role !== "estudante" && (
            <p className="registration-context">
              {roleLabels[role]} · Primeiro, crie seu acesso. Após confirmar o
              e-mail, complete os dados e documentos do perfil.
            </p>
          )}
          <label>
            E-mail:
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Ex: Aluno@gmail.com"
              required
              maxLength={254}
            />
          </label>
          <PasswordField newPassword />
          <Link className="auth-account-link" to="/login">
            Já tenho uma conta
          </Link>
          {role === "estudante" && (
            <>
              <UploadField
                label="Carteira de estudante"
                student
                file={file}
                onChange={setFile}
                disabled={action.busy}
              />
              <p className="registration-hint">
                Opcional. O envio será feito depois de confirmar seu e-mail.
                Selecionar o arquivo agora não o envia.
              </p>
            </>
          )}
          <Button type="submit" disabled={!configured || action.busy}>
            {action.busy
              ? "Criando acesso…"
              : role === "estudante"
                ? "Completar Cadastro"
                : "Criar acesso"}
          </Button>
          <ActionFeedback action={action} />
          {!configured && (
            <Notice>
              O cadastro real ainda não foi configurado nesta implantação.
            </Notice>
          )}
        </form>
      )}
    </AuthFrame>
  );
}
export function RegistrationDocuments() {
  const auth = useAuth();
  if (auth.demo)
    return (
      <AuthFrame description="Documentação do cadastro." backTo="/app/home">
        <Notice>
          Documentos pessoais só podem ser enviados com uma conta real e e-mail
          confirmado. A demonstração não recebe arquivos.
        </Notice>
        <ActionLink to="/login?cadastro=1">
          Entrar com e-mail e senha
        </ActionLink>
      </AuthFrame>
    );
  return <DocumentForm key={auth.id} />;
}
function DocumentForm() {
  const auth = useAuth(),
    action = useAction();
  const [request, setRequest] = useState<RoleRequest | null>(null),
    [role, setRole] = useState<Role>("estudante");
  const [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState(""),
    [retry, setRetry] = useState(0);
  const [step, setStep] = useState(1),
    [done, setDone] = useState(false),
    [declaration, setDeclaration] = useState(false);
  const [accepted, setAccepted] = useState(false),
    [files, setFiles] = useState<Record<number, File | undefined>>({});
  const [info, setInfo] = useState({
    organization_name: "",
    registration_number: "",
    cnae: "",
  });
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    loadRegistration()
      .then((result) => {
        if (!active) return;
        setRequest(result.request);
        setRole(result.role);
        setAccepted(result.accepted);
        if (result.request)
          setInfo({
            organization_name: result.request.organization_name,
            registration_number: result.request.registration_number,
            cnae: result.request.cnae,
          });
        const staged = stagedStudentDocument(auth.email);
        if (staged && result.role === "estudante") setFiles({ 0: staged });
      })
      .catch((err) => {
        if (active) setLoadError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [auth.id, auth.email, retry]);
  function upload(index: number) {
    return (
      <UploadField
        key={index}
        label={registrationDocuments[role][index]}
        student={role === "estudante"}
        file={files[index]}
        stored={Boolean(documentPath(request, index))}
        disabled={action.busy}
        onChange={(file) =>
          setFiles((previous) => ({ ...previous, [index]: file }))
        }
      />
    );
  }
  function field(
    name: keyof typeof info,
    label: string,
    placeholder: string,
    maxLength: number,
  ) {
    return (
      <label>
        {label}:
        <input
          name={name}
          value={info[name]}
          placeholder={placeholder}
          maxLength={maxLength}
          required
          onChange={(e) => setInfo({ ...info, [name]: e.target.value })}
        />
      </label>
    );
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    action.setError("");
    if (role === "instituicao" && step === 1) {
      if (!files[0] && !documentPath(request, 0)) {
        action.setError("Anexe a Declaração institucional para avançar.");
        return;
      }
      setStep(2);
      window.scrollTo?.({ top: 0, behavior: "instant" });
      return;
    }
    await action.run(async () => {
      await saveRegistration({
        request,
        role,
        info,
        files,
        accepted,
        onProgress: (saved, index) => {
          setRequest(saved);
          if (index !== undefined)
            setFiles((previous) => ({ ...previous, [index]: undefined }));
        },
      });
      setDone(true);
    });
  }
  return (
    <AuthFrame
      description="Complete as informações para avançar com o cadastro."
      footer={false}
      variant="documents"
      backTo="/app/home"
      onBack={
        role === "instituicao" && step === 2 && !done
          ? () => {
              setStep(1);
              action.setError("");
            }
          : undefined
      }
      step={role === "instituicao" && !done ? `${step}/2` : undefined}
    >
      {loading ? (
        <p role="status">Carregando seu cadastro…</p>
      ) : loadError ? (
        <div className="stack">
          <Notice tone="error">{loadError}</Notice>
          <Button onClick={() => setRetry(retry + 1)}>Tentar novamente</Button>
        </div>
      ) : done ? (
        <div className="stack registration-result">
          <Notice tone="success">
            {request?.document_paths.length
              ? "Documentos armazenados no seu cadastro."
              : "Cadastro salvo sem documentos."}
          </Notice>
          <p>
            {role === "estudante"
              ? "Você pode continuar sua aprendizagem."
              : "Seu perfil profissional continua aguardando análise. O envio não libera permissões e não representa aprovação."}
          </p>
          <ActionLink to="/app/home">Ir para o aplicativo</ActionLink>
          <ActionLink to="/app/config/verificacao" variant="outline">
            Acompanhar verificação
          </ActionLink>
        </div>
      ) : (
        <form
          className="auth-form"
          onSubmit={submit}
          aria-label={`Documentos de ${roleLabels[role]}`}
        >
          {role === "estudante" && upload(0)}
          {role === "docente" && (
            <>
              {field(
                "organization_name",
                "Instituição vinculada",
                "Ex: Centro Educacional São José LTDA.",
                160,
              )}
              {upload(0)}
              {upload(1)}
            </>
          )}
          {role === "recrutador" && (
            <>
              {upload(0)}
              {upload(1)}
              {field(
                "registration_number",
                "CNPJ/ CPF",
                "Ex: 60.311.238/0001-98",
                32,
              )}
              <div className="responsibility-row">
                <input
                  id="responsibility"
                  type="checkbox"
                  checked={accepted}
                  required
                  onChange={(e) => setAccepted(e.target.checked)}
                />
                <div>
                  <label htmlFor="responsibility">
                    Concordo com a Declaração de responsabilidades
                  </label>
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => setDeclaration(true)}
                  >
                    Ler Declaração de responsabilidades
                  </button>
                </div>
              </div>
            </>
          )}
          {role === "instituicao" && step === 1 && (
            <>
              {field(
                "organization_name",
                "Razão Social",
                "Ex: Centro Educacional São José LTDA.",
                160,
              )}
              {field(
                "registration_number",
                "CNPJ",
                "Ex: 60.311.238/0001-98",
                32,
              )}
              {field("cnae", "CNAE", "Ex: 85.13-9-00 - Ensino fundamental", 30)}
              {upload(0)}
            </>
          )}
          {role === "instituicao" && step === 2 && (
            <>
              {upload(1)}
              {upload(2)}
              {upload(3)}
            </>
          )}
          <Button type="submit" disabled={action.busy}>
            {action.busy
              ? "Salvando documentos…"
              : role === "instituicao" && step === 1
                ? "Avançar"
                : role === "estudante"
                  ? "Completar Cadastro"
                  : "Concluir cadastro"}
          </Button>
          <ActionFeedback action={action} />
          <p className="registration-hint">
            {role === "estudante"
              ? "Carteira opcional. "
              : "O perfil profissional depende de aprovação. "}
            Arquivos selecionados só serão enviados ao concluir. Ao sair ou
            recarregar, selecione novamente os arquivos ainda não enviados.
          </p>
        </form>
      )}
      {declaration && (
        <Modal
          title="Declaração de responsabilidades"
          onClose={() => setDeclaration(false)}
        >
          <p>{responsibilityText}</p>
          <Notice>
            Texto provisório desta versão de desenvolvimento. Precisa da revisão
            do responsável antes da publicação definitiva.
          </Notice>
          <Button
            onClick={() => {
              setAccepted(true);
              setDeclaration(false);
            }}
          >
            Li e concordo
          </Button>
        </Modal>
      )}
    </AuthFrame>
  );
}
