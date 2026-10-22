---
name: kiss
description: "Assess a codebase against the principles behind Dune, the framework agents extend correctly by default, and report what to improve, in what order, and what to leave alone. Then apply the findings one PR at a time through pstack. Use for /kiss, 'assess this repo', 'is this repo agent-friendly', 'refactor toward KISS', or when agents keep making the same mistakes in a repo."
disable-model-invocation: true
---

# KISS

Keep It Simple, Stupid. A codebase is agent-friendly when a correct open-file edit preserves the whole app's invariants. KISS tells you how far a repo is from that and what to change first.

KISS assumes every contributor is an agent that sees only the files it opened, copies the nearest pattern, and takes the shortest path that compiles. The question behind every finding is the same: does this repo turn that behavior into good code, or into a mistake?

KISS lives in the same skills directory as pstack and links its skills as siblings (`../correct/SKILL.md`). Read [`pstack-harness`](../pstack-harness/SKILL.md) first for how to load a sibling skill (the **skill** row) and how to spawn a subagent. Where this file names a pstack skill, load its `SKILL.md` in full and follow it, with the one exception the `correct` row names.

## Modes

| Mode | When | Reads | Produces |
| --- | --- | --- | --- |
| `assess` | Any repo. The default. | `pstack-harness`, [`references/principles.md`](references/principles.md), [`references/assess.md`](references/assess.md) | `.kiss/assessment.md` |
| `apply` | After an assessment, on request | `pstack-harness`, the assessment, `references/principles.md` | One PR per finding, in the report's order |

`assess` is read-only. It never fixes. Re-running it regenerates the report and marks each finding new, unchanged, or resolved. The previous report is in git.

## Assess

Follow `references/assess.md`. In short: derive the repo's shape from four questions (what runs where, what outlives a run and who writes it, how two sides talk, what grows per contribution), answer the question list with file evidence, sort every answer, and write the report in the shape it gives. Every finding names the rule or anti-pattern it breaks, the contributor behavior that produces it, and the fix at the strongest level of the ladder that works.

The report has a **Leave alone** section. A principle that presumes a shape the repo does not have, something a stronger mechanism already enforces, a cost that exceeds the benefit, and a constraint the repo does not own all go there, with the reason. That section matters as much as the findings. It stops the next agent from churning. A redesign the operator has not asked for is not a Leave alone reason. It stays in Improve, marked "needs a decision", with its evidence.

pstack skills used while assessing:

| Need | Skill |
| --- | --- |
| Trace how a subsystem works, where a feature lives, who writes a value | [`how`](../how/SKILL.md) |
| Know why a shape exists before calling it debt | [`why`](../why/SKILL.md) |
| More than one package, or more than about twenty thousand lines | [`swarm`](../swarm/SKILL.md): one read-only worker per package or side, the same question list, one report. Explain the cost and ask the operator before spawning. |
| Write the report | [`technical-writing`](../technical-writing/SKILL.md), every layer except Diátaxis, then [`unslop`](../unslop/SKILL.md) |

## Apply

Only on request, only from an existing assessment. Small PRs on the main branch, the app shippable after each one. No big-bang branch. The report's Improve list is the plan and its order is the PR order.

0. **Confirm the list.** Show the operator the Improve list and ask which findings to land. Findings marked "needs a decision" wait for a yes. The rest proceed.
1. **Gate first, report-only.** One command, checked in, that runs what the repo already has in report mode plus one named check per Improve finding whose fix is level 2 or 3. Each check prints its count and nothing fails yet. The counts match the report's Count fields. This PR adds no cleanup.
2. **Delete debt.** The Improve findings that are deletions: copy-and-modify files, dead code, legacy paths. Agents copy what exists; remove it before they do (the **subtract-before-you-add** and **migrate-callers-then-delete-legacy-apis** principle skills). A deletion that migrates callers is a reshape and goes through the Refactoring playbook, pin first.
3. **Mechanical changes.** A formatter and one package manager. No behavior change. Strict compiler flags are not mechanical on a real repo. They are a ratcheted finding in step 4.
4. **One finding per PR, in report order.** Each PR does the cleanup and then flips that finding's check to blocking when its count is zero. If zero is far off, ratchet: fail on net-new instances above the baseline. Never flip with open violations and no exceptions. Never weaken a check to land a PR. Each finding's check was written in step 1, so no PR here adds a check.
5. **Re-assess.** Run `assess` again. The new report marks each finding new, unchanged, or resolved. New findings go through step 0.

After the last PR the repo needs a gardener. Delete debt as it appears. Keep one paved path per pattern. Lint against an anti-pattern the moment it shows up. Re-assess on a schedule and read the whole batch before fixing anything, because a single fix hides the pattern. Sample landed PRs. When a sample shows a shortcut, fix the environment, not the PR.

pstack skills used while applying:

