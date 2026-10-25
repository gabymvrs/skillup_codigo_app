export interface TestCase {
  stdin: string;
  stdout: string;
}
export interface WebRule {
  selector: string;
  text?: string;
  attribute?: string;
  value?: string;
}
interface ParsedDocument {
  querySelectorAll(
    selector: string,
  ): ArrayLike<{
    textContent: string | null;
    getAttribute(name: string): string | null;
  }>;
}
export function gradeWeb(
  source: string,
  rules: WebRule[],
  parse: (source: string) => ParsedDocument,
) {
  const doc = parse(source);
  return (
    rules.length > 0 &&
    rules.length <= 20 &&
    rules.every((rule) =>
      Array.from(doc.querySelectorAll(rule.selector)).some(
        (el) =>
          (!rule.text || el.textContent?.trim() === rule.text) &&
          (!rule.attribute || el.getAttribute(rule.attribute) === rule.value),
      ),
    )
  );
}
export const base64 = (value: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(value)));
const decode = (value: string | null | undefined) =>
  value
    ? new TextDecoder().decode(
        Uint8Array.from(atob(value), (char) => char.charCodeAt(0)),
      )
    : "";
export async function gradeProgram(args: {
  source: string;
  language: "python" | "javascript";
  languageId: number;
  tests: TestCase[];
  url: string;
  headers: Record<string, string>;
  fetcher?: typeof fetch;
  pause?: (ms: number) => Promise<void>;
}) {
  if (!args.tests.length || args.tests.length > 5)
    throw new Error("Testes da atividade indisponíveis.");
  const base = new URL(args.url);
  if (base.protocol !== "https:")
    throw new Error("O serviço de validação precisa usar HTTPS.");
  const fetcher = args.fetcher || fetch;
  const pause =
    args.pause || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const code =
    args.language === "javascript"
      ? 'const __skillupLines = require("fs").readFileSync(0,"utf8").replace(/\\r/g, "").split("\\n");\nconst input = () => __skillupLines.shift() ?? "";\n' +
        args.source
      : args.source;
  async function request(path: string, body?: unknown) {
    const response = await fetcher(args.url.replace(/\/$/, "") + path, {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json", ...args.headers },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10000),
      redirect: "error",
    });
    if (!response.ok)
      throw new Error(
        "O serviço de correção está indisponível. Tente novamente mais tarde.",
      );
    return await response.json();
  }
  for (let i = 0; i < args.tests.length; i++) {
    const test = args.tests[i];
    const created = await request(
      "/submissions?base64_encoded=true&wait=false",
      {
        source_code: base64(code),
        language_id: args.languageId,
        stdin: base64(test.stdin),
        expected_output: base64(test.stdout),
        cpu_time_limit: 2,
        wall_time_limit: 5,
        memory_limit: 256000,
        max_file_size: 64,
        enable_network: false,
      },
    );
    if (
      typeof created.token !== "string" ||
      !/^[\w-]{1,100}$/.test(created.token)
    )
      throw new Error("Resposta inválida do serviço de correção.");
    let result;
    for (let poll = 0; poll < 12; poll++) {
      result = await request(
        `/submissions/${created.token}?base64_encoded=true&fields=status,stdout,stderr,compile_output`,
      );
      if (result.status?.id > 2) break;
      await pause(750);
    }
    if (!result || !(result.status?.id > 2))
      throw new Error(
        "A correção ainda não terminou. Tente novamente em instantes.",
      );
    if (
      result.status.id !== 3 ||
      decode(result.stdout).trim() !== test.stdout.trim()
    )
      return {
        correct: false,
        explanation: `Teste ${i + 1} não passou. ${decode(result.stderr || result.compile_output).slice(0, 1200) || "Revise as entradas, o cálculo e a saída. Não imprima mensagens adicionais."}`,
      };
  }
  return { correct: true, explanation: "Todos os testes passaram." };
}
