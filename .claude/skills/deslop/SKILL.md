---
name: deslop
description: Remove AI-generated code slop from a branch or working diff before committing. Use for /deslop, code cleanup, unnecessary comments, redundant guards, type escape hatches, or patterns that do not fit the surrounding code.
disable-model-invocation: false
---

# Remove AI code slop

Check the diff and remove AI-generated slop introduced by the current work. This is code cleanup; use `unslop` for prose and `no-comments` for the independent comment review.

## Choose the diff

Use the base the user or PR names. Otherwise resolve the repository's default branch from its documentation or `refs/remotes/origin/HEAD`; do not assume it is called `main`. Compare from the merge base (`git diff <base>...HEAD`) and inspect staged and unstaged changes (`git diff --cached`, `git diff`). Read new untracked files that belong to the task too. If the base is unavailable locally, inspect the working diff and report the limited scope.

Read the surrounding code before editing. Clean the current task's changes; leave unrelated user edits alone.

## Focus areas

- Extra comments that are unnecessary or inconsistent with local style.
- Defensive checks or try/catch blocks that are abnormal for trusted code paths.
- Casts to `any` used only to bypass type issues.
- Deeply nested code that should be simplified with early returns.
- Dead compatibility paths, needless abstractions, and placeholder names.
- Other patterns inconsistent with the file and surrounding codebase.

## Finish

Keep behavior unchanged and prefer minimal edits over broad rewrites. Preserve validation at external boundaries and comments that explain a real constraint. If cleanup exposes a bug, handle it within the user's task or report it separately.

Inspect the resulting diff and run the checks appropriate to the code you changed. In a pstack commit workflow, follow with `no-comments` per the harness **deslop** row. Keep the final summary to 1-3 sentences, including any checks that could not run.
