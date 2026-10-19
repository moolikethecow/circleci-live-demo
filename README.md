# circleci-live-demo

A tiny page for live CircleCI demos. Edit `banner.json`, push, and CircleCI tests it, deploys it, and the live page updates. A bad change fails the test and never deploys.

- `banner.json`: the banner text and colors (the only file you edit)
- `test/banner.test.js`: plain-English content checks
- `scripts/build.js`: renders `dist/index.html` and stamps the CircleCI build number and commit
- `.circleci/config.yml`: `test`, then `deploy` to Vercel (deploy requires test)

Run locally: `npm test` and `npm run build`. See `DEMO-MOO.md` for the on-stage runbook and one-time setup.

## One-time setup

1. `vercel login`, then in this folder `vercel link` to create/link a project. Note `orgId` and `projectId` from `.vercel/project.json`.
2. In CircleCI, follow this repo as a project and add environment variables `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
