import { describe, it, expect, vi } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../src/state/AuthContext";
import { AppRoutes } from "../src/App";
import { createDemo } from "../src/data/demo";
import { id } from "../src/data/catalog";
import { DEMO_KEY, loadData } from "../src/services/repository";
import {
  defaultPortfolio,
  demoAchievements,
  recommendProjects,
  uniqueSkills,
  type Highlight,
} from "../src/features/portfolio/model";
import {
  readPortfolioDemo,
  writePortfolioDemo,
  reportComment,
  savePortfolioRow,
  validatePortfolioFile,
  loadPortfolio,
} from "../src/features/portfolio/service";
import { SkillsField } from "../src/features/portfolio/Fields";
import { resumePdf } from "../src/features/portfolio/resumePdf";
function app(path = "/app/perfil") {
  sessionStorage.setItem("skillup.demo.role", "estudante");
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}
function highlight(n: number): Highlight {
  return {
    id: id(9500 + n),
    user_id: id(1),
    kind: "Evento",
    title: `Evento ${n}`,
    organization: "Senac",
    description: "Uma experiência acadêmica.",
    started_on: "2026-10-01",
    ended_on: null,
    external_url: "",
    file_path: null,
    file_name: "",
    visibility: "private",
    pinned: true,
    created_at: new Date().toISOString(),
  };
}
describe("Student portfolio logic and privacy", () => {
  it("deduplicates skills regardless of casing and enforces size limits", () => {
    expect(uniqueSkills(["Figma", "figma", "  React  "])).toEqual([
      "figma",
      "React",
    ]);
    expect(() =>
      uniqueSkills(Array.from({ length: 31 }, (_, i) => `Skill ${i}`)),
    ).toThrow(/30/);
    expect(() => uniqueSkills(["x".repeat(61)])).toThrow();
  });
  it("counts unique skills before applying the configured limit", () => {
    expect(uniqueSkills(["Figma", "figma"], 1)).toEqual(["figma"]);
  });
  it("recognizes and removes previously saved skills regardless of casing", async () => {
    const user = userEvent.setup();
    render(<SkillsField initial={["figma"]} limit={1} />);
    const option = screen.getByRole("checkbox", { name: "Figma" });
    expect(option).toBeChecked();
    expect(option).toBeEnabled();
    await user.click(option);
    expect(option).not.toBeChecked();
    expect(
      screen.queryByRole("button", { name: "Remover figma" }),
    ).not.toBeInTheDocument();
    await user.click(option);
    expect(
      screen.getByRole("button", { name: "Remover Figma" }),
    ).toBeInTheDocument();
  });
  it("ranks real eligible projects by skills and explains the match", () => {
    const d = createDemo(),
      profile = d.profiles[0];
    profile.skills = ["Figma"];
    const projects = [
      {
        ...d.projects[0],
        id: "a",
        owner_id: "other",
        skills: ["Python"],
        visibility: "public" as const,
      },
      {
        ...d.projects[0],
        id: "b",
        owner_id: "other",
        skills: ["Figma"],
        visibility: "community" as const,
      },
      {
        ...d.projects[0],
        id: "c",
        owner_id: "other",
        skills: ["Figma"],
        visibility: "private" as const,
      },
    ];
    const rows = recommendProjects(
      projects,
      profile,
      defaultPortfolio(profile.id),
      [],
    );
    expect(rows.map((r) => r.project.id)).toEqual(["b", "a"]);
    expect(rows[0].reason).toContain("Figma");
  });
  it("uses initial suggestions when there is no user data", () => {
    const d = createDemo(),
      p = { ...d.profiles[0], skills: [] };
    const rows = recommendProjects(
      [{ ...d.projects[0], owner_id: "other" }],
      p,
      defaultPortfolio(p.id),
      [],
    );
    expect(rows[0].reason).toContain("Sugestão inicial");
    expect(recommendProjects([], p, defaultPortfolio(p.id), [])).toEqual([]);
  });
  it("uses course, interests, technology and saved/viewed signals", () => {
    const d = createDemo(),
      p = { ...d.profiles[0], skills: [] },
      s = {
        ...defaultPortfolio(p.id),
        study_area: "Design",
        interests: ["Figma"],
        technologies: ["React"],
      };
    const projects = [
      {
        ...d.projects[0],
        id: "a",
        owner_id: "other",
        category: "Design",
        skills: ["Figma", "React"],
      },
      {
        ...d.projects[0],
        id: "b",
        owner_id: "other",
        category: "Web",
        skills: ["Python"],
      },
    ];
    expect(recommendProjects(projects, p, s, [])[0].project.id).toBe("a");
    expect(
      recommendProjects(projects, p, defaultPortfolio(p.id), [
        {
          id: "signal",
          user_id: p.id,
          project_id: "b",
          saved: true,
          viewed_at: null,
        },
      ])[0].project.id,
    ).toBe("b");
  });
  it("records reports and rejects duplicates without deleting comments", async () => {
    const d = createDemo();
    localStorage.setItem(DEMO_KEY, JSON.stringify(d));
    await reportComment(true, id(1), "c", "Spam", "Teste");
    await expect(reportComment(true, id(1), "c", "Outro", "")).rejects.toThrow(
      /já denunciou/,
    );
    expect(readPortfolioDemo().comment_reports).toHaveLength(1);
    expect((await loadData(true)).comments).toEqual(d.comments);
  });
  it("limits reports to five per day", async () => {
    for (let n = 0; n < 5; n++)
      await reportComment(true, id(1), `c${n}`, "Spam", "");
    await expect(reportComment(true, id(1), "c6", "Spam", "")).rejects.toThrow(
      /cinco/,
    );
  });
  it("protects private project publications in demo role switching", async () => {
    const d = createDemo();
    d.projects[0].visibility = "private";
    d.projects[0].owner_id = id(1);
    d.posts[0].project_id = d.projects[0].id;
    localStorage.setItem(DEMO_KEY, JSON.stringify(d));
    expect(
      (await loadData(true, id(2))).projects.some(
        (p) => p.id === d.projects[0].id,
      ),
    ).toBe(false);
    expect(
      (await loadData(true, id(2))).posts.some((p) => p.id === d.posts[0].id),
    ).toBe(false);
  });
  it("derives badges from actual learning records and never assumes weekly podium", () => {
    const d = createDemo();
    d.progress = [];
    d.attempts = [];
    d.projects = [];
    d.study_days = [];
    d.track_enrollments = [];
    expect(demoAchievements(d, id(1))).toEqual([]);
    d.progress.push({
      id: id(9999),
      user_id: id(1),
      module_id: d.modules[0].id,
      completed_at: new Date().toISOString(),
    });
    expect(demoAchievements(d, id(1))).toEqual(["first_lesson"]);
  });
  it("blocks manual badge grants and featuring locked badges", async () => {
    await expect(
      savePortfolioRow(true, "student_achievements", {
        id: "a",
        user_id: id(1),
        achievement_id: "first_code",
        earned_at: new Date().toISOString(),
      }),
    ).rejects.toThrow(/sistema/);
    await expect(
      savePortfolioRow(true, "student_portfolios", {
        ...defaultPortfolio(id(1)),
        featured_badges: ["first_code"],
      }),
    ).rejects.toThrow(/desbloqueadas/);
  });
  it("enforces three pins and chronological periods in demo", async () => {
    for (let n = 0; n < 3; n++)
      await savePortfolioRow(true, "profile_highlights", highlight(n));
    await expect(
      savePortfolioRow(true, "profile_highlights", highlight(4)),
    ).rejects.toThrow(/três/);
    await expect(
      savePortfolioRow(true, "profile_highlights", {
        ...highlight(5),
        pinned: false,
        ended_on: "2020-01-01",
      }),
    ).rejects.toThrow(/data final/);
  });
  it("validates PDF signatures and size before upload", async () => {
    const file = (text: string, type = "application/pdf", size = text.length) =>
      ({
        type,
        size,
        slice: () => ({
          arrayBuffer: async () => new TextEncoder().encode(text).buffer,
        }),
      }) as File;
    await expect(
      validatePortfolioFile(file("%PDF-1.7 body"), true),
    ).resolves.toBeUndefined();
    await expect(
      validatePortfolioFile(file("<html>bad</html>"), true),
    ).rejects.toThrow(/conteúdo/);
    await expect(
      validatePortfolioFile(
        file("%PDF-", "application/pdf", 6 * 1024 * 1024),
        true,
      ),
    ).rejects.toThrow(/5 MB/);
  });
  it("exports a genuine PDF containing only explicitly supplied sections", async () => {
    const blob = await resumePdf(
      "Gabrielly Maria",
      "UI/UX Designer em formação",
      [{ title: "Habilidades", lines: ["Figma", "Acessibilidade"] }],
    );
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsText(blob);
    });
    expect(text.startsWith("%PDF-")).toBe(true);
    expect(text).toContain("Gabrielly Maria");
    expect(text).toContain("Figma");
    expect(text).not.toContain("Experiência inventada");
  });
});
describe("Student portfolio user flows", () => {
  it("edits headline and adds/removes searchable skills", async () => {
    const user = userEvent.setup();
    app("/app/config/perfil");
    const select = await screen.findByRole("combobox", {
      name: "Apresentação profissional",
    });
    await user.selectOptions(select, "UI/UX Designer em formação");
    await user.type(
      screen.getByRole("searchbox", { name: "Buscar habilidades" }),
      "Figma",
    );
    await user.click(screen.getByRole("checkbox", { name: "Figma" }));
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    await screen.findByText("Perfil atualizado.");
    const d = await loadData(true);
    expect(d.profiles[0].headline).toBe("UI/UX Designer em formação");
    expect(d.profiles[0].skills).toContain("Figma");
    await user.click(screen.getByRole("button", { name: "Remover Figma" }));
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    await waitFor(async () =>
      expect((await loadData(true)).profiles[0].skills).not.toContain("Figma"),
    );
  });
  it("creates, edits, pins and deletes a highlight", async () => {
    const user = userEvent.setup();
    app();
    await user.click(
      await screen.findByRole("button", { name: "Adicionar destaque" }),
    );
    let dialog = within(screen.getByRole("dialog"));
    await user.selectOptions(
      dialog.getByLabelText("Tipo de destaque"),
      "Evento",
    );
    await user.type(dialog.getByLabelText("Título"), "Workshop UX");
    await user.type(
      dialog.getByLabelText("Instituição ou organização"),
      "Senac",
    );
    await user.type(
      dialog.getByLabelText("Data de emissão ou início"),
      "2026-10-01",
    );
    await user.click(dialog.getByRole("button", { name: "Salvar destaque" }));
    await screen.findByRole("heading", { name: "Workshop UX" });
    await user.click(screen.getByRole("button", { name: "Fixar destaque" }));
    await screen.findByRole("button", { name: "Desafixar" });
    await user.click(screen.getByRole("button", { name: "Editar destaque" }));
    dialog = within(screen.getByRole("dialog"));
    await user.clear(dialog.getByLabelText("Título"));
    await user.type(dialog.getByLabelText("Título"), "Workshop acessibilidade");
    await user.click(dialog.getByRole("button", { name: "Salvar destaque" }));
    await screen.findByRole("heading", { name: "Workshop acessibilidade" });
    await user.click(screen.getByRole("button", { name: "Excluir destaque" }));
    dialog = within(screen.getByRole("dialog"));
    await user.click(dialog.getByRole("button", { name: /Confirmar|Excluir/ }));
    await waitFor(() =>
      expect(readPortfolioDemo().profile_highlights).toHaveLength(0),
    );
  });
  it("offers private resume controls and a preview without fake uploads", async () => {
    const user = userEvent.setup();
    app();
    await screen.findByRole("heading", { name: "Meu perfil profissional" });
    await user.click(screen.getByText("Currículo · privado"));
    expect(screen.getByLabelText("Importar currículo PDF")).toBeDisabled();
    await user.click(
      screen.getByRole("button", {
        name: "Pré-visualizar e exportar currículo",
      }),
    );
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "Pré-visualização do currículo",
    );
    expect(screen.getByRole("button", { name: "Exportar PDF" })).toBeEnabled();
  });
  it("provides a report menu in project-shared post comments", async () => {
    const user = userEvent.setup(),
      d = createDemo();
    const post = d.posts[0];
    d.comments.push({
      id: id(9666),
      post_id: post.id,
      user_id: id(2),
      author_name: "Pessoa Teste",
      body: "Comentário de teste",
      created_at: new Date().toISOString(),
    });
    localStorage.setItem(DEMO_KEY, JSON.stringify(d));
    app(`/app/social/post/${post.id}`);
    await user.click(
      await screen.findByLabelText("Opções do comentário de Pessoa Teste"),
    );
    await user.click(
      screen.getAllByRole("button", { name: "Denunciar" }).at(-1)!,
    );
    const dialog = within(screen.getByRole("dialog"));
    await user.selectOptions(
      dialog.getByLabelText("Motivo da denúncia"),
      "Spam",
    );
    await user.click(dialog.getByRole("button", { name: "Enviar denúncia" }));
    await screen.findByText("Denúncia de teste registrada neste navegador.");
    expect(readPortfolioDemo().comment_reports).toHaveLength(1);
  });
});
