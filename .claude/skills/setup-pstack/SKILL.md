---
name: setup-pstack
description: Configure which models pstack uses per role and at what reasoning budget, on Claude Code or Codex. Detects your available models, writes the pstack models file that overrides the skill defaults, and on Codex installs the poteto-agent and comment-sicko agents. Use for /setup-pstack, "configure pstack models", "pstack budget", or changing pstack's model choices.
---

# Setup pstack

Write `~/.pstack/models.md`, the file that sets pstack's model per role, with one section per harness. On Codex, also install pstack's two agents into `~/.codex/agents/`.

Read the **pstack-harness** skill first and detect the harness. Every step below says what differs.

## Steps

### 1. Detect available models

- **Claude Code.** The `Agent` tool's `model` field accepts `opus`, `sonnet`, `haiku`, `fable`, or a full model id. Those aliases are the dependable set. Prefer the aliases over full ids so the file survives model releases. The aliases `inherit-parent` and `auto` are always valid.
- **Codex.** Read `~/.codex/config.toml` for `model` and `model_reasoning_effort`, and read the model list the `spawn_agent` tool description names when it exposes one. If neither tells you which models the user can run, ask the user to paste the model ids from their `/model` picker. Never write a real model id you have not confirmed is available. The aliases `inherit-parent` and `auto` are always valid.

### 2. Load current state

The default role-to-model mapping is the file shape shown in step 5. If `~/.pstack/models.md` already exists, read it. Treat its `# budget` line and the role values in the section for the current harness as the current choices. Leave the other harness's section untouched. Otherwise start from the defaults. A line whose role is not in step 5, such as `how critics`, is from a retired role. Drop it.

### 3. Budget, map, and confirm

**(a) Ask for a budget.** Prefer the harness **ask** tool over free text. Offer these four options with these exact labels, and name the current budget when the file records one. With no file, say that `medium` matches the skill defaults.

- `unlimited — max reasoning`
- `large — xhigh reasoning`
- `medium — high reasoning`
- `small — medium reasoning`

**(b) Apply it.** Build the working table from the skill defaults, and on a re-run keep any role you changed by model, list, or alias (`inherit-parent`, `auto`).

- **Codex.** A role value is `<model>@<effort>`. `unlimited`, `large`, `medium`, and `small` set the effort of every real value, panel entries included, to `max`, `xhigh`, `high`, or `medium`. Every current Codex model accepts those four levels. `inherit-parent` and `auto` do not change. So `unlimited` turns `gpt-6-astra@high` into `gpt-6-astra@max`, and `small` turns `gpt-6.1-sol@high` into `gpt-6.1-sol@medium`.
- **Claude Code.** Effort is session-wide, not per spawn, so a role value is a bare model alias and the budget does not rewrite the roles. Instead, record the budget and tell the user the matching session setting: `/effort max`, `/effort xhigh`, `/effort high`, or `/effort medium` in an interactive session, or `"effortLevel"` in `~/.claude/settings.json` to make it stick. Do not write settings.json yourself.

**(c) Show the roles and confirm.** Show every role with its model, marking any real model not in the detected set as needing a choice. Also list each line step 2 dropped. Ask whether to accept as-is or change specific roles, offering the detected models plus `inherit-parent` and `auto` (both mean: this role runs on the parent chat model) as the options. Prefer the harness **ask** tool over free text. For panel roles (arena runners, architect runners, interrogate reviewers) the value is a list, and one subagent runs per entry, alias entries included, so the list length sets the count. `arena cross-judge pool` is also a list, but Arena selects one value from it whose model differs from the parent's when possible. `swarm workers` is the default model for every worker unless a race or comparison assigns another model per arm.

### 4. Validate

Every real model written must be in the detected set. `inherit-parent` and `auto` always pass. If a chosen real model is not available, stop and ask again.

### 5. Write the file

Write `~/.pstack/models.md`. Create the directory when it is missing. Rewrite the section for the current harness in full so re-runs stay idempotent, and keep the other section as it was, or write its defaults when the file is new. Shape:

