import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AnimalCellSimulation } from "../src/features/simulations/AnimalCellSimulation";
import { ElectricCircuitSimulation } from "../src/features/simulations/ElectricCircuitSimulation";
import { LogicGatesSimulation } from "../src/features/simulations/LogicGatesSimulation";
import { SolarSystemSimulation } from "../src/features/simulations/SolarSystemSimulation";

describe("Simulation keyboard accessibility", () => {
  it("operates a logic input from the keyboard and announces the output", async () => {
    const user = userEvent.setup();
    render(<LogicGatesSimulation />);
    const inputA = screen.getByRole("button", { name: "Entrada A: desligada" });

    inputA.focus();
    await user.keyboard("{Enter}");
    expect(
      screen.getByRole("button", { name: "Entrada A: ligada" }),
    ).toHaveFocus();
    expect(screen.getByRole("status", { name: /Saída 0/ })).toBeVisible();
  });

  it("starts the orbits and selects a planet from the keyboard", async () => {
    const user = userEvent.setup();
    render(<SolarSystemSimulation />);
    const start = screen.getByRole("button", { name: "Iniciar órbitas" });

    start.focus();
    await user.keyboard(" ");
    expect(
      screen.getByRole("button", { name: "Pausar órbitas" }),
    ).toHaveFocus();
    const mars = screen.getByRole("button", { name: "Selecionar Marte" });
    mars.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("heading", { name: "Marte" })).toBeVisible();
  });

  it("selects a cell structure from the keyboard", async () => {
    const user = userEvent.setup();
    render(<AnimalCellSimulation />);
    const mitochondria = screen.getByRole("button", {
      name: "Selecionar Mitocôndria",
    });

    mitochondria.focus();
    await user.keyboard("{Enter}");
    expect(mitochondria).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { name: "Mitocôndria" })).toBeVisible();
  });

  it("closes the electric circuit from the keyboard and announces its state", async () => {
    const user = userEvent.setup();
    render(<ElectricCircuitSimulation />);
    const circuitSwitch = screen.getByRole("button", {
      name: "Fechar chave do circuito",
    });

    circuitSwitch.focus();
    await user.keyboard(" ");
    expect(
      screen.getByRole("button", { name: "Abrir chave do circuito" }),
    ).toHaveFocus();
    expect(
      screen.getByRole("status", { name: "Feedback do circuito" }),
    ).toHaveTextContent("A corrente está circulando");
  });
});
