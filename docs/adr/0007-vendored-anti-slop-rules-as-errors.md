---
status: accepted
---

# Vendored anti-slop lint rules, all on as errors

Most of this codebase is written by coding agents, so the lint gate is stricter than usual. We vendor the anti-slop Oxlint plugin (https://github.com/dmmulroy/anti-slop) into `tools/oxlint/anti-slop` and enable all 20 generic rules and the 5 Effect rules as errors in every workspace. It is vendored because it has no npm package and is designed to be copied and owned.

Starting as errors, not warnings, is deliberate. An agent working a ticket ignores warnings, and loosening one rule later is cheaper than tightening twenty after code exists.

## Consequences

- `tools/oxlint/anti-slop` is our code. Upstream changes arrive only when someone copies them in.
- A rule may be turned off for one workspace in `oxlint.config.ts`, with a one-line comment giving the reason. Component props in `apps/web` are the expected first case, because `no-object-parameters` forbids them.
- Do not silence a rule with an inline disable comment to get a ticket through. Either fix the code or change the config with a reason.
- `apps/web` is also gated by React Doctor, which covers React-specific problems that anti-slop has no rules for.
