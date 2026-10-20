const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const banner = require("../banner.json");

const SUBLINE_LIMIT = 80;

describe("Banner fields", () => {
  test("banner must have headline, subline and theme filled in", () => {
    for (const key of ["headline", "subline", "theme"]) {
      assert.equal(typeof banner[key], "string", `Banner is missing its "${key}" field`);
      assert.ok(banner[key].trim().length > 0, `Banner "${key}" field is empty`);
    }
  });

  test("banner subline must be 80 characters or fewer", () => {
    const length = banner.subline.length;
    assert.ok(
      length <= SUBLINE_LIMIT,
      `Banner subline is ${length} characters, the limit is ${SUBLINE_LIMIT}`,
    );
  });
});
