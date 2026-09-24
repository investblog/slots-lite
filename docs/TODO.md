---
type: note
status: active
tags: [backlog]
project: slots-lite
---

# Backlog

The single list of open work: the v0.1 milestones, and what is outside them or was decided along
the way. The milestones are the v0.1 plan; this list is its public index.

## v0.1

- [x] M0 — bootstrap, spec, ADRs 001–008, the engine port, `palette()`, the blank `machine()`
  (2026-09-23). 15 Node tests, each seen red against a deliberately broken library (nine
  mutations; one test could not fail and was fixed). **Measured 3347 B** against the provisional
  8192. Looked at in Chromium: 3/4/5 reels, both themes, both styles. Seen there: the flat
  cabinet in the light theme is a large bright field — the ADR 005 question for M1.
- [x] M1 — the role table prototyped outside the library and decided by the user (2026-09-24,
  ADR 005 addendum): `violet` narrowed to 325° ±20 so blue brands keep their blue for the cabinet;
  an unclaimed `gold` is never tinted; under `theme: 'light'` the cabinet defaults to `line`.
  18 tests; the three new ones seen red against four mutations. 3960 dark renders byte-identical
  to M0, and `stroke`/`background`/`halo` unmoved. **Measured 3362 B.**
- [x] M2 — done 2026-09-24. Six classic symbols from the M1 shapes, the bar reworked into a plaque
  with the word BAR; the lemon given tips and the plum made an egg after the first contact sheet
  read them as a potato and an apple. Three procedural ones, the flat-only shade (the user's pick
  from reference art, as an idiom), the drum projection and gradient, `symbol()`, and — pulled
  forward from M3 so M2 had a machine to look at — the 20-position strips on `reel:i:*`. ADR 004
  count **exactly 8**. 27 tests, the new ones seen red against ten mutations. **Measured 5491 B.**
  Found on the way: `c.defs += make()` lost every def a nested `add()` wrote (JS reads the left
  side first) — invisible in cards-lite, which never nested.
- [ ] M3 — cabinet, `rows: 1`; output size measured (the strips, weight table and `reels` 3–5
  appending landed at M2)
- [ ] M4 — results, the spin (prototyped first), `init()`, types, budget frozen
- [ ] M5 — browser gate with `--mutate`, playground, workflows on a current Node, README/CHANGELOG/RELEASING
- [ ] M6 — integration in a static site, then 0.1.0 on the user's go

## Outside v0.1

- A flat video-slot grid (`sy = 1`, no shade) — offered on 2026-09-23 and not chosen; ADR 003 says
  it is the same code.
- A permanent marquee chase (ADR 008).
- More classic symbols — each one an ADR 004 amendment.
- Multiple paylines.
