---
name: control-cli
description: Drive, inspect, and profile a local CLI or TUI with a repeatable terminal harness. Use for CLI UX checks, startup regressions, memory leaks, hangs, prompt flows, keyboard behavior, or terminal demos.
disable-model-invocation: true
---

# Control CLI

Exercise the real command with repeatable input and capture evidence. Reuse the project's `verify-<app>` skill or checked-in test/demo harness first. Otherwise use terminal tools already available in the session. This skill supplies the workflow; it does not install a terminal driver.

## Choose the driver

- For a non-interactive command, run it through Claude Code's `Bash` or Codex's shell tool and capture stdout, stderr, exit status, and resulting files.
- For prompts or a TUI, use a real PTY. On Codex, use `exec_command` with `tty: true` and `write_stdin` when those tools are available and support the host. Poll the returned session ID and send input to that same session.
- On Claude Code, prefer a repo-native PTY helper, Expect, or `tmux` through `Bash`. A background shell with piped stdin is not proof of terminal behavior.
- On Windows, use an available ConPTY driver such as a repo's `node-pty` or `pywinpty` harness, or the session's native PTY tool. Unix `pty`, Expect, and `tmux` recipes require a Unix host or WSL with the app running there too.
- If no suitable driver exists, identify the missing capability and report what remains unverified. Do not substitute piped input for a TTY-sensitive flow or silently add a project dependency.

## Harness loop

1. Identify the command, terminal size, and smallest reproducible workspace. Discover package scripts, e2e tests, expect scripts, PTY helpers, and demo recorders.
2. Launch an isolated session with the repo's required environment and disposable input/data. Record its session ID or PID, command, cwd, and terminal dimensions.
3. Capture the screen before interacting. Keep terminal escape sequences when layout matters; use the existing terminal renderer for a visual capture if available.
4. Send one action at a time: text, Enter, arrows, Escape, Ctrl-C, or resize. Use the driver's supported key encoding.
5. Wait for a concrete prompt or screen pattern with a deadline before the next action. A successful input write does not prove the command handled it.
6. Assert the user-visible result and side effects, including files, exit codes, or API responses. Save the transcript and any profile artifacts. Capture before/after runs for a bug fix.
7. Close sessions and processes this run created, including failed attempts. Preserve evidence outside disposable state and confirm it survives cleanup.

## tmux recipe

On a Unix host with `tmux`, adapt this to the current command and prompt:

```bash
SESSION="cli-harness-$(date +%s)-$$"
tmux new-session -d -s "$SESSION" -- <command-under-test>
trap 'tmux kill-session -t "$SESSION" 2>/dev/null || true' EXIT
tmux capture-pane -pt "$SESSION"
# Wait for the app's ready prompt with a bounded poll before sending input.
tmux send-keys -t "$SESSION" "help" Enter
# Wait for the expected result, then capture and save the transcript.
tmux capture-pane -pt "$SESSION"
```

Use a temporary directory from the host's temp API or environment, rather than assuming `/tmp`. Keep a one-off harness temporary unless the task calls for a reusable test. Do not hard-code paths from another repository.

## Profiling and demos

- Startup regression: compare baseline and treatment with the same machine, environment, command, and readiness condition.
- Slow operation: collect a CPU profile around the operation and compare top self-time functions.
- Memory leak: repeat the operation between heap snapshots; force GC if the runtime supports it and record whether you did.
- Hang: capture the screen, active handles/resources, and a stack or CPU sample before interrupting.
- Node or Bun inspector: use the runtime's supported inspector flag with a loopback address and an ephemeral port. Read the inspector URL from startup output and use available DevTools-compatible tooling.
- Terminal demo: use an existing recorder or an asciinema-compatible tool when the user asks. A recording supplements the assertions above.

Use deterministic waits rather than fixed sleeps. Keep credentials out of transcripts. Report the command, actions, observed result, evidence paths, and any unverified behavior.
