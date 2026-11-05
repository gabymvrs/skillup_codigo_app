import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CodePractice from "../src/components/CodePractice";
import { questions, id } from "../src/data/catalog";
import { runCode } from "../src/services/codeRunner";
vi.mock("../src/services/codeRunner", () => ({
  runCode: vi.fn(async () => ({ output: "3\n" })),
}));
it("lets students test a validated program with other inputs without changing the recorded source", async () => {
  const user = userEvent.setup(),
    change = vi.fn();
  render(
    <CodePractice
      q={questions.find((q) => q.id === id(12002))!}
      value={"a = int(input())\nb = int(input())\nprint(a + b)"}
      onChange={change}
      disabled={false}
      readOnly
    />,
  );
  const code = screen.getByRole("textbox", { name: "Código python" });
  expect(code).toHaveAttribute("readonly");
  await user.type(code, "print(0)");
  expect(change).not.toHaveBeenCalled();
  const stdin = screen.getByRole("textbox", {
    name: "Entrada do programa (uma linha por valor)",
  });
  await user.clear(stdin);
  await user.type(stdin, "-2\n5");
  await user.click(screen.getByRole("button", { name: "Executar código" }));
  expect(
    await screen.findByRole("status", { name: "Saída do programa" }),
  ).toHaveTextContent("3");
  expect(runCode).toHaveBeenCalledWith(
    "python",
    expect.stringContaining("print(a + b)"),
    "-2\n5",
    expect.any(AbortSignal),
  );
});
