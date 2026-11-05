import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
export function PasswordField({
  name = "password",
  label = "Senha",
  newPassword = false,
}: {
  name?: string;
  label?: string;
  newPassword?: boolean;
}) {
  const id = useId(),
    [visible, setVisible] = useState(false);
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}:</label>
      <div className="password-control">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required
          autoComplete={newPassword ? "new-password" : "current-password"}
          minLength={newPassword ? 8 : undefined}
          maxLength={newPassword ? 128 : undefined}
          placeholder="Ex: Aluno_@123"
          aria-describedby={newPassword ? `${id}-hint` : undefined}
        />
        <button
          type="button"
          aria-label={
            visible
              ? `Ocultar ${label.toLowerCase()}`
              : `Mostrar ${label.toLowerCase()}`
          }
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
        >
          {visible ? (
            <EyeOff size={20} aria-hidden="true" />
          ) : (
            <Eye size={20} aria-hidden="true" />
          )}
        </button>
      </div>
      {newPassword && (
        <small id={`${id}-hint`}>Use pelo menos 8 caracteres.</small>
      )}
    </div>
  );
}
