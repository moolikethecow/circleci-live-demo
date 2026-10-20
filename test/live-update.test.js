const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const { execFileSync } = require("node:child_process");

const root = path.join(__dirname, "..");

// Runs the page's own polling script against a tiny fake browser.
function startPage(buildNumber) {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "live-demo-"));
  execFileSync("node", [path.join(root, "scripts", "build.js")], {
    env: { ...process.env, CIRCLE_BUILD_NUM: String(buildNumber), OUT_DIR: outDir },
    stdio: "pipe",
  });
  const html = fs.readFileSync(path.join(outDir, "index.html"), "utf8");
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

  const elements = {};
  const element = () => ({ textContent: "", offsetWidth: 0, classList: { add() {}, remove() {} } });
  const attrs = { "data-build": String(buildNumber), "data-theme": "midnight" };
  const document = {
    hidden: false,
    title: "",
    body: { getAttribute: (k) => attrs[k] },
    documentElement: { setAttribute: (k, v) => (attrs[k] = v) },
    getElementById: (id) => (elements[id] ||= element()),
    addEventListener() {},
  };
  const responses = [];
  let tick;
  const context = {
    document,
    Date,
    Number,
    String,
    isNaN,
    clearTimeout() {},
    setTimeout: () => 0,
    clearInterval() {},
    setInterval: (fn) => ((tick = fn), 1),
    fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve(responses.shift()) }),
  };
  vm.runInNewContext(script, context);

  return {
    elements,
    attrs,
    async poll(version) {
      responses.push(version);
      tick();
      await new Promise((resolve) => setImmediate(resolve));
    },
  };
}

const version = (build, headline, theme) => ({
  build: String(build),
  sha: "abc1234",
  builtAt: "2026-10-20T15:00:00.000Z",
  headline,
  subline: "sub",
  theme,
});

describe("Live update script", () => {
  test("page must switch to a newer build without a reload", async () => {
    const page = startPage(5);
    await page.poll(version(6, "Brand new headline", "slime"));
    assert.equal(page.elements.headline.textContent, "Brand new headline");
    assert.equal(page.attrs["data-theme"], "slime");
    assert.equal(page.elements.toast.textContent, "Updated by build #6, just now");
    // builtAt is 15:00 UTC on Oct 20, which is 8:00 AM Pacific (PDT).
    assert.match(page.elements["stamp-time"].textContent, /^Oct 20, 8:00\sAM PDT$/);
  });

  test("page must ignore an older build, so it never flip-flops during a deploy", async () => {
    const page = startPage(5);
    await page.poll(version(6, "New", "slime"));
    await page.poll(version(5, "Old", "midnight"));
    assert.equal(page.elements.headline.textContent, "New");
    assert.equal(page.attrs["data-theme"], "slime");
  });

  test("page must stay put while the build number is unchanged", async () => {
    const page = startPage(5);
    await page.poll(version(5, "Same build", "slime"));
    assert.equal(page.elements.headline, undefined, "Page changed although nothing was deployed");
  });
});
