const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const banner = require("../banner.json");

const HEADLINE_LIMIT = 60;

describe("Banner headline", () => {
  test("banner headline must be under 60 characters", () => {
    const length = banner.headline.length;
    assert.ok(
      length <= HEADLINE_LIMIT,
      `Banner headline is ${length} characters, the limit is ${HEADLINE_LIMIT}`,
    );
  });

  test("banner headline must not be empty", () => {
    assert.ok(banner.headline.trim().length > 0, "Banner headline is empty, it needs some text");
  });
});
