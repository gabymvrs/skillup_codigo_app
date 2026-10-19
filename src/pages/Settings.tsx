import { Experiences } from "../components/Experiences";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { useData } from "../state/DataContext";
import { requireSupabase } from "../services/supabase";
import { clearOffline } from "../services/offline";
import { readDemo, writeDemo } from "../services/repository";
import { roleLabels, type Role } from "../lib/types";
import { downloadBlob, initials, safeUrl, uid } from "../lib/utils";
import {
  ActionFeedback,
  ActionLink,
  Badge,
  Button,
  Card,
  Confirm,
  Empty,
  Heading,
  Icon,
  Modal,
  Notice,
  SectionTitle,
  useAction,
} from "../components/ui";
export function Settings() {
  const auth = useAuth(),
    repo = useData(),
    navigate = useNavigate(),
    action = useAction(),
    [logout, setLogout] = useState(false),
    [prefs, setPrefs] = useState(false),
    [privacy, setPrivacy] = useState(false),
    [security, setSecurity] = useState(false),
    [legacy, setLegacy] = useState(false);
  const p = repo.data.profiles.find((p) => p.id === auth.id);
  const progress = repo.data.progress.filter((p) => p.user_id === auth.id),
    xp =
      progress.reduce(
        (sum, p) =>
          sum + (repo.data.modules.find((m) => m.id === p.module_id)?.xp || 0),
        0,
      ) +
      repo.data.attempts
        .filter((a) => a.user_id === auth.id)
        .reduce((s, a) => s + a.xp, 0);
  async function exportData() {
    const data = {
      experiences: repo.data.experiences.filter((x) => x.user_id === auth.id),
      profile: p,
      progress,
      attempts: repo.data.attempts.filter((x) => x.user_id === auth.id),
      publications: repo.data.posts.filter((x) => x.user_id === auth.id),
      comments: repo.data.comments.filter((x) => x.user_id === auth.id),
      applications: repo.data.applications.filter(
        (x) => x.student_id === auth.id,
      ),
      support: repo.data.support_tickets.filter((x) => x.user_id === auth.id),
      events: repo.data.study_events.filter((x) => x.user_id === auth.id),
    };
    downloadBlob(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      "meus-dados-skillup.json",
    );
  }
  return (
    <div className="stack">
      <Heading
        title={
          auth.role === "instituicao"
            ? "Configurações institucionais"
            : "Configurações"
        }
        description="Seu perfil, suas preferências e seus dados."
      />
      <div className="settings-grid">
        <Card className="profile-card">
          <span className="avatar large">
            {initials(p?.full_name || "SkillUp")}
          </span>
          <h2>{p?.full_name}</h2>
          <Badge>{roleLabels[auth.role!]}</Badge>
          <div className="stats-grid">
            <div>
              <strong>{xp}</strong>
              <span>Total XP</span>
            </div>
            <div>
              <strong>{progress.length}</strong>
              <span>Etapas concluídas</span>
            </div>
          </div>
          <ActionLink to="/app/config/perfil" icon="users">
            Editar perfil
          </ActionLink>
        </Card>
        <Card className="settings-list">
          {[
            ["Preferências", "settings", () => setPrefs(true)],
            ["Privacidade", "shield", () => setPrivacy(true)],
            ["Segurança", "lock", () => setSecurity(true)],
          ].map(([label, icon, fn]) => (
            <button
              key={String(label)}
              className="settings-row"
              onClick={fn as () => void}
            >
              <Icon name={String(icon)} />
              <span>{String(label)}</span>
              <Icon name="chevron" />
            </button>
          ))}
          <Link className="settings-row" to="/app/config/verificacao">
            <Icon name="clipboard" />
            <span>Verificação de perfil</span>
            <Icon name="chevron" />
          </Link>
          <Link className="settings-row" to="/app/aprenda/suporte">
            <Icon name="message" />
            <span>FAQ e suporte</span>
            <Icon name="chevron" />
          </Link>
          <Link className="settings-row" to="/offline">
            <Icon name="download" />
            <span>Materiais offline</span>
            <Icon name="chevron" />
          </Link>
          <button
            className="settings-row"
            onClick={() =>
              action.run(
                exportData,
                "Cópia dos seus dados preparada para download.",
              )
            }
          >
            <Icon name="download" />
            <span>Exportar meus dados</span>
            <Icon name="chevron" />
          </button>
          {auth.demo && (
            <button className="settings-row" onClick={() => setLegacy(true)}>
              <Icon name="folder" />
              <span>Recuperar progresso da versão anterior</span>
              <Icon name="chevron" />
            </button>
          )}
          <button
            className="settings-row danger-text"
            onClick={() => setLogout(true)}
          >
            <Icon name="logout" />
            <span>Sair</span>
            <Icon name="chevron" />
          </button>
        </Card>
      </div>
      {auth.role === "instituicao" && (
        <Card>
          <h2>Perfis e permissões</h2>
          <p>
            Os perfis privilegiados são aprovados pelo responsável pelo
            ambiente. A administração institucional pode gerenciar turmas e
            matrículas da própria instituição.
          </p>
          <div className="actions">
            <ActionLink to="/app/turmas" variant="outline">
              Gerenciar turmas
            </ActionLink>
            <ActionLink to="/app/relatorios" variant="outline">
              Relatórios
            </ActionLink>
          </div>
          <p className="small muted">
            Provisionamento de contas, convites, integrações sociais e auditoria
            operacional precisam ser configurados pelo responsável pela
            implantação.
          </p>
        </Card>
      )}
      <ActionFeedback action={action} />
      {prefs && p && (
        <Modal title="Preferências" onClose={() => setPrefs(false)}>
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void action.run(
                () =>
                  repo.update("profiles", p.id, {
                    preferences: {
                      ...p.preferences,
                      large_text: f.get("large") === "on",
                      reduced_motion: f.get("motion") === "on",
                      study_minutes: Number(f.get("minutes")),
                    },
                  }),
                "Preferências salvas.",
              );
            }}
          >
            <label className="check-label">
              <input
                type="checkbox"
                name="large"
                defaultChecked={Boolean(p.preferences.large_text)}
              />
              Texto ampliado
            </label>
            <label className="check-label">
              <input
                type="checkbox"
                name="motion"
                defaultChecked={Boolean(p.preferences.reduced_motion)}
              />
              Reduzir movimentos
            </label>
            <label>
              Tempo por sessão de estudo
              <select
                name="minutes"
                defaultValue={Number(p.preferences.study_minutes) || 15}
              >
                <option value="15">15 minutos</option>
                <option value="30">30 minutos</option>
                <option value="60">60 minutos</option>
              </select>
            </label>
            <Button type="submit" disabled={action.busy}>
              Salvar preferências
            </Button>
            <ActionFeedback action={action} />
          </form>
        </Modal>
      )}
      {privacy && p && (
        <Modal title="Privacidade" onClose={() => setPrivacy(false)}>
          <p>
            Seu perfil público pode ser visto pela comunidade autenticada e
            participar do ranking. Candidatar-se a uma vaga compartilha seu
            perfil com o responsável pela oportunidade, mesmo quando não for
            público.
          </p>
          <label className="check-label">
            <input
              type="checkbox"
              checked={p.public_profile}
              disabled={action.busy}
              onChange={(e) =>
                action.run(
                  () =>
                    repo.update("profiles", p.id, {
                      public_profile: e.target.checked,
                    }),
                  "Preferência atualizada.",
                )
              }
            />
            Participar do diretório e ranking da comunidade
          </label>
          <p>
            A triagem automática não deve receber senhas ou documentos.
            Documentos de verificação ficam em uma área privada.
          </p>
          <Button variant="outline" onClick={() => action.run(exportData)}>
            Exportar meus dados
          </Button>
          <ActionFeedback action={action} />
        </Modal>
      )}
      {security && <Security onClose={() => setSecurity(false)} />}{" "}
      {logout && (
        <Confirm
          title="Sair do SkillUp?"
          onClose={() => setLogout(false)}
          onConfirm={async () => {
            await clearOffline(`${auth.demo ? "demo:" : ""}${auth.id}`);
            sessionStorage.removeItem(
              `skillup.triage.${auth.demo ? "demo." : ""}${auth.id}`,
            );
            sessionStorage.removeItem(
              `skillup.recent.${auth.demo ? "demo:" : ""}${auth.id}`,
            );
            await auth.logout();
            navigate("/login");
          }}
        >
          Suas cópias offline e conclusões ainda na fila serão removidas deste
          dispositivo. O progresso já confirmado continuará salvo.
        </Confirm>
      )}
      {legacy && (
        <Confirm
          title="Importar dados da versão anterior?"
          onClose={() => setLegacy(false)}
          onConfirm={async () => {
            const raw = localStorage.getItem("skillup_fidelity");
            if (!raw)
              throw new Error(
                "Não foram encontrados dados da versão anterior neste navegador.",
              );
            const old = JSON.parse(raw),
              d = readDemo(),
              profile = d.profiles.find((p) => p.id === auth.id);
            if (profile && typeof old.name === "string")
              profile.full_name = old.name.slice(0, 80);
            const modules = d.modules
              .filter(
                (m) => m.track_id === "00000000-0000-4000-8000-000000000200",
              )
              .sort((a, b) => a.position - b.position);
            if (Array.isArray(old.lessons))
              for (const index of old.lessons) {
                const m = modules[index];
                if (
                  m &&
                  !d.progress.some(
                    (p) => p.user_id === auth.id && p.module_id === m.id,
                  )
                )
                  d.progress.push({
                    id: uid(),
                    user_id: auth.id!,
                    module_id: m.id,
                    completed_at: new Date().toISOString(),
                  });
              }
            writeDemo(d);
            await repo.reload();
          }}
        >
          Nome e etapas serão importados apenas para a demonstração. A cópia
          anterior permanecerá intacta; XP e certificados reais não serão
          criados.
        </Confirm>
      )}
    </div>
  );
}
export function ProfileEditor() {
  const auth = useAuth(),
    repo = useData(),
    p = repo.data.profiles.find((p) => p.id === auth.id),
    action = useAction();
  if (!p) return <Empty title="Perfil indisponível" />;
  return (
    <div className="stack narrow">
      <Link className="back-link" to="/app/config">
        <Icon name="arrow" />
        Configurações
      </Link>
      <Heading
        title="Editar perfil"
        description="Conte sua trajetória e as habilidades que você está desenvolvendo."
      />
      <form
        className="card stack"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget),
            website = String(f.get("website")).trim();
          if (website && !safeUrl(website)) {
            action.setError("O portfólio deve usar um endereço HTTPS válido.");
            return;
          }
          void action.run(
            () =>
              repo.update("profiles", p.id, {
                full_name: String(f.get("name")).trim(),
                headline: String(f.get("headline")).trim(),
                bio: String(f.get("bio")).trim(),
                website,
                skills: String(f.get("skills"))
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .slice(0, 30),
              }),
            "Perfil atualizado.",
          );
        }}
      >
        <label>
          Nome
          <input
            name="name"
            autoComplete="name"
            defaultValue={p.full_name}
            maxLength={80}
            minLength={2}
            required
          />
        </label>
        <label>
          Apresentação profissional
          <input
            name="headline"
            defaultValue={p.headline}
            maxLength={160}
            placeholder="Estudante de desenvolvimento de sistemas"
          />
        </label>
        <label>
          Sobre você
          <textarea name="bio" rows={5} defaultValue={p.bio} maxLength={3000} />
        </label>
        <label>
          Habilidades (separadas por vírgula)
          <input
            name="skills"
            defaultValue={p.skills.join(", ")}
            maxLength={500}
          />
        </label>
        <label>
          Portfólio ou site
          <input
            name="website"
            type="url"
            defaultValue={p.website}
            placeholder="https://"
          />
        </label>
        {!auth.demo && (
          <label>
            E-mail da conta
            <input value={auth.email} disabled />
            <small>
              A troca de e-mail deve ser confirmada pelo serviço de
              autenticação.
            </small>
          </label>
        )}
        <Button type="submit" disabled={action.busy}>
          Salvar alterações
        </Button>
        <ActionFeedback action={action} />
      </form>
      <Experiences userId={auth.id!} editable />
    </div>
  );
}
const documents: Record<Role, string[]> = {
  estudante: ["Carteira de estudante (opcional)"],
  docente: ["Declaração institucional", "Comprovante de vínculo profissional"],
  recrutador: ["Declaração institucional", "Contrato social"],
  instituicao: [
    "Declaração institucional",
    "Alvará de funcionamento",
    "Contrato social",
    "Credenciamento institucional",
  ],
};
export function Verification() {
  const auth = useAuth(),
    repo = useData(),
    action = useAction(),
    request = repo.data.role_requests.find(
      (r) => r.user_id === auth.id && r.status === "pending",
    ),
    [role, setRole] = useState<Role>("estudante");
  return (
    <div className="stack narrow">
      <Heading
        title="Verificação de perfil"
        description="A aprovação de um perfil profissional acontece no servidor, após análise do responsável."
      />
      {auth.demo && (
        <Notice>
          Não envie documentos pessoais na demonstração. A coleta de arquivos só
          está disponível com uma conta real.
        </Notice>
      )}
      {request ? (
        <Card>
          <Badge>
            Aguardando análise · {roleLabels[request.requested_role]}
          </Badge>
          <h2>{request.organization_name || "Documentação de estudante"}</h2>
          <p>
            Envie PDFs ou imagens de até 5 MB. Os arquivos são privados; o envio
            não significa aprovação.
          </p>
          <div className="stack">
            {documents[request.requested_role].map((label, i) => {
              const existing = request.document_paths.find((p) =>
                p.split("/")[2]?.startsWith(`${i}-`),
              );
              return (
                <label key={label}>
                  {label}
                  <input
                    type="file"
                    accept="application/pdf,image/png,image/jpeg"
                    disabled={auth.demo || action.busy}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      void action.run(async () => {
                        if (
                          file.size > 5 * 1024 * 1024 ||
                          ![
                            "application/pdf",
                            "image/png",
                            "image/jpeg",
                          ].includes(file.type)
                        )
                          throw new Error("Use PDF, PNG ou JPEG de até 5 MB.");
                        const path = `${auth.id}/${request.id}/${i}-${uid()}.${file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg"}`;
                        const { error } = await requireSupabase()
                          .storage.from("profile-documents")
                          .upload(path, file);
                        if (error) throw error;
                        try {
                          await repo.update("role_requests", request.id, {
                            document_paths: [
                              ...request.document_paths.filter(
                                (p) => p !== existing,
                              ),
                              path,
                            ],
                          });
                        } catch (error) {
                          await requireSupabase()
                            .storage.from("profile-documents")
                            .remove([path]);
                          throw error;
                        }
                        if (existing)
                          await requireSupabase()
                            .storage.from("profile-documents")
                            .remove([existing]);
                      }, "Documento armazenado. A análise ainda está pendente.");
                    }}
                  />
                  {existing && <small>Arquivo recebido</small>}
                </label>
              );
            })}
          </div>
        </Card>
      ) : (
        <form
          className="card stack"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void action.run(
              () =>
                repo.add("role_requests", {
                  id: uid(),
                  user_id: auth.id!,
                  requested_role: role,
                  organization_name: String(f.get("organization")).trim(),
                  registration_number: String(f.get("registration") || ""),
                  cnae: String(f.get("cnae") || ""),
                  status: "pending",
                  document_paths: [],
                  created_at: new Date().toISOString(),
                }),
              "Solicitação registrada. Nenhuma permissão foi alterada.",
            );
          }}
        >
          <label>
            Perfil solicitado
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              {Object.entries(roleLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Instituição ou empresa
            <input
              name="organization"
              maxLength={160}
              required={role !== "estudante"}
            />
          </label>
          {["recrutador", "instituicao"].includes(role) && (
            <label>
              Registro institucional
              <input name="registration" maxLength={32} required />
            </label>
          )}
          {role === "instituicao" && (
            <label>
              CNAE
              <input name="cnae" maxLength={30} required />
            </label>
          )}
          <Button type="submit" disabled={action.busy}>
            Solicitar verificação
          </Button>
        </form>
      )}
      <ActionFeedback action={action} />
      <SectionTitle>Solicitações anteriores</SectionTitle>
      {repo.data.role_requests
        .filter((r) => r.user_id === auth.id && r.status !== "pending")
        .map((r) => (
          <Card key={r.id}>
            <strong>{roleLabels[r.requested_role]}</strong>
            <p>{r.status === "approved" ? "Aprovada" : "Não aprovada"}</p>
          </Card>
        ))}
    </div>
  );
}
function Security({ onClose }: { onClose: () => void }) {
  const auth = useAuth(),
    action = useAction(),
    [factor, setFactor] = useState<{
      id: string;
      qr: string;
      secret: string;
    } | null>(null),
    [factors, setFactors] = useState<{ id: string; friendly_name?: string }[]>(
      [],
    ),
    [code, setCode] = useState("");
  useEffect(() => {
    if (!auth.demo)
      requireSupabase()
        .auth.mfa.listFactors()
        .then(({ data, error }) => {
          if (error) action.setError(error.message);
          else
            setFactors(data?.totp.filter((f) => f.status === "verified") || []);
        });
  }, [auth.demo]);
  return (
    <Modal title="Segurança da conta" onClose={onClose}>
      {auth.demo ? (
        <Notice>
          A demonstração não utiliza senha nem autenticação. Estes controles
          ficam disponíveis em uma conta real.
        </Notice>
      ) : (
        <div className="stack">
          <p>
            Use um aplicativo autenticador para acrescentar um segundo fator à
            conta.
          </p>
          {factors.map((f) => (
            <Notice key={f.id} tone="success">
              Autenticador ativo: {f.friendly_name || "SkillUp"}
            </Notice>
          ))}
          {!factors.length && !factor && (
            <Button
              onClick={() =>
                action.run(async () => {
                  const { data, error } =
                    await requireSupabase().auth.mfa.enroll({
                      factorType: "totp",
                      friendlyName: "SkillUp",
                    });
                  if (error) throw error;
                  setFactor({
                    id: data.id,
                    qr: data.totp.qr_code,
                    secret: data.totp.secret,
                  });
                })
              }
            >
              Configurar autenticador
            </Button>
          )}
          {factor && (
            <>
              <img
                className="mfa-qr"
                src={factor.qr}
                alt="QR code para configurar o autenticador"
              />
              <details>
                <summary>Usar chave manual</summary>
                <code>{factor.secret}</code>
              </details>
              <form
                className="stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  void action.run(async () => {
                    const { error } =
                      await requireSupabase().auth.mfa.challengeAndVerify({
                        factorId: factor.id,
                        code,
                      });
                    if (error) throw error;
                    setFactors([{ id: factor.id, friendly_name: "SkillUp" }]);
                    setFactor(null);
                  }, "Autenticador confirmado.");
                }}
              >
                <label>
                  Código do autenticador
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                </label>
                <Button type="submit" disabled={action.busy}>
                  Confirmar código
                </Button>
              </form>
            </>
          )}
          <Button
            variant="outline"
            onClick={() =>
              action.run(async () => {
                const { error } =
                  await requireSupabase().auth.resetPasswordForEmail(
                    auth.email,
                    { redirectTo: `${location.origin}/redefinir-senha` },
                  );
                if (error) throw error;
              }, "Instruções enviadas para o e-mail da conta.")
            }
          >
            Enviar link para trocar senha
          </Button>
          <ActionFeedback action={action} />
        </div>
      )}
    </Modal>
  );
}
