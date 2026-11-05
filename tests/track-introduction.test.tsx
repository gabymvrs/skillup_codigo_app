import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  TrackIntroduction,
  trackIntroductions,
} from "../src/components/TrackIntroduction";
import { tracks, modules, id } from "../src/data/catalog";
it("has a specific complete introduction for every catalogue track", () => {
  expect(Object.keys(trackIntroductions)).toHaveLength(tracks.length);
  for (const track of tracks) {
    const x = trackIntroductions[track.id];
    expect(x).toBeDefined();
    expect(x.objectives.length).toBeGreaterThan(1);
    expect(x.outcome.length).toBeGreaterThan(50);
    expect(x.prerequisites).toBeTruthy();
  }
});
it("shows an introduction before the path and lets the student revisit it without changing modules", async () => {
  const user = userEvent.setup(),
    begin = vi.fn().mockResolvedValue(undefined),
    track = tracks.find((t) => t.id === id(2100))!;
  render(
    <TrackIntroduction
      track={track}
      modules={modules.filter((m) => m.track_id === track.id)}
      owner="demo:student"
      student
      busy={false}
      onBegin={begin}
    />,
  );
  expect(
    screen.getByRole("heading", { name: "O que preciso saber antes?" }),
  ).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Começar trilha" }));
  expect(begin).toHaveBeenCalledOnce();
  await user.click(
    screen.getByRole("button", { name: "Rever apresentação da trilha" }),
  );
  expect(
    screen.getByRole("heading", { name: "O que você vai aprender" }),
  ).toBeVisible();
});
it("keeps the presentation open after a failed start", async () => {
  const user = userEvent.setup();
  render(
    <TrackIntroduction
      track={tracks[0]}
      modules={[]}
      owner="demo:other"
      student
      busy={false}
      onBegin={async () => {
        throw new Error("Sem conexão");
      }}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Começar trilha" }));
  expect(await screen.findByText("Sem conexão")).toBeVisible();
  expect(
    screen.getByRole("heading", { name: "O que você vai aprender" }),
  ).toBeVisible();
});
