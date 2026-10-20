const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const banner = require("../banner.json");

const root = path.join(__dirname, "..");

function build(extraEnv) {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "live-demo-"));
  execFileSync("node", [path.join(root, "scripts", "build.js")], {
    env: { ...process.env, ...extraEnv, OUT_DIR: outDir },
    stdio: "pipe",
  });
  return fs.readFileSync(path.join(outDir, "index.html"), "utf8");
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
});
