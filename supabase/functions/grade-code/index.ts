import { createClient } from "npm:@supabase/supabase-js@2.118.0";
import { parseHTML } from "npm:linkedom@0.18.12";
import { gradeProgram, gradeWeb } from "./grading.ts";
// Auth is verified here and again by the session-aware database RPCs.
Deno.serve(async (request) => {
  const origin = request.headers.get("Origin") || "";
  const allowed = (Deno.env.get("ALLOWED_ORIGINS") || "")
    .split(",")
    .map((x) => x.trim());
  const cors: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
  if (origin && !allowed.includes(origin))
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
      return reply({ error: "Entre na sua conta." }, 401);
    const url = Deno.env.get("SUPABASE_URL")!;
    const client = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    });
    const { data: user, error: authError } = await client.auth.getUser(
      authorization.slice(7),
    );
    if (authError || !user.user)
      return reply({ error: "Sessão inválida. Entre novamente." }, 401);
    const raw = await request.text();
    if (raw.length > 30000)
      return reply({ error: "Código acima do limite." }, 413);
    const { question_id, source } = JSON.parse(raw);
    if (
      typeof question_id !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(question_id) ||
      typeof source !== "string" ||
      source.length < 1 ||
      source.length > 10000
    )
      return reply({ error: "Informe uma atividade e um código válido." }, 400);
    const { error: contextError } = await client.rpc("code_activity_context", {
      p_question_id: question_id,
    });
    if (contextError) return reply({ error: contextError.message }, 403);
    const admin = createClient(
      url,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );
    const { data: spec, error: specError } = await admin.rpc(
      "code_grading_spec",
      { p_question_id: question_id },
    );
    if (specError || !spec?.expected)
      return reply({ error: "Critérios de correção indisponíveis." }, 503);
    let verdict;
    if (spec.language === "web") {
      verdict = {
        correct: gradeWeb(
          source,
          spec.expected.webRules || [],
          (html) => parseHTML(html).document,
        ),
        explanation:
          "Revise a estrutura HTML solicitada. A aparência ou o JavaScript não substituem os elementos exigidos.",
      };
    } else if (spec.language === "python" || spec.language === "javascript") {
      const judgeUrl = Deno.env.get("JUDGE0_URL");
      const languageId = Number(
        Deno.env.get(
          spec.language === "python"
            ? "JUDGE0_PYTHON_ID"
            : "JUDGE0_JAVASCRIPT_ID",
        ),
      );
      if (!judgeUrl || !Number.isInteger(languageId) || languageId <= 0)
        return reply(
          {
            error:
              "A validação de código ainda não foi configurada. Você pode executar o programa localmente; XP e conclusão dependem da validação no servidor.",
          },
          503,
        );
      const headers: Record<string, string> = {};
      const token = Deno.env.get("JUDGE0_AUTH_TOKEN");
      if (token) headers["X-Auth-Token"] = token;
      const rapidKey = Deno.env.get("JUDGE0_RAPIDAPI_KEY"),
        rapidHost = Deno.env.get("JUDGE0_RAPIDAPI_HOST");
      if (rapidKey && rapidHost) {
        headers["X-RapidAPI-Key"] = rapidKey;
        headers["X-RapidAPI-Host"] = rapidHost;
      }
      verdict = await gradeProgram({
        source,
        language: spec.language,
        languageId,
        tests: spec.expected.tests || [],
        url: judgeUrl,
        headers,
      });
    } else return reply({ error: "Linguagem não suportada." }, 400);
    // Decode only after getUser has verified the signed access token.
    const encoded = authorization
      .slice(7)
      .split(".")[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const claims = JSON.parse(
      atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "=")),
    );
    const { data: result, error } = await admin.rpc("record_code_result", {
      p_user_id: user.user.id,
      p_session_id: claims.session_id,
      p_aal: claims.aal || "aal1",
      p_question_id: question_id,
      p_source: source,
      p_correct: verdict.correct,
      p_feedback: verdict.explanation,
    });
    if (error)
      return reply(
        {
          error:
            "Não foi possível registrar a atividade. Confira sua sessão e tente novamente.",
        },
        403,
      );
    return reply(result);
  } catch (error) {
    return reply(
      {
        error:
          error instanceof SyntaxError
            ? "Dados inválidos."
            : error instanceof Error
              ? error.message
              : "Não foi possível validar o código.",
      },
      503,
    );
  }
});
