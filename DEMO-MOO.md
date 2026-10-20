# DEMO-MOO.md: on-stage runbook

**Audience:** new hires (sales, marketing, ops). **Length:** about 8 to 10 minutes of talking. Waits are under a minute, so have filler ready.
**The one idea:** "Every change gets tested and scanned before it can reach the live page. Good change: it ships. Bad change: it's stopped."

## How the pieces fit

| Thing                    | What it is                                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| `banner.json`            | The only file you edit on stage: headline, subline, colors                                          |
| `test/*.test.js`         | 6 small test files (12 plain-English checks), split across 2 machines                               |
| `.gitleaks.toml`         | Secret-scan rules (catches committed credentials)                                                   |
| `.circleci/config.yml`   | `install` → (`lint`, `unit-tests` ×2, `security-scan`) → `build` → `deploy`                         |
| `brand/`                 | Logos for your slides, served at `https://circleci-live-demo.vercel.app/brand/<file>`               |
| Page footer              | `Build #<n> · commit <sha> · deployed <time>`. `<n>` is the **build** job's number in that pipeline |

Branches:

- `main`: safe baseline. Deploys.
- `demo-moo-base`: your live-typing branch. Deploys.
- `demo-moo-good-change`: fallback. Passes everything, deploys a new headline.
- `demo-moo-bad-change`: fallback. Headline too long, so **tests** go red. Never deploys.
- `demo-moo-leaked-secret`: fallback. Commits a fake key, so the **security scan** goes red. Never deploys (and is not even allowed to).

Only `main`, `demo-moo-base`, `demo-moo-good-change` and `demo-moo-bad-change` can deploy. Every other branch runs the checks only.

## Point at the graph (30 seconds)

Open the workflow graph of a green run and say:

- **Speed:** "Three jobs run side by side: lint, tests and security scan. The tests are split across **two machines** (see ×2 on `unit-tests`). The package cache means the second run says **Found a cache** and skips downloading."
- **Efficiency:** "One line pulls in a shared, maintained **orb** for installing and caching. One shared executor and one reusable command keep the config short. Each job picks a **small** machine, so you only pay for what you need. We **build once** and deploy exactly the thing we tested."
- **Guardrails:** "Tests and the security scan both **gate** the deploy. If either goes red, `build` and `deploy` never start."
- **Where to look:** Tests tab (split results), Artifacts tab on `build` (downloadable page), the `install` job's "Restoring cache" step.

Two red paths to show (below): `demo-moo-bad-change` (tests) and `demo-moo-leaked-secret` (security).

## Pre-flight (tonight, and 15 minutes before)

- [ ] Live URL opens: **https://circleci-live-demo.vercel.app** (use this stable URL, not the long per-deploy URL, which can be login-protected).
- [ ] Brand images load, e.g. https://circleci-live-demo.vercel.app/brand/circleci-logo-white.png
- [ ] Last pipeline on `main` is green. Footer shows a real build number, not `#local`.
- [ ] **Warm the cache:** push one empty commit to `main` about 15 minutes before (`git commit --allow-empty -m "warm cache" && git push`). The next run then shows "Found a cache" and finishes fastest.
- [ ] Tabs open: live page, CircleCI pipeline list, a recent green workflow graph, a recent red run of each kind (backup), `banner.json` on GitHub, editor on `demo-moo-base`.
- [ ] Terminal in the repo: `git switch demo-moo-base && git pull`
- [ ] Font size up in editor and terminal. Phone on silent.
- [ ] Check the Vercel token hasn't expired (an expired token makes `deploy` fail while everything before it stays green).

## Timings (measured Oct 20 on real runs)

| What                                | Time                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------- |
| Green, warm (cache hit)             | **about 50 to 60 s** (measured 56 s and 49 s)                             |
| Green, cold (first run, cache miss) | **about 85 to 95 s** (measured 95 s and 87 s)                             |
| Red: tests (`demo-moo-bad-change`)  | workflow settles red in **about 40 s** (measured 41 s). Deploy never runs |
| Red: secret (`leaked-secret`)       | workflow settles red in **about 43 s** (measured 43 s). Deploy never runs |

Where the green time goes: `install` ~10 to 14 s, then the three parallel jobs ~7 to 14 s, then `build` ~5 to 19 s, then `deploy` ~14 s (cache hit; 30+ s when the cache is cold). Most of each job is CircleCI starting its container (2 to 16 s, it varies run to run); the actual work is 1 to 2 s.

## 1. Happy path: change the banner, watch it go live (about 2 min including talking)

1. Show the live page. Point at the footer: "See this build number? Remember it."
2. Open `banner.json`. Edit **one value**, for example:
   ```json
   "headline": "Welcome to CircleCI, October 2026 cohort: let's ship!"
   ```
3. Commit and push:
   ```bash
   git commit -am "Update banner headline" && git push
   ```
