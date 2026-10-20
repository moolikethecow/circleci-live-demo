const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const root = path.join(__dirname, "..");
const BRAND_FILES = [
  "circleci-logo-white.png",
  "circleci-logo-dark.png",
  "jelly-pixel-medium.png",
  "chunk-hyped.png",
  "qr-live-demo.png",
];
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe("Brand images", () => {
  test("brand images must be real PNG files", () => {
    for (const file of BRAND_FILES) {
      const bytes = fs.readFileSync(path.join(root, "brand", file));
      assert.ok(
        bytes.subarray(0, 8).equals(PNG_SIGNATURE),
        `Brand image ${file} is not a valid PNG file`,
      );
    }
  });

  test("QR code must be a square image big enough to scan from a projector", () => {
    const bytes = fs.readFileSync(path.join(root, "brand", "qr-live-demo.png"));
    const width = bytes.readUInt32BE(16);
    const height = bytes.readUInt32BE(20);
    assert.equal(width, height, `QR code is ${width}x${height}, it must be square`);
    assert.ok(width >= 300, `QR code is only ${width}px wide, it needs at least 300px`);
  });

  test("build must copy every brand image into the site", () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "live-demo-"));
    execFileSync("node", [path.join(root, "scripts", "build.js")], {
      env: { ...process.env, OUT_DIR: outDir },
      stdio: "pipe",
    });
    for (const file of BRAND_FILES) {
      assert.ok(
        fs.existsSync(path.join(outDir, "brand", file)),
        `Built site is missing brand/${file}, so it would not be served`,
      );
    }
  });
});
