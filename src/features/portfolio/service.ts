import { requireSupabase } from "../../services/supabase";
import { readDemo } from "../../services/repository";
import { uid } from "../../lib/utils";
import {
  demoAchievements,
  emptyPortfolioData,
  type PortfolioData,
} from "./model";
const KEY = "skillup.portfolio.demo.v1";
const event = "skillup-portfolio-changed";
export const notifyPortfolio = () => window.dispatchEvent(new Event(event));
export function readPortfolioDemo(): PortfolioData {
  try {
    return {
      ...emptyPortfolioData(),
      ...JSON.parse(localStorage.getItem(KEY) || "{}"),
    };
  } catch {
    return emptyPortfolioData();
  }
}
export function writePortfolioDemo(data: PortfolioData) {
  localStorage.setItem(KEY, JSON.stringify(data));
  notifyPortfolio();
}
export async function loadPortfolio(
  demo: boolean,
  userId: string,
  student: boolean,
): Promise<PortfolioData> {
  if (demo) {
    const d = readPortfolioDemo();
    if (student)
      for (const achievement_id of demoAchievements(readDemo(), userId))
        if (
          !d.student_achievements.some(
            (a) => a.user_id === userId && a.achievement_id === achievement_id,
          )
        )
          d.student_achievements.push({
            id: uid(),
            user_id: userId,
            achievement_id,
            earned_at: new Date().toISOString(),
          });
    localStorage.setItem(KEY, JSON.stringify(d));
    d.profile_highlights = d.profile_highlights.filter(
      (h) => h.user_id === userId || h.visibility !== "private",
    );
    d.comment_reports = d.comment_reports.filter(
      (r) => r.reporter_id === userId,
    );
    d.project_signals = d.project_signals.filter((r) => r.user_id === userId);
    d.student_resumes = d.student_resumes.filter((r) => r.user_id === userId);
    return d;
  }
  const client = requireSupabase();
  if (student) {
    const r = await client.rpc("refresh_student_achievements");
    if (r.error)
      throw Error(
        ["42883", "PGRST202", "42P01", "PGRST205"].includes(r.error.code)
          ? "Recursos de perfil pendentes: aplique a migração 009 no Supabase."
          : r.error.message,
      );
  }
  const result = emptyPortfolioData();
  await Promise.all(
    (Object.keys(result) as (keyof PortfolioData)[]).map(async (table) => {
      const rows: unknown[] = [];
      let offset = 0;
      while (true) {
        const { data, error } = await client
          .from(table)
          .select("*")
          .order("id")
          .range(offset, offset + 199);
        if (error)
          throw Error(
            ["42P01", "PGRST205"].includes(error.code)
              ? "Recursos de perfil pendentes: aplique a migração 009 no Supabase."
              : error.message,
          );
        rows.push(...(data || []));
        if (!data || data.length < 200) break;
        offset += 200;
      }
      (result[table] as unknown[]) = rows;
    }),
  );
  return result;
}
export async function savePortfolioRow<K extends keyof PortfolioData>(
  demo: boolean,
  table: K,
  row: PortfolioData[K][number],
) {
  if (
    [
      "student_achievements",
      "achievement_definitions",
      "comment_reports",
    ].includes(table)
  )
    throw Error("Esta ação deve ser validada pelo sistema.");
  if (demo) {
    const d = readPortfolioDemo();
    if (table === "profile_highlights") {
      const h = row as PortfolioData["profile_highlights"][number];
      if (
        h.pinned &&
        d.profile_highlights.filter(
          (x) => x.user_id === h.user_id && x.pinned && x.id !== h.id,
        ).length >= 3
      )
        throw Error("Você pode fixar até três destaques.");
      if (h.ended_on && h.ended_on < h.started_on)
        throw Error("A data final deve ser posterior ao início.");
    }
    if (table === "student_portfolios") {
      const p = row as PortfolioData["student_portfolios"][number];
      if (
        p.featured_badges.length > 3 ||
        p.featured_badges.some(
          (id) =>
            !d.student_achievements.some(
              (a) => a.user_id === p.id && a.achievement_id === id,
            ),
        )
      )
        throw Error("Selecione até três conquistas desbloqueadas.");
    }
    const rows = d[table] as { id: string }[];
    const i = rows.findIndex((r) => r.id === row.id);
    if (i < 0) rows.push(row);
    else rows[i] = row;
    writePortfolioDemo(d);
    return;
  }
  const client = requireSupabase();
  const existing = await client
    .from(table)
    .select("id")
    .eq("id", row.id)
    .maybeSingle();
  if (existing.error) throw existing.error;
  const patch = { ...row } as Record<string, unknown>;
  if (table !== "student_portfolios")
    for (const key of ["id", "user_id", "created_at", "project_id"])
      delete patch[key];
  const result = existing.data
    ? await client.from(table).update(patch).eq("id", row.id).select("id")
    : await client.from(table).insert(row).select("id");
  if (result.error) throw result.error;
  if (!result.data?.length) throw Error("Registro não autorizado.");
  notifyPortfolio();
}
export async function removePortfolioRow(
  demo: boolean,
  table: "profile_highlights" | "student_resumes",
  id: string,
) {
  if (demo) {
    const d = readPortfolioDemo();
    d[table] = d[table].filter((r) => r.id !== id) as never;
    writePortfolioDemo(d);
    return;
  }
  const { data, error } = await requireSupabase()
    .from(table)
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (!data?.length) throw Error("Registro indisponível.");
  notifyPortfolio();
}
export async function reportComment(
  demo: boolean,
  userId: string,
  commentId: string,
  reason: string,
  description: string,
) {
  if (demo) {
    const d = readPortfolioDemo();
    if (
      d.comment_reports.some(
        (r) => r.reporter_id === userId && r.comment_id === commentId,
      )
    )
      throw Error("Você já denunciou este comentário.");
    if (
      d.comment_reports.filter(
        (r) =>
          r.reporter_id === userId &&
          Date.parse(r.created_at) > Date.now() - 86400000,
      ).length >= 5
    )
      throw Error("Limite de cinco denúncias por 24 horas.");
    d.comment_reports.push({
      id: uid(),
      reporter_id: userId,
      comment_id: commentId,
      reason,
      description,
      status: "pending",
      created_at: new Date().toISOString(),
    });
    writePortfolioDemo(d);
    return;
  }
  const { error } = await requireSupabase().rpc("report_comment", {
    p_comment_id: commentId,
    p_reason: reason,
    p_description: description,
  });
  if (error) throw error;
  notifyPortfolio();
}
export async function validatePortfolioFile(file: File, pdfOnly = false) {
  if (
    !file.size ||
    file.size > 5 * 1024 * 1024 ||
    !(
      pdfOnly
        ? ["application/pdf"]
        : ["application/pdf", "image/png", "image/jpeg", "image/webp"]
    ).includes(file.type)
  )
    throw Error(
      pdfOnly
        ? "Use um arquivo PDF de até 5 MB."
        : "Use PDF, PNG, JPEG ou WebP de até 5 MB.",
    );
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const head = new TextDecoder().decode(b);
  const valid =
    file.type === "application/pdf"
      ? head.startsWith("%PDF-")
      : file.type === "image/png"
        ? b[0] === 137 && head.slice(1, 4) === "PNG"
        : file.type === "image/jpeg"
          ? b[0] === 255 && b[1] === 216
          : head.startsWith("RIFF") && head.slice(8, 12) === "WEBP";
  if (!valid)
    throw Error("O conteúdo do arquivo não corresponde ao formato informado.");
}
export async function uploadPortfolioFile(
  demo: boolean,
  userId: string,
  bucket: "student-resumes" | "portfolio-files",
  file: File,
) {
  await validatePortfolioFile(file, bucket === "student-resumes");
  if (demo)
    throw Error(
      "Arquivos pessoais não são armazenados na demonstração. Entre em uma conta real para enviar.",
    );
  const ext =
    file.type === "application/pdf"
      ? "pdf"
      : file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg";
  const path = `${userId}/${uid()}.${ext}`;
  const { error } = await requireSupabase()
    .storage.from(bucket)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return path;
}
export async function removePortfolioFile(bucket: string, path: string) {
  const { error } = await requireSupabase().storage.from(bucket).remove([path]);
  if (error) throw error;
}
export async function signedFile(bucket: string, path: string) {
  const { data, error } = await requireSupabase()
    .storage.from(bucket)
    .createSignedUrl(path, 900);
  if (error) throw error;
  return data.signedUrl;
}
export { event as portfolioEvent };
