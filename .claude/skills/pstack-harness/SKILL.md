---
name: pstack-harness
description: Platform adapter for pstack on Claude Code and Codex. Read it when a pstack skill tells you to spawn a subagent, pick a model for a role, read the models file, find transcripts, ask a structured question, loop until a predicate holds, isolate parallel workers, push an event into a session from outside, or invoke another pstack skill.
---

# pstack harness

pstack was written for Cursor. This file maps every Cursor primitive the skills name onto Claude Code and Codex. Skills reference rows here by name in bold, as in "spawn per the harness **spawn** row". Read the row, apply it, move on.

## Detect the harness

- **Claude Code** when your tools include `Agent`, `Skill`, `AskUserQuestion`, and `TodoWrite`.
- **Codex** when your tools include `spawn_agent`, `wait_agent`, `request_user_input`, and `update_plan`.

When neither matches, say so and apply the closest row by hand.

## Detect the install

pstack installs two ways, and the way decides how its names are spelled.

- **Plugin** (`claude plugin install` or `codex plugin add`). This file lives under the plugin cache (`~/.claude/plugins/` or `~/.codex/plugins/`). On Claude Code every pstack skill and agent is namespaced: `/pstack:poteto-mode`, `subagent_type: "pstack:poteto-agent"`, `claude --agent pstack:poteto-agent`.
- **Copied** (`npx @jiroamato/pstack`). This file lives in a skills directory from the **project skills** or **user skills** row, and the agents sit in the matching `agents/` directory next to it. Names are bare on both harnesses: `/poteto-mode`, `subagent_type: "poteto-agent"`, `claude --agent poteto-agent`. On Codex the agents are already installed; `setup-pstack` only fills in their model lines.

Wherever a row below writes `pstack:name`, drop the `pstack:` prefix in a copied install. `../name/SKILL.md` relative to this file works in both.

## Rows

