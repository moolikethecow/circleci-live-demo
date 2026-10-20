const test = require("node:test");
const assert = require("node:assert/strict");
const banner = require("../banner.json");

const MIN_CONTRAST = 4.5; // WCAG AA for normal text

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test("banner text must be readable against the background", () => {
  const ratio = contrast(banner.text, banner.background);
  assert.ok(
    ratio >= MIN_CONTRAST,
    `Banner text and background colors are too similar to read (contrast ${ratio.toFixed(1)}, need ${MIN_CONTRAST})`,
  );
});

test("banner accent must be readable against the background", () => {
  const ratio = contrast(banner.accent, banner.background);
  assert.ok(
    ratio >= MIN_CONTRAST,
    `Banner accent and background colors are too similar to read (contrast ${ratio.toFixed(1)}, need ${MIN_CONTRAST})`,
  );
});
