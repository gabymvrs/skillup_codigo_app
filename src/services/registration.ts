import type { Role, RoleRequest } from "../lib/types";
import { requireSupabase } from "./supabase";
export const registrationDocuments: Record<Role, string[]> = {
  estudante: ["Carteira de estudante"],
  docente: ["Declaração Institucional", "Carteira de trabalho"],
  recrutador: ["Declaração Institucional", "Contrato social"],
  instituicao: [
    "Declaração institucional",
    "Alvará de funcionamento",
    "Contrato social",
    "Credenciamento no MEC",
  ],
};
export const responsibilityVersion = "cadastro-desenvolvimento-2026-10-20";
export const responsibilityText =
  "Declaro que as informações e os documentos enviados são verdadeiros e que tenho autorização para representar a empresa ou atuar como recrutador. Comprometo-me a publicar oportunidades verdadeiras e a utilizar os dados de candidatos somente para os processos seletivos informados. Sei que o envio está sujeito à análise e não concede aprovação ou permissões profissionais automaticamente.";
export function validateDocument(file: File) {
  if (
    !file.size ||
    file.size > 5 * 1024 * 1024 ||
    !["application/pdf", "image/png", "image/jpeg"].includes(file.type)
  )
    throw new Error("Use um arquivo PDF, PNG ou JPEG de até 5 MB, não vazio.");
}
// Only in memory; never persist personal documents before a confirmed session.
let stagedStudent: { email: string; file: File; expires: number } | null = null;
export function stageStudentDocument(email: string, file?: File) {
  if (file) validateDocument(file);
  stagedStudent = file
    ? {
        email: email.trim().toLowerCase(),
        file,
        expires: Date.now() + 30 * 60_000,
      }
    : null;
}
export function stagedStudentDocument(email: string) {
  if (stagedStudent && stagedStudent.expires < Date.now()) stagedStudent = null;
  return stagedStudent?.email === email.trim().toLowerCase()
    ? stagedStudent.file
    : undefined;
}
export function clearRegistrationDraft() {
  stagedStudent = null;
}
async function confirmedUser() {
  const { data, error } = await requireSupabase().auth.getUser();
  if (error) throw error;
  if (!data.user?.email_confirmed_at || data.user.is_anonymous)
    throw new Error(
      "Confirme seu e-mail e faça login antes de enviar documentos.",
    );
  return data.user;
}
export async function loadRegistration() {
  const user = await confirmedUser();
  const { data, error } = await requireSupabase()
    .from("role_requests")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();
  if (error) throw error;
  const requested = user.user_metadata.requested_role;
  const role: Role = [
    "estudante",
    "docente",
    "recrutador",
    "instituicao",
  ].includes(requested)
    ? requested
    : "estudante";
  const acceptance = user.user_metadata.skillup_registration;
  return {
    request: data as RoleRequest | null,
    role: (data?.requested_role || role) as Role,
    accepted: Boolean(
      data &&
      acceptance?.request_id === data.id &&
      acceptance?.responsibility_version === responsibilityVersion &&
      acceptance?.responsibility_accepted_at,
    ),
  };
}
export function documentPath(request: RoleRequest | null, index: number) {
  return request?.document_paths.find((path) =>
    path.split("/")[2]?.startsWith(`${index}-`),
  );
}
export type RegistrationInfo = {
  organization_name: string;
  registration_number: string;
  cnae: string;
};
export async function saveRegistration({
  request,
  role,
  info,
  files,
  accepted,
  onProgress,
}: {
  request: RoleRequest | null;
  role: Role;
  info: RegistrationInfo;
  files: Record<number, File | undefined>;
  accepted: boolean;
  onProgress: (request: RoleRequest, storedIndex?: number) => void;
}) {
  const user = await confirmedUser(),
    client = requireSupabase();
  if (
    request &&
    (request.user_id !== user.id ||
      request.requested_role !== role ||
      request.status !== "pending")
  )
    throw new Error("Esta solicitação não pertence à sua sessão ativa.");
  if (role === "recrutador" && !accepted)
    throw new Error("Leia e aceite a Declaração de responsabilidades.");
  info = {
    organization_name: info.organization_name.trim(),
    registration_number: info.registration_number.trim(),
    cnae: info.cnae.trim(),
  };
  if (
    ["docente", "instituicao"].includes(role) &&
    info.organization_name.length < 2
  )
    throw new Error("Informe o nome da instituição ou a razão social.");
  if (["recrutador", "instituicao"].includes(role) && !info.registration_number)
    throw new Error("Informe o CNPJ ou CPF solicitado.");
  if (role === "instituicao" && !info.cnae) throw new Error("Informe o CNAE.");
  for (const file of Object.values(files)) if (file) validateDocument(file);
  if (
    role !== "estudante" &&
    registrationDocuments[role].some(
      (_, i) => !files[i] && !documentPath(request, i),
    )
  )
    throw new Error("Anexe todos os documentos solicitados para continuar.");
  const query = request
    ? client
        .from("role_requests")
        .update(info)
        .eq("id", request.id)
        .eq("user_id", user.id)
        .eq("status", "pending")
    : client
        .from("role_requests")
        .insert({
          ...info,
          user_id: user.id,
          requested_role: role,
          status: "pending",
          document_paths: [],
        });
  const result = await query.select("*").single();
  if (result.error) throw result.error;
  let current = result.data as RoleRequest;
  onProgress(current);
  for (const [key, file] of Object.entries(files)) {
    if (!file) continue;
    const index = Number(key),
      previous = documentPath(current, index),
      extension =
        file.type === "application/pdf"
          ? "pdf"
          : file.type === "image/png"
            ? "png"
            : "jpg";
    const path = `${user.id}/${current.id}/${index}-${crypto.randomUUID()}.${extension}`,
      bucket = client.storage.from("profile-documents");
    const upload = await bucket.upload(path, file, {
      upsert: false,
      contentType: file.type,
    });
    if (upload.error) throw upload.error;
    const nextPaths = [
      ...current.document_paths.filter((p) => p !== previous),
      path,
    ];
    const saved = await client
      .from("role_requests")
      .update({ document_paths: nextPaths })
      .eq("id", current.id)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .select("*")
      .single();
    if (saved.error) {
      const cleanup = await bucket.remove([path]);
      if (cleanup.error)
        throw new Error(
          "O vínculo do documento falhou e a limpeza automática também. Uma cópia privada pode ter permanecido; procure o responsável pela implantação.",
        );
      throw saved.error;
    }
    current = saved.data as RoleRequest;
    onProgress(current, index);
    if (previous) {
      const cleanup = await bucket.remove([previous]);
      if (cleanup.error)
        throw new Error(
          "O novo documento foi salvo, mas a cópia anterior não pôde ser removida. Procure o responsável pela implantação.",
        );
    }
  }
  // Editable self-declaration; never an authorization or approval signal.
  const completion = await client.auth.updateUser({
    data: {
      skillup_registration: {
        request_id: current.id,
        completed_at: new Date().toISOString(),
        ...(role === "recrutador"
          ? {
              responsibility_version: responsibilityVersion,
              responsibility_accepted_at: new Date().toISOString(),
            }
          : {}),
      },
    },
  });
  if (completion.error) throw completion.error;
  clearRegistrationDraft();
  return current;
}
