import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ElectricCircuitSimulation } from "../src/features/simulations/ElectricCircuitSimulation";

describe("Electric circuit simulation", () => {
  it("opens and closes the circuit with visual readings", async () => {
    const user = userEvent.setup();
    render(<ElectricCircuitSimulation />);

    expect(
      screen.getByRole("heading", { name: "Circuito aberto" }),
    ).toBeVisible();
    expect(screen.getByText("0.00 A")).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "Fechar chave do circuito" }),
    );

    expect(
      screen.getByRole("heading", { name: "Circuito fechado" }),
    ).toBeVisible();
    expect(screen.getByText("0.30 A")).toBeVisible();
    expect(
      screen.getByRole("status", { name: "Feedback do circuito" }),
    ).toHaveTextContent("A corrente está circulando");
  });

  it("updates voltage, resistance and restores the initial state", async () => {
    const user = userEvent.setup();
    render(<ElectricCircuitSimulation />);

    await user.click(screen.getByRole("button", { name: "9 V" }));
    fireEvent.change(screen.getByRole("slider"), { target: { value: "30" } });
    await user.click(
      screen.getByRole("button", { name: "Fechar chave do circuito" }),
    );
    expect(screen.getByText("2.70 W")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Reiniciar" }));
    expect(
      screen.getByRole("heading", { name: "Circuito aberto" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "6 V" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("slider")).toHaveValue("20");
  });
});
