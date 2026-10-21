import { useEffect, useState } from "react";
import { ActionFeedback, useAction } from "../ui";
import {
  configured,
  getOAuthProviders,
  requireSupabase,
} from "../../services/supabase";
function ProviderIcon({ provider }: { provider: "google" | "facebook" }) {
  return provider === "facebook" ? (
    <svg width="36" height="36" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#1877f2" />
      <path
        fill="white"
        d="M13.8 24v-9.3h3.1l.5-3.6h-3.6V8.8c0-1 .3-1.8 1.8-1.8h1.9V3.8c-.3 0-1.5-.1-2.8-.1-2.8 0-4.6 1.7-4.6 4.8v2.6H7v3.6h3.1V24z"
      />
    </svg>
  ) : (
    <svg width="36" height="36" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285f4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.5 5.5 0 0 1-2.4 3.6V21H20c2.3-2.1 3.5-5.1 3.5-8.7z"
      />
      <path
        fill="#34a853"
        d="M12 24c3.2 0 5.9-1.1 8-3l-3.9-2.9c-1.1.7-2.5 1.1-4.1 1.1-3.1 0-5.8-2.1-6.7-4.9H1.2v3A12 12 0 0 0 12 24z"
      />
      <path
        fill="#fbbc05"
        d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6v-3H1.2a12 12 0 0 0 0 10.6z"
      />
      <path
        fill="#ea4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8L20 3.2A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.2 6.7l4.1 3C6.2 6.9 8.9 4.8 12 4.8z"
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
        {(["facebook", "google"] as const).map((provider) => (
          <button
            key={provider}
            type="button"
            aria-label={`Entrar com ${provider === "google" ? "Google" : "Facebook"}`}
            aria-describedby="social-signin-status"
            disabled={!providers?.[provider] || action.busy}
            onClick={() =>
              void action.run(async () => {
                const { error } = await requireSupabase().auth.signInWithOAuth({
                  provider,
                  options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                  },
                });
                if (error) throw error;
              })
            }
          >
            <ProviderIcon provider={provider} />
          </button>
        ))}
      </div>
      <small id="social-signin-status">
        {!configured
          ? "Login social indisponível sem conexão com o Supabase."
          : failed
            ? "Não foi possível verificar o login social. Entre com e-mail e senha."
            : !providers
              ? "Verificando formas de acesso…"
              : !providers.google && !providers.facebook
                ? "Google e Facebook ainda não estão habilitados. Use e-mail e senha."
                : !providers.google
                  ? "Google ainda não habilitado."
                  : !providers.facebook
                    ? "Facebook ainda não habilitado."
                    : "Ou entre com sua conta Google ou Facebook."}
      </small>
      <ActionFeedback action={action} />
    </div>
  );
}
