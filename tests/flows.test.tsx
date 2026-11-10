import { describe, expect, it, vi } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../src/state/AuthContext";
import { AppRoutes } from "../src/App";
import { id } from "../src/data/catalog";
import { createDemo } from "../src/data/demo";
import { DEMO_KEY } from "../src/services/repository";
import type { Role } from "../src/lib/types";
function app(path = "/app/home", role: Role | null = "estudante") {
  if (role) sessionStorage.setItem("skillup.demo.role", role);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}
describe("Authenticated boundaries and role navigation", () => {
  it("redirects a direct app URL to login without silently creating a demo session", async () => {
    app("/app/home", null);
    expect(
      await screen.findByRole("button", { name: "Fazer Login" }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("heading", { name: /Olá/ }),
    ).not.toBeInTheDocument();
    expect(sessionStorage.getItem("skillup.demo.role")).toBeNull();
  });
  it.each(["estudante", "docente", "recrutador", "instituicao"] as Role[])(
    "%s can navigate all five primary sections",
    async (role) => {
      const user = userEvent.setup();
      app("/app/home", role);
      await screen.findByText("Demonstração");
      await waitFor(() =>
        expect(
          screen.queryByText("Carregando seu espaço…"),
        ).not.toBeInTheDocument(),
      );
      const nav = screen.getByRole("navigation", {
        name: "Navegação principal mobile",
      });
      for (const name of ["Aprenda", "Social", "Emprego", "Config.", "Home"]) {
        await user.click(within(nav).getByRole("link", { name }));
        await waitFor(() =>
          expect(screen.getByRole("main")).not.toBeEmptyDOMElement(),
        );
        expect(within(nav).getByRole("link", { name })).toHaveAttribute(
          "aria-current",
          "page",
        );
      }
      expect(
        screen.getByRole("button", { name: "Dúvidas?" }),
      ).toBeInTheDocument();
    },
  );
});
describe("Learning and support", () => {
  it("opens a subject, reads a material and verifies offline storage", async () => {
    const user = userEvent.setup();
    app("/app/aprenda/material");
    await user.click(await screen.findByRole("link", { name: "Português" }));
    await user.click(
      (await screen.findAllByRole("link", { name: "Abrir material" }))[0],
    );
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Ortografia e acentuação",
      }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Salvar no app" }));
    expect(
      await screen.findByText("Gravação offline confirmada."),
    ).toBeInTheDocument();
    expect(screen.getByText("Cópia salva no app")).toBeInTheDocument();
  });
  it("unlocks the next module only after confirming completion", async () => {
    const user = userEvent.setup();
    app(`/app/aprenda/trilhas/${id(200)}`);
    const logic = await screen.findByRole("button", { name: /Lógica/ });
    expect(screen.getByRole("button", { name: /Maratona 1/ })).toBeDisabled();
    await user.click(logic);
    await user.click(
      await screen.findByRole("button", {
        name: /^(Começar|Continuar atividade|Ver resultado)$/,
      }),
    );
    await user.click(
      await screen.findByRole("button", {
        name: "Pular teoria e ir para prática",
      }),
    );
    expect(
      screen.queryByRole("button", { name: "Li e concluí esta etapa" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Próxima questão" }),
    ).toBeDisabled();
    const correctOptions = [
      "A janela está aberta",
      "Verdadeira",
      "Levar guarda-chuva",
      "Não, pode ser um resultado válido",
      "true",
    ];
    for (let i = 0; i < correctOptions.length; i++) {
      await user.click(screen.getByRole("radio", { name: correctOptions[i] }));
      await user.click(
        screen.getByRole("button", { name: "Conferir resposta" }),
      );
      if (i < 4)
        await user.click(
          await screen.findByRole("button", { name: "Próxima questão" }),
        );
    }
    await user.click(
      await screen.findByRole("button", { name: "Continuar para a dinâmica" }),
    );
    await user.click(screen.getByRole("button", { name: "Testar simulação" }));
    await user.type(
      screen.getByRole("textbox", { name: "Sua entrega" }),
      "A condição verifica se está chovendo. Quando é verdadeira, levo o guarda-chuva. Quando é falsa, posso sair sem ele. Testei também os dois estados da luz no quadro.",
    );
    for (const box of screen.getAllByRole("checkbox"))
      if (!(box as HTMLInputElement).checked) await user.click(box);
    expect(
      screen.getByRole("button", { name: "Finalizar atividade" }),
    ).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /1\/3.*Teoria/ }));
    for (let i = 0; i < 4; i++)
      await user.click(
        screen.getByRole("button", { name: "Continuar teoria" }),
      );
    await user.click(
      screen.getByRole("button", { name: "Continuar para a prática" }),
    );
    await user.click(screen.getByRole("button", { name: /3\/3.*Dinâmica/ }));
    // Editing the simulated input invalidates a prior test.
    await user.click(screen.getByRole("button", { name: "Testar simulação" }));
    await user.click(
      screen.getByRole("button", { name: "Finalizar atividade" }),
    );
    await screen.findByText("Atividade concluída!");
    await user.click(screen.getByRole("button", { name: "Continuar trilha" }));
    expect(
      screen.getByRole("button", { name: /Comparar valores/ }),
    ).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /Maratona 1/ })).toBeDisabled();
  });
  it("grades practice, gives feedback and does not duplicate XP", async () => {
    const user = userEvent.setup();
    app("/app/aprenda/pratica");
    await user.click(await screen.findByRole("button", { name: "Exercício" }));
    for (let i = 0; i < 2; i++) {
      await user.click(screen.getByRole("button", { name: "Iniciar prática" }));
      await user.click(screen.getByRole("radio", { name: "double" }));
      await user.click(
        screen.getByRole("button", { name: "Conferir questão" }),
      );
      await screen.findByText(/Resposta correta\./);
      await user.click(
        screen.getByRole("button", { name: "Revisar respostas" }),
      );
      await user.click(
        screen.getByRole("button", { name: "Finalizar e corrigir" }),
      );
      await user.click(
        await screen.findByRole("button", { name: "Concluir revisão" }),
      );
    }
    const data = JSON.parse(localStorage.getItem(DEMO_KEY)!);
    expect(
      data.attempts.reduce((s: number, a: { xp: number }) => s + a.xp, 0),
    ).toBe(50);
  });
  it("switches bot and FAQ without simultaneous panels and searches accents", async () => {
    const user = userEvent.setup();
    app();
    await user.click(await screen.findByRole("button", { name: "Dúvidas?" }));
    await user.click(screen.getByRole("tab", { name: "FAQ" }));
    expect(screen.queryByRole("log")).not.toBeInTheDocument();
    await user.type(
      screen.getByRole("searchbox", { name: "Buscar perguntas frequentes" }),
      "certificado",
    );
    expect(
      screen.getByText("O certificado tem reconhecimento oficial?"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Professores" }));
    expect(
      screen.getByRole("heading", { name: "Conversar com professores" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /Conversar com/ })[0],
    ).toHaveAttribute("href", expect.stringContaining("/app/mensagens?para="));
    await user.click(screen.getByRole("tab", { name: "Bot IA" }));
    expect(
      screen.queryByRole("searchbox", { name: "Buscar perguntas frequentes" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("log")).toBeInTheDocument();
  });
  it("completes triage and offers manual copy after Clipboard API denial", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn().mockRejectedValue(new DOMException("Denied")),
      },
    });
    app("/app/aprenda/suporte");
    await user.click(await screen.findByRole("button", { name: "Dúvidas?" }));
    await user.click(
      await within(screen.getByRole("dialog")).findByRole("button", {
        name: "Esqueci minha senha",
      }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "Mensagem para o bot" }),
      "Tentei na tela de login",
    );
    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));
    await user.click(
      screen.getByRole("button", { name: "Impede uma entrega hoje" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Ver resumo do atendimento" }),
    );
    await user.click(screen.getByRole("button", { name: "Copiar resumo" }));
    expect(
      await screen.findByRole("textbox", {
        name: "Selecione e copie manualmente",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Nenhum chamado foi enviado/)).toBeInTheDocument();
  });
});
describe("Social, career and assessment interactions", () => {
  it("publishes a forum discussion and persists comments", async () => {
    const user = userEvent.setup();
    app("/app/social/foruns");
    await user.click(
      await screen.findByRole("button", { name: "Nova discussão" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "Título" }),
      "Como organizar um portfólio?",
    );
    await user.type(
      screen.getByRole("textbox", { name: "O que você quer compartilhar?" }),
      "Quero reunir os projetos de programação e design.",
    );
    await user.click(screen.getByRole("button", { name: "Publicar" }));
    await user.click(
      await screen.findByRole("link", { name: "Como organizar um portfólio?" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "Seu comentário" }),
      "Vou começar pelo problema de cada projeto.",
    );
    await user.click(screen.getByRole("button", { name: "Comentar" }));
    expect(
      await screen.findByText("Comentário salvo nesta demonstração."),
    ).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(DEMO_KEY)!).comments).toHaveLength(
      1,
    );
  });
  it("filters projects and joins a project", async () => {
    const user = userEvent.setup();
    app("/app/social/projetos");
    await user.click(await screen.findByRole("button", { name: "Design" }));
    expect(
      screen.queryByText("Portal de Sustentabilidade"),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Ver detalhes" }));
    await user.click(
      screen.getByRole("button", { name: "Participar do projeto" }),
    );
    expect(
      await screen.findByText("Participação registrada."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sair do projeto" }),
    ).toBeInTheDocument();
  });
  it("requires explicit application confirmation and shows history", async () => {
    const user = userEvent.setup();
    app(`/app/emprego/${id(800)}`);
    await user.click(
      await screen.findByRole("button", { name: "Candidatar-se" }),
    );
    await user.type(
      screen.getByRole("textbox", {
        name: "Sua apresentação para esta oportunidade",
      }),
      "Estou estudando desenvolvimento web e gostaria de aprender com a equipe.",
    );
    await user.click(screen.getByRole("checkbox"));
    await user.click(
      screen.getByRole("button", { name: "Registrar candidatura de exemplo" }),
    );
    expect(
      await screen.findByText(/Nenhuma empresa recebeu seus dados/),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("link", { name: "Acompanhar candidaturas" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Minhas candidaturas" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Enviada")).toBeInTheDocument();
  });
  it("teacher reviews an actual submitted answer", async () => {
    const user = userEvent.setup();
    app("/app/aprenda/pratica", "docente");
    await user.click(await screen.findByRole("button", { name: "Corrigir" }));
    expect(screen.getByText(/Entrada: preço e quantidade/)).toBeInTheDocument();
    await user.type(
      screen.getByRole("spinbutton", { name: "Nota (0 a 10)" }),
      "8.5",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Feedback" }),
      "Boa organização. Revise o cenário de estoque zero.",
    );
    await user.click(screen.getByRole("button", { name: "Salvar avaliação" }));
    expect(
      (await screen.findAllByRole("button", { name: "Rever correção" }))[0],
    ).toBeInTheDocument();
    expect(
      JSON.parse(localStorage.getItem(DEMO_KEY)!).submissions[0].grade,
    ).toBe(8.5);
  });
  it("profile changes persist and export does not contain auth tokens", async () => {
    const user = userEvent.setup();
    app("/app/config/perfil");
    const name = await screen.findByRole("textbox", { name: "Nome" });
    await user.clear(name);
    await user.type(name, "Gabrielly Maria");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByText("Perfil atualizado.")).toBeInTheDocument();
    const data = JSON.parse(localStorage.getItem(DEMO_KEY)!);
    expect(data.profiles[0].full_name).toBe("Gabrielly Maria");
    expect(JSON.stringify(data)).not.toContain("access_token");
  });
});

