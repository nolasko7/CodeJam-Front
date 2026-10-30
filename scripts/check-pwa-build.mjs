import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const directory = ".cloudflare/output/v0/workers/default/assets";
const asset = (path) => readFile(`${directory}/${path}`);
const manifest = JSON.parse(await asset("site.webmanifest"));
assert.equal(manifest.display, "standalone");
assert.equal(manifest.start_url, "/");
for (const icon of manifest.icons) {
  const png = await asset(icon.src.slice(1));
  assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
}
const html = (await asset("index.html")).toString();
assert.match(html, /rel="manifest"/);
assert.match(html, /apple-touch-icon/);
const sw = (await asset("sw.js")).toString();
assert.match(sw, /push\.js/);
assert.match(sw, /index\.html/);
assert.match(sw, /assets\/index-/);
await asset("push.js");
await asset("apple-touch-icon.png");
console.log("PWA: manifest, íconos y precache presentes en el build de Cloudflare.");
