import { useState } from "react";

export const COOKIE_NOTICE_KEY = "skillup.cookie-notice.v1";

function alreadyAccepted() {
  try {
    return localStorage.getItem(COOKIE_NOTICE_KEY) === "accepted";
  } catch {
    return false;
  }
}

export function CookieBanner() {
  const [visible, setVisible] = useState(() => !alreadyAccepted());

  if (!visible) return null;

  function accept() {
    try {
      localStorage.setItem(COOKIE_NOTICE_KEY, "accepted");
    } catch {
      // The notice can still be dismissed when storage is unavailable.
    }
    setVisible(false);
  }

  return (
    <section
      className="cookie-banner"
      aria-label="Aviso sobre cookies"
      aria-live="polite"
    >
      <div className="cookie-banner-content">
        <div>
          <h2>Cookies e armazenamento local</h2>
          <p>
            O SkillUp usa recursos essenciais do navegador para manter sua
            sessão, salvar preferências e oferecer conteúdo offline. Não usamos
            cookies de publicidade.
          </p>
        </div>
        <button className="button primary" type="button" onClick={accept}>
          Entendi
        </button>
      </div>
    </section>
  );
}
