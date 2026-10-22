---
name: reflect
description: Spawn three parallel review subagents over the active transcript, surface learnings, and route each to a concrete edit on an existing skill. Use when the user says reflect.
disable-model-invocation: true
---

# Reflect

Mine the current conversation for durable learnings, then route them into skill edits.

Invoke when the user says "reflect" or "/reflect". Skip when the conversation is trivial, off-topic, or already covered by an existing skill the parent followed correctly. One-offs are not learnings.

## 1. Locate the active transcript

Before fanning out, find this conversation's transcript in the active workspace's transcript directory (harness **transcripts** row) and stay inside it. Other workspaces' transcripts are private chats from unrelated projects.

```bash
# Claude Code
ls -t <transcripts>/*.jsonl <transcripts>/*/subagents/*.jsonl 2>/dev/null | head -10
# Codex
ls -t <transcripts>/*/*/*/rollout-*.jsonl 2>/dev/null | head -10
```

Claude Code keeps `<session-id>.jsonl` beside a `<session-id>/subagents/<child>.jsonl` tree. Codex keeps one `rollout-<timestamp>-<id>.jsonl` per session under date folders, and its first line carries the session's `cwd`. For each candidate, read the first JSONL line. Take the file whose `message.content[0].text` contains the conversation's opening user prompt. If none matches, pass a tight digest of the session instead.

## 2. Spawn three reviewers in parallel

One message, three spawn calls (harness **spawn** row), `subagent_type: general-purpose`, read-write (harness **read-write** row). Reviewers need MCP access to look up the tickets, chat threads, and observability traces the transcript references, and readonly strips MCPs.

Each reviewer and the synthesizer name a role line in the pstack models file (`~/.pstack/models.md`, harness **models file** row) and a default. Set `model` to that line's value, or to the default if the file or the line is missing. Leave `model` unset when the value is `auto` or `inherit-parent`. If the spawn rejects a model, use the default and say so. If it rejects the default, use the closest valid model of the same family from its error message. Pick each subagent's reasoning level for the job (harness **effort** row), per the Subagents section of the **poteto-mode** skill.

| Lens | Role line | Default `model` | Prompt template |
|---|---|---|---|
| Judgment | `reflect judgment, divergent, synthesizer` | the judgment tier default | `references/judgment-reviewer.md` |
| Tooling | `reflect tooling` | the code tier default | `references/tooling-reviewer.md` |
| Divergent | `reflect judgment, divergent, synthesizer` | the judgment tier default | `references/divergent-reviewer.md` |

Pass each template verbatim, substituting the transcript path or digest where marked. Reviewers return findings in their final report.

## 3. Synthesize

One spawn call, `subagent_type: general-purpose`, `model` from the `reflect judgment, divergent, synthesizer` line (default the judgment tier), read-write (harness **read-write** row). It spot-verifies citations through MCP, and readonly strips MCPs. Pass `references/synthesizer.md` verbatim, with each reviewer's full output inlined where marked. It returns an Accepted / Rejected / Backlog list.

## 4. Structural enforcement check

Move any Accepted item that a lint rule, script, metadata flag, or runtime check would enforce more reliably to Backlog. See the **encode-lessons-in-structure** principle skill.

## 5. Apply

Present the synthesizer's full Accepted / Rejected / Backlog output and wait for explicit approval before applying any Accepted edit. The user picks the subset and may redirect routings. Skill changes affect every future agent in the org. Do not auto-apply.

File each Backlog item to your team's devex or backlog tracker without waiting. Only the Accepted list waits for approval.

Follow each approved row's Routing exactly:

- Trivial existing-skill edit (a one-line bullet, a tightened sentence, a stale fact corrected): the parent does it directly.
- Substantive existing-skill edit (a new section, a new pattern table, more than ~10 lines): hand to `skill-creator` (harness **skill-creator** row) and run its draft / test / iterate loop.
- `tune description: <skill path>` (the skill exists but didn't trigger when it should have): hand to `skill-creator` and run its description-optimization loop.
- `new skill via skill-creator: <kebab-name>`: hand creation to `skill-creator`. Do not invent the shape ad hoc.

If your environment ships a SKILL.md validator, run it on every touched skill before declaring done.

## 6. Summarize for the user

Short list, no preamble:

- Edits applied: `<skill path>`. What changed, one line each.
- New skills created: `<skill path>`. One line each (rare).
- Backlog filed to the devex tracker: `<issue title>` (`<tags>`). One line each.
- Dropped: one line per rejected finding + reason from the synthesizer.
