# DEMO-MOO.md: on-stage runbook

**Audience:** new hires (sales, marketing, ops). **Length:** about 8 to 10 minutes of talking. Waits are under a minute, so have filler ready.
**The one idea:** "Every change gets tested and scanned before it can reach the live page. Good change: it ships. Bad change: it's stopped."

## How the pieces fit

| Thing                    | What it is                                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| `banner.json`            | The only file you edit on stage: `headline`, `subline`, `theme` (`midnight` or `slime`)             |
| `test/*.test.js`         | 8 small test files (24 plain-English checks), split across 2 machines                               |
| `.gitleaks.toml`         | Secret-scan rules (catches committed credentials)                                                   |
| `.circleci/config.yml`   | `install` → (`lint`, `unit-tests` ×2, `security-scan`) → `build` → `deploy`                         |
| `brand/`                 | Logos for your slides and the QR code, at `https://circleci-live-demo.vercel.app/brand/<file>`      |
| `dist/version.json`      | Written by every build (build number, SHA, time, headline, theme). Phones poll it every 3 s         |
| Page footer              | `Build #<n> · commit <sha> · deployed <time>`. `<n>` is the **build** job's number in that pipeline |

Branches:

- `main`: safe baseline. Deploys.
- `demo-moo-base`: your live-typing branch. Deploys.
- `demo-moo-good-change`: fallback. Passes everything, deploys **slime theme + a new headline**.
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
- [ ] QR loads: https://circleci-live-demo.vercel.app/brand/qr-live-demo.png (also shown in the bottom-right card of the page on the projector). **Scan it with your own phone** and leave that phone on the page: it's your proof the live update works.
- [ ] Page on the projector is **midnight** (dark) with the original headline, so the switch to green is dramatic.
- [ ] Last pipeline on `main` is green. Footer shows a real build number, not `#local`.
- [ ] **Warm the cache:** push one empty commit to `main` about 15 minutes before (`git commit --allow-empty -m "warm cache" && git push`). The next run then shows "Found a cache" and finishes fastest.
- [ ] Tabs open: live page, CircleCI pipeline list, a recent green workflow graph, a recent red run of each kind (backup), `banner.json` on GitHub, editor on `demo-moo-base`.
- [ ] Terminal in the repo: `git switch demo-moo-base && git pull`
- [ ] Font size up in editor and terminal. Phone on silent.
- [ ] Check the Vercel token hasn't expired (an expired token makes `deploy` fail while everything before it stays green).

## Timings (measured Oct 20 on real runs)

| What                                | Time                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------- |
| Green, warm (cache hit)             | **about 55 to 60 s** (measured 53, 55, 57, 60 and 61 s on Oct 20)         |
| Green, cold (first run, cache miss) | **about 85 to 95 s** (measured 95 s and 87 s, before the QR/theme change)  |
| Red: tests (`demo-moo-bad-change`)  | workflow settles red in **about 40 s** (measured 41 s). Deploy never runs |
| Red: secret (`leaked-secret`)       | workflow settles red in **about 43 s** (measured 43 s). Deploy never runs |
| `deploy` finishes → phones change   | **about 4 to 5 s** (poll is every 3 s; measured 4.5 s and about 4 s)      |
| Push → phones change (end to end)   | **about 1 minute** (about 60 s pipeline + 4 to 5 s)                       |

Where the green time goes: `install` ~10 to 14 s, then the three parallel jobs ~7 to 14 s, then `build` ~5 to 19 s, then `deploy` ~14 s (cache hit; 30+ s when the cache is cold). Most of each job is CircleCI starting its container (2 to 16 s, it varies run to run); the actual work is 1 to 2 s.

## 1. Happy path: ask the room, watch every phone change (about 3 min including talking)

**Setup (before you start talking):** put the QR page on the projector. Say: "Scan this and keep the page open. Don't refresh it. Ever."
Give people a minute. The page shows `Build #<n>` in the footer, so you can say "everyone should see the same number".

