import type { Material } from "../lib/types";
import { requireSupabase } from "./supabase";
export interface SavedMaterial {
  key: string;
  owner: string;
  material: Material;
  blob: Blob | null;
  bytes: number;
  saved_at: string;
}
export interface PendingProgress {
  key: string;
  owner: string;
  module_id: string;
}
const DB = "skillup-offline-v2";
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in globalThis)) {
      reject(new Error("Este navegador não permite salvar conteúdos offline."));
      return;
    }
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("materials", { keyPath: "key" });
      request.result.createObjectStore("queue", { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(
        new Error("Feche outras abas do SkillUp para atualizar a biblioteca."),
      );
  });
}
async function transact<T>(
  store: string,
  mode: IDBTransactionMode,
  run: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    let request: IDBRequest<T>;
    try {
      request = run(tx.objectStore(store));
    } catch (error) {
      tx.abort();
      db.close();
      reject(error);
      return;
    }
    tx.oncomplete = () => {
      db.close();
      resolve(request.result);
    };
    tx.onerror = () => {
      db.close();
      reject(
        tx.error ||
          request.error ||
          new Error("Não foi possível salvar no dispositivo."),
      );
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error || new Error("O armazenamento foi interrompido."));
    };
  });
}
export async function listSaved(owner: string) {
  return (
    await transact<SavedMaterial[]>("materials", "readonly", (s) => s.getAll())
  ).filter((x) => x.owner === owner);
}
export async function getSaved(owner: string, materialId: string) {
  return transact<SavedMaterial | undefined>("materials", "readonly", (s) =>
    s.get(`${owner}:${materialId}`),
  );
}
export async function saveMaterial(
  owner: string,
  material: Material,
): Promise<SavedMaterial> {
  if (!material.allow_offline)
    throw new Error("O autor não autorizou salvar este material offline.");
  let blob: Blob | null = null;
  if (material.file_path) {
    const { data, error } = await requireSupabase()
      .storage.from("learning-materials")
      .download(material.file_path);
    if (error) throw error;
    blob = data;
  }
  const record: SavedMaterial = {
    key: `${owner}:${material.id}`,
    owner,
    material: structuredClone(material),
    blob,
    bytes: new Blob([JSON.stringify(material)]).size + (blob?.size || 0),
    saved_at: new Date().toISOString(),
  };
  await transact("materials", "readwrite", (s) => s.put(record));
  const stored = await getSaved(owner, material.id);
  if (
    !stored ||
    stored.bytes !== record.bytes ||
    (blob && stored.blob?.size !== blob.size)
  )
    throw new Error(
      "A gravação não pôde ser confirmada. Tente salvar novamente.",
    );
  return stored;
}
export async function removeSaved(owner: string, materialId: string) {
  await transact("materials", "readwrite", (s) =>
    s.delete(`${owner}:${materialId}`),
  );
}
export async function queueProgress(owner: string, module_id: string) {
  await transact("queue", "readwrite", (s) =>
    s.put({ key: `${owner}:${module_id}`, owner, module_id }),
  );
}
export async function pendingProgress(owner: string) {
  return (
    await transact<PendingProgress[]>("queue", "readonly", (s) => s.getAll())
  ).filter((x) => x.owner === owner);
}
export async function removePending(key: string) {
  await transact("queue", "readwrite", (s) => s.delete(key));
}
export async function clearOffline(owner: string) {
  for (const record of await listSaved(owner))
    await removeSaved(owner, record.material.id);
  for (const record of await pendingProgress(owner))
    await removePending(record.key);
}
export function materialHtml(material: Material) {
  const escape = (s: string) =>
    s.replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c]!,
    );
  return `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(material.title)}</title><style>body{font:16px/1.7 system-ui;max-width:760px;margin:auto;padding:24px;color:#0c1c5d}article{white-space:pre-wrap}h1{font-size:28px}</style><h1>${escape(material.title)}</h1><p>${escape(material.summary)}</p><article>${escape(material.body)}</article><footer>Material de estudo SkillUp · cópia exportada</footer></html>`;
}
