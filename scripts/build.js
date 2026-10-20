// Renders src/index.template.html + banner.json into dist/index.html, writes
// dist/version.json (what phones poll to see a new build), and copies brand/
// and vercel.json (cache headers) into dist/ so they are served with the page.
// CircleCI injects CIRCLE_BUILD_NUM and CIRCLE_SHA1, so the live page proves
// which pipeline run produced it.
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
// OUT_DIR lets tests build into a temp folder without touching dist/.
const outDir = process.env.OUT_DIR || path.join(root, "dist");
const banner = JSON.parse(fs.readFileSync(path.join(root, "banner.json"), "utf8"));
const themes = JSON.parse(fs.readFileSync(path.join(root, "src", "themes.json"), "utf8"));
const template = fs.readFileSync(path.join(root, "src", "index.template.html"), "utf8");

if (!(banner.theme in themes)) {
  throw new Error(`Unknown theme "${banner.theme}", expected one of: ${Object.keys(themes)}`);
}

const escapeHtml = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

// One CSS block per theme; the page switches theme by changing <html data-theme>.
const themeCss = Object.entries(themes)
  .map(
    ([name, t]) =>
      `:root[data-theme="${name}"] { --bg: ${t.background}; --text: ${t.text}; --accent: ${t.accent}; }`,
  )
  .join("\n      ");

const now = new Date();
const build = process.env.CIRCLE_BUILD_NUM || "local";
const sha = (process.env.CIRCLE_SHA1 || "dev").slice(0, 7);

const values = {
  HEADLINE: escapeHtml(banner.headline),
  SUBLINE: escapeHtml(banner.subline),
  THEME: banner.theme,
  THEME_CSS: themeCss,
  BUILD: escapeHtml(build),
  SHA: escapeHtml(sha),
  DEPLOYED_AT: now.toISOString().replace("T", " ").slice(0, 16) + " UTC",
};

const html = template.replace(/{{(\w+)}}/g, (_, key) => {
  if (!(key in values)) throw new Error(`Unknown placeholder {{${key}}} in template`);
  return values[key];
});

// Raw (unescaped) values: the page sets them with textContent, so this is safe.
const version = {
  build,
  sha,
  builtAt: now.toISOString(),
  headline: banner.headline,
  subline: banner.subline,
  theme: banner.theme,
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "index.html"), html);
fs.writeFileSync(path.join(outDir, "version.json"), JSON.stringify(version, null, 2) + "\n");
fs.cpSync(path.join(root, "brand"), path.join(outDir, "brand"), { recursive: true });
fs.copyFileSync(path.join(root, "vercel.json"), path.join(outDir, "vercel.json"));
console.log(
  `Built ${path.join(outDir, "index.html")} (build ${build}, commit ${sha}, theme ${banner.theme})`,
);