| Row | pstack text says | Claude Code | Codex |
|---|---|---|---|
| **skill** | `/name`, `$name`, or "the **name** skill" | `Skill` tool with `pstack:name`, or read `../name/SKILL.md` relative to this file | `$name`, or read `../name/SKILL.md` relative to this file |
| **spawn** | `Task`, "spawn a subagent" | `Agent` tool. Fields: `subagent_type`, `prompt`, `description`, `model`, `run_in_background: true` | `spawn_agent`. Fields: `agent_type`, `message`, `model`, `reasoning_effort`, `fork_context: false`. Spawns are asynchronous. Collect with `wait_agent`, steer with `send_input`, finish with `close_agent` |
| **default agent** | `generalPurpose`, `general-purpose` | `general-purpose` | `default` |
| **read-only** | `readonly: true` | `subagent_type: "Explore"`. It cannot write. It has no MCP tools | `agent_type: "explorer"`. Tell it not to write |
| **read-write** | `readonly: false`, "agent mode" | `general-purpose`. MCP tools stay available | `default`, or `worker` for implementation. MCP tools stay available |
| **poteto-agent** | `subagent_type: "poteto-agent"` | `subagent_type: "pstack:poteto-agent"` | `agent_type: "poteto-agent"` once `setup-pstack` has installed `~/.codex/agents/poteto-agent.toml`. Before that, `default` with "read the `poteto-mode` skill in full before any work" as the first line of the message |
| **comment-sicko** | `subagent_type: "comment-sicko"`, "Comment Sicko" | `subagent_type: "pstack:comment-sicko"` | `agent_type: "comment-sicko"` once installed by `setup-pstack`. Before that, `explorer` with the body of `codex/agents/comment-sicko.toml` as the message |
| **models file** | `~/.cursor/rules/pstack-models.mdc`, "the rule" | `~/.pstack/models.md`, section `## claude-code` | `~/.pstack/models.md`, section `## codex` |
| **model** | `model: <slug>` | `model` takes `opus`, `sonnet`, `haiku`, `fable`, or a full model id. Effort is session-wide on Claude Code (`/effort`, `effortLevel` in settings, or `CLAUDE_CODE_EFFORT_LEVEL`), so a role value carries no effort | A role value is `<model>@<effort>`. Pass `model` and `reasoning_effort` separately. Effort is one of `low`, `medium`, `high`, `xhigh`, `max`. If the build rejects `model` or `reasoning_effort`, omit them and say so |
| **effort** | "reasoning level", "fast or standard speed", a `-fast` slug | Effort is session-wide (harness **model** row), so keep the role's value as written. There is no per-spawn speed. `/fast` is a session toggle | Change only the `@<effort>` part of the role value, between `low` and `max`, and pass it as `reasoning_effort`. There is no per-spawn speed |
| **inherit** | `inherit-parent`, `auto` | Omit `model` | Omit `model` and `reasoning_effort` |
| **tiers** | "the code tier default", "the judgment tier default" | code tier `opus`, judgment tier `fable` | code tier `gpt-6.1-sol@high`, judgment tier `gpt-6-astra@high` |
| **families** | "a different model family" | Every model is Claude. Treat `opus`, `sonnet`, `haiku`, and `fable` as the families | Every model is GPT. Treat `gpt-6-astra`, `gpt-6.1-sol`, and `gpt-6-luna` as the families |
| **background** | `run_in_background: true` | Pass it as written | Nothing to pass. Every spawn runs in the background |
| **isolation** | `environment: "cloud"`, `cloud_base_branch` | `isolation: "worktree"` on the `Agent` call. Name the base branch in the prompt | Create a `git worktree` per worker under the repo's worktree directory and name its path and base branch in the message. The Codex app's worktree option does the same for a whole thread |
| **ask** | `AskQuestion` | `AskUserQuestion` | `request_user_input` |
| **visualize** | `/visualize`, "a chart" | No built-in. Draw a Mermaid diagram, or render the chart to an SVG or PNG with a script and embed it by its absolute path | Same as Claude Code |
| **todo** | "open a todolist" | `TodoWrite` | `update_plan` |
| **channels** | "webhook routine", "Grok Bot webhook", "sender key" | Channels, a research preview. A channel is an MCP server in `.mcp.json` that declares the `claude/channel` capability and emits `notifications/claude/channel`. A custom one loads with `claude --dangerously-load-development-channels server:<name>`. An official plugin such as Telegram loads with `claude --channels plugin:telegram@claude-plugins-official`. The wake is a `<channel source="<name>">` tag. `/make-bot-ui` builds on it | None. Codex cannot push an event into a session. Use a ChatGPT Dot that watches a Slack channel, as `/make-bot-ui` describes |
| **loop** | `/loop`, `/loop until X`, `/loop 1h` | `/loop <interval> <prompt>` is built in. Inside a task, `ScheduleWakeup` for dynamic pacing or `CronCreate` for a fixed interval | No built-in loop. Inside the task, poll with a shell loop such as `until <check>; do sleep 300; done`, or spawn a `monitor` agent that watches the event and reports. For a schedule that outlives the session, the Codex app's Automations |
| **keep the mode on** | "Custom Mode", "Option+Enter" | Add one line to `CLAUDE.md`: "Apply the pstack:poteto-mode skill to any non-trivial task." Skill content also stays in context after one `/pstack:poteto-mode` call. Do not start the session as `poteto-agent`. It is a delegate, and the chat that receives `/poteto-mode` runs the playbook | Add one line to `AGENTS.md` or `~/.codex/AGENTS.md`: "Apply $poteto-mode to any non-trivial task." |
| **skill-creator** | `create-skill`, "Cursor's built-in for authoring SKILL.md" | `skill-creator` from the `anthropic-skills` plugin when installed. Otherwise run the checks in the Authoring a skill playbook by hand | `$skill-creator`, bundled with Codex |
| **project skills** | `.cursor/skills/<name>/` | `.claude/skills/<name>/SKILL.md` | `.agents/skills/<name>/SKILL.md` |
| **user skills** | `~/.cursor/skills/<name>/` | `~/.claude/skills/<name>/SKILL.md` | `~/.agents/skills/<name>/SKILL.md` |
| **transcripts** | `agent-transcripts/`, `~/.cursor/projects/<slug>/` | `~/.claude/projects/<slug>/<session-id>.jsonl`. `<slug>` is the absolute workspace path with every character other than a letter or digit turned into `-`, so `/Users/you/proj` becomes `-Users-you-proj` and `C:\Users\you\.t3\proj` becomes `C--Users-you--t3-proj`. A session run inside a git worktree sits under that worktree's slug. Subagent transcripts sit under `<slug>/<session-id>/subagents/`. Read only the slug for the active workspace | `~/.codex/sessions/YYYY/MM/DD/rollout-<timestamp>-<id>.jsonl`. The first line is `session_meta` and carries `cwd`. Keep only files whose `cwd` is the active workspace |
| **verification harness** | `control-ui`, `control-cli` | Load bundled `/pstack:control-ui` for web, IDE, or Electron, or `/pstack:control-cli` for CLI/TUI, per the **skill** row. Use the project's `verify-<app>` skill when present for app-specific launch commands, selectors, and feature coverage | Load bundled `$control-ui` for web, IDE, or Electron, or `$control-cli` for CLI/TUI, per the **skill** row. Use the project's `verify-<app>` skill when present for app-specific launch commands, selectors, and feature coverage |
| **deslop** | `/deslop` | Before each commit, load bundled `/pstack:deslop` per the **skill** row, then run `/pstack:no-comments` | Before each commit, load bundled `$deslop` per the **skill** row, then run `$no-comments` |
| **plugin root** | `~/.cursor/plugins/` | `${CLAUDE_PLUGIN_ROOT}` in skill text, `~/.claude/plugins/` on disk. In a copied install, the skills directory that holds this file | `~/.codex/plugins/cache/<marketplace>/pstack/<version>/`. In a copied install, the skills directory that holds this file |
| **review bots** | "Bugbot" | Any automated reviewer on the PR. Claude Code review, Copilot review, Bugbot. Same skeptical posture | Same, including Codex code review |
| **worktree dir** | `.cursor/worktrees/` | `.claude/worktrees/<name>` for `isolation: "worktree"` agents | `~/.codex/worktrees/` for app worktrees |

## Rules that hold on both

- An internal skill call means loading the target `SKILL.md` in full and following it, not merely naming it. Use the **skill** row; when invocation is unavailable or restricted to user commands, read the sibling file directly. This also works for delegates that cannot resolve a `$name` mention.
- There is no separate `control` skill. For web, IDE, and Electron driving, load [`control-ui`](../control-ui/SKILL.md); for CLI/TUI driving, load [`control-cli`](../control-cli/SKILL.md). Project `verify-<app>` skills specialize their recipes rather than replacing this routing. Native mobile and other surfaces need their own available driver.
- If the driver is already loaded in this agent's context, follow it without invoking it again. A project verification skill that names that driver uses the existing workflow, so routing does not recurse between the two skills.
- A skill that names a role line reads the models file first. A missing file or missing line means the default named in the skill. Read the section for the harness you detected and ignore the other.
- Spawn every parallel subagent in one message. On Codex, follow the spawns with one `wait_agent` for all of them.
- Never invent a model id. When a spawn rejects the configured model, retry on the tier default and say so in the reply.
- `Comment Sicko` and `poteto-agent` are agent definitions, not skills. Spawn them. Do not invoke them as skills.
