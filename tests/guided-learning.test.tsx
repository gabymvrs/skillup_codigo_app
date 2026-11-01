import { expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../src/state/AuthContext";
import { AppRoutes } from "../src/App";
import { id } from "../src/data/catalog";
import { createDemo } from "../src/data/demo";
import { DEMO_KEY } from "../src/services/repository";
import {
  parseGrade,
  traceAverage,
  missionReady,
  algorithmOrder,
  guidedTheories,
} from "../src/lib/guidedLearning";
function app() {
  sessionStorage.setItem("skillup.demo.role", "estudante");
  return render(
    <MemoryRouter initialEntries={["/app/aprenda/trilhas/" + id(200)]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}
it("calculates real results, distinguishes empty from zero and diagnoses broken dependencies", () => {
  expect(parseGrade("")).toBeNull();
  expect(parseGrade("0")).toBe(0);
  expect(parseGrade("7,5")).toBe(7.5);
  expect(parseGrade("12")).toBeNull();
  expect(traceAverage({ first: "6", second: "8" }).mean).toBe(7);
  expect(traceAverage({ first: "0", second: "0" }).mean).toBe(0);
  expect(traceAverage({ first: "", second: "8" }).error).toMatch(/vazio/);
  expect(
    traceAverage({ first: "6", second: "8" }, ["show", "read", "sum", "mean"])
      .error,
  ).toMatch(/ainda não/);
  expect(
    missionReady({ first: "6", second: "8", order: algorithmOrder, ran: true }),
  ).toBe(true);
  expect(
    missionReady({
      first: "6",
      second: "8",
      order: [...algorithmOrder].reverse(),
      ran: true,
    }),
  ).toBe(false);
});
it("restores the internal theory step and experiment values after leaving the activity", async () => {
  const user = userEvent.setup();
  app();
  await user.click(await screen.findByRole("button", { name: /^Fundamentos/ }));
  await user.click(await screen.findByRole("button", { name: "Começar" }));
  for (let i = 0; i < 5; i++)
    await user.click(screen.getByRole("button", { name: "Continuar teoria" }));
  await user.clear(screen.getByRole("textbox", { name: "Primeira nota" }));
  await user.type(screen.getByRole("textbox", { name: "Primeira nota" }), "4");
  await user.click(screen.getByRole("button", { name: "Calcular exemplo" }));
  await screen.findByText(/Média calculada: 6/);
  await user.click(screen.getByRole("button", { name: "Fechar" }));
  await screen.findByRole("button", { name: /^Fundamentos/ });
  await user.click(screen.getByRole("button", { name: /^Fundamentos/ }));
  await user.click(
    await screen.findByRole("button", { name: "Continuar atividade" }),
  );
  await screen.findByRole("heading", { name: "Agora altere as entradas" });
  expect(screen.getByRole("textbox", { name: "Primeira nota" })).toHaveValue(
    "4",
  );
});
it("completes nine theory steps, five taught exercises and the mission before unlocking the next activity", async () => {
  const d = createDemo();
  d.progress = [];
  d.reward_events = [];
  d.attempts = [];
  d.study_days = [];
  localStorage.setItem(DEMO_KEY, JSON.stringify(d));
  const user = userEvent.setup();
  app();
  await user.click(await screen.findByRole("button", { name: /^Fundamentos/ }));
  await user.click(await screen.findByRole("button", { name: "Começar" }));
  expect(
    screen.queryByRole("button", { name: "Continuar para a prática" }),
  ).not.toBeInTheDocument();
  for (let i = 1; i < guidedTheories[id(300)].steps.length; i++)
    await user.click(screen.getByRole("button", { name: "Continuar teoria" }));
  await user.click(
    screen.getByRole("button", { name: "Continuar para a prática" }),
  );
  await user.click(
    screen.getByRole("radio", {
      name: "Entrada: duas notas; processamento: somar e dividir por 2; saída: média",
    }),
  );
  await user.click(screen.getByRole("button", { name: "Conferir resposta" }));
  await user.click(screen.getByRole("button", { name: "Próxima questão" }));
  await user.type(screen.getByRole("textbox"), "7");
  await user.click(screen.getByRole("button", { name: "Conferir resposta" }));
  await user.click(screen.getByRole("button", { name: "Próxima questão" }));
  await user.click(
    screen.getByRole("button", { name: "Subir Ler as duas notas" }),
  );
  await user.click(
    screen.getByRole("button", { name: "Subir Somar as duas notas" }),
  );
  await user.click(
    screen.getByRole("button", { name: "Subir Somar as duas notas" }),
  );
  await user.click(screen.getByRole("button", { name: "Conferir resposta" }));
  await user.click(screen.getByRole("button", { name: "Próxima questão" }));
  const radios = screen.getAllByRole("radio");
  await user.click(radios[0]);
  await user.click(radios[3]);
  await user.click(screen.getByRole("button", { name: "Conferir resposta" }));
  await user.click(screen.getByRole("button", { name: "Próxima questão" }));
  await user.click(
    screen.getByRole("radio", {
      name: "Informar que falta uma nota e solicitar o preenchimento",
    }),
  );
  await user.click(screen.getByRole("button", { name: "Conferir resposta" }));
  await user.click(
    screen.getByRole("button", { name: "Continuar para a dinâmica" }),
  );
  await user.click(
    screen.getByRole("button", { name: "Testar minha sequência" }),
  );
  await screen.findByText(/A média ainda não foi calculada/);
  for (const [name, times] of [
    ["Ler e validar as notas", 3],
    ["Somar as duas notas", 2],
    ["Dividir a soma por 2", 1],
  ] as const)
    for (let i = 0; i < times; i++)
      await user.click(screen.getByRole("button", { name: "Subir " + name }));
  await user.click(
    screen.getByRole("button", { name: "Testar minha sequência" }),
  );
  await screen.findByText(/Média calculada: 7/);
  await user.type(
    screen.getByRole("textbox", { name: "Sua entrega" }),
    "As entradas são as notas 4 e 10. A soma é 14 e, dividindo por 2, obtenho a média 7. Precisei ler antes de somar e calcular antes de mostrar, pois cada instrução depende do resultado anterior.",
  );
  for (const box of screen.getAllByRole("checkbox")) await user.click(box);
  await user.click(screen.getByRole("button", { name: "Finalizar atividade" }));
  await screen.findByText("Atividade concluída!");
  await user.click(screen.getByRole("button", { name: "Continuar trilha" }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: /^Variáveis/ })).toBeEnabled(),
  );
  const stored = JSON.parse(localStorage.getItem(DEMO_KEY)!);
  expect(
    stored.reward_events.filter(
      (r: { source: string }) => r.source === "module:" + id(300),
    ),
  ).toHaveLength(1);
});
