---
type: decision
status: accepted
date: 2026-09-23
tags: [size]
project: slots-lite
---

# 007 — size budget, provisional at M0

## Context

The family measures the minified, gzipped library with terser and Node's `gzipSync` (roulette's
ADR 009) and freezes a budget once the features are in.

## Decision

**Provisional budget 8192 B.** The forecast, from cards-lite's measured parts: the engine port
~3.1 KB (cards' M0 measured 3108 B), the lattices 633 B, six classic symbols ~0.6 KB, three
procedural symbols ~0.5 KB, the cabinet ~1.2 KB, the spin ~0.4 KB, `init()` and the results
~0.5 KB. cards-lite's M0 forecast came in 26% low, and the misses were the estimated parts, so
this number is expected to move. It is **frozen after M4** at the measured size + 2.5%, rounded up
to the next 128.

## Addendum — 2026-09-24: frozen at M4, at 8192 B

Measured after M4: **7885 B** (7924 after its review fixes). + 2.5% = 8122, rounded up to the
next 128: **8192 B** — the
provisional number, which the forecast set at M0 and the parts then met. The path there: M0 3347 ·
M1 3362 · M2 5731 (symbols, shade, drum, strips) · M3 7085 (cabinet, lattice) · M4 7885 (results,
spin, `init()`; 7924 with the review's fixes). The misses cancelled: the symbols and the drum came in at twice their forecast, the
spin and `init()` at under it. From here the budget is room for fixes, not features.

## Consequences

- From the freeze on, the budget is room for fixes, not features.
