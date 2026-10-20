const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const themes = require("../src/themes.json");

const MIN_CONTRAST = 4.5; // WCAG AA for normal text

// Relative luminance of a "#RRGGBB" color per WCAG 2.x. The constants (0.03928
// gamma breakpoint, 2.4 exponent, 0.2126 / 0.7152 / 0.0722 channel weights) are
// taken straight from the spec and must not be rounded — the readability tests
// below compare against the official threshold.
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

// WCAG contrast ratio between two colors: a number from 1 (identical) to 21
// (black on white). The +0.05 offset is from the spec; it keeps the ratio
// defined when either color is pure black.
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("Theme readability", () => {
  for (const [name, theme] of Object.entries(themes)) {
    test(`${name} text must be readable against the background`, () => {
      const ratio = contrast(theme.text, theme.background);
      assert.ok(
        ratio >= MIN_CONTRAST,
        `Theme ${name} text and background colors are too similar to read (contrast ${ratio.toFixed(1)}, need ${MIN_CONTRAST})`,
      );
    });

    test(`${name} accent must be readable against the background`, () => {
      const ratio = contrast(theme.accent, theme.background);
      assert.ok(
        ratio >= MIN_CONTRAST,
        `Theme ${name} accent and background colors are too similar to read (contrast ${ratio.toFixed(1)}, need ${MIN_CONTRAST})`,
      );
    });
  }
});
