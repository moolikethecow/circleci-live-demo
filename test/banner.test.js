const test = require("node:test");
const assert = require("node:assert/strict");
const banner = require("../banner.json");

const HEADLINE_LIMIT = 60;
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

test("banner headline must be under 60 characters", () => {
  const length = banner.headline.length;
  assert.ok(
    length <= HEADLINE_LIMIT,
    `Banner headline is ${length} characters, the limit is ${HEADLINE_LIMIT}`
  );
});

test("banner headline must not be empty", () => {
  assert.ok(banner.headline.trim().length > 0, "Banner headline is empty, it needs some text");
});

test("banner colors must be valid hex codes", () => {
  for (const key of ["background", "accent", "text"]) {
    assert.match(
      banner[key],
      HEX_COLOR,
      `Banner ${key} color "${banner[key]}" is not a hex code like #1C273A`
    );
  }
});
