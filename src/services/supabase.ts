import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
// Reject known administrative credentials before creating a browser client.
function isPublicKey(value: string) {
  if (value.startsWith("sb_publishable_")) return true;
  try {
    return JSON.parse(atob(value.split(".")[1])).role === "anon";
  } catch {
    return false;
  }
}
export const configured = Boolean(url && key && isPublicKey(key));
// Real deployments must explicitly opt in to the separate demo experience.
export const demoEnabled =
  import.meta.env.VITE_ENABLE_DEMO === "true" ||
  (!configured && import.meta.env.VITE_ENABLE_DEMO !== "false");
export const supabase = configured
  ? createClient(url!, key!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    })
  : null;
export function requireSupabase() {
  if (!supabase)
    throw new Error(
      "O acesso real ainda não está configurado. Use a demonstração para conhecer o aplicativo.",
    );
  return supabase;
}
export async function getOAuthProviders() {
  if (!configured) return { google: false, facebook: false };
  const response = await fetch(`${url}/auth/v1/settings`, {
    headers: { apikey: key! },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok)
    throw new Error("Não foi possível verificar os provedores.");
  const settings = await response.json();
  return {
    google: settings.external?.google === true,
    facebook: settings.external?.facebook === true,
  };
}
