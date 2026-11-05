import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
function worker() {
  const handlers: Record<string, (event: any) => void> = {};
  const cache = { addAll: vi.fn().mockResolvedValue(undefined) };
  const caches = {
    open: vi.fn().mockResolvedValue(cache),
    keys: vi
      .fn()
      .mockResolvedValue(["skillup-shell-old", "skillup_old", "other-app"]),
    delete: vi.fn().mockResolvedValue(true),
    match: vi.fn().mockResolvedValue(new Response("offline shell")),
  };
  const fetch = vi.fn().mockResolvedValue(new Response("online"));
  runInNewContext(
    readFileSync("scripts/sw-template.js", "utf8")
      .replace("__VERSION__", "test")
      .replace(
        "__PRECACHE__",
        JSON.stringify(["/index.html", "/assets/app.js"]),
      ),
    {
      self: {
        location: { origin: "https://skillup.test" },
        clients: { claim: vi.fn() },
        addEventListener: (name: string, fn: any) => (handlers[name] = fn),
      },
      caches,
      fetch,
      URL,
    },
  );
  const event = (
    type: string,
    fields: Record<string, unknown> = {},
  ): Promise<any> | null => {
    let result: Promise<any> | null = null;
    handlers[type]({
      ...fields,
      waitUntil: (p: Promise<any>) => (result = p),
      respondWith: (p: Promise<any>) => (result = p),
    });
    return result;
  };
  return { event, caches, cache, fetch };
}
describe("Service worker cache policy (simulated runtime)", () => {
  it("installs the generated public shell and removes only old SkillUp caches", async () => {
    const w = worker();
    await w.event("install");
    expect(w.cache.addAll).toHaveBeenCalledWith([
      "/index.html",
      "/assets/app.js",
    ]);
    await w.event("activate");
    expect(w.caches.delete.mock.calls.map((x) => x[0])).toEqual([
      "skillup-shell-old",
      "skillup_old",
    ]);
  });
  it("does not intercept authenticated API responses, private files or mutations", () => {
    const w = worker();
    for (const request of [
      {
        method: "GET",
        url: "https://project.supabase.co/rest/v1/profiles",
        mode: "cors",
      },
      {
        method: "GET",
        url: "https://skillup.test/private/file.pdf",
        mode: "cors",
      },
      {
        method: "POST",
        url: "https://skillup.test/assets/app.js",
        mode: "cors",
      },
    ])
      expect(w.event("fetch", { request })).toBeNull();
    expect(w.caches.match).not.toHaveBeenCalled();
  });
  it("returns the cached shell when offline and cached versioned assets", async () => {
    const w = worker();
    w.fetch.mockRejectedValue(new TypeError("Network offline"));
    const response = await w.event("fetch", {
      request: {
        method: "GET",
        url: "https://skillup.test/app/home",
        mode: "navigate",
      },
    });
    expect(await response!.text()).toBe("offline shell");
    await w.event("fetch", {
      request: {
        method: "GET",
        url: "https://skillup.test/assets/app.js",
        mode: "cors",
      },
    });
    expect(w.caches.match).toHaveBeenCalledWith("/assets/app.js", {
      cacheName: "skillup-shell-test",
    });
    expect(w.fetch).toHaveBeenCalledTimes(1);
  });
});
