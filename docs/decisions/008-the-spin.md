---
type: decision
status: accepted
date: 2026-09-23
tags: [motion]
project: slots-lite
---

# 008 — the spin: CSS, from-only, left to right

## Context

cards-lite's deal set the family's one-shot motion: CSS inside the SVG, animations that start
away and end at identity so the rest state is the static picture, and a reduced-motion gate.

## Decision

`motion: 'spin'` animates each reel's strip group from an offset of 8–14 symbols (seeded,
`reel:i:spin`) to identity, reels stopping left to right by per-reel seeded classes and delays, the
overshoot in the timing function. `speed: 0` returns the static bytes exactly. The strip scrolls
flat under the drum shade; at rest the cells are projected (ADR 003).

**Open until M4:** whether the flat-to-projected handover reads on screen. It is prototyped before
it is coded. The fallback, stated now so it is not invented later: draw each passing symbol with the
`sy` of the row it is passing.

## Consequences

- The extra symbols a spin needs are real markup — 8–14 `<use>` per reel — emitted only when
  motion is on.
- A permanent marquee chase is backlog: motion that never stops is what roulette's `init()` had to
  pause off screen, and v0.1 has no reason to pay for that.
