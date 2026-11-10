import { useEffect, useState } from "react";
import { ActionFeedback, useAction } from "../ui";
import {
  configured,
  getOAuthProviders,
  requireSupabase,
} from "../../services/supabase";
function FacebookIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#1877f2" />
      <path
        fill="white"
        d="M13.8 24v-9.3h3.1l.5-3.6h-3.6V8.8c0-1 .3-1.8 1.8-1.8h1.9V3.8c-.3 0-1.5-.1-2.8-.1-2.8 0-4.6 1.7-4.6 4.8v2.6H7v3.6h3.1V24z"
      />
    </svg>
  );
}
export function SocialSignIn() {
  const action = useAction(),
    [providers, setProviders] = useState<{
      google: boolean;
      facebook: boolean;
    } | null>(null),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    getOAuthProviders()
      .then((data) => {
        if (active) setProviders(data);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <div className="social-signin">
      <div
        className="social-signin-buttons"
        aria-label="Outras formas de entrar"
      >
        <button
          type="button"
          aria-label="Entrar com Facebook"
          aria-describedby="social-signin-status"
          disabled={!providers?.facebook || action.busy}
          aria-busy={action.busy}
          onClick={() =>
            void action.run(async () => {
              const { error } = await requireSupabase().auth.signInWithOAuth({
                provider: "facebook",
                options: {
                  redirectTo: `${window.location.origin}/auth/callback`,
                },
              });
              if (error) throw error;
            })
          }
        >
          <FacebookIcon />
          <span className="sr-only">
            {action.busy ? "Abrindo provedor…" : ""}
          </span>
        </button>
      </div>
      <small id="social-signin-status">
        {!configured
          ? "Login social indisponível sem conexão com o Supabase."
          : failed
            ? "Não foi possível verificar o login social. Entre com e-mail e senha."
            : !providers
              ? "Verificando formas de acesso…"
              : !providers.facebook
                ? "Facebook ainda não está habilitado. Use e-mail e senha."
                : "Ou entre com sua conta Facebook."}
      </small>
      <ActionFeedback action={action} />
    </div>
  );
}