```
# pstack model configuration. One line per role under each harness section. Delete a line to fall back to the skill default.
# `inherit-parent` or `auto` as a value: the role runs on the parent chat model (omit `model`). Alias entries in a panel list still count toward its fan-out.
# budget: medium (high)

## claude-code
# Values: opus, sonnet, haiku, fable, a full model id, or inherit-parent. Effort is session-wide on Claude Code (/effort).
feature, refactoring: opus
bug-fix: opus
perf-issue: opus
hillclimb: opus
judgment and prose: fable
hardest tasks: fable
how explorer: opus
how explainer: opus
why investigators: opus
why synthesizer: opus
reflect tooling: opus
reflect judgment, divergent, synthesizer: fable
arena runners: opus, sonnet
arena cross-judge pool: opus, sonnet, fable
swarm workers: sonnet
architect runners: opus
interrogate reviewers: opus, sonnet

## codex
# Values: <model>@<effort> or inherit-parent. Effort is low, medium, high, xhigh, or max.
feature, refactoring: gpt-6.1-sol@high
bug-fix: gpt-6.1-sol@high
perf-issue: gpt-6.1-sol@high
hillclimb: gpt-6.1-sol@high
judgment and prose: gpt-6-astra@high
hardest tasks: gpt-6-astra@high
how explorer: gpt-6.1-sol@high
how explainer: gpt-6.1-sol@high
why investigators: gpt-6.1-sol@high
why synthesizer: gpt-6-astra@high
reflect tooling: gpt-6.1-sol@high
reflect judgment, divergent, synthesizer: gpt-6-astra@high
arena runners: gpt-6-astra@high, gpt-6.1-sol@high
arena cross-judge pool: gpt-6-astra@high, gpt-6.1-sol@high
swarm workers: gpt-6.1-sol@high
architect runners: gpt-6-astra@high, gpt-6.1-sol@high
interrogate reviewers: gpt-6-astra@high, gpt-6.1-sol@high
```

### 6. Install the Codex agents (Codex only)

Codex plugins cannot ship agent definitions, so install pstack's two agents by hand. Which steps apply depends on the install (harness **Detect the install**):

1. **Plugin install** (`../../codex/agents/` exists relative to this file). Copy `../../codex/agents/poteto-agent.toml` and `../../codex/agents/comment-sicko.toml` to `~/.codex/agents/`. Create the directory when it is missing. Overwrite an existing copy of either file. Then replace `<setup-pstack fills this in>` on the `poteto-mode path:` line of `poteto-agent.toml` with the absolute path of `../poteto-mode/SKILL.md` relative to this file.
   **Copied install** (`npx @jiroamato/pstack`, no `../../codex/agents/`). The installer already placed both files in `.codex/agents/` (project) or `~/.codex/agents/` (global), next to the skills directory holding this file, with the path filled in. Edit them in place.
2. In each file, uncomment `model` and `model_reasoning_effort` and fill them from the `hardest tasks` line for `poteto-agent` and the `judgment and prose` line for `comment-sicko`. For `inherit-parent` or `auto`, delete both lines instead.
3. Say that the agents load in new Codex sessions.

On Claude Code, skip this step. The plugin ships `agents/poteto-agent.md` and `agents/comment-sicko.md`, available as `pstack:poteto-agent` and `pstack:comment-sicko`; a copied install puts the same two files in `.claude/agents/` or `~/.claude/agents/`, available as `poteto-agent` and `comment-sicko`.

### 7. Confirm

Tell the user the file was written and that it applies to new sessions. Re-running this skill updates it.

### 8. Offer a verification skill (optional)

Check whether the project has a way to drive the real app for proof (a `verify-*` skill, or an existing harness). If not, offer once: "want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with /create-verification-skill." On yes, invoke `/create-verification-skill` (harness **skill** row). On no, move on without pushing.

### 9. Offer a formal verification skill (optional)

Check whether the project already has a formal verification skill (a project skill that runs a model checker, a proof, or another verifier against the code). If not, offer once: "want a formal verification skill, so agents can prove a key property of your code holds in every case in scope, not only the cases tests reach? I can generate one with /create-formal-verification-skill." On yes, invoke `/create-formal-verification-skill` (harness **skill** row). On no, move on without pushing.
