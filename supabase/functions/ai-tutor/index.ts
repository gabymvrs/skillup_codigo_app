import { createClient } from "npm:@supabase/supabase-js@2.118.0";
import { geminiPayload, parseTutorRequest } from "../_shared/geminiTutor.ts";

Deno.serve(async (request) => {
  const origin = request.headers.get("Origin") || "";
  const allowed = (Deno.env.get("ALLOWED_ORIGINS") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
  if (origin && !allowed.includes(origin))
    return Response.json(
      { error: "Origem não autorizada." },
      { status: 403, headers },
    );
  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  const reply = (body: unknown, status = 200) =>
    Response.json(body, { status, headers });
  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers });
  if (request.method !== "POST")
    return reply({ error: "Método não permitido." }, 405);

  try {
    const authorization = request.headers.get("Authorization") || "";
    if (!authorization.startsWith("Bearer "))
      return reply({ error: "Entre na sua conta." }, 401);
    const client = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { headers: { Authorization: authorization } },
        auth: { persistSession: false },
      },
    );
    const token = authorization.slice(7);
    const { data: authData, error: authError } =
      await client.auth.getUser(token);
    if (authError || !authData.user)
      return reply({ error: "Sessão inválida. Entre novamente." }, 401);
    const input = parseTutorRequest(await request.text());
    const { data: allowedRequest, error: limitError } = await client.rpc(
      "consume_ai_tutor_quota",
    );
    if (limitError) return reply({ error: "Sessão sem acesso ao tutor." }, 403);
    if (!allowedRequest)
      return reply({ error: "Limite gratuito temporariamente atingido." }, 429);

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) return reply({ error: "Tutor ainda não configurado." }, 503);
    const model = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash-lite";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiPayload(input.messages, input.subject)),
        signal: AbortSignal.timeout(20000),
      },
    );
    if (response.status === 429)
      return reply({ error: "Limite gratuito do Gemini atingido." }, 429);
    if (!response.ok)
      return reply({ error: "Tutor temporariamente indisponível." }, 503);
    const result = await response.json();
    const answer = result.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || "")
      .join("")
      .trim();
    if (!answer)
      return reply({ error: "O tutor não gerou uma resposta." }, 503);
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );
    await admin.from("ai_tutor_metrics").insert({
      user_id: authData.user.id,
      model,
      prompt_tokens: Math.max(
        0,
        Number(result.usageMetadata?.promptTokenCount) || 0,
      ),
      output_tokens: Math.max(
        0,
        Number(result.usageMetadata?.candidatesTokenCount) || 0,
      ),
    });
    return reply({ answer });
  } catch (error) {
    return reply(
      {
        error:
          error instanceof SyntaxError
            ? "Dados inválidos."
            : error instanceof Error
              ? error.message
              : "Tutor temporariamente indisponível.",
      },
      400,
    );
  }
});
