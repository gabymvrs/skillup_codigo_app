import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StartupSplash } from "../src/components/StartupSplash";

describe("StartupSplash", () => {
  afterEach(() => vi.useRealTimers());

  it("shows the SkillUp introduction before revealing the application", () => {
    vi.useFakeTimers();
    render(
      <StartupSplash>
        <main>Aplicativo pronto</main>
      </StartupSplash>,
    );

    expect(
      screen.getByRole("status", { name: "Preparando o SkillUp" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Aplicativo pronto")).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1850));

    expect(screen.getByText("Aplicativo pronto")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    act(() => window.dispatchEvent(new Event("skillup:session-started")));

    expect(
      screen.getByRole("status", { name: "Preparando o SkillUp" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Aplicativo pronto")).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1850));
    expect(screen.getByText("Aplicativo pronto")).toBeInTheDocument();
  });
});
