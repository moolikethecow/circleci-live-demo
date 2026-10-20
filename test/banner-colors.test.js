const test = require("node:test");
const assert = require("node:assert/strict");
const banner = require("../banner.json");

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

test("banner colors must be valid hex codes", () => {
  for (const key of ["background", "accent", "text"]) {
    assert.match(
      banner[key],
      HEX_COLOR,
      `Banner ${key} color "${banner[key]}" is not a hex code like #1C273A`,
    );
  }
});