1. Ask the room: **"Give me a headline."** Pick one (60 characters or fewer, or you've just started the red path!).
2. Open `banner.json`. Change **two values**: the headline, and the theme to `slime`:
   ```json
   "headline": "<what the room said>",
   "theme": "slime"
   ```
3. Commit and push:
   ```bash
   git commit -am "Room's headline, slime theme" && git push
   ```
4. Switch to the pipeline list and open the new pipeline. Use "Point at the graph" above while it runs (about 55 to 60 s).
5. **Stop talking when `deploy` goes green.** About 4 to 5 seconds later every phone in the room, and the projector page, **turns bright green by itself**: new headline slides in and a bar across the top says "Updated by build #N, just now" for about 5 seconds. Nobody refreshed.

**Say:** "Nobody pressed anything. Your phone asked 'anything new?' every 3 seconds, and the moment the pipeline published, it noticed. That number in the footer is this pipeline run."

**What phones see, and roughly when** (from the push):

| Time after push | Phones                                                                               |
| --------------- | ------------------------------------------------------------------------------------ |
| 0 to ~55 s      | Nothing changes (that's the pipeline working: tests, scan, build). Dark page         |
| ~55 to 60 s     | `deploy` finishes                                                                    |
| +4 to 5 s       | Page flips to green, headline slides in, "Updated by build #N, just now" for ~5 s    |

If someone's phone didn't change: they probably locked it or switched apps. The page re-checks the moment they return to it; if not, a refresh works.

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

5. Look at the phones and the live page. **Unchanged**: same text, same theme, same build number as before. Nothing flips.

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

1. Put the live page back on the baseline (**midnight + original headline**):
   ```bash
   git switch main && git pull
   git commit --allow-empty -m "Reset demo page" && git push
   ```
   Wait for green. Phones that are still open flip back to dark by themselves. Confirm the live page shows the original headline: "Welcome to CircleCI, October 2026 cohort".
   If you changed `banner.json` on `demo-moo-base` or `main`, it's `git switch main && git pull`, then set `"theme": "midnight"` and the original headline before pushing.
2. Reset your demo branch to match `main` (your own throwaway branch):
   ```bash
   git switch demo-moo-base && git reset --hard main && git push --force-with-lease
   ```
3. Check `banner.json` on `main` has the original values (headline "Welcome to CircleCI, October 2026 cohort", subline "Presented by Moo Olaniyan", theme `midnight`).

The fallback branches (`demo-moo-good-change`, `demo-moo-bad-change`, `demo-moo-leaked-secret`) need no reset.
Nothing else is touched: no shared clusters, no shared repos, no shared contexts.

## Fallbacks if live typing goes sideways

Push a prepared branch. No editing needed:

```bash
git push origin demo-moo-good-change      # deploys slime theme + new headline, goes green; phones flip
git push origin demo-moo-bad-change       # tests go red, does not deploy
git push origin demo-moo-leaked-secret    # security scan goes red, does not deploy
```

If a push says "up to date", make an empty commit on that branch first. After using `demo-moo-good-change`, run the reset (section 5).

## QR code

`brand/qr-live-demo.png` points at `https://circleci-live-demo.vercel.app`. It was generated once (macOS, no dependencies) and committed. Only regenerate if the URL changes:

```bash
swift scripts/make-qr.swift "https://circleci-live-demo.vercel.app" brand/qr-live-demo.png
```

## Manual approval gate (not enabled)

`.circleci/config.yml` has a commented-out `hold` approval job before `deploy`, with the two steps to turn it on. It's left off so the live demo doesn't stall waiting for a click. Mention it as "you can require a human to click approve before production".

## If it breaks on stage

| Symptom                           | Likely cause                                                     | What to do                                                                                     |
| --------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Pipeline doesn't start            | GitHub or CircleCI hiccup                                        | Say "let's give it a second", refresh. Fall back to the last green pipeline and walk it        |
| `deploy` fails but checks are green | Vercel token or project IDs wrong or expired                    | Show the green checks, then the failed `deploy` log. Fix after the session                     |
| Page doesn't change after green   | Browser cache, or you're on the wrong URL                        | Hard refresh (Cmd+Shift+R), use the stable `circleci-live-demo.vercel.app` URL                 |
| Phones don't flip but yours does  | They locked the phone or switched apps (polling pauses when hidden) | They'll update when they come back. Otherwise ask them to reload. Polling also stops after 90 minutes open |
| Theme test goes red               | `theme` isn't exactly `midnight` or `slime`                      | Read the message: `Theme must be midnight or slime, got <value>`. Fix the spelling             |
| Run is slower than the table      | Container start-up varies by a few seconds                       | Keep talking over the graph; it's still the same flow                                          |
| A check is red that shouldn't be  | Formatting (lint) after a hand edit of `banner.json`             | Click `lint`, read the file name. `npm run format` fixes it. Or use a fallback branch          |
| Anything else                     |                                                                  | Show the last green pipeline and the saved red ones. Don't live-debug                          |
