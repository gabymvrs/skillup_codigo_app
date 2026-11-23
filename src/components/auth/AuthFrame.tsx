import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../ui";
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
            <Link to="/termos">Termos</Link>
            <Link to="/privacidade">Privacidade</Link>
            <Link to="/cookies">Cookies</Link>
          </footer>
        )}
      </div>
    </main>
  );
}
