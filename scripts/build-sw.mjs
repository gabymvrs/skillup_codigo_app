import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
async function files(dir) {
  return (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map((e) =>
        e.isDirectory() ? files(`${dir}/${e.name}`) : `${dir}/${e.name}`,
      ),
    )
  ).flat();
}
const paths = (await files("dist")).filter((p) => !p.endsWith("/sw.js")).sort();
const hash = createHash("sha256");
for (const path of paths) {
  hash.update(path);
  hash.update(await readFile(path));
}
const version = hash.digest("hex").slice(0, 12);
// Code runners and editor chunks are fetched only when a code activity is opened.
const urls = paths
  .filter(
    (p) =>
      !p.includes("/code-sandbox/") && !/\/(CodePractice|codeRunner)-/.test(p),
  )
  .map((p) => "/" + p.replace(/^dist\//, ""));
const template = await readFile("scripts/sw-template.js", "utf8");
await writeFile(
  "dist/sw.js",
  template
    .replace("__VERSION__", version)
    .replace("__PRECACHE__", JSON.stringify(urls)),
);
console.log(`Service Worker ${version}: ${urls.length} arquivos públicos.`);
