---
name: task-ship
description: Ship a smit-tasks task after every repo is committed locally — rebase on the latest default branch, re-run tests, adversarial review in a fresh context, browser smoke with screenshots/video (when the project supports it), stop on any reviewer finding until the user has each one fixed or waived, rule-based risk rating, then push and open one PR per repo (ready for review, not Draft) with the risk table and evidence. Only when the user explicitly asks to ship. Never merges.
argument-hint: "[<repo>...]  (default: every repo in the task's worktree table)"
---

# /task-ship

Run in the task session (`smit-tasks/<task>/`). Talk to the user in Vietnamese; PR body in Vietnamese, commits in English.
Only when the user asked for it in this turn ("ship", "mở PR"…). Never run on your own after committing.

`ROOT` = smit-tasks dir · `TASK` = `./TASK.md` · `PROJECT` = `$(cat .project)` · `MAP` = `$ROOT/projects/$PROJECT/REPOS.md`.
Per repo `WT` = the worktree path in TASK's table · `BASE` = `$(git -C WT symbolic-ref --short refs/remotes/origin/HEAD)` (e.g. `origin/main`).
`OUT` = `./ship/<repo>/` in the task dir (outside the worktree, so nothing gets committed): `findings.json`, `resolved.json`, `risk.json`, `pr-body.md`.
Run steps 1–7 for **every** repo before step 8 for any: no repo is pushed while another still has open findings.
Update TASK after every step (status column + one `## Nhật ký` line).

## 0. Preconditions (per WT, stop on failure)
- `git -C WT status --porcelain` empty → else stop, ask the user to commit first.
- Branch is not the default branch and has ≥1 commit ahead of `BASE`.
- `gh auth status` ok; `origin` remote exists.
- Ask the user once (AskUserQuestion) to confirm the repo list before step 2 — this is the only question unless a step below says otherwise.

## 1. Intent
`contract.md` in the task dir → its Goal + the section for this repo. Otherwise `git -C WT log --format='%s%n%b' BASE..HEAD`. Only what must be true when done — never the author's reasoning or transcripts.

## 2. Rebase
`git -C WT fetch origin` → `git -C WT rebase BASE`. Conflict → `git -C WT rebase --abort`, stop, show the conflicting files. Never resolve conflicts yourself.

## 3. Tests (after rebase)
Repo convention (`CLAUDE.md` / `repos/<repo>.md`): test script, plain-assert `tests/*.test.js` via `node`, lint if present. No tests → record "repo không có test". Any failure → stop, no PR.

## 4. Adversarial review (fresh context)
`Agent(subagent_type: "task-review")` per WT with ONLY:
```
intent: <step 1>
cwd: <WT>
base: <BASE>
map: <MAP>
```
Save its JSON block to `OUT/review.json`.

## 5. Findings gate (no PR while a finding is open)
Open findings = every finding in any repo's `OUT/review.json`, any severity, minus ones the user already waived (same file and same defect, see `OUT/resolved.json`).
None open → write `OUT/findings.json` = `{"findings": [<waived entries from resolved.json>]}` and go to step 6.
Otherwise stop before any push. TASK status `chờ Sếp: <n> lỗi review`. Ask the user with AskUserQuestion, one question per finding (up to 4 per call, repeat until all are answered). Each question shows repo, severity, `file:line`, summary and scenario, with exactly two options:
- **AI tự sửa** — fix it in WT, smallest change, following the repo's patterns, plus a test when the repo has tests. Never change a contract item (method, path, field, column, i18n key); if the fix needs one, say so and ask again with only **Bỏ qua** or stopping the ship. Commit `git -C WT commit -m "fix: <summary>"` (new commit, never amend). Append the finding to `OUT/resolved.json` with `"resolution": "fixed"` and the commit sha.
- **Bỏ qua** — append it to `OUT/resolved.json` with `"resolution": "waived"`. It goes in the PR marked as waived by the user and still counts in step 7.
After the answers: for every repo that got a fix, re-run step 3 then step 4 (a new `task-review` agent, same inputs) and come back to this step. Loop until nothing is open.

## 6. Smoke + evidence (only if MAP has a "Preview ảnh FE" section and this repo's diff touches UI files)
Pages: contract "Preview pages", else ask the user once for `<name>=<path>`.
Run the `smoke` command MAP gives → exit 0 = `ok`, 2 = `errors`, 1 = `skipped` (record stderr reason; never start servers or log in). Files land where MAP says; copy PNG/webm/`smoke.json` paths for step 8.

## 7. Risk
`$ROOT/bin/task-risk WT BASE --project $PROJECT --findings OUT/findings.json [--smoke ok|errors|skipped]` → `OUT/risk.json`. Never edit the level by judgment; if it looks wrong, report it as a rule to tune.

## 8. Push + PR
- `git -C WT push -u origin HEAD`; if the branch was pushed before and rebase rewrote it: `--force-with-lease`. Never push to the default branch.
- Evidence (step 6): `$ROOT/bin/task-push-evidence WT <files…>` → URLs.
- Fill `$ROOT/templates/pr-body.md` → `OUT/pr-body.md`, every section from files (risk.json, resolved.json, test output, smoke.json, evidence URLs), not memory.
- `gh pr create --base <BASE without origin/> --head <branch> --title "$(git -C WT log --reverse --format=%s BASE..HEAD | head -1)" --body-file OUT/pr-body.md`. No `--reviewer`.
- Several repos: create all PRs, then `gh pr edit --body-file` each to fill "PR liên quan" with the others' URLs and merge order from MAP "Thứ tự deploy".

## 9. Report (Vietnamese)
Per repo: PR URL · risk level + reasons · findings fixed / waived by severity · tests · smoke. Highest risk first. TASK: PR URL in Commit column, status `PR mở`.

## Never
Merge, enable auto-merge, open a Draft PR, add reviewers, push to the default branch, run migrations, start dev servers, log in, print `.env`, open a PR while a finding is open, fix or waive a finding the user did not choose, lower a risk level by judgment.