describe("Professional experience", () => {
  it("creates an experience, persists it and removes only after confirmation", async () => {
    const user = userEvent.setup();
    app("/app/config/perfil");
    await user.click(
      await screen.findByRole("button", { name: "Adicionar experiência" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "Título da experiência" }),
      "Projeto de biblioteca",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Organização ou contexto" }),
      "Projeto de estudo",
    );
    await user.type(screen.getByLabelText("Data de início"), "2026-09-01");
    await user.type(
      screen.getByRole("textbox", { name: "Atividades e aprendizados" }),
      "Pesquisa, protótipos e testes da busca por materiais.",
    );
    await user.click(
      screen.getByRole("button", { name: "Salvar experiência" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Projeto de biblioteca" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Remover experiência" }),
    );
    expect(
      JSON.parse(localStorage.getItem(DEMO_KEY)!).experiences,
    ).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(
      await screen.findByText("Nenhuma experiência cadastrada"),
    ).toBeInTheDocument();
    expect(
      JSON.parse(localStorage.getItem(DEMO_KEY)!).experiences,
    ).toHaveLength(0);
  });
});

describe("Teacher support queue", () => {
  it("records a response to an explicitly assigned student summary", async () => {
    const d = createDemo();
    d.support_tickets = [
      {
        id: id(950),
        user_id: id(1),
        topic: "Dúvida de lógica",
        urgency: "Alta",
        summary: "Preciso entender as condições de parada do exercício.",
        status: "open",
        assigned_to: id(2),
        response: null,
        created_at: "2026-10-19T12:00:00Z",
      },
    ];
    localStorage.setItem(DEMO_KEY, JSON.stringify(d));
    const user = userEvent.setup();
    app("/app/aprenda/suporte", "docente");
    await user.click(
      await screen.findByRole("button", { name: "Responder dúvida" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "Orientação ao estudante" }),
      "Trace uma tabela com o valor da condição em cada repetição.",
    );
    await user.click(screen.getByRole("button", { name: "Salvar resposta" }));
    expect(
      await screen.findByText("Resposta registrada no histórico do estudante."),
    ).toBeInTheDocument();
    expect(
      JSON.parse(localStorage.getItem(DEMO_KEY)!).support_tickets[0].status,
    ).toBe("answered");
  });
});

