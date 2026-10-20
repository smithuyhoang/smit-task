---
name: task-ship
description: Ship a smit-tasks task after every repo is committed locally — rebase on the latest default branch, re-run tests, adversarial review in a fresh context, browser smoke with screenshots/video (when the project supports it), stop on any reviewer finding until the user has each one fixed or waived, rule-based risk rating, then push and open one PR per repo (ready for review, not Draft) with the risk table and evidence. Only when the user explicitly asks to ship. Never merges.
argument-hint: "[<repo>...]  (default: every repo in the task's worktree table)"
---

# /task-ship

Run in the task session (`smit-tasks/<task>/`). Talk to the user in Vietnamese; PR body in Vietnamese, commits in English.
Only when the user asked for it in this turn ("ship", "mở PR"…). Never run on your own after committing.

`ROOT` = smit-tasks dir · `TASK` = `./TASK.md` · `PROJECT` = `$(cat .project)` · `MAP` = `$ROOT/projects/$PROJECT/REPOS.md`.
Per repo `WT` = the worktree path in TASK's table · `NWO` = `gh repo view "$(git -C WT remote get-url origin)" --json nameWithOwner -q .nameWithOwner` (the task dir sits inside the smit-tasks repo, so every `gh pr` call needs `--repo NWO` after the subcommand, never `gh -R`, or the ask rules in `.claude/settings.json` stop matching) · `BASE` = `$(git -C WT symbolic-ref --short refs/remotes/origin/HEAD)` (e.g. `origin/main`).
`OUT` = `./ship/<repo>/run-<n>/` in the task dir (outside the worktree, so nothing gets committed): `findings.json`, `resolved.json`, `risk.json`, `pr-body.md`. `n` = 1 + the number of existing `./ship/<repo>/run-*` dirs, so a repeat ship (after PR feedback or new commits) never mixes with an earlier one. Round counters and the 3-round cap restart in every run. Files sitting directly in `./ship/<repo>/` come from before this layout: leave them alone.
`PRIOR` = every `./ship/<repo>/run-*/resolved.json` of earlier runs (waivers and fixes the user already decided).
Run steps 1–7 for **every** repo before step 8 for any: no repo is pushed while another still has open findings.
Update TASK after every step (status column + one `## Nhật ký` line).

## 0. Preconditions (per WT, stop on failure)
- `git -C WT status --porcelain` empty → else stop, ask the user to commit first.
- Branch is not the default branch and has ≥1 commit ahead of `BASE`.
- `gh auth status` ok; `origin` remote exists.
- `gh pr list --repo NWO --head <branch> --state all --json url,state` → `PR_STATE` (prefer an OPEN PR when several are listed): none = first ship; `OPEN` = repeat ship (step 8 updates that PR instead of creating one); `MERGED`/`CLOSED` → stop and ask the user, never open a second PR on a finished branch.
- Ask the user once (AskUserQuestion) to confirm the repo list before step 2 — this is the only question unless a step below says otherwise.

## 1. Intent
`contract.md` in the task dir → its Goal + the section for this repo. Otherwise `git -C WT log --format='%s%n%b' BASE..HEAD`. Only what must be true when done — never the author's reasoning or transcripts.

## 2. Rebase
`git -C WT fetch origin` → `git -C WT rebase BASE`. Conflict → `git -C WT rebase --abort`, stop, show the conflicting files. Never resolve conflicts yourself.

## 3. Tests (after rebase)
Repo convention (`CLAUDE.md` / `repos/<repo>.md`, else `package.json` scripts): test script, plain-assert `tests/*.test.js` via `node`, then lint, type check and build for every one the repo defines. No tests → record "repo không có test"; a check the repo does not define → record "không có <lint|type|build>", never invent a command. Any failure → stop, no PR. Never build into a tracked output directory the map marks as do-not-touch (e.g. committed build output); if the only build writes there, skip it and record why.

## 4. Adversarial review (fresh context)
`Agent(subagent_type: "task-review")` per WT with ONLY:
```
intent: <step 1>
cwd: <WT>
base: <BASE>
map: <MAP>
```
Save its JSON block to `OUT/review-round-<n>.json` (n = 1 on the first pass, +1 for every re-review in step 5).
Round 2 and later: set `base` to the sha of HEAD taken before the step 5 fix commits, so the reviewer only sees what the fixes changed.

Security pass, same inputs, in parallel with the review agent. Repo type comes from the "Loại" of the repo in MAP / `repos/<repo>.md`:
- BE, worker, DB-migration, shared library: always run it (permission checks live inside service files whose names say nothing).
- FE and anything else: run it only if `$ROOT/bin/task-risk WT BASE --project $PROJECT` (no `--findings`) is not `low`, or `git -C WT diff --name-only BASE...HEAD | $ROOT/bin/task-sensitive` exits 0, or the added lines contain a raw-HTML/eval sink: `git -C WT diff -U0 BASE...HEAD | grep -v '^+++' | grep -E '^\+(.*(v-html|innerHTML|outerHTML|insertAdjacentHTML|document\.write|dangerouslySetInnerHTML|new Function\()|(.*[^A-Za-z0-9_])?eval\()'` finds a match. Otherwise record "security: bỏ qua (diff FE không chạm vùng nhạy cảm)".
`Agent(subagent_type: "task-security")` with the same four lines → `OUT/security-round-<n>.json`. It owns auth, permission, tenant, injection and secret findings. The two agents still overlap in practice; step 5 merges the duplicates.

