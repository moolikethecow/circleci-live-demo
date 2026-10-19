# DEMO-MOO.md: on-stage runbook

**Audience:** new hires (sales, marketing, ops). **Length:** about 8 minutes of talking, with waits.
**The one idea:** "Every change gets tested before it can reach the live page. Good change: it ships. Bad change: it's stopped."

## How the pieces fit

| Thing | What it is |
|---|---|
| `banner.json` | The only file you edit on stage: headline, subline, colors |
| `test/banner.test.js` | Plain-English checks, e.g. headline must be 60 characters or fewer |
| `.circleci/config.yml` | `test` then `deploy`. Deploy **requires** test, so red means no deploy |
| Page footer | `Build #<number> · commit <sha> · deployed <time>`. Proof the page came from this run |

Branches: `main` is the safe baseline. `demo-moo-base` is your live-typing branch (it deploys). `demo-moo-good-change` and `demo-moo-bad-change` are the fallbacks.
The pipeline deploys from `main` and any `demo-moo-*` branch. Every other branch only runs tests.

## Pre-flight (do all of this tonight, and 15 minutes before)

- [ ] Live URL opens: **`https://<your-project>.vercel.app`** (use this stable URL, not the long per-deploy URL, which can be login-protected).
- [ ] Last pipeline on `demo-moo-base` is green. Footer shows a real build number, not `#local`.
- [ ] Tabs open: live page, CircleCI pipeline list, `banner.json` on GitHub, your editor on `demo-moo-base`.
- [ ] Terminal in the repo: `git switch demo-moo-base && git pull`
- [ ] Font size up in editor and terminal. Phone on silent.
- [ ] Do one full rehearsal of steps 1 and 2 so the timings below are real for you.

## Expected timings

These are estimates until you rehearse. Replace them with what you actually see.

| Step | What you'll see | Typical wait |
|---|---|---|
| Push → pipeline appears | New pipeline at the top of the list | 5 to 15 s |
| `test` job | Container starts, 3 checks run | 15 to 30 s |
| `deploy` job | Build page, deploy to Vercel | 40 to 70 s |
| Live page updates | Refresh shows new text and build number | right after `deploy` is green |
| **Happy path, push to refresh** | | **about 1.5 to 2 min** |
| **Red path, push to red** | `test` fails, `deploy` never starts | **about 30 s** |

Talk-over while waiting is in each step below.

## 1. Happy path: change the banner, watch it go live (about 2 min)

1. Show the live page. Point at the footer: "See this build number? Remember it."
2. Open `banner.json`. Edit **one value**, for example:
   ```json
   "headline": "Welcome to CircleCI, October 2026 cohort: let's ship!"
   ```
3. Commit and push:
   ```bash
   git commit -am "Update banner headline" && git push
   ```
4. Switch to the pipeline list. Click the new pipeline.

**Say while it runs:** "I only changed some words. CircleCI sees my push, starts a fresh machine, and runs the tests first. Only if they pass does it go on to publish."

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
3. Open the pipeline. `test` goes **red**, `deploy` shows as not run.
4. Click `test`. Point at this exact line:

   > `Banner headline is 87 characters, the limit is 60`

   (Tests tab shows the same sentence.)
5. Refresh the live page. **Unchanged**: same text, same build number as before.

**Say:** "The tests said no, in plain English. Nothing was published. The live page never saw the bad version. No one had to catch it by eye."

6. Fix it: restore a short headline, push again, and show it going green. This is also your cleanup for the next step.

## 3. Optional: caught after deploy

This demo has no post-deploy health check, so there's no automatic "release marked Failed" or rollback button. Say so if asked, and use the banking app's Deploys view (read-only, in a tab) to show that story:
"Tests catch problems before deploy. CircleCI release validation catches them after deploy and can roll back. We use that on our larger banking demo."

## 4. Reset: leave everything clean

1. Put the live page back on the baseline:
   ```bash
   git switch main && git pull
   git commit --allow-empty -m "Reset demo page" && git push
   ```
   Wait for green and confirm the live page shows the original headline.
2. Reset your demo branch to match `main` (your own throwaway branch):
   ```bash
   git switch demo-moo-base && git reset --hard main && git push --force-with-lease
   ```
3. Check `banner.json` on `main` has the original values (headline "Welcome to CircleCI, October 2026 cohort", subline "Presented by Moo Olaniyan").

Nothing else is touched: no shared clusters, no shared repos, no shared contexts.

## Fallbacks if live typing goes sideways

Push a prepared branch. No editing needed:

```bash
git push origin demo-moo-good-change    # deploys a new headline, goes green
git push origin demo-moo-bad-change     # fails the headline test, does not deploy
```

If you've pushed them before and the push says "up to date", make an empty commit on that branch first:
`git switch demo-moo-bad-change && git commit --allow-empty -m "rerun" && git push`

## If it breaks on stage

| Symptom | Likely cause | What to do |
|---|---|---|
| Pipeline doesn't start | GitHub or CircleCI hiccup, or the repo isn't followed in CircleCI | Say "let's give it a second", refresh. Fall back to the last green pipeline and walk it |
| `deploy` fails but `test` is green | Vercel token or project IDs wrong or expired | Show the green `test`, then the failed `deploy` log. Fix after the session |
| Page doesn't change after green | Browser cache, or you're on the wrong URL | Hard refresh (Cmd+Shift+R), use the stable `.vercel.app` URL |
| Anything else | | Show the last green pipeline and the red one from rehearsal. Don't live-debug |
