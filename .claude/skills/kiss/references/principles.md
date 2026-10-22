# Principles

The ideas behind Dune, the framework Lauren Tan built so agents could ship thousands of PRs a month to Grok Bot. Stack-agnostic. Nothing here names a tool. The assessment names the tool a given repo should use.

## 1. The contributor model

A coding agent optimizes for what fits in its context. It will, predictably:

1. copy the nearest working pattern;
2. edit the file already open;
3. choose the shortest path that compiles;
4. avoid deleting code whose callers are not visible;
5. follow the requested implementation even when it conflicts with a system invariant.

These are inputs to the design, not faults to prompt away. The codebase is the agent's memory. Whatever pattern exists will be copied, including workarounds, and each copy makes the next copy likelier. Keep the repo in a state where you would be happy for any file to be copied. Human friction is not a cost here. A repo this constrained is annoying for humans to write in, and agents absorb the annoyance.

Every rule and anti-pattern finding names which of the five behaviors produces the mistake. A guardrail or verification gap (sections 4 and 6) does not need one.

## 2. The five rules

Dune's rules, verbatim. Each has the behavior it addresses, the test question the assessment asks, and one example.

### Rule 1. The conventional path requires fewer decisions than a shortcut

Behavior 3. If the shortcut is easier, the shortcut wins.

Test: how many files must change to add one unit of product work, and how many of them are shared? A unit of product work is one merged change that adds user-visible behavior: a page, a command, an endpoint, a job. A shared file is one that two or more such units changed.

Violating: to add a page, create the view, then add a route to `routes.ts`, a key to `keys.ts`, a type to `types.ts`, a nav item to `nav.ts`, and a permission to `permissions.ts`. Six decisions, five shared files. An agent skips two and the page half-works.

Conforming: create `features/reports/entrypoint.*` and `features/reports/view.*`. The build discovers both. Two files, zero shared edits.

### Rule 2. Forbidden dependencies fail mechanically

Behaviors 1 and 3. A rule that lives only in a doc is unenforced.

Test: for each boundary the repo claims, what rejects a crossing, and does the error name what to use instead?

Violating: the agent instruction file says views do not call the API. `view.tsx` imports `api/client` and compiles.

Conforming: the same import fails with `features/* may not import api/*. Read data through client/reports.`

### Rule 3. Every durable value has one obvious writer

Behaviors 1 and 2. Three writers mean three sets of rules that drift apart.

Test: for each value that outlives a request or a run, name every writer. A spec restated in code (a template, rule text, a name list that another file also holds) is a durable value too, and one copy is the writer.

Violating: `view.tsx`, `nav.tsx`, and `url-sync.ts` each write `selectedReportId`.

Conforming: one module owns it and exposes `useSelectedReport()` and `selectReport(id)`. Everyone else calls the command.

### Rule 4. New product work adds isolated files rather than branches in shared roots

Behaviors 1 and 2. Two agents adding two features must never touch the same file.

Test: does any shared file grow when a unit of work is added?

Violating: `registry.ts` with one line per feature, which every feature edits.

Conforming: one folder per feature with a reserved filename. A build step collects them into a catalog that is derived, never hand-edited.

### Rule 5. Exceptions are narrow, explicit, and reviewed as architecture changes

Behavior 5. Every guard has an escape hatch, and the hatch has a cost.

Test: does every suppression, disabled rule, and workaround carry a reason, an issue link, an expiry, and a human's approval, on the offending line? An approval an agent wrote is a fail. An expect-error directive whose purpose is to assert that a type rejects a value is a test, not a suppression.

Format, in whatever comment syntax the language has: `kiss-allow(<finding id>): <why>. <issue link>. expires <date>. approved: <who>`. A third live exception on one rule means the rule or the design is wrong. Fix one of them.

## 3. Deriving the shape

Dune names its nouns for an Electron app: Feature, Entrypoint, Client, Host, and a typed edge between processes. Those names fit a UI with durable local state and an always-on backend. They do not fit a CLI or a library, and forcing them onto one is invention. What is universal is the four questions the nouns answer. Ask them of any repo:

1. **Where does code run, and can an agent tell from the open file?** Each process, deployable, package, or layer is a boundary. The folder, the filename, or a directive in the file (`"use client"`, `server-only`) must tell an agent which boundary the code is in and what it may import, and a wrong import must fail. Shared code is a leaf: it imports nothing above it.
2. **Which values outlive a request or a run, and who writes each one?** Stores, caches, tables, files on disk, config. One writer per value, behind a named interface. Where a value lives on two sides (a server row and a client cache), one side is authoritative and the other writes only through one named command.
3. **Where two boundaries talk, is there one typed contract both sides import or generate from?** A change to the contract on one side must fail the build on the other. Not applicable to a single-process repo.
4. **Which sets grow when someone contributes?** Routes, commands, jobs, registries, type mirrors, test lists. See open and closed sets below.

The answers are the repo's own noun table: noun, its one job at runtime, where it lives, what it may import, how it is found. A web app's table looks like Dune's. A CLI's table has commands, one state store, and one adapter per external tool. Write the table the repo needs, not the one Dune had. The table describes the target. Each row where today's repo differs is a finding that cites the row.

Two properties every table keeps:

