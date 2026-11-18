import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import {
  SimulationCatalogPage,
  SimulationPage,
} from "../src/features/simulations/SimulationLab";
import { simulationCatalog } from "../src/features/simulations/catalog";

function laboratory(path = "/app/aprenda/dinamica") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/app/aprenda/dinamica"
          element={<SimulationCatalogPage />}
        />
        <Route
          path="/app/aprenda/dinamica/:simulationId"
          element={<SimulationPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Simulation laboratory architecture", () => {
  it("lists the four planned simulations with stable links", () => {
    laboratory();

    const catalog = screen.getByRole("list", {
      name: "Simulações educativas",
    });
    expect(within(catalog).getAllByRole("listitem")).toHaveLength(4);
    for (const simulation of simulationCatalog) {
      const heading = within(catalog).getByRole("heading", {
        name: simulation.title,
      });
      expect(heading).toBeVisible();
      const card = heading.closest("section");
      expect(card).not.toBeNull();
      expect(
        within(card as HTMLElement).getByRole("link", {
          name:
            simulation.status === "available"
              ? "Abrir dinâmica"
              : "Ver planejamento",
        }),
      ).toHaveAttribute("href", `/app/aprenda/dinamica/${simulation.id}`);
    }
    expect(new Set(simulationCatalog.map(({ id }) => id)).size).toBe(4);
  });

  it("opens the available logic-gates simulation", async () => {
    const user = userEvent.setup();
    laboratory();
    const logicCard = screen
      .getByRole("heading", { name: "Portas lógicas" })
      .closest("section");
    expect(logicCard).not.toBeNull();
    await user.click(
      within(logicCard as HTMLElement).getByRole("link", {
        name: "Abrir dinâmica",
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Experimente as portas" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Reiniciar" })).toBeVisible();
  });

  it("opens the available Solar System simulation", async () => {
    const user = userEvent.setup();
    laboratory();
    const solarCard = screen
      .getByRole("heading", { name: "Sistema Solar" })
      .closest("section");
    expect(solarCard).not.toBeNull();
    await user.click(
      within(solarCard as HTMLElement).getByRole("link", {
        name: "Abrir dinâmica",
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Sistema Solar" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Explore as órbitas" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Reiniciar" })).toBeVisible();
  });

  it("opens the available animal-cell simulation", async () => {
    const user = userEvent.setup();
    laboratory();
    const cellCard = screen
      .getByRole("heading", { name: "Célula animal" })
      .closest("section");
    expect(cellCard).not.toBeNull();
    await user.click(
      within(cellCard as HTMLElement).getByRole("link", {
        name: "Abrir dinâmica",
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Explore a célula animal" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Reiniciar" })).toBeVisible();
  });

  it("handles an unknown simulation without breaking navigation", () => {
    laboratory("/app/aprenda/dinamica/desconhecida");
    expect(
      screen.getByRole("heading", { name: "Simulação não encontrada" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Ver catálogo" })).toHaveAttribute(
      "href",
      "/app/aprenda/dinamica",
    );
  });
});
