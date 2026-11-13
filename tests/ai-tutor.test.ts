import { describe, expect, it } from "vitest";
import {
  geminiPayload,
  parseTutorRequest,
} from "../supabase/functions/_shared/geminiTutor";

describe("Gemini school tutor", () => {
  it("keeps only four relevant messages and removes common personal data", () => {
    const parsed = parseTutorRequest(
      JSON.stringify({
        subject: "Matemática",
        messages: [
          { role: "user", text: "mensagem antiga" },
          { role: "model", text: "resposta antiga" },
          { role: "user", text: "Meu e-mail é aluno@example.com" },
          { role: "model", text: "Não preciso do seu e-mail." },
          { role: "user", text: "Explique frações para mim" },
        ],
      }),
    );
    expect(parsed.messages).toHaveLength(4);
    expect(parsed.messages[1].text).toContain("[e-mail removido]");
    expect(parsed.messages.at(-1)?.text).toBe("Explique frações para mim");
  });

  it("uses 250 output tokens normally and allows a deeper explanation", () => {
    const normal = geminiPayload(
      [{ role: "user", text: "O que é uma fração?" }],
      "Matemática",
    );
    const detailed = geminiPayload(
      [{ role: "user", text: "Pode aprofundar passo a passo?" }],
      "Matemática",
    );
    expect(normal.generationConfig.maxOutputTokens).toBe(250);
    expect(detailed.generationConfig.maxOutputTokens).toBe(500);
    expect(normal.system_instruction.parts[0].text).toContain("Matemática");
  });

  it("rejects malformed history", () => {
    expect(() =>
      parseTutorRequest(
        JSON.stringify({ messages: [{ role: "model", text: "sem pergunta" }] }),
      ),
    ).toThrow(/última mensagem/i);
  });
});
