---
type: decision
status: accepted
date: 2026-09-23
tags: [naming]
project: slots-lite
---

# 002 — package name `slots-lite`, global `Slots`

## Context

The family names by subject with a `-lite` suffix. The name must be free on npm before the first
publish, because npm cannot attach a trusted publisher to a package that does not exist.

## Decision

Package `slots-lite`, global `Slots`, repo `investblog/slots-lite`, source `slots.js`, generated
`slots.min.js`, types `slots.d.ts`. Checked 2026-09-23: free on npm (E404) and free as a GitHub
repo under `investblog`. Alternates, both also free that day: `slot-lite`, `reels-lite`.

## Consequences

- The name is checked again on the day of the bootstrap publish.

## Addendum — 2026-09-24: published as `@spintax/slots-lite`

Checked again on the publish day, `slots-lite` was still free (E404) — and the registry refused it
at the publish itself: `403 Forbidden — Package name too similar to existing package stats-lite;
try renaming your package to '@spintax/slots-lite'`. npm's typosquatting guard is applied only on
`PUT`, so "free" was never the whole question and no amount of checking beforehand shows it. The
user chose the scoped name npm suggested: the `spintax` scope is the account the siblings are
published from, and a scoped name cannot collide again. Only the npm name changes — the project
name, the repository `investblog/slots-lite`, the global `Slots` and the files stay. The siblings
stay unscoped; the next one checks its name by publishing, not by `npm view`.
