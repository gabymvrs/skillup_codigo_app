import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AnimalCellSimulation } from "../src/features/simulations/AnimalCellSimulation";

describe("Animal cell simulation", () => {
  it("selects organelles and explains their functions", async () => {
    const user = userEvent.setup();
    render(<AnimalCellSimulation />);

    expect(
      screen.getByRole("heading", { name: "Explore a célula animal" }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "Núcleo" })).toBeVisible();
    expect(screen.getByText(/Armazena o DNA/)).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: "Selecionar Mitocôndria" }),
    );
    expect(screen.getByRole("heading", { name: "Mitocôndria" })).toBeVisible();
    expect(screen.getByText(/produção de ATP/)).toBeVisible();
    expect(
      screen.getByRole("status", { name: "Feedback da célula" }),
    ).toHaveTextContent("Estrutura selecionada: Mitocôndria");
  });

  it("runs an identification challenge, toggles labels and resets", async () => {
    const user = userEvent.setup();
    render(<AnimalCellSimulation />);
    const diagram = screen.getByRole("group", { name: /Modelo 2D/ });

    expect(within(diagram).getByText("Mitocôndria")).toBeVisible();
    await user.click(screen.getByRole("checkbox", { name: "Mostrar nomes" }));
    expect(within(diagram).queryByText("Mitocôndria")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Criar desafio" }));
    expect(screen.getByText(/encontre Mitocôndria/)).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: "Selecionar Complexo golgiense" }),
    );
    expect(
      screen.getByRole("status", { name: "Feedback da célula" }),
    ).toHaveTextContent("Procure Mitocôndria");
    await user.click(
      screen.getByRole("button", { name: "Selecionar Mitocôndria" }),
    );
    expect(
      screen.getByRole("status", { name: "Feedback da célula" }),
    ).toHaveTextContent("Correto: você encontrou Mitocôndria");

    await user.click(screen.getByRole("button", { name: "Reiniciar" }));
    expect(screen.getByRole("heading", { name: "Núcleo" })).toBeVisible();
    expect(
      screen.getByRole("checkbox", { name: "Mostrar nomes" }),
    ).toBeChecked();
    expect(screen.getByRole("button", { name: "Criar desafio" })).toBeVisible();
  });
});
