import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GuidedTheory } from "../src/components/GuidedTheory";

const firstLogicModule = "00000000-0000-4000-8000-000000000302";

describe("first logic lesson for beginners", () => {
  it("visually differentiates a condition from an instruction", () => {
    render(
      <GuidedTheory
        moduleId={firstLogicModule}
        step={1}
        onStep={vi.fn()}
        inputs={{ first: "false", second: "false" }}
        onInputs={vi.fn()}
        onComplete={vi.fn()}
        resourceIds={[]}
        disabled={false}
      />,
    );

    expect(screen.getByText("Condição: verificar")).toBeTruthy();
    expect(screen.getByText("Instrução: agir")).toBeTruthy();
    expect(screen.getByText("Você observa e responde: verdadeiro ou falso.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continuar teoria" })).toBeTruthy();
  });
});