- **Reserved filenames make a folder a complete contribution.** Dropping a folder with the right filenames into the tree is the whole change. The build discovers it, startup validates it, nothing shared is edited. For a CLI: one file per command group that exports a register function, collected by a glob, or by a hand list plus a check that every file in the folder is in it.
- **The side that owns durable state imports no presentation code.** Whatever accepts a write knows nothing about views or output formatting.

### Open sets are discovered, closed sets are unions

Two kinds of "list of things" exist.

- An **open set** has independent contributors who should never collide: features, routes, commands, jobs. Discover them from reserved filenames. No shared edit, validated at build or start.
- A **closed set** belongs to one owner and must be handled exhaustively: a feature's states, its commands, its event kinds. A discriminated union in one file, so the compiler forces every consumer to handle every variant. The shared edit is the point. Every runtime list or switch over a closed set fails the build when a variant is missing, through a `never` check or a `satisfies Record` check, never a default branch.

Ask: can two agents add to this set in parallel without talking? If yes, discover it. If adding a variant must break every consumer that forgot it, union it.

## 4. The ladder

When an agent makes a mistake, encode the correction at the strongest level that works. These are the four levels pstack's `correct` skill climbs, numbered the same way, so a KISS finding and a `correct` fix name the same number.

| Level | Mechanism | What happens when an agent skips it |
| --- | --- | --- |
| 1 | Architecture and ownership. One owner per value, one supported way per task, internals hidden so the wrong import fails, one source of truth, old ways deleted | It cannot be written |
| 2 | Types that make the bad state unwritable. If bad code still compiles, a compiler flag, lint, or build check whose error names the file, type, or function to use instead | The check goes red |
| 3 | A test of the behavior that fails when the behavior breaks. A project verification skill that drives the real app counts here | CI goes red |
| 4 | Docs, agent rules, skills, review | Nothing. Agents forget them and busy humans skip them |

Rules of use:

- A human catching the same thing in review is the signal that a level is missing. The fix is a check or a redesign, not another comment on the PR.
- Write the check before the cleanup. It stops the bleeding while the debt stays. If the pattern is already common, fail only on net-new instances.
- Prefer the stack's own strictness first. Strict compiler flags are level 2 for free, but turning them on in a live repo is a ratchet, not a mechanical change.
- Operator corrections during `apply`: a mistake class counts once it has happened twice. Record the first, act on the second. Assessment findings are already evidence of a pattern and do not wait for a second instance.

## 5. Anti-patterns

Things agents are reliably bad at. Each has a stable id that findings cite. The replacement is a shape, not a tool. The assessment names the tool for the repo in hand. When counting, a hit that is the replacement pattern itself (a cast right after a runtime check, an expect-error that asserts rejection, polling a vendor with backoff) is sanctioned; say how you decided.

| Id | Pattern | Behavior | Replacement |
| --- | --- | --- | --- |
| `comments-as-bandaids` | A comment that justifies a workaround, or cites review feedback as the reason the code is shaped this way. A constraint the code cannot show may stay. A reference to a past PR or bug alone moves to the commit message | 5 | A better name, a type, a test, or an issue link in the commit. Enforced by a lint that allows license headers, public API docs, and `kiss-allow` lines, with `no-comments` on top for judgment |
| `hand-edited-registry` | A list, switch, or registry file that grows per feature | 1 | Discovery for open sets, a union for closed sets |
| `cross-boundary-import` | An import across a process or layer boundary the repo claims | 3 | Shared code, or the typed contract between sides |
| `raw-transport` | HTTP, RPC, or subprocess calls scattered outside one adapter | 3 | One adapter per external system, behind named functions |
| `second-writer` | A durable value written from more than one module | 2 | The owner's named command |
| `god-file` | A file past the size budget (400 lines unless the repo sets its own; tests count) that several units of work edit or that no agent reads fully | 2 | A split along the repo's nouns, behind one writer if the file was one |
| `timer-as-sync` | A sleep or timer used to wait for state the code could observe | 3 | Explicit events, readiness checks, request keys |
| `type-escape-hatch` | `any`, double casts, `type: ignore`, untyped contracts | 3 | A real type, a branded id, a parse at the boundary |
| `suppression-without-reason` | A disabled rule or suppression with no reason, issue link, expiry, or approval | 3 | Fix the code, or a Rule 5 exception |
| `copy-and-modify` | `thing_v2`, `thing-new`, a parallel old and new path, a helper pasted into several files | 4 | Migrate callers, then delete the old copy in the same wave |
| `tautological-test` | A test that would still pass if every function it calls returned nothing: no assertion on a literal result, only mock-call assertions, a constant restated, a fixture asserting itself | 3 | A test that calls the public surface and asserts a literal result |

Dune also bans React's `useEffect` and fails CI on it. That ban belongs in a web repo's rule table, not in this list.

## 6. Verification

Guardrails prove the code is shaped right. Verification proves it works. Every serious project ships a verification skill: a CLI that launches the real app, drives it the way a user would, and captures evidence, plus a feature map that says what exists and how a user reaches it. Deterministic work lives in the CLI so no agent rebuilds it per session. The map is kept current by an automation, not by memory.

Drift is an entrypoint (a route, a command, a job) with no map entry, or a map entry whose route, selector, or command no longer exists. Drift is a finding. The fix is pstack's `create-verification-skill` when no skill exists and `maintain-verification-skill` when one does. Both count as level 3.
