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
