import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Steps } from "../src/components/ui/steps";

describe("Steps", () => {
  it("indica o progresso e permite voltar apenas para etapas concluídas", async () => {
    const user = userEvent.setup();
    const onStepChange = vi.fn();
    render(
      <Steps
        items={[
          { title: "Introdução" },
          { title: "Prática experimental" },
          { title: "Fixação" },
        ]}
        current={1}
        clickable
        onStepChange={onStepChange}
        aria-label="Etapas da dinâmica"
      />,
    );

    expect(
      screen.getByRole("list", { name: "Etapas da dinâmica" }),
    ).toBeVisible();
    expect(screen.getByRole("listitem", { current: "step" })).toHaveTextContent(
      "Prática experimental",
    );
    expect(screen.getByRole("button", { name: /Fixação/ })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /Introdução/ }));
    expect(onStepChange).toHaveBeenCalledWith(0);
  });
});
