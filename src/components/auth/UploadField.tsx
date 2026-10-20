import { useId, useRef, useState } from "react";
import { Icon } from "../ui";
import { validateDocument } from "../../services/registration";
export function UploadField({
  label,
  file,
  stored = false,
  disabled = false,
  student = false,
  onChange,
}: {
  label: string;
  file?: File;
  stored?: boolean;
  disabled?: boolean;
  student?: boolean;
  onChange: (file?: File) => void;
}) {
  const id = useId(),
    ref = useRef<HTMLInputElement>(null),
    [error, setError] = useState("");
  return (
    <div className={`upload-field ${student ? "upload-student" : ""}`}>
      {!student && <label htmlFor={id}>{label}:</label>}
      <label
        className={`upload-control ${disabled ? "is-disabled" : ""}`}
        htmlFor={id}
      >
        <input
          ref={ref}
          id={id}
          type="file"
          aria-label={label}
          disabled={disabled}
          accept="application/pdf,image/png,image/jpeg"
          aria-describedby={`${id}-status`}
          onChange={(e) => {
            const next = e.target.files?.[0];
            if (!next) return;
            try {
              validateDocument(next);
              setError("");
              onChange(next);
            } catch (err) {
              setError((err as Error).message);
              e.target.value = "";
            }
          }}
        />
        <Icon
          name={stored && !file ? "check" : "upload"}
          size={student ? 40 : 28}
        />
        <span>
          {file
            ? file.name
            : stored
              ? "Documento armazenado · substituir"
              : student
                ? "Faça Upload da sua Carteira de estudante aqui"
                : "Anexar documento"}
        </span>
      </label>
      <small id={`${id}-status`} role="status">
        {file
          ? "Selecionado neste navegador. Ainda não enviado."
          : stored
            ? "Arquivo recebido no armazenamento privado."
            : "PDF, PNG ou JPEG · até 5 MB"}
      </small>
      {file && (
        <button
          type="button"
          className="text-link"
          disabled={disabled}
          onClick={() => {
            onChange(undefined);
            setError("");
            if (ref.current) ref.current.value = "";
          }}
        >
          Remover seleção de {label.toLowerCase()}
        </button>
      )}
      {error && (
        <p className="upload-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
