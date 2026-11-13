import { createClient } from "npm:@supabase/supabase-js@2.118.0";

type TutorInput = { role: "user" | "model"; text: string };

function removePersonalData(text: string) {
  return text
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[e-mail removido]")
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[documento removido]")
    .replace(
      /(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?\d{4,5}[-\s]?\d{4}\b/g,
      "[telefone removido]",
    );
}

function parseTutorRequest(raw: string) {
  if (raw.length > 12000) throw new Error("Pergunta acima do limite.");
  const input = JSON.parse(raw) as {
    messages?: TutorInput[];
    subject?: string;
  };
  if (!Array.isArray(input.messages) || !input.messages.length)
    throw new Error("Envie uma pergunta.");
  const messages = input.messages.slice(-4).map((message) => {
    if (
      !message ||
      !["user", "model"].includes(message.role) ||
      typeof message.text !== "string" ||
      !message.text.trim() ||
      message.text.length > 2000
    )
      throw new Error("Histórico de conversa inválido.");
    return {
      role: message.role,
      text: removePersonalData(message.text.trim()),
    } as TutorInput;
  });
  if (messages.at(-1)?.role !== "user")
    throw new Error("A última mensagem deve ser uma pergunta do aluno.");
  if (
    input.subject !== undefined &&
    (typeof input.subject !== "string" || input.subject.length > 120)
  )
    throw new Error("Contexto de disciplina inválido.");
  return { messages, subject: input.subject?.trim() || "" };
}

function geminiPayload(messages: TutorInput[], subject: string) {
  const detailed = /aprofund|detalh|explique melhor|passo a passo/i.test(
    messages.at(-1)?.text || "",
  );
  return {
    systemInstruction: {
      parts: [
        {
          text:
            "Você é o tutor escolar do SkillUp. Responda em português simples, didático e correto. Explique por etapas, use exemplos curtos e incentive o raciocínio. Não peça dados pessoais." +
            (subject ? ` Contexto da disciplina: ${subject}.` : ""),
        },
      ],
    },
    contents: messages.map((message) => ({
      role: message.role,
      parts: [{ text: message.text }],
    })),
    generationConfig: {
      maxOutputTokens: detailed ? 500 : 250,
      temperature: 0.35,
    },
  };
}

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
    if (!response.ok) {
      const providerError = await response.json().catch(() => null);
      console.error("Gemini request failed", {
        status: response.status,
        reason: providerError?.error?.status || "unknown",
      });
      const message =
        response.status === 400
          ? "O Google recusou a configuração do tutor (erro 400). Verifique o modelo Gemini configurado."
          : response.status === 403
            ? "A chave Gemini não tem permissão para usar a API (erro 403). Verifique a chave no Google AI Studio."
            : response.status === 404
              ? "O modelo Gemini configurado não foi encontrado (erro 404)."
              : `O serviço Gemini falhou temporariamente (erro ${response.status}).`;
      return reply({ error: message }, 503);
    }
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
