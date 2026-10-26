import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { roleLabels, type Role } from "../lib/types";
import { ActionFeedback, Button, useAction } from "./ui";
const roles: Role[] = ["estudante", "docente", "recrutador", "instituicao"];
export function DemoToolbar() {
  const auth = useAuth(),
    navigate = useNavigate(),
    action = useAction();
  if (!auth.demo) return null;
  return (
    <section
      className="demo-banner demo-toolbar"
      aria-label="Navegação de teste"
    >
      <div>
        <strong>Demonstração</strong>
        <p>Versão de teste · dados de exemplo neste navegador.</p>
      </div>
      <div className="demo-toolbar-controls">
        <label>
          Testar como
          <select
            value={auth.role || "estudante"}
            onChange={(e) => {
              const role = e.target.value as Role;
              if (!roles.includes(role)) return;
              auth.startDemo(role);
              navigate("/app/home", { replace: true });
            }}
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {roleLabels[role]}
              </option>
            ))}
          </select>
        </label>
        <Button
          variant="outline"
          disabled={action.busy}
          onClick={() =>
            action.run(async () => {
              await auth.logout();
              navigate("/teste", { replace: true });
            })
          }
        >
          Sair do teste
        </Button>
      </div>
      <ActionFeedback action={action} />
    </section>
  );
}
