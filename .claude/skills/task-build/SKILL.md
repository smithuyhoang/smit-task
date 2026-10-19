---
name: task-build
description: Run a multi-repo smit-tasks task end to end from one request — route to repos, write contract.md for one approval, create worktrees, dispatch task-db/task-be/task-fe, task-verify, code review, then commit locally. Use when the user types /task-build "<request>".
argument-hint: "<task request>"
---

# /task-build

Entry point for the task flow. The flow itself lives in smit-tasks `CLAUDE.md` → "Khi được giao việc" (single source of truth); do not restate or change it here. Talk to the user in Vietnamese.

## 1. Task context
- Current dir is `smit-tasks/<task>/` (has `TASK.md` + `.project`) → use it.
- Current dir is the smit-tasks root → follow `CLAUDE.md` → "Khi được giao việc" for the root case: inside an Orca card (`ORCA_WORKSPACE_ID=folder:<id>`) reuse the task bound to that card or run `smit-task new <task> [project] --card`; otherwise `smit-task new <task> [project]` and tell the user to open the new card.
- Anywhere else → stop, tell the user to run it from smit-tasks or a task dir.
- `TASK.md` already has a request and a status other than `mới tạo` → it is an ongoing task: read it and continue from where it stopped instead of starting over. Ask the user if the new request conflicts with it.

## 2. Run the flow
Follow `CLAUDE.md` → "Khi được giao việc" steps 1–11 with `$ARGUMENTS` as the request, including "Không biết sửa ở đâu → DỪNG" and the rules section.
Empty `$ARGUMENTS` → ask the user for the request first.

## 3. After commit
Report as step 11 says, then mention `/task-ship` to open PRs. Do not run it unless the user asks.
