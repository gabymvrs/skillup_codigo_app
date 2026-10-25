import { describe, expect, it, vi } from "vitest";
import {
  gradeProgram,
  gradeWeb,
  base64,
} from "../supabase/functions/grading-code/grading";
import { runCode } from "../src/services/codeRunner";

const args = {
  source: "print(int(input()) + int(input()))",
  language: "python" as const,
  languageId: 71,
  tests: [{ stdin: "3\n4", stdout: "7" }],
  url: "https://judge.example",
  headers: {},
  pause: async () => {},
};
function response(value: unknown) {
  return new Response(JSON.stringify(value));
}
describe("Trusted code grading", () => {
  it("waits for server execution and enforces limits instead of trusting client output", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response({ token: "test-123" }))
      .mockResolvedValueOnce(response({ status: { id: 2 } }))
      .mockResolvedValueOnce(
        response({ status: { id: 3 }, stdout: base64("7\n") }),
      );
    expect((await gradeProgram({ ...args, fetcher })).correct).toBe(true);
    const submitted = JSON.parse(String(fetcher.mock.calls[0][1]?.body));
    expect(submitted).toMatchObject({
      enable_network: false,
      cpu_time_limit: 2,
      wall_time_limit: 5,
      stdin: base64("3\n4"),
    });
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
  it("rejects incorrect stdout even if the executor reports success", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response({ token: "test-123" }))
      .mockResolvedValueOnce(
        response({ status: { id: 3 }, stdout: base64("8") }),
      );
    expect((await gradeProgram({ ...args, fetcher })).correct).toBe(false);
  });
  it("does not produce a verdict on provider failure or prolonged queue", async () => {
    await expect(
      gradeProgram({
        ...args,
        fetcher: vi.fn().mockResolvedValue(new Response("", { status: 503 })),
      }),
    ).rejects.toThrow("indisponível");
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response({ token: "test-123" }))
      .mockImplementation(async () => response({ status: { id: 1 } }));
    await expect(gradeProgram({ ...args, fetcher })).rejects.toThrow(
      "não terminou",
    );
  });
  it("checks HTML structure without running submitted scripts", () => {
    const parse = (source: string) =>
      new DOMParser().parseFromString(source, "text/html");
    const rules = [{ selector: "main#conteudo h1", text: "Meu curso" }];
    expect(
      gradeWeb('<main id="conteudo"><h1>Meu curso</h1></main>', rules, parse),
    ).toBe(true);
    expect(
      gradeWeb(
        '<script>document.body.innerHTML="<main id=conteudo><h1>Meu curso</h1></main>"</script>',
        rules,
        parse,
      ),
    ).toBe(false);
  });
});
describe("Isolated local runtime", () => {
  it("ignores other windows, has no same-origin permission and removes its frame when cancelled", async () => {
    const controller = new AbortController();
    const pending = runCode(
      "javascript",
      "console.log(input())",
      "7",
      controller.signal,
    );
    const failure = expect(pending).rejects.toThrow("interrompida");
    const frame = document.querySelector("iframe")!;
    expect(frame.getAttribute("sandbox")).toBe("allow-scripts");
    window.dispatchEvent(
      new MessageEvent("message", {
        source: window,
        data: { kind: "result", output: "forged" },
      }),
    );
    expect(frame.isConnected).toBe(true);
    controller.abort();
    await failure;
    expect(document.querySelector("iframe")).toBeNull();
  });
});
