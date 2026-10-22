---
name: swarm
description: "Fan out N parallel workers, drain them, and return one report. Use for /swarm, 'swarm this', or parallel coverage, races, gauntlets, and exploration."
disable-model-invocation: true
---

# Swarm

## Start

Open a todolist with one entry per phase before launching anything.

1. Frame
2. Fan out
3. Aggregate
4. Report

## Phase A: Frame

1. State the done predicate and the artifact or report the swarm must return.
2. Choose the shape. Partition into slices, race N workers on identical briefs, or mix both. For a race or mixed shape, declare `first pass`, `rank all`, or `best-of` before spawning.
4. Pick the worker model from the `swarm workers` line in `~/.pstack/models.md` (harness **models file** row). If the file or that line is missing, use the code tier default (harness **tiers** row). For `auto` or `inherit-parent`, omit `model` so the workers run on the parent model. If the spawn rejects a model, use the default and say so. If it rejects the default, use the closest valid model of the same family from its error message. For a model race, name each arm's model up front. Pick each subagent's reasoning level for the job (harness **effort** row), per the Subagents section of the **poteto-mode** skill.
5. Give each worker its own writable output when it writes. When workers verify or measure commits, each brief names the exact SHAs. A measurement brief also names the method (sample count, what one sample is, order). The worker records both in its result.

## Phase B: Fan out

Spawn all N workers in one message (harness **spawn** row) with `subagent_type: general-purpose` (harness **default agent** row), isolation per the harness **isolation** row, `run_in_background: true`, and the step 4 model, left unset for `auto` or `inherit-parent`. Skip isolation only when the worker needs shared state on the user's machine, such as a running dev server.

When a worker must start from a non-default pushed branch, name that branch in its brief (harness **isolation** row).

Every brief stands alone. Include the goal, scope, exact slice or race arm, how to verify, and what to report. Reports use `PASS`, `ISSUES`, or `BLOCKED` with evidence. A worker that can prove a defect reports `ISSUES` and lists every issue it can prove, not only the first.

For a code-writing worker, include a call to load [`deslop`](../deslop/SKILL.md) before each commit and its final code handoff. For workers that drive web, IDE, or Electron behavior, include [`control-ui`](../control-ui/SKILL.md); for CLI/TUI driving, [`control-cli`](../control-cli/SKILL.md). Use the harness **skill** and **verification harness** rows, and include any project verification skill. Read-only workers do not clean or commit the target diff.

If a worker drops out, proceed with N-1 and note it.

## Phase C: Aggregate

Read the terminal results. Drop a result that does not record the SHAs and method its brief names, and respawn that worker once. After a second miss, record a gap. A gap does not count as a pass. For coverage, every required slice needs a result. For a race, apply the selection rule declared up front. Use first pass, rank all, or best-of. Do not paste raw worker dumps.

## Phase D: Report

Return one consolidated in-chat report with the table, issue one-liners, gaps or dropouts, and the race rule when used.
