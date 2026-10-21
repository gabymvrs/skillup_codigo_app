export const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
export const matches = (query: string, ...fields: string[]) =>
  normalize(fields.join(" ")).includes(normalize(query.trim()));
export const uid = () => crypto.randomUUID();
export const dateLabel = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();
export function safeUrl(value: string): string | undefined {
  try {
    const u = new URL(value);
    return u.protocol === "https:" ? u.href : undefined;
  } catch {
    return undefined;
  }
}
export function errorMessage(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String(error.message)
        : "Não foi possível concluir. Tente novamente.";
  if (/invalid login credentials/i.test(message))
    return "E-mail ou senha incorretos.";
  if (/email not confirmed/i.test(message))
    return "Confirme seu e-mail antes de entrar.";
  if (/fetch|network|offline/i.test(message))
    return "Sem conexão com o servidor. Confira a internet e tente novamente.";
  if (/row-level|permission denied/i.test(message))
    return "Sua conta não tem permissão para esta ação.";
  if (/duplicate key/i.test(message)) return "Este registro já existe.";
  return message;
}
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
export const percent = (count: number, total: number) =>
  total ? Math.min(100, Math.round((count / total) * 100)) : 0;
