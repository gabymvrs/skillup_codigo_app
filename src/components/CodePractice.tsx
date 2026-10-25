import { useEffect, useRef, useState } from "react";
import type { Question } from "../lib/types";
import { runCode } from "../services/codeRunner";
import { Button, Notice } from "./ui";
export default function CodePractice({
  q,
  value,
  onChange,
  disabled,
}: {
  q: Question;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const language = q.payload?.language;
  const [stdin, setStdin] = useState(q.payload?.tests?.[0]?.stdin || "");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [preview, setPreview] = useState<{ code: string; key: number } | null>(
    null,
  );
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);
  if (!language)
    return (
      <Notice tone="warning">
        A linguagem desta atividade ainda não foi definida.
      </Notice>
    );
  async function execute() {
    if (language === "web") {
      setPreview({ code: value, key: Date.now() });
      return;
    }
    if (language !== "python" && language !== "javascript") return;
    abort.current?.abort();
    abort.current = new AbortController();
    setRunning(true);
    setOutput("");
    setError("");
    try {
      const result = await runCode(
        language,
        value,
        stdin,
        abort.current.signal,
      );
      setOutput(result.output || "Programa finalizado sem saída.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha de execução.");
    } finally {
      setRunning(false);
    }
  }
  return (
    <div className="code-practice stack">
      <p className="small">
        {language === "web"
          ? "HTML, CSS e JavaScript · pré-visualização isolada"
          : "Editor e console · " +
            (language === "python" ? "Python" : "JavaScript")}
        . Executar permite testar; use a validação da atividade para registrar o
        resultado.
      </p>
      {language === "python" && (
        <p className="small muted">
          O interpretador Python é carregado pela internet somente quando você
          executa o código.
        </p>
      )}
      <label>
        Código {language === "web" ? "HTML/CSS/JS" : language}
        <textarea
          className="code-editor"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={12}
          maxLength={10000}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          disabled={disabled || running}
        />
      </label>
      {language !== "web" && (
        <label>
          Entrada do programa (uma linha por valor)
          <textarea
            rows={3}
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            maxLength={2000}
            disabled={disabled || running}
          />
        </label>
      )}
      <div className="actions">
        <Button
          icon="play"
          variant="outline"
          onClick={execute}
          disabled={disabled || running || !value.trim()}
        >
          {running
            ? "Executando…"
            : language === "web"
              ? "Atualizar prévia"
              : "Executar código"}
        </Button>
        {running && (
          <Button variant="outline" onClick={() => abort.current?.abort()}>
            Interromper
          </Button>
        )}
        {preview && (
          <Button variant="ghost" onClick={() => setPreview(null)}>
            Fechar prévia
          </Button>
        )}
      </div>
      {preview && (
        <iframe
          key={preview.key}
          className="code-preview"
          title="Pré-visualização da sua página"
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          src="/code-sandbox/preview.html"
          onLoad={(e) =>
            e.currentTarget.contentWindow?.postMessage(
              { kind: "preview", html: preview.code },
              "*",
            )
          }
        />
      )}
      {running && (
        <p role="status">Preparando o ambiente e executando seu programa…</p>
      )}
      {output && (
        <pre
          className="code-output"
          role="status"
          aria-label="Saída do programa"
        >
          {output}
        </pre>
      )}
      {error && (
        <Notice tone="error" onDismiss={() => setError("")}>
          {error}
        </Notice>
      )}
    </div>
  );
}