4. Switch to the pipeline list and open the new pipeline. Use "Point at the graph" above while it runs.
5. When `deploy` goes green, refresh the live page. New headline, **new build number**.

**Say:** "That number in the footer is this pipeline run. The page really did change because of what we just watched."

## 2. Caught by tests: a bad change never ships (about 1.5 min)

1. Edit `banner.json` and make the headline far too long, for example:
   ```json
   "headline": "Welcome to CircleCI, October 2026 cohort, we are so glad you are all here with us today"
   ```
2. Commit and push:
   ```bash
   git commit -am "Make headline very long" && git push
   ```
3. Open the pipeline. `unit-tests` goes **red**; `build` and `deploy` show **not run**.
4. Click `unit-tests`, then the failing machine. Point at this line:

   > `Banner headline is 87 characters, the limit is 60`

   (The Tests tab shows the same sentence.)

5. Refresh the live page. **Unchanged**: same text, same build number as before.

**Say:** "The tests said no, in plain English. Nothing was published. The live page never saw the bad version."

6. Fix it: restore a short headline, push again, and show it going green. (Or reset, below.)

## 3. Caught by the security scan: a leaked secret never ships (about 1.5 min)

Fastest on stage: push the prepared branch (no editing).

```bash
git push origin demo-moo-leaked-secret
```

(If it says "up to date", run `git switch demo-moo-leaked-secret && git commit --allow-empty -m "rerun" && git push`.)

1. Open the pipeline. `security-scan` goes **red**; `build` is **not run**. This branch is also not allowed to deploy at all.
2. Click `security-scan` → **Secret scan** step. Point at:
   - `File: demo-leaked-credentials.txt`, `Line: 2`
   - the sentence at the bottom: `SECRET SCAN FAILED: a credential-like value was committed ... Nothing was deployed.`
3. Say: "That file contains an obviously fake key (`FAKE-DEMO-NOT-REAL-EXAMPLE`), not a real one. A real key committed by accident would be caught the same way, before it reaches production."

## 4. Optional: caught after deploy

This demo has no post-deploy health check, so there's no automatic "release marked Failed" or rollback button. Say so if asked, and use the banking app's Deploys view (read-only, in a tab) to show that story:
"Tests and scans catch problems before deploy. CircleCI release validation catches them after deploy and can roll back. We use that on our larger banking demo."

## 5. Reset: leave everything clean

1. Put the live page back on the baseline:
   ```bash
   git switch main && git pull
   git commit --allow-empty -m "Reset demo page" && git push
   ```
   Wait for green, then confirm the live page shows the original headline: "Welcome to CircleCI, October 2026 cohort".
2. Reset your demo branch to match `main` (your own throwaway branch):
   ```bash
   git switch demo-moo-base && git reset --hard main && git push --force-with-lease
   ```
3. Check `banner.json` on `main` has the original values (headline "Welcome to CircleCI, October 2026 cohort", subline "Presented by Moo Olaniyan").

The fallback branches (`demo-moo-good-change`, `demo-moo-bad-change`, `demo-moo-leaked-secret`) need no reset.
Nothing else is touched: no shared clusters, no shared repos, no shared contexts.

## Fallbacks if live typing goes sideways

Push a prepared branch. No editing needed:

```bash
git push origin demo-moo-good-change      # deploys a new headline, goes green
git push origin demo-moo-bad-change       # tests go red, does not deploy
git push origin demo-moo-leaked-secret    # security scan goes red, does not deploy
```

If a push says "up to date", make an empty commit on that branch first. After using `demo-moo-good-change`, run the reset (section 5).

## Manual approval gate (not enabled)

`.circleci/config.yml` has a commented-out `hold` approval job before `deploy`, with the two steps to turn it on. It's left off so the live demo doesn't stall waiting for a click. Mention it as "you can require a human to click approve before production".

## If it breaks on stage

| Symptom                           | Likely cause                                                     | What to do                                                                                     |
| --------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Pipeline doesn't start            | GitHub or CircleCI hiccup                                        | Say "let's give it a second", refresh. Fall back to the last green pipeline and walk it        |
| `deploy` fails but checks are green | Vercel token or project IDs wrong or expired                    | Show the green checks, then the failed `deploy` log. Fix after the session                     |
| Page doesn't change after green   | Browser cache, or you're on the wrong URL                        | Hard refresh (Cmd+Shift+R), use the stable `circleci-live-demo.vercel.app` URL                 |
| Run is slower than the table      | Container start-up varies by a few seconds                       | Keep talking over the graph; it's still the same flow                                          |
| A check is red that shouldn't be  | Formatting (lint) after a hand edit of `banner.json`             | Click `lint`, read the file name. `npm run format` fixes it. Or use a fallback branch          |
| Anything else                     |                                                                  | Show the last green pipeline and the saved red ones. Don't live-debug                          |
