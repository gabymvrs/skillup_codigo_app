import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  COOKIE_NOTICE_KEY,
  CookieBanner,
} from "../src/components/CookieBanner";

describe("Cookie banner", () => {
  it("explains essential storage and remembers the acknowledgement", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<CookieBanner />);

    expect(
      screen.getByRole("region", { name: "Aviso sobre cookies" }),
    ).toBeVisible();
    expect(
      screen.getByText(/Não usamos cookies de publicidade/i),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Entendi" }));

    expect(localStorage.getItem(COOKIE_NOTICE_KEY)).toBe("accepted");
    expect(
      screen.queryByRole("region", { name: "Aviso sobre cookies" }),
    ).not.toBeInTheDocument();

    unmount();
    render(<CookieBanner />);
    expect(
      screen.queryByRole("region", { name: "Aviso sobre cookies" }),
    ).not.toBeInTheDocument();
  });
});
