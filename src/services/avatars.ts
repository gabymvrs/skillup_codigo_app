import { requireSupabase } from "./supabase";
export const AVATAR_LIMIT = 2 * 1024 * 1024;
export function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(file);
  });
}
export async function validateAvatar(file: File) {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size === 0 ||
    file.size > AVATAR_LIMIT
  )
    throw new Error("Escolha JPEG, PNG ou WebP de até 2 MB.");
  const url = await readImage(file),
    bytes = atob(url.split(",")[1]);
  const valid =
    file.type === "image/jpeg"
      ? bytes.startsWith("\xff\xd8\xff")
      : file.type === "image/png"
        ? bytes.startsWith("\x89PNG\r\n\x1a\n")
        : bytes.startsWith("RIFF") && bytes.slice(8, 12) === "WEBP";
  if (!valid)
    throw new Error(
      "O conteúdo do arquivo não corresponde a uma imagem JPEG, PNG ou WebP válida.",
    );
  return url;
}
export async function uploadAvatar(user: string, file: File) {
  await validateAvatar(file);
  const ext = (
      {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/webp": "webp",
      } as Record<string, string>
    )[file.type],
    path = `${user}/${crypto.randomUUID()}.${ext}`;
  const { error } = await requireSupabase()
    .storage.from("avatars")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return path;
}
export async function removeAvatar(path: string) {
  const { error } = await requireSupabase()
    .storage.from("avatars")
    .remove([path]);
  if (error) throw error;
}
