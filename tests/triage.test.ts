import { describe, expect, it } from "vitest";
import {
  advance,
  classify,
  initialTriage,
  summary,
} from "../src/services/triage";
import { safeUrl, matches } from "../src/lib/utils";
describe("Triage and input boundaries", () => {
  it("recognizes Portuguese accents and account issues", () => {
    expect(classify("Esqueci minha senha de acesso")).toBe("Conta e acesso");
    expect(classify("Meu estágio e candidatura")).toBe("Carreira");
    expect(matches("programacao", "Programação")).toBe(true);
  });
  it("asks follow-ups, classifies urgency and never fabricates a sent ticket", () => {
    let state = advance(initialTriage(), "Meu material não abre");
    expect(state.stage).toBe("detail");
    state = advance(state, "Na biblioteca, tentei abrir o artigo");
    expect(state.stage).toBe("urgency");
    state = advance(state, "Impede uma entrega hoje");
    expect(state.urgency).toBe("Alta");
    expect(state.stage).toBe("done");
    expect(summary(state)).toContain(
      "Nenhum atendimento humano ou envio externo confirmado.",
    );
  });
  it("preserves blank-input state and limits message size", () => {
    const first = initialTriage();
    expect(advance(first, "   ")).toBe(first);
    expect(advance(first, "x".repeat(2000)).detail).toHaveLength(1000);
  });
  it("allows HTTPS portfolios and blocks executable/protocol-relative links", () => {
    expect(safeUrl("https://example.com")).toBe("https://example.com/");
    for (const value of [
      "javascript:alert(1)",
      "data:text/html,hello",
      "//evil.test",
      "http://example.com",
    ])
      expect(safeUrl(value)).toBeUndefined();
  });
});
