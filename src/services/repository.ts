import { hydrateDemoLearning } from "./learning";
import {
  subjects,
  materials,
  tracks,
  modules,
  questions,
} from "../data/catalog";
import type { Dataset, TableMap, TableName } from "../lib/types";
import { emptyDataset, tableNames } from "../lib/types";
import { createDemo } from "../data/demo";
import { requireSupabase } from "./supabase";
export const DEMO_KEY = "skillup.demo.v2";
export function readDemo(): Dataset {
  const raw = localStorage.getItem(DEMO_KEY);
  if (!raw) return hydrateDemoLearning(createDemo());
  try {
    const d = JSON.parse(raw);
    d.experiences ??= [];
    for (const [table, additions] of Object.entries({
      subjects,
      materials,
      tracks,
      modules,
      questions,
    })) {
      d[table] ??= [];
      for (const row of additions)
        if (!d[table].some((old: { id: string }) => old.id === row.id))
          d[table].push(structuredClone(row));
    }
    for (const q of d.questions)
      q.activity_type ??= questions.find(
        (item) => item.id === q.id,
      )?.activity_type;
    hydrateDemoLearning(d);
    d.support_tickets?.forEach((t: Record<string, unknown>) => {
      t.assigned_to ??= null;
      t.response ??= null;
    });
    if (tableNames.every((k) => Array.isArray(d[k]))) return d as Dataset;
  } catch {
    /* recover corrupt demo data only */
  }
  return hydrateDemoLearning(createDemo());
}
export function writeDemo(data: Dataset) {
  localStorage.setItem(DEMO_KEY, JSON.stringify(data));
}
export async function loadData(
  demo: boolean,
  userId?: string,
): Promise<Dataset> {
  if (demo) {
    const d = readDemo();
    if (userId) {
      d.projects = d.projects.filter(
        (p) =>
          p.owner_id === userId ||
          (p.visibility !== "private" && p.status !== "archived"),
      );
      d.posts = d.posts.filter(
        (p) => !p.project_id || d.projects.some((j) => j.id === p.project_id),
      );
      d.comments = d.comments.filter((c) =>
        d.posts.some((p) => p.id === c.post_id),
      );
      d.reactions = d.reactions.filter((c) =>
        d.posts.some((p) => p.id === c.post_id),
      );
    }
    return d;
  }
  const client = requireSupabase(),
    result = emptyDataset();
  await Promise.all(
    tableNames.map(async (table) => {
      // RLS is authoritative. The UI never adds privileges by changing a filter.
      const rows: unknown[] = [];
      // Read every permitted page; never silently compute reports from a 300-row subset.
      while (true) {
        const { data, error, count } = await client
          .from(table)
          .select("*", { count: "exact" })
          .order(table === "user_roles" ? "user_id" : "id")
          .range(rows.length, rows.length + 199);
        if (error) {
          if (
            ["42P01", "PGRST205"].includes(error.code) &&
            [
              "reward_events",
              "study_days",
              "learning_settings",
              "track_enrollments",
              "material_reads",
            ].includes(table)
          )
            throw new Error(
              "Atualização do banco pendente: aplique a migração 007 e o seed.sql no Supabase para habilitar os novos recursos.",
            );
          throw error;
        }
        if (!data?.length) break;
        rows.push(...data);
        if (count !== null && rows.length >= count) break;
      }
      (result[table] as unknown[]) = rows;
    }),
  );
  return result;
}
export async function insertRow<K extends TableName>(
  demo: boolean,
  table: K,
  row: TableMap[K],
): Promise<void> {
  if (demo) {
    const d = readDemo();
    (d[table] as TableMap[K][]).push(row);
    writeDemo(d);
    return;
  }
  const { error } = await requireSupabase().from(table).insert(row);
  if (error) throw error;
}
export async function updateRow<K extends Exclude<TableName, "user_roles">>(
  demo: boolean,
  table: K,
  id: string,
  patch: Partial<TableMap[K]>,
) {
  if (demo) {
    const d = readDemo();
    (d[table] as TableMap[K][]) = d[table].map((row) =>
      row.id === id ? { ...row, ...patch } : row,
    ) as TableMap[K][];
    writeDemo(d);
    return;
  }
  const { data, error } = await requireSupabase()
    .from(table)
    .update(patch as Record<string, unknown>)
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (!data?.length)
    throw new Error("Registro não encontrado ou acesso não autorizado.");
}
export async function deleteRow(
  demo: boolean,
  table: Exclude<TableName, "user_roles">,
  id: string,
) {
  if (demo) {
    const d = readDemo();
    (d[table] as { id: string }[]) = d[table].filter((row) => row.id !== id);
    if (table === "posts") {
      d.comments = d.comments.filter((c) => c.post_id !== id);
      d.reactions = d.reactions.filter((r) => r.post_id !== id);
    }
    writeDemo(d);
    return;
  }
  const { data, error } = await requireSupabase()
    .from(table)
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (!data?.length) throw new Error("Não foi possível remover este registro.");
}
