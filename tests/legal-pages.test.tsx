import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { LegalPage } from "../src/pages/Legal";
import { SiteFooter } from "../src/components/SiteFooter";

describe("Legal information", () => {
  it.each([
    ["privacidade", "Política de Privacidade"],
    ["termos", "Termos de Uso"],
    ["cookies", "Aviso de Cookies e Armazenamento Local"],
  ] as const)("renders the %s draft without hiding pending decisions", (document, title) => {
    render(
      <MemoryRouter>
        <LegalPage document={document} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: title })).toBeVisible();
    expect(screen.getByRole("note")).toHaveTextContent(
      "Documento em revisão",
    );
    expect(screen.getByRole("note")).toHaveTextContent("bases legais");
  });

  it("links every legal document from the footer", () => {
    render(
      <MemoryRouter>
        <SiteFooter />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Privacidade" })).toHaveAttribute(
      "href",
      "/privacidade",
    );
    expect(screen.getByRole("link", { name: "Termos de Uso" })).toHaveAttribute(
      "href",
      "/termos",
    );
    expect(screen.getByRole("link", { name: "Cookies" })).toHaveAttribute(
      "href",
      "/cookies",
    );
  });
});
