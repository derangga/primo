# Primo

A personal monitor for Indonesian staple food prices by province, built with Effect on Cloudflare.

## Bead ids stay in beads

Commit messages and code comments describe the change in words. A bead id (`primo-…`) appears only in `bd` commands and in conversation with the user.

- To leave a marker for unfinished work in code, describe the work itself. Record the file and line on the bead with `bd note`.
- Never write a bead id in a commit message, a code comment, or any file in this repository.

## Working a bead

1. **Read.** `bd show <id>`, then every document section and ADR the bead names. Done when you can say what each acceptance criterion will look like when it is met.
2. **Claim.** `bd update <id> --claim`.
3. **Design.** For Effect code, run the `design-thinking` skill and write the call graph into the conversation before any code. For interface code, read the matching sections of `DESIGN.UI.md` and the mockup markup.
4. **Build** the smallest change that meets every acceptance criterion.
5. **Observe every criterion.** Run it, request it, or screenshot it. A criterion you reasoned about but did not see is unmet.
6. **Check.** `bun run check` from the repository root passes. It formats, lints, type-checks, tests, and audits the React app.
7. **Record.** Put what you learned on the bead with `bd note`. When the bead tests an assumption, write the result into the "Still to verify" table of `DESIGN.md`. File work you discovered but did not do as a new bead with `--deps discovered-from:<id>`.
8. **Close** with `bd close <id> --reason "<what was observed>"` once every criterion is observed and the check passes. Otherwise leave it in progress with a note that says what remains.

Leave your changes uncommitted. The user reviews the working tree and commits.

Stop and ask the user when a bead says it needs them, or when a fallback from `DESIGN.md` or an ADR would have to be applied. A fallback changes the design, and that decision is theirs.

When a lint rule blocks you, fix the code. If the rule is wrong for a whole workspace, turn it off for that workspace in `oxlint.config.ts` with a one-line reason. Inline disable comments are not the way through.

## Where the decisions are

Read the one that covers your change before you edit.

- `DESIGN.md`: architecture, call graphs with their error handling, the API contract, and the Free plan budgets. Read before touching the backend, the contract, or how data reaches the browser.
- `DESIGN.UI.md`: the approved look and behaviour of every surface and state. Read before any interface work. Values come from `design/tokens.css`, never from memory.
- `docs/adr/`: choices that look wrong but are deliberate. Read before changing the transport, the chart or component library, the ingest's retries, indexes or upsert, the province count, the lint rules, or the infrastructure.
- `.FINDINGS.md`: the PIHPS endpoints, their response quirks, and measured limits. Read before working on ingestion.
