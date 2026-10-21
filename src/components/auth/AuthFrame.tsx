import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon, Modal } from "../ui";
export function AuthFrame({
  children,
  description,
  back = true,
  backTo = "/",
  onBack,
  step,
  footer = true,
  variant = "form",
}: {
  children: ReactNode;
  description: string;
  back?: boolean;
  backTo?: string;
  onBack?: () => void;
  step?: string;
  footer?: boolean;
  variant?: string;
}) {
  const [policy, setPolicy] = useState("");
  return (
    <main className={`auth-page auth-${variant}`}>
      <div className="auth-panel">
        {back &&
          (onBack ? (
            <button
              className="auth-back icon-button"
              onClick={onBack}
              aria-label="Voltar à etapa anterior"
            >
              <Icon name="arrow" size={28} />
            </button>
          ) : (
            <Link
              to={backTo}
              className="auth-back icon-button"
              aria-label="Voltar"
            >
              <Icon name="arrow" size={28} />
            </Link>
          ))}
        {step && (
          <span
            className="auth-step"
            aria-label={`Etapa ${step.replace("/", " de ")}`}
          >
            {step}
          </span>
        )}
        <header className="auth-header">
          <img
            className="app-logo"
            src="/assets/skillup-auth-logo.png"
            alt="SkillUp"
          />
          <h1>Bem-vindo!</h1>
          <p className="auth-description">{description}</p>
        </header>
        {children}
        {footer && (
          <footer>
            {["Termos", "Privacidade", "Políticas"].map((x) => (
              <button
                className="text-link"
                key={x}
                onClick={() => setPolicy(x)}
              >
                {x}
              </button>
            ))}
          </footer>
        )}
      </div>
      {policy && (
        <Modal title={policy} onClose={() => setPolicy("")}>
          <p>
            Esta é uma versão de desenvolvimento do SkillUp. Contas reais usam o
            Supabase configurado pelo responsável pela implantação.
          </p>
          <p>
            Os documentos definitivos de {policy.toLowerCase()} ainda precisam
            ser fornecidos pelo responsável. Este aviso não substitui esses
            documentos.
          </p>
          <p>
            Documentos de cadastro são enviados ao armazenamento privado depois
            da confirmação do e-mail. A demonstração não recebe documentos
            pessoais.
          </p>
          <p>
            Materiais offline podem ser removidos na biblioteca. Sair pelas
            configurações remove as cópias da conta neste dispositivo.
          </p>
        </Modal>
      )}
    </main>
  );
}
