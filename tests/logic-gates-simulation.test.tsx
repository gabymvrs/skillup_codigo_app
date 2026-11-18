import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LogicGatesSimulation } from "../src/features/simulations/LogicGatesSimulation";

describe("Logic gates simulation", () => {
  it("calculates AND, OR and NOT and resets the experiment", async () => {
    const user = userEvent.setup();
    render(<LogicGatesSimulation />);

    expect(
      screen.getByRole("heading", { name: "Experimente as portas" }),
    ).toBeVisible();
    expect(
      screen.getByRole("status", { name: "Saída 0: desligada" }),
    ).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: "Entrada A: desligada" }),
    );
    expect(
      screen.getByRole("status", { name: "Saída 0: desligada" }),
    ).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "Entrada B: desligada" }),
    );
    expect(
      screen.getByRole("status", { name: "Saída 1: ligada" }),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "OR (OU)" }));
    await user.click(
      screen.getByRole("button", { name: "Entrada A: desligada" }),
    );
    expect(
      screen.getByRole("status", { name: "Saída 1: ligada" }),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "NOT (NÃO)" }));
    expect(
      screen.queryByRole("button", { name: /Entrada B:/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Saída 1: ligada" }),
    ).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "Entrada A: desligada" }),
    );
    expect(
      screen.getByRole("status", { name: "Saída 0: desligada" }),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Reiniciar" }));
    expect(screen.getByRole("button", { name: "AND (E)" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByRole("status", { name: "Saída 0: desligada" }),
    ).toBeVisible();
  });

  it("highlights the active truth-table row and describes the diagram", async () => {
    const user = userEvent.setup();
    render(<LogicGatesSimulation />);

    const table = screen.getByRole("table", {
      name: "Tabela-verdade da porta AND (E)",
    });
    expect(within(table).getAllByRole("row")).toHaveLength(5);
    expect(within(table).getByRole("row", { current: true })).toHaveTextContent(
      "000",
    );
    expect(
      screen.getByRole("img", {
        name: "AND (E): entrada A 0, entrada B 0, saída 0",
      }),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "NOT (NÃO)" }));
    expect(
      screen.getByRole("table", {
        name: "Tabela-verdade da porta NOT (NÃO)",
      }),
    ).toBeVisible();
  });
});
