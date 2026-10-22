# Assess

Produce `.kiss/assessment.md`. Read-only. Every finding has `path:line` evidence, or for an absence, the location searched. No fixes.

When the target is a folder inside a larger repository, say which one you assessed, put `.kiss/` at that folder's root, and scope git history to that path. When that history is a bulk import, widen to the git root and say so.

If `.kiss/assessment.md` already exists, read it first. The new report replaces it; git keeps the old one. Each finding carries a stable id, `<rule or anti-pattern id>:<path>`, so the new report can mark it new, unchanged, or resolved.

## Before the questions

Read `principles.md`. Then build the model the questions need:

- For a repo you can hold in context, read the tree, the package manifests, the CI config, and the agent instruction files. Pick the most recent unit of product work from git history and read its diff.
- For a subsystem you cannot judge from the tree, run the **how** skill on it. Its Where Things Live section is the start of the noun table.
- When a shape looks wrong but deliberate, run the **why** skill before calling it debt. A constraint the repo does not own goes under Leave alone, not Improve.
- For more than one package, or more than about twenty thousand lines, run the **swarm** skill: one read-only worker per package or side, each answering the full question list for its slice, one report back. Explain the cost and ask the operator first. Merge the noun tables yourself.

## Questions

Answer in order. Status is `pass`, `fail`, `partial`, `n/a (<the shape the question presumes>)`, or `unknown (<what you could not see>)`. One answer may yield several entries in the report.

**Shape** (principles.md section 3)

1. Where does code run, and can an agent tell from the open file which boundary it is in and what it may import? Does a wrong import fail?
2. Which values outlive a request or a run? For each, name every writer. Where a value lives on two sides, which side is authoritative?
3. Where two boundaries talk, is there one typed contract both sides import or generate from, so a change on one side fails the build on the other?
4. Which sets grow when someone contributes? For each, open or closed, and how it is populated today. For a closed set, does every runtime switch over it fail the build on a missing variant?

Write the noun table from these answers before going on. The table is the target. Each row where today differs becomes a finding.

**Rules** (principles.md section 2)

5. Rule 1. From git history, list the files the most recent unit of product work changed. Which were shared files? Is the blessed path the shortest one?
6. Rule 2. Which boundaries does the repo claim, in docs, folder names, or comments? Which are enforced mechanically, by what, and does the error name the owner?
7. Rule 3. From question 2, which values have more than one writer? Include specs restated in code.
8. Rule 4. From question 4, which open sets are hand-edited lists?
9. Rule 5. Every suppression, disabled rule, `TODO`, and workaround comment. Which carry a reason, an issue link, an expiry, and a human's approval? Expect-error directives that assert rejection are tests, not suppressions.

**Guardrails** (principles.md section 4)

10. What runs before merge, and is it one command or several? Formatter, linter, type checker, import guard, tests. What is missing, and what would each missing one catch in this repo? If CI lives outside the checkout, say so and answer `unknown`.
11. Type strictness: compiler flags, checker mode, which files they cover, and what they ignore.
12. For each anti-pattern id in principles.md section 5: present or absent, count, sanctioned hits excluded, enforced today or not.

**Verification** (principles.md section 6)

13. Is there a project verification skill? Look for `verify-*` under `.claude/skills/` or `.agents/skills/` at the project root. Does its feature map cover every entrypoint the repo has: routes, commands, jobs? Name any drift.

**Debt**

14. Files over the size budget, with line counts and, from git log, how many distinct units of work edited each. Use the repo's budget if it has one, else 400. Tests count.
15. Legacy paths, dead code, and copy-and-modify files an agent would copy. For dead code use an unused-export check or the compiler's unused flags; a grep for callers is the fallback and say so.

## Sorting the answers

Sort every answer. A passing answer may go under Already right. Any other answer goes under Improve or Leave alone, and one answer may produce entries in both.

**Improve** holds three kinds of finding.

- A rule or anti-pattern finding: one of the five contributor behaviors produces the mistake, the repo owns the code, and a fix exists at level 1, 2, or 3 of the ladder. One label per finding. When a rule and an id describe the same evidence, use the id and name the rule in the title.
- A guardrail gap from questions 10 or 11: a missing formatter, linter, type checker, import guard, or strict mode. The fix is level 2. No behavior needed.
- A verification gap from question 13: no skill, or drift. The fix is level 3. No behavior needed.

A redesign the operator has not asked for stays here with all fields and "needs a decision" after the title. `apply` skips it until the operator says yes.

Order Improve the way `apply` will land it: deletions first, then mechanical changes, then everything else by risk, then by effort. Risk is how likely an agent is to copy the pattern: `high` when it sits on the path every new unit of work takes, `medium` when it is in a module agents touch sometimes, `low` when it is isolated. Effort is `S` for one PR under an hour, `M` for one PR, `L` for several PRs.

**Leave alone** when any of these holds. Say which one.

- The question presumes a shape the repo does not have. The `n/a` answers land here with the presumed shape as the reason.
- Something stronger already enforces it. A doc rule that a type also makes impossible is fine as a doc.
- The cost exceeds the benefit. A single-writer module over the size budget whose every section is about one thing. A three-entry registry that has not grown in a year.
- An external constraint owns it: a vendor API, a platform, a file the framework requires, polling a service that offers no events.

**Already right** when the answer passes and agents are likely to copy it. Name it so the next agent protects it.

## Report shape

```markdown
# KISS assessment: <repo> <date>

## Shape
<Three to six lines: what runs where, which durable values exist and who writes them, how the sides talk, which sets grow per contribution.>

| Noun | Job | Lives at | May import | Found by |
| --- | --- | --- | --- | --- |

## Already right
- <what> (<path>). <Why it matters that agents copy it.>

## Improve
### <n>. <title> (<id>, <new | unchanged | resolved>)
Rule or anti-pattern: <rule 1 to 5, an id, guardrail gap, or verification gap>
Behavior: <1 to 5, or none for a gap>
Evidence:
- <path:line> <what>
Count: <number of hits, or 1>
Enforcement today: <none, or the tool>
Fix: <what> at level <1 to 3>. <Why a stronger level does not work.>
Risk: <high | medium | low>
Effort: <S | M | L>

## Leave alone
- <what> (<path>): <which reason above>

## Not checked
- Q<n>: <what you could not answer, and why>
```

Write it with every technical-writing layer except Diátaxis, then **unslop**. Keep it under 300 lines. A finding that needs a paragraph is two findings.