describe("Final interaction regressions", () => {
  it("edits an agenda event and confirms before deletion", async () => {
    const user = userEvent.setup();
    app();
    await user.click(
      await screen.findByRole("button", { name: /Laboratório rápido: lógica/ }),
    );
    await user.click(screen.getByRole("button", { name: "Editar evento" }));
    const title = screen.getByRole("textbox", { name: "Título" });
    await user.clear(title);
    await user.type(title, "Revisão de lógica");
    await user.click(screen.getByRole("button", { name: "Salvar evento" }));
    await screen.findByText("Evento salvo na agenda.");
    await user.click(screen.getByRole("button", { name: "Fechar" }));
    await user.click(screen.getByRole("button", { name: /Revisão de lógica/ }));
    await user.click(screen.getByRole("button", { name: "Excluir evento" }));
    expect(
      JSON.parse(localStorage.getItem(DEMO_KEY)!).study_events,
    ).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(
      await screen.findByText("Sua agenda começa aqui"),
    ).toBeInTheDocument();
  });
  it("keeps floating triage separate from academic support and preserves it on reopen", async () => {
    const user = userEvent.setup();
    app("/app/aprenda/suporte");
    await user.click(await screen.findByRole("button", { name: "Dúvidas?" }));
    const dialog = screen.getByRole("dialog"),
      input = within(dialog).getByRole("textbox", {
        name: "Mensagem para o bot",
      });
    const ids = screen
      .getAllByRole("textbox", { name: "Mensagem para o bot" })
      .map((e) => e.id);
    expect(new Set(ids).size).toBe(1);
    expect(
      screen.getByRole("textbox", { name: "Dúvida acadêmica" }),
    ).toBeInTheDocument();
    await user.type(input, "Esqueci minha senha de acesso");
    await user.click(
      within(dialog).getByRole("button", { name: "Enviar mensagem" }),
    );
    await user.click(within(dialog).getByRole("button", { name: "Fechar" }));
    expect(screen.queryByRole("log")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Dúvidas?" }));
    expect(
      within(screen.getByRole("log")).getByText(
        "Esqueci minha senha de acesso",
      ),
    ).toBeInTheDocument();
  });
});
