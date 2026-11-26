import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StartupSplash } from "../src/components/StartupSplash";

describe("StartupSplash", () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => vi.useRealTimers());

  it("shows the SkillUp introduction before revealing the application", () => {
    vi.useFakeTimers();
    const { container } = render(
      <StartupSplash>
        <main>Aplicativo pronto</main>
      </StartupSplash>,
    );

    expect(
      screen.getByRole("status", { name: "Preparando o SkillUp" }),
    ).toBeInTheDocument();
    expect(container.querySelector(".snurra")).toHaveAttribute("width", "240");
    expect(container.querySelector(".startup-logo-frame img")).toHaveAttribute(
      "src",
      "/assets/skillup-logo.png",
    );
    expect(screen.queryByText("Aplicativo pronto")).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1850));

    expect(screen.getByText("Aplicativo pronto")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    act(() => window.dispatchEvent(new Event("skillup:session-started")));

    expect(screen.getByText("Aplicativo pronto")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("does not replay when the same tab loads the application again", () => {
    vi.useFakeTimers();
    const first = render(
      <StartupSplash>
        <main>Primeira abertura</main>
      </StartupSplash>,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    first.unmount();

    render(
      <StartupSplash>
        <main>Aba já aberta</main>
      </StartupSplash>,
    );

    expect(screen.getByText("Aba já aberta")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
