import { describe, it, expect } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../src/state/AuthContext";
import { AppRoutes } from "../src/App";
import { id, subjects } from "../src/data/catalog";
import { DEMO_KEY } from "../src/services/repository";
function app(path: string) {
  sessionStorage.setItem("skillup.demo.role", "estudante");
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}
describe("Academic support", () => {
  it("shows a linked teacher, opens feedback details and saves an explicitly demonstrative message", async () => {
    const user = userEvent.setup();
    app("/app/aprenda/suporte");
    await user.click(
      await screen.findByRole("button", { name: "Ver feedback completo" }),
    );
    expect(
      within(screen.getByRole("dialog")).getByText(
        /contratos e acrescente testes/,
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Fechar" }));
    await user.click(screen.getByRole("button", { name: "Enviar Mensagem" }));
    await user.type(
      screen.getByRole("textbox", { name: "Sua mensagem ao docente" }),
      "Como revisar as camadas do projeto?",
    );
    await user.click(screen.getByRole("button", { name: "Confirmar envio" }));
    await screen.findByText(/Nenhum docente real recebeu/);
    expect(JSON.parse(localStorage.getItem(DEMO_KEY)!).messages).toHaveLength(
      1,
    );
    expect(screen.queryByRole("log")).not.toBeInTheDocument();
  });
  it("answers academic questions without opening the floating FAQ and records tickets without claiming delivery", async () => {
    const user = userEvent.setup();
    app("/app/aprenda/suporte");
    await user.click(
      await screen.findByRole("button", { name: "Como trocar de curso?" }),
    );
    expect(
      await screen.findByText(/Nenhuma alteração foi feita aqui/),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Abrir Chamado Técnico" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "Assunto" }),
      "Download",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Descreva o problema" }),
      "O material não terminou de salvar.",
    );
    await user.click(
      screen.getByRole("button", { name: "Salvar no histórico" }),
    );
    await screen.findByText(/Nenhum chamado foi enviado a uma equipe externa/);
  });
});
describe("Home and material", () => {
  it("displays three illustrative stories and weekly ranking from the same source as Social", async () => {
    const user = userEvent.setup();
    app("/app/home");
    await screen.findByRole("heading", { name: "Histórias que inspiram" });
    expect(screen.getAllByText(/Primeiro portfólio publicado/)).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: "Ranking semanal" }),
    ).toBeInTheDocument();
    const xp = (await screen.findByText("120 XP nesta semana")).textContent;
    await user.click(
      within(
        screen.getByRole("navigation", { name: "Navegação principal mobile" }),
      ).getByRole("link", { name: "Social" }),
    );
    expect(await screen.findByText(xp!)).toBeInTheDocument();
  });
  it.each(subjects)("opens the $name library", async (subject) => {
    app(`/app/aprenda/material/${subject.id}`);
    await screen.findByRole("heading", { name: subject.name, level: 1 });
    expect(
      screen.getAllByRole("link", { name: "Abrir material" }).length,
    ).toBeGreaterThanOrEqual(2);
  });
  it("updates actual recent visits and reading completion", async () => {
    const user = userEvent.setup();
    app(`/app/aprenda/material/item/${id(151)}`);
    await user.click(
      await screen.findByRole("button", {
        name: "Marcar leitura como concluída",
      }),
    );
    await screen.findByText("Leitura concluída e registrada.");
    expect(
      JSON.parse(localStorage.getItem(DEMO_KEY)!).material_reads.find(
        (r: { material_id: string }) => r.material_id === id(151),
      ).completed_at,
    ).toBeTruthy();
  });
});
describe("Profile photo", () => {
  it("previews, cancels, saves and removes a photo while preserving the saved name", async () => {
    const user = userEvent.setup();
    app("/app/config/perfil");
    const bytes = Uint8Array.from(
      atob(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aGXkAAAAASUVORK5CYII=",
      ),
      (c) => c.charCodeAt(0),
    );
    const file = new File([bytes], "avatar.png", { type: "image/png" });
    const input = await screen.findByLabelText(
      "Foto de perfil (JPEG, PNG ou WebP, até 2 MB)",
    );
    await user.upload(input, file);
    await screen.findByAltText("Prévia da nova foto");
    await user.click(
      screen.getByRole("button", { name: "Cancelar alterações" }),
    );
    expect(
      screen.queryByAltText("Prévia da nova foto"),
    ).not.toBeInTheDocument();
    await user.upload(
      screen.getByLabelText("Foto de perfil (JPEG, PNG ou WebP, até 2 MB)"),
      file,
    );
    await screen.findByAltText("Prévia da nova foto");
    const name = screen.getByRole("textbox", { name: "Nome" });
    await user.clear(name);
    await user.type(name, "Gabi Silva");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    await screen.findByText("Perfil atualizado.");
    expect(
      JSON.parse(localStorage.getItem(DEMO_KEY)!).profiles[0],
    ).toMatchObject({
      full_name: "Gabi Silva",
      avatar_demo: expect.stringContaining("data:image/png"),
    });
    await user.click(screen.getByRole("button", { name: "Remover foto" }));
    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    await waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem(DEMO_KEY)!).profiles[0].avatar_demo,
      ).toBeNull(),
    );
  });
});
describe("Interactive exercise formats", () => {
  it.each([
    "choice",
    "true_false",
    "blank",
    "matching",
    "ordering",
    "challenge",
  ])(
    "submits the %s form and preserves the reward after retry",
    async (kind) => {
      const user = userEvent.setup();
      app("/app/aprenda/pratica");
      await user.selectOptions(
        await screen.findByLabelText("Disciplina"),
        id(10),
      );
      await user.selectOptions(
        screen.getByLabelText("Formato de exercício"),
        kind,
      );
      await user.click(screen.getByRole("button", { name: "Praticar" }));
      const dialog = within(screen.getByRole("dialog"));
      if (kind === "choice")
        await user.click(dialog.getByRole("radio", { name: "árvore" }));
      if (kind === "true_false") {
        await user.click(
          within(
            dialog.getByRole("group", {
              name: "Toda proparoxítona é acentuada.",
            }),
          ).getByRole("radio", { name: "Verdadeiro" }),
        );
        await user.click(
          within(
            dialog.getByRole("group", {
              name: "Todo texto apresenta apenas fatos.",
            }),
          ).getByRole("radio", { name: "Falso" }),
        );
      }
      if (kind === "blank")
        await user.type(
          dialog.getByRole("textbox", { name: /Complete a lacuna/ }),
          "substantivo",
        );
      if (kind === "matching")
        for (const [i, name] of ["Substantivo", "Verbo", "Adjetivo"].entries())
          await user.selectOptions(dialog.getByLabelText(name), String(i));
      if (kind === "ordering") {
        await user.click(
          dialog.getByRole("button", { name: "Subir Ler o texto" }),
        );
        await user.click(
          dialog.getByRole("button", { name: "Subir Ler o texto" }),
        );
        await user.click(
          dialog.getByRole("button", {
            name: "Subir Identificar a ideia principal",
          }),
        );
      }
      if (kind === "challenge") {
        await user.type(
          dialog.getByRole("textbox", { name: /Relato do desafio/ }),
          "Meu projeto ajuda a turma a organizar materiais. A ideia principal é facilitar a revisão de conteúdos com títulos claros. Revisei a ortografia e usei a biblioteca como exemplo para sustentar o argumento.",
        );
        for (const box of dialog.getAllByRole("checkbox"))
          await user.click(box);
      }
      await user.click(
        dialog.getByRole("button", { name: "Conferir resposta" }),
      );
      await screen.findByText(
        kind === "challenge" ? "Relato registrado!" : "Resposta correta!",
      );
      const d = JSON.parse(localStorage.getItem(DEMO_KEY)!);
      expect(d.attempts.at(-1).correct).toBe(true);
      expect(d.study_days).toHaveLength(1);
      expect(
        d.reward_events.some((r: { source: string }) =>
          r.source.startsWith("streak:"),
        ),
      ).toBe(true);
    },
  );
  it("starts two tracks and completes only the practiced track module", async () => {
    const user = userEvent.setup();
    app(`/app/aprenda/trilhas/${id(2000)}`);
    await user.click(
      await screen.findByRole("button", { name: "Iniciar trilha" }),
    );
    await screen.findByText(/Trilha iniciada/);
    await user.click(screen.getByRole("button", { name: /HTML semântico/ }));
    await user.click(
      screen.getByRole("button", { name: "Abrir exercício da etapa" }),
    );
    await user.click(screen.getByRole("radio", { name: "nav" }));
    await user.click(screen.getByRole("button", { name: "Conferir resposta" }));
    await screen.findByText("Resposta correta!");
    await user.click(screen.getByRole("button", { name: "Fechar" }));
    await user.click(screen.getByRole("button", { name: /HTML semântico/ }));
    await user.click(
      screen.getByRole("button", { name: "Li e concluí esta etapa" }),
    );
    await screen.findByText("Etapa concluída. Progresso atualizado.");
    await user.click(screen.getByRole("button", { name: "Fechar" }));
    await user.click(screen.getByRole("link", { name: "Todas as trilhas" }));
    const heading = await screen.findByRole("heading", {
        name: "UI/UX Design",
      }),
      card = heading.closest("section")!;
    await user.click(within(card).getByRole("link", { name: "Ver trilha" }));
    await user.click(screen.getByRole("button", { name: "Iniciar trilha" }));
    await screen.findByText(/Trilha iniciada/);
    const d = JSON.parse(localStorage.getItem(DEMO_KEY)!);
    expect(
      d.track_enrollments.filter((e: { track_id: string }) =>
        [id(2000), id(2001)].includes(e.track_id),
      ),
    ).toHaveLength(2);
    expect(
      d.progress.some((p: { module_id: string }) => p.module_id === id(3000)),
    ).toBe(true);
    expect(
      d.progress.some((p: { module_id: string }) => p.module_id === id(3010)),
    ).toBe(false);
  });
});