| Step | Skill |
| --- | --- |
| A finding that is a repeated mistake class | [`correct`](../correct/SKILL.md). Skip its "Find the mistake classes" step. The finding is the class; pass it the evidence lines and the report's level. Follow "Fix each class at the highest level", "Fix and prove", and "Keep the rule table" for that one class. One class per PR. `correct` owns the rule table in the agent instruction file and drops a row once the mistake cannot happen. |
| A reshape: move, extract, split a god file, change ownership, migrate callers | the Refactoring playbook in [`poteto-mode`](../poteto-mode/SKILL.md). Pin the behavior, subtract, move in steps, prove equivalence. |
| A fix that crosses a module boundary | [`architect`](../architect/SKILL.md) before code |
| Before each PR | [`blast-radius`](../blast-radius/SKILL.md) for the one fact the change is safe because of |
| Each PR | the Opening a PR playbook in `poteto-mode`, which runs [`deslop`](../deslop/SKILL.md) and [`no-comments`](../no-comments/SKILL.md). Run [`interrogate`](../interrogate/SKILL.md) on the diff yourself; the playbook only runs it for subagents. |
| A program that spans days or many stacked PRs | the Multi-phase plan playbook in `poteto-mode`, seeded with the Improve list in report order, or [`figure-it-out`](../figure-it-out/SKILL.md) for a migration |
| No verification skill in the repo | [`create-verification-skill`](../create-verification-skill/SKILL.md) |
| A verification map that drifted | [`maintain-verification-skill`](../maintain-verification-skill/SKILL.md) |
| A run longer than one sitting | [`show-me-your-work`](../show-me-your-work/SKILL.md) for the decision trail |
| After the last PR | [`reflect`](../reflect/SKILL.md), to turn what the refactor taught into skill edits |

## Principle skills by rule

Read the leaf skill in full when a finding falls in its class. `references/principles.md` holds the rules. These hold the reasoning an agent applies while fixing. An anti-pattern id without a row uses the row of the rule it breaks.

| Rule or anti-pattern | Principle skills |
| --- | --- |
| Rule 1, fewest decisions | [**laziness-protocol**](../principle-laziness-protocol/SKILL.md), [**minimize-reader-load**](../principle-minimize-reader-load/SKILL.md) |
| Rule 2, forbidden dependencies fail | [**encode-lessons-in-structure**](../principle-encode-lessons-in-structure/SKILL.md) |
| Rule 3, one writer | [**separate-before-serializing-shared-state**](../principle-separate-before-serializing-shared-state/SKILL.md), [**model-the-domain**](../principle-model-the-domain/SKILL.md) |
| Rule 4, isolated files, not shared roots | [**separate-before-serializing-shared-state**](../principle-separate-before-serializing-shared-state/SKILL.md), [**model-the-domain**](../principle-model-the-domain/SKILL.md), [**type-system-discipline**](../principle-type-system-discipline/SKILL.md) for closed sets |
| Rule 5, narrow exceptions | [**encode-lessons-in-structure**](../principle-encode-lessons-in-structure/SKILL.md) |
| `raw-transport` | [**boundary-discipline**](../principle-boundary-discipline/SKILL.md) |
| `god-file` | [**minimize-reader-load**](../principle-minimize-reader-load/SKILL.md) |
| `type-escape-hatch` | [**type-system-discipline**](../principle-type-system-discipline/SKILL.md) |
| `tautological-test` | [**test-behavior-not-implementation**](../principle-test-behavior-not-implementation/SKILL.md) |
| `comments-as-bandaids` | [**fix-root-causes**](../principle-fix-root-causes/SKILL.md) |
| `copy-and-modify` | [**migrate-callers-then-delete-legacy-apis**](../principle-migrate-callers-then-delete-legacy-apis/SKILL.md) |
| Ordering the PRs | [**sequence-verifiable-units**](../principle-sequence-verifiable-units/SKILL.md), [**prove-it-works**](../principle-prove-it-works/SKILL.md) |

## Rules that hold in both modes

- Prose is the last resort. If a rule can be a type, a build failure, a lint, or a test, it is not a sentence in the agent instruction file. A rule that lives only in a doc is unenforced and the report says so.
- An exception lives on the offending line as `kiss-allow(<finding id>): <why>. <issue link>. expires <date>. approved: <who>`. The issue link is what lets it survive `no-comments`, whose reviewer keeps issue links that explain a constraint. If the reviewer still kills it, follow `no-comments` step 5: encode the constraint or report it open. Never restore the comment. An agent never approves its own exception. A third live exception on one rule means the rule or the design is wrong.
- Every operator correction that names a repo mistake is a signal. In `apply`, route it through `correct`. In `assess`, record it as a finding with evidence and a proposed level. A correction about scope goes under Not checked; one that names a deliberate design goes under Leave alone.
