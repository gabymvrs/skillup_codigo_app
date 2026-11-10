import { createClient } from "npm:@supabase/supabase-js@2.118.0";
import {
  allowedOrigin,
  deletionAuditHash,
  hasRecentAuthentication,
  validConfirmation,
} from "../_shared/accountDeletion.ts";

Deno.serve(async (request) => {
  const origin = request.headers.get("Origin") || "";
  const cors: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
  if (!allowedOrigin(origin, Deno.env.get("ALLOWED_ORIGINS") || ""))
    return new Response("Origem não autorizada.", { status: 403 });
  if (origin) cors["Access-Control-Allow-Origin"] = origin;
  const reply = (body: unknown, status = 200) =>
    Response.json(body, { status, headers: cors });

  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST")
    return reply({ error: "Método não permitido." }, 405);

  try {
    const authorization = request.headers.get("Authorization") || "";
    if (!authorization.startsWith("Bearer "))
      return reply({ error: "Entre novamente para continuar." }, 401);

    const raw = await request.text();
    if (raw.length > 500) return reply({ error: "Confirmação inválida." }, 400);
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return reply({ error: "Confirmação inválida." }, 400);
    }
    if (!validConfirmation(body))
      return reply(
        {
          error:
            "Confirme a exclusão permanente, inclusive dos certificados e registros acadêmicos.",
        },
        400,
      );

    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !anonKey || !serviceKey)
      return reply({ error: "Serviço de exclusão indisponível." }, 503);

    const token = authorization.slice(7);
    const sessionClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    });
    const { data, error: authError } = await sessionClient.auth.getUser(token);
    if (authError || !data.user)
      return reply({ error: "Sessão inválida. Entre novamente." }, 401);
    if (!hasRecentAuthentication(data.user.last_sign_in_at))
      return reply(
        { error: "Entre novamente antes de solicitar a exclusão." },
        401,
      );

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: created, error: createError } = await admin.rpc(
      "create_account_deletion_request",
      {
        p_user_id: data.user.id,
        p_user_hash: await deletionAuditHash(data.user.id),
      },
    );
    if (createError) {
      const recent = createError.message.includes(
        "recent_authentication_required",
      );
      return reply(
        {
          error: recent
            ? "Entre novamente antes de solicitar a exclusão."
            : "Não foi possível registrar a solicitação.",
        },
        recent ? 401 : 503,
      );
    }

    const requestRow = Array.isArray(created) ? created[0] : created;
    if (!requestRow?.request_id)
      return reply({ error: "Não foi possível registrar a solicitação." }, 503);

    // Execution is deliberately gated twice: environment configuration and
    // the database policy gate. Auth deletion can only happen after the DB
    // reports that every approved data step completed successfully.
    if (Deno.env.get("ACCOUNT_DELETION_EXECUTION_ENABLED") !== "true")
      return reply(
        {
          request_id: requestRow.request_id,
          status: requestRow.request_status,
          execution_enabled: false,
        },
        202,
      );

    const { data: prepared, error: prepareError } = await admin.rpc(
      "prepare_account_deletion",
      { p_request_id: requestRow.request_id, p_user_id: data.user.id },
    );
    if (prepareError)
      return reply(
        {
          request_id: requestRow.request_id,
          status: "failed",
          error: "A solicitação foi registrada, mas não pôde ser processada.",
        },
        503,
      );

    const preparation = Array.isArray(prepared) ? prepared[0] : prepared;
    if (!preparation?.ready_for_auth_deletion)
      return reply(
        {
          request_id: requestRow.request_id,
          status: preparation?.request_status || "awaiting_policy_review",
        },
        202,
      );

    const { error: deleteError } = await admin.auth.admin.deleteUser(
      data.user.id,
      false,
    );
    if (deleteError)
      return reply(
        {
          request_id: requestRow.request_id,
          status: "failed",
          error:
            "Os dados foram processados, mas a identidade não foi removida.",
        },
        503,
      );

    const { error: completeError } = await admin.rpc(
      "complete_account_deletion",
      { p_request_id: requestRow.request_id, p_user_id: data.user.id },
    );
    if (completeError)
      return reply(
        {
          request_id: requestRow.request_id,
          status: "failed",
          error:
            "A identidade foi removida, mas a auditoria precisa de reconciliação.",
        },
        503,
      );
    return reply({ request_id: requestRow.request_id, status: "completed" });
  } catch {
    return reply({ error: "Não foi possível processar a solicitação." }, 503);
  }
});