## 5. Findings gate (no PR while a finding is open)
Open findings = every finding in each repo's latest `OUT/review-round-<n>.json` and latest `OUT/security-round-<n>.json` (older rounds are already answered), any severity, minus ones the user already waived (same file and same defect, see `OUT/resolved.json` and `PRIOR`). A repeat ship therefore never asks again about a defect the user waived in an earlier run.
Merge duplicates before asking: the two agents may report the same defect (e.g. review calls a dropped permission check an intent gap). Two findings are one when they point to the same file, lines within ~5 of each other, and the same root cause (same changed line or same missing check). Keep one entry with the higher severity, `"source": "review+security"`, and both scenarios joined. Different root causes on the same line stay separate; when unsure, keep them separate. Save the merged list as `OUT/open-round-<n>.json` and ask from it.
None open → write `OUT/findings.json` = `{"findings": [<every entry of OUT/resolved.json and PRIOR, waived and fixed>]}` and go to step 6. Fixed entries stay in it so step 7 still sees that a serious defect existed.
Otherwise stop before any push. TASK status `chờ Sếp: <n> lỗi review`. Ask the user with AskUserQuestion, one question per finding (up to 4 per call, repeat until all are answered). Each question shows repo, source (review | security | review+security), severity, `file:line`, summary and scenario, with exactly two options:
- **AI tự sửa** — fix it in WT, smallest change, following the repo's patterns, plus a test when the repo has tests. Never change a contract item (method, path, field, column, i18n key); if the fix needs one, say so and ask again with only **Bỏ qua** or stopping the ship. Commit `git -C WT commit -m "fix: <summary>"` (new commit, never amend). A FE preview hook that blocks the commit → ask the user (see `CLAUDE.md` → "Luật"); never set `SKIP_PREVIEW=1` on your own. Append the finding to `OUT/resolved.json` with `"source": "review"|"security"|"review+security"`, `"resolution": "fixed"` and the commit sha.
- **Bỏ qua** — append it to `OUT/resolved.json` with its `"source"` and `"resolution": "waived"`. It goes in the PR marked as waived by the user and still counts in step 7.
After the answers: for every repo that got a fix, re-run step 3 then step 4 (a new `task-review` agent, same inputs; a new `task-security` agent too if it ran for that repo) and come back to this step. Loop until nothing is open, at most 3 review rounds per repo. If round 3 or any later round still leaves findings open, stop and ask (AskUserQuestion, showing rounds done and findings still open): **Thêm 1 vòng** or **Dừng ship**. Each extra round needs its own answer; never start round 4+ without one.

## 6. Smoke + evidence (only if MAP has a "Preview ảnh FE" section and this repo's diff touches UI files)
Pages: contract "Preview pages", else ask the user once for `<name>=<path>`.
Run the `smoke` command MAP gives → exit 0 = `ok`, 2 = `errors`, 1 = `skipped` (record stderr reason; never start servers or log in). Files land where MAP says; copy PNG/webm/`smoke.json` paths for step 8.

## 7. Risk
`$ROOT/bin/task-risk WT BASE --project $PROJECT --findings OUT/findings.json [--smoke ok|errors|skipped]` → `OUT/risk.json`. Never edit the level by judgment; if it looks wrong, report it as a rule to tune.

## 8. Push + PR
- `git -C WT push -u origin HEAD`; if the branch was pushed before and rebase rewrote it: `--force-with-lease`. Never push to the default branch.
- Evidence (step 6): `$ROOT/bin/task-push-evidence WT <files…>` → URLs.
- Fill `$ROOT/templates/pr-body.md` → `OUT/pr-body.md`, every section from files (risk.json, resolved.json, test output, smoke.json, evidence URLs), not memory.
- "Triển khai" section of the body: files under `migrations/` in the diff, plus where MAP says the run commands live (for smit-gate: the migrate repo's `CLAUDE.md`); never write a command from memory, the user runs migrations, never you. None → "Không có migration".
- `PR_STATE` none → `gh pr create --repo NWO --base <BASE without origin/> --head <branch> --title "$(git -C WT log --reverse --format=%s BASE..HEAD | head -1)" --body-file OUT/pr-body.md`. No `--reviewer`.
- `PR_STATE` OPEN → `gh pr edit <url> --body-file OUT/pr-body.md`; keep the title unless the user asks to change it.
- Several repos: create all PRs, then `gh pr edit <url> --body-file` each to fill "PR liên quan" with the others' URLs and merge order from MAP "Thứ tự deploy".

## 9. Report (Vietnamese)
Per repo: PR URL · risk level + reasons · findings fixed / waived by severity · review rounds · tests · smoke. Highest risk first. TASK: PR URL in Commit column, status `PR mở`.
Noise: `$ROOT/bin/task-noise OUT <task> <repo>` per repo → show `rounds`, `fixed`, `waived`, `noise_rate` for `review` and `security` separately, and append the JSON line to `$ROOT/ship-noise.jsonl` (local, untracked) so rates can be compared across tasks. Report only; never change the reviewer or any gate from one task's numbers.

## Never
Merge, enable auto-merge, open a Draft PR, add reviewers, push to the default branch, run migrations, start dev servers, log in, print `.env`, open a PR while a finding is open, fix or waive a finding the user did not choose, lower a risk level by judgment.
