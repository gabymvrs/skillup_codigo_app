import { uid } from "../lib/utils";
import type { CodeLanguage, Question } from "../lib/types";
export interface RunResult {
  output: string;
}
export function runCode(
  language: Exclude<CodeLanguage, "web">,
  code: string,
  stdin = "",
  signal?: AbortSignal,
): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Execução interrompida."));
      return;
    }
    if (code.length > 10000 || stdin.length > 2000) {
      reject(new Error("Código ou entrada acima do limite."));
      return;
    }
    const id = uid();
    const frame = document.createElement("iframe");
    frame.hidden = true;
    frame.title = "Execução isolada de código";
    frame.setAttribute("sandbox", "allow-scripts");
    frame.referrerPolicy = "no-referrer";
    frame.src = "/code-sandbox/runner.html";
    let timer: ReturnType<typeof setTimeout>;
    let settled = false;
    const cleanup = () => {
      clearTimeout(timer);
      window.removeEventListener("message", receive);
      signal?.removeEventListener("abort", abort);
      frame.remove();
    };
    const fail = (message: string) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(message));
    };
    const abort = () => fail("Execução interrompida.");
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.contentWindow || event.data?.id !== id) return;
      if (event.data.kind === "running") {
        clearTimeout(timer);
        timer = setTimeout(
          () =>
            fail(
              "Tempo máximo de execução atingido (5 segundos). Revise os laços.",
            ),
          5000,
        );
      }
      if (event.data.kind === "error")
        fail(
          `${String(event.data.output || "").slice(0, 8000)}${String(event.data.message || "Falha de execução.").slice(0, 2000)}`,
        );
      if (event.data.kind === "result" && !settled) {
        settled = true;
        cleanup();
        resolve({ output: String(event.data.output || "").slice(0, 8000) });
      }
    };
    frame.onload = () =>
      frame.contentWindow?.postMessage(
        { kind: "run", id, language, code, stdin },
        "*",
      );
    frame.onerror = () =>
      fail("Ambiente indisponível. Verifique sua conexão e tente novamente.");
    window.addEventListener("message", receive);
    signal?.addEventListener("abort", abort, { once: true });
    timer = setTimeout(
      () =>
        fail(
          "Não foi possível carregar o ambiente. Python precisa de conexão para carregar seu interpretador.",
        ),
      45000,
    );
    document.body.appendChild(frame);
  });
}
export function checkWeb(
  source: string,
  rules: NonNullable<NonNullable<Question["payload"]>["webRules"]>,
) {
  const doc = new DOMParser().parseFromString(source, "text/html");
  return (
    rules.length > 0 &&
    rules.every((rule) =>
      Array.from(doc.querySelectorAll(rule.selector)).some(
        (el) =>
          (!rule.text || el.textContent?.trim() === rule.text) &&
          (!rule.attribute || el.getAttribute(rule.attribute) === rule.value),
      ),
    )
  );
}
export async function gradeDemoCode(q: Question, source: string) {
  const language = q.payload?.language;
  if (language === "web")
    return {
      correct: checkWeb(source, q.payload?.webRules || []),
      explanation: q.explanation,
    };
  if (language !== "python" && language !== "javascript")
    throw new Error("Linguagem não disponível para esta atividade.");
  const tests = q.payload?.tests || [];
  if (!tests.length) throw new Error("Testes ainda não publicados.");
  for (let i = 0; i < tests.length; i++) {
    const result = await runCode(language, source, tests[i].stdin);
    if (result.output.trim() !== tests[i].stdout.trim())
      return {
        correct: false,
        explanation: `O teste ${i + 1} não produziu o resultado esperado. ${q.explanation}`,
      };
  }
  return { correct: true, explanation: q.explanation };
}
