// Renders src/index.template.html + banner.json into dist/index.html.
// CircleCI injects CIRCLE_BUILD_NUM and CIRCLE_SHA1, so the live page proves
// which pipeline run produced it.
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const banner = JSON.parse(fs.readFileSync(path.join(root, "banner.json"), "utf8"));
const template = fs.readFileSync(path.join(root, "src", "index.template.html"), "utf8");

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const values = {
  HEADLINE: escapeHtml(banner.headline),
  SUBLINE: escapeHtml(banner.subline),
  BACKGROUND: banner.background,
  ACCENT: banner.accent,
  TEXT: banner.text,
  BUILD: escapeHtml(process.env.CIRCLE_BUILD_NUM || "local"),
  SHA: escapeHtml((process.env.CIRCLE_SHA1 || "dev").slice(0, 7)),
  DEPLOYED_AT: new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC",
};

const html = template.replace(/{{(\w+)}}/g, (_, key) => {
  if (!(key in values)) throw new Error(`Unknown placeholder {{${key}}} in template`);
  return values[key];
});

fs.mkdirSync(path.join(root, "dist"), { recursive: true });
fs.writeFileSync(path.join(root, "dist", "index.html"), html);
console.log(`Built dist/index.html (build ${values.BUILD}, commit ${values.SHA})`);
