const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const themes = require("../src/themes.json");

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

describe("Theme colors", () => {
  test("theme colors must be valid hex codes", () => {
    for (const [name, theme] of Object.entries(themes)) {
      for (const key of ["background", "accent", "text"]) {
        assert.match(
          theme[key],
          HEX_COLOR,
          `Theme ${name} ${key} color "${theme[key]}" is not a hex code like #1C273A`,
        );
      }
    }
  });
});
