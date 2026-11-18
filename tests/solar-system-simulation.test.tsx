import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SolarSystemSimulation } from "../src/features/simulations/SolarSystemSimulation";

describe("Solar System simulation", () => {
  it("starts, pauses, changes speed and selects planets", async () => {
    const user = userEvent.setup();
    render(<SolarSystemSimulation />);

    expect(
      screen.getByRole("heading", { name: "Explore as órbitas" }),
    ).toBeVisible();
    expect(
      screen.getByRole("group", {
        name: /Órbitas pausadas\. Planeta selecionado: Terra/,
      }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "Terra" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Iniciar órbitas" }));
    expect(
      screen.getByRole("group", {
        name: /Órbitas em movimento\. Planeta selecionado: Terra/,
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Pausar órbitas" }),
    ).toHaveAttribute("aria-pressed", "true");

    const speed = screen.getByRole("slider", { name: "Velocidade: 1×" });
    fireEvent.change(speed, { target: { value: "2" } });
    expect(screen.getByRole("slider", { name: "Velocidade: 2×" })).toHaveValue(
      "2",
    );

    await user.click(screen.getByRole("button", { name: "Selecionar Marte" }));
    expect(screen.getByRole("heading", { name: "Marte" })).toBeVisible();
    expect(screen.getByText("4º planeta a partir do Sol")).toBeVisible();
    expect(
      screen.getByRole("group", { name: /Planeta selecionado: Marte/ }),
    ).toBeVisible();
  });

  it("shows or hides names and restores the initial state", async () => {
    const user = userEvent.setup();
    render(<SolarSystemSimulation />);
    const scene = screen.getByRole("group", { name: /Modelo 2D/ });

    expect(within(scene).getByText("Mercúrio")).toBeVisible();
    await user.click(screen.getByRole("checkbox", { name: "Mostrar nomes" }));
    expect(within(scene).queryByText("Mercúrio")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Selecionar Netuno" }));
    await user.click(screen.getByRole("button", { name: "Iniciar órbitas" }));

    await user.click(screen.getByRole("button", { name: "Reiniciar" }));
    expect(screen.getByRole("heading", { name: "Terra" })).toBeVisible();
    expect(
      screen.getByRole("checkbox", { name: "Mostrar nomes" }),
    ).toBeChecked();
    expect(screen.getByRole("slider", { name: "Velocidade: 1×" })).toHaveValue(
      "1",
    );
    expect(
      screen.getByRole("button", { name: "Iniciar órbitas" }),
    ).toBeVisible();
  });
});
