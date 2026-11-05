import { beforeEach, describe, expect, it, vi } from "vitest";
import { IDBFactory, IDBObjectStore } from "fake-indexeddb";
import {
  clearOffline,
  getSaved,
  listSaved,
  materialHtml,
  pendingProgress,
  queueProgress,
  removeSaved,
  saveMaterial,
} from "../src/services/offline";
import { materials } from "../src/data/catalog";
beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});
describe("Offline storage: verified, scoped, removable", () => {
  it("confirms actual committed bytes and retrieves after reopening the database", async () => {
    const saved = await saveMaterial("user-a", materials[0]);
    expect(saved.bytes).toBeGreaterThan(100);
    expect((await getSaved("user-a", materials[0].id))?.material.body).toEqual(
      materials[0].body,
    );
    expect(await listSaved("user-b")).toEqual([]);
  });
  it("does not mark denied content as stored", async () => {
    await expect(
      saveMaterial("user-a", { ...materials[0], allow_offline: false }),
    ).rejects.toThrow("não autorizou");
    expect(await listSaved("user-a")).toEqual([]);
  });
  it("surfaces a storage failure without a false success", async () => {
    const spy = vi
      .spyOn(IDBObjectStore.prototype, "put")
      .mockImplementationOnce(() => {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      });
    await expect(saveMaterial("user-a", materials[0])).rejects.toThrow();
    spy.mockRestore();
    expect(await listSaved("user-a")).toEqual([]);
  });
  it("removes one material and keeps another owner intact", async () => {
    await saveMaterial("user-a", materials[0]);
    await saveMaterial("user-b", materials[0]);
    await removeSaved("user-a", materials[0].id);
    expect(await listSaved("user-a")).toEqual([]);
    expect(await listSaved("user-b")).toHaveLength(1);
  });
  it("queues only module identifiers and isolates logout cleanup", async () => {
    await queueProgress("user-a", "module-1");
    await queueProgress("user-b", "module-2");
    await clearOffline("user-a");
    expect(await pendingProgress("user-a")).toEqual([]);
    expect(await pendingProgress("user-b")).toHaveLength(1);
  });
  it("escapes downloaded HTML and never executes material text", () => {
    const html = materialHtml({
      ...materials[0],
      title: "<script>alert(1)</script>",
      body: "<img src=x onerror=alert(1)>",
    });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;");
  });
});
