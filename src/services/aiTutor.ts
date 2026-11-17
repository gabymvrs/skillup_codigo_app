import { requireSupabase } from "./supabase";

export const aiTutorEnabled = import.meta.env.VITE_AI_TUTOR_ENABLED === "true";

export interface TutorMessage {
  role: "user" | "model";
  text: string;
}

export interface TutorUsage {
  minuteUsed: number;
  minuteLimit: number;
  dailyUsed: number;
  dailyLimit: number;
  promptTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export interface TutorAnswer {
  answer: string;
  usage: TutorUsage;
}

const emptyUsage = (): TutorUsage => ({
  minuteUsed: 0,
  minuteLimit: 10,
  dailyUsed: 0,
  dailyLimit: 100,
});

export async function loadTutorHistory(): Promise<TutorMessage[]> {
  const { data, error } = await requireSupabase()
    .from("ai_tutor_messages")
    .select("role,content")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return [...(data || [])].reverse().map((item) => ({
    role: item.role as TutorMessage["role"],
    text: item.content,
  }));
}

export async function clearTutorHistory() {
  const { error } = await requireSupabase()
    .from("ai_tutor_messages")
    .delete()
    .gte("id", 0);
  if (error) throw error;
}

export async function loadTutorUsage(): Promise<TutorUsage> {
  const { data, error } = await requireSupabase().rpc("get_ai_tutor_usage");
  if (error) throw error;
  const usage = data as { minute_used?: number; daily_used?: number } | null;
  return {
    ...emptyUsage(),
    minuteUsed: usage?.minute_used || 0,
    dailyUsed: usage?.daily_used || 0,
  };
}

export async function askTutor(
  messages: TutorMessage[],
  subject?: string,
): Promise<TutorAnswer> {
  const recent = messages
    .filter((message) => message.text.trim())
    .slice(-4)
    .map((message) => ({
      role: message.role,
      text: message.text.trim().slice(0, 2000),
    }));
  const { data, error } = await requireSupabase().functions.invoke("ai-tutor", {
    body: {
      messages: recent,
      subject: subject?.trim().slice(0, 120) || undefined,
    },
  });
  if (error) {
    const response = (error as { context?: Response }).context;
    const status = response?.status;
    if (status === 429)
      throw new Error(
        "O tutor está temporariamente indisponível por limite de uso. Tente novamente em alguns minutos.",
      );
    if (response) {
      const detail = await response
        .clone()
        .json()
        .catch(() => null);
      if (detail?.error && typeof detail.error === "string")
        throw new Error(detail.error.slice(0, 240));
    }
    throw new Error(
      "Não foi possível falar com o tutor agora. Tente novamente.",
    );
  }
  if (!data?.answer || typeof data.answer !== "string")
    throw new Error(
      "O tutor não conseguiu preparar uma resposta. Tente reformular a pergunta.",
    );
  return {
    answer: data.answer.trim(),
    usage: {
      ...emptyUsage(),
      ...(data.usage || {}),
    },
  };
}
