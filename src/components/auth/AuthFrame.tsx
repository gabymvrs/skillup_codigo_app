import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon, Modal } from "../ui";
export function AuthFrame({
  children,
  description,
  title = "Bem-vindo!",
  back = true,
  backTo = "/",
  onBack,
  step,
  footer = true,
  variant = "generic",
}: {
  children: ReactNode;
  description: string;
  title?: string;
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
            src="/assets/skillup-logo.png"
            alt="SkillUp"
            fetchPriority="high"
            decoding="async"
          />
          <h1>{title}</h1>
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
          {policy === "Termos" ? (
            <>
              <p>
                Ao criar uma conta, você se compromete a fornecer informações
                verdadeiras, proteger sua senha e usar o SkillUp para fins de
                aprendizagem, colaboração ou recrutamento legítimo.
              </p>
              <p>
                Não publique conteúdo ilegal, discriminatório, enganoso ou que
                viole direitos de outras pessoas. O acesso profissional depende
                da análise dos documentos enviados e não é liberado apenas pelo
                cadastro.
              </p>
            </>
          ) : policy === "Privacidade" ? (
            <>
              <p>
                O SkillUp usa os dados da conta para autenticação, aprendizagem,
                comunicação, emissão de certificados e recursos profissionais
                solicitados por você.
              </p>
              <p>
                Documentos de cadastro ficam em armazenamento privado. Você pode
                controlar a visibilidade do perfil e solicitar a exclusão da
                conta nas configurações.
              </p>
            </>
          ) : (
            <>
              <p>
                Publicações, mensagens e projetos devem respeitar outras pessoas
                e a finalidade educacional da plataforma. Denúncias podem ser
                analisadas pela instituição responsável.
              </p>
              <p>
                Materiais offline podem ser removidos na biblioteca. Sair pelas
                configurações remove as cópias da conta deste dispositivo.
              </p>
            </>
          )}
          <p className="small muted">Versão de 16 de novembro de 2026.</p>
        </Modal>
      )}
    </main>
  );
}
