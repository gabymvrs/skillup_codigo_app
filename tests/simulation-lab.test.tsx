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
    await user.click(screen.getByRole("link", { name: "Abrir dinâmica" }));
    expect(
      screen.getByRole("heading", { name: "Experimente as portas" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Reiniciar" })).toBeVisible();
  });

  it("opens a catalog item and explains its implementation status", async () => {
    const user = userEvent.setup();
    laboratory();
    const solarCard = screen
      .getByRole("heading", { name: "Sistema Solar" })
      .closest("section");
    expect(solarCard).not.toBeNull();
    await user.click(
      within(solarCard as HTMLElement).getByRole("link", {
        name: "Ver planejamento",
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Sistema Solar" }),
    ).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(
      "será implementada no Lote 3",
    );
    expect(screen.queryByRole("button", { name: /reiniciar/i })).toBeNull();
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
