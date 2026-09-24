---
type: decision
status: accepted
date: 2026-09-23
tags: [signature]
project: slots-lite
---

# 004 — the classic symbols as fixed paths: a counted no-signature exception

## Context

Roulette's ADR 005 forbids anything in the output that fingerprints the tool. A seven, a bar, a
bell and a cherry are fixed shapes: a seeded seven stops being a seven. cards-lite met the same
conflict with its rank glyphs and resolved it with a counted exception (its ADR 005): the rule
guards tool identity, not subject identity, and roulette itself ships fixed subject geometry.

## Decision

The classic set — `seven`, `bar`, `bell`, `cherry`, `lemon`, `plum` — is drawn from fixed `d`
values, **at most 8** (the six symbols, the cherry's stem as its own colour, the bar plaque's rule).
The exact number is fixed at M2 when the paths exist, and a test pins that the seed-invariant `d`
set of a machine is exactly that list. Double and triple bars are the same `d` placed with `<use>`.

Everything else carries no fixed path: the procedural symbols (`gem`, `star`, `coin`), the cabinet,
the lattice, the bulbs. The test requires them to contribute **zero** seed-invariant `d` values.
`classic: false` removes the whole exception.

The honest counter, as in cards-lite: a drawn seven is a design choice where a betting grid is
canonical, so the exception genuinely widens the surface roulette's ADR 005 protects. It is
accepted because the alternative — procedural symbols only — was offered to the user on
2026-09-23 and declined: the subject is not recognisable without the classics.

## Addendum — 2026-09-24: M2, the count is exactly 8

The paths exist: `seven`, `cherry`, `stem`, `bell`, `lemon`, `plum`, `plaque`, `word` — integers on
the 160-unit em. The bar's second path is the word BAR as a stroked skeleton (cards' rank-glyph
idiom), not the plaque rule first planned; the user rejected the plaque-and-stripe bar on the M1
prototype. `test/symbols.test.mjs` pins the per-symbol counts (1 · 2 · 1 · 2 · 1 · 1), the union of
8 over both styles and all bar counts, and zero fixed paths from `gem`, `star`, `coin` and the
cabinet. Each of those checks was seen red: a ninth path on the bell, a constant path on the gem
and one on the cabinet. Two things were changed so the scope stays honest: the payline became a
`<line>` (as a `<path>` it was a constant `d`), and the shade paints the same `d` again rather than
drawing a crescent of its own.

The user was shown third-party references in the same session and chose the library's own shapes;
nothing from them is shipped. One idea was taken, and it is an idiom, not geometry: the shade.

**The seven's provenance.** After the contact sheet the user generated a set of symbols with an AI
tool (Recraft) and chose its calligraphic seven over the library's straight one. Its silhouette —
one of the file's paths; the separate shade paths were dropped, since the library's own shade
replaces them — was refitted to the 160 em, rounded to integers and its degenerate curves written
as `H`/`V`/`L`: 198 characters. Nothing else from that file is shipped, including its C2PA
manifest, which the no-signature rule would forbid anyway. The count is unchanged. The rest of that
set was measured (+1239 B, double contours under `line`) and declined. The gem took its structure
from a second generated reference — table, alternating crown, tall pavilion — but stays procedural
and contributes no fixed path.

## Consequences

- Growing the classic set (watermelon, grapes, horseshoe) is an amendment to this ADR with a new
  count, never a quiet addition.
