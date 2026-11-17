export type TutorInput = { role: "user" | "model"; text: string };

export function chooseGeminiModel(
  models: Array<{ name?: string; supportedGenerationMethods?: string[] }>,
) {
  const available = models
    .filter((model) =>
      model.supportedGenerationMethods?.includes("generateContent"),
    )
    .map((model) => (model.name || "").replace(/^models\//, ""))
    .filter(
      (name) =>
        /^gemini-[\w.-]+-flash(?:-lite)?(?:-[\w.-]+)?$/.test(name) &&
        !/(image|audio|tts|live)/.test(name),
    );
  const preferred = [
    "gemini-2.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash",
    "gemini-3-flash-preview",
    "gemini-2.0-flash-lite",
  ];
  return (
    preferred.find((name) => available.includes(name)) ||
    available.find((name) => name.includes("flash-lite")) ||
    available.find((name) => name.includes("flash")) ||
    ""
  );
}

function removePersonalData(text: string) {
  return text
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[e-mail removido]")
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[documento removido]")
    .replace(
      /(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?\d{4,5}[-\s]?\d{4}\b/g,
      "[telefone removido]",
    );
}

export function parseTutorRequest(raw: string) {
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

export function geminiPayload(messages: TutorInput[], subject: string) {
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
