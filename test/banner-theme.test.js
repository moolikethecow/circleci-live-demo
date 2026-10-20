const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const banner = require("../banner.json");
const themes = require("../src/themes.json");

const ALLOWED_THEMES = ["midnight", "slime"];

describe("Banner theme", () => {
  test("banner theme must be midnight or slime", () => {
    assert.ok(
      ALLOWED_THEMES.includes(banner.theme),
      `Theme must be midnight or slime, got ${banner.theme}`,
    );
  });

  test("every allowed theme must have a palette", () => {
    assert.deepEqual(Object.keys(themes).sort(), [...ALLOWED_THEMES].sort());
  });
});
