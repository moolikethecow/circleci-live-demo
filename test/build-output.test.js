const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const { execFileSync } = require("node:child_process");
const banner = require("../banner.json");
const themes = require("../src/themes.json");

const root = path.join(__dirname, "..");

function buildDir(extraEnv) {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "live-demo-"));
  execFileSync("node", [path.join(root, "scripts", "build.js")], {
    env: { ...process.env, ...extraEnv, OUT_DIR: outDir },
    stdio: "pipe",
  });
  return outDir;
}

function build(extraEnv) {
  return fs.readFileSync(path.join(buildDir(extraEnv), "index.html"), "utf8");
}

describe("Built page", () => {
  test("built page must have no unfilled {{placeholders}}", () => {
    const html = build({});
    const leftover = html.match(/{{\w+}}/);
    assert.equal(leftover, null, `Built page still contains an unfilled placeholder ${leftover}`);
  });

  test("built page must show the banner headline", () => {
    const html = build({});
    const escaped = banner.headline.replace(/&/g, "&amp;");
    assert.ok(html.includes(escaped), "Built page does not contain the banner headline");
  });

  test("built page must stamp the CircleCI build number and commit", () => {
    const html = build({ CIRCLE_BUILD_NUM: "4242", CIRCLE_SHA1: "abcdef1234567890" });
    assert.ok(html.includes("#4242"), "Built page is missing the build number stamp");
    assert.ok(html.includes("abcdef1"), "Built page is missing the short commit stamp");
  });

  test("built page must apply the banner theme and show the QR card", () => {
    const html = build({});
    assert.ok(html.includes(`data-theme="${banner.theme}"`), "Built page is missing its theme");
    assert.ok(html.includes("Follow along on your phone"), "Built page is missing the QR card");
    assert.ok(html.includes("brand/qr-live-demo.png"), "Built page does not show the QR image");
  });

  test("built page must show the CircleCI logo, in a version that suits every theme", () => {
    const html = build({});
    for (const file of ["circleci-logo-white.png", "circleci-logo-dark.png"]) {
      assert.ok(html.includes(`brand/${file}`), `Built page does not show brand/${file}`);
    }
    for (const [name, theme] of Object.entries(themes)) {
      assert.ok(
        ["white", "dark"].includes(theme.logo),
        `Theme ${name} must say which logo to use ("white" or "dark"), got ${theme.logo}`,
      );
    }
  });

  test("built page script must be valid JavaScript", () => {
    const html = build({});
    const script = html.match(/<script>([\s\S]*?)<\/script>/);
    assert.ok(script, "Built page has no <script> to poll for updates");
    assert.doesNotThrow(() => new vm.Script(script[1]), "Built page script has a syntax error");
  });
});

describe("Live update files", () => {
  test("build must write version.json that matches the page", () => {
    const outDir = buildDir({ CIRCLE_BUILD_NUM: "4242", CIRCLE_SHA1: "abcdef1234567890" });
    const version = JSON.parse(fs.readFileSync(path.join(outDir, "version.json"), "utf8"));
    assert.equal(version.build, "4242");
    assert.equal(version.sha, "abcdef1");
    assert.equal(version.headline, banner.headline);
    assert.equal(version.subline, banner.subline);
    assert.equal(version.theme, banner.theme);
    assert.ok(!Number.isNaN(Date.parse(version.builtAt)), "version.json builtAt is not a date");
  });

  test("version.json and the page must never be cached", () => {
    const outDir = buildDir({});
    const config = JSON.parse(fs.readFileSync(path.join(outDir, "vercel.json"), "utf8"));
    for (const source of ["/", "/index.html", "/version.json"]) {
      const rule = config.headers.find((h) => h.source === source);
      assert.ok(rule, `vercel.json has no cache rule for ${source}`);
      const cache = rule.headers.find((h) => h.key === "Cache-Control");
      assert.ok(
        cache && cache.value.includes("no-store"),
        `${source} must be served with Cache-Control: no-store, or phones will see stale builds`,
      );
    }
  });
});
