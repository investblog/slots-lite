---
type: decision
status: accepted
date: 2026-09-23
tags: [process]
project: slots-lite
---

# 001 — adopt the family ADRs

## Context

slots-lite is the sixth library in the family and the third that emits an SVG string. Re-deriving
decisions the family already paid for would waste the payment.

## Decision

Adopted by reference from roulette-lite: **002** (an SVG string, not a canvas), **005** (no
signature in the output — extended here by ADR 004), **006** (motion through CSS inside the SVG),
**007** (module format: ES5 IIFE with a UMD tail), **008** (Node tests alongside a browser verify
page), **009**'s measurement method (terser in process + Node `gzipSync`), **010** (output
stability is a contract), **011**'s capture algorithm.

From cards-lite, the direct parent: **005**'s counted-exception argument, **006**'s tint and
paper/ink formulas, **007**'s rule that layout produces placements and painting never learns the
layout, **008**'s port of the three family lattices, **010** (presets are data), and the M5 rule
that a check is trusted only after it has been seen red.

From further up the family: contract-first, auto-palette from `brand` in CIE LCh, the minified file
is generated and never committed, `author: 301st`, OIDC trusted publishing after a one-time token
bootstrap, and "gzip beats clever — trim only by measurement".

ESLint 10 is no longer a divergence: cards-lite piloted it for the family.

**One deliberate divergence from cards-lite:** the field colours (`stroke`, `background`, `halo`)
are derived from the **whole brand**, as `Hexagons.palette(brand)` derives them, not from the
leftover colour that paints the cabinet (cards-lite derives them from its back's colour). The two
agree for every single-colour brand, which is all the parity fixture covers, so cards-lite's test
cannot see the difference; for a multi-colour brand whose first colour is captured, only this
form matches the sibling.

## Consequences

- Where this project extends an inherited decision it does so in its own numbered ADR and cites
  the parent rather than editing it.
