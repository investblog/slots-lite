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

## Addendum — 2026-09-24: the handover, looked at

Prototyped as specified and frozen at seven moments (150 ms to 2.5 s) through the Web Animations
API; three of the frames were read (500 ms, 1250 ms, 2500 ms). The extras are drawn flat and the landing cells projected; at the speed the
strip travels (1340–2340 units in 1–1.8 s) the change of scale is not readable, and the landing is
the static picture exactly. The fallback — each extra with the `sy` of a row — was not needed. The
extras sit **below** the window and the group travels down, so the symbols move the way a real
reel's do. The overshoot of `cubic-bezier(.2,.7,.3,1.08)` peaks at 1.05% of the travel — the
curve's maximum is 1.0105, computed — so 14–25 units over N = 8–14 cells: a settle, not a bounce.
Under `rows: 1` the first extra showed 19 units inside the window at rest; the extras start lower
there. The live page went to the user at M4's gate; they moved on to M5 without a comment on the spin —
recorded as no objection, not as an explicit sign-off.

## Consequences

- The extra symbols a spin needs are real markup — 8–14 `<use>` per reel — emitted only when
  motion is on.
- A permanent marquee chase is backlog: motion that never stops is what roulette's `init()` had to
  pause off screen, and v0.1 has no reason to pay for that.
