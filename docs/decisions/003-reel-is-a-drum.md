---
type: decision
status: accepted
date: 2026-09-23
tags: [geometry]
project: slots-lite
---

# 003 — the reel is a drum: one projection per cell, one gradient per window

## Context

A mechanical slot reads as a machine because its reels read as drums. Drawing a cylinder in SVG
invites perspective transforms, per-symbol distortion, or a 3D mesh — each expensive in bytes and
each a new kind of code.

## Decision

A visible cell is `(reel, θ)`. Its placement is `translate(x, R·sin θ) scale(1, cos θ)` and nothing
else; symbols are drawn upright on a flat 160-unit em. The drum's shading is one vertical gradient
laid over the whole window, emitted once. The window clips. The constants (`EM`, `CW`, `GAP`, `R`,
`STEP`, `VIEW`) are in the spec and are provisional until M2.

Handedness is fixed: reels run left to right, the payline is the centre row, the lever is on the
right.

## Consequences

- `rows: 1` is the same code with a narrower window, not a second layout.
- A flat video-slot grid would be the same code with `sy = 1` and no gradient. It was offered and
  not chosen for v0.1; it is in the backlog, not in the API.
- The spin cannot use the projection while it scrolls (a CSS translate does not re-project), which
  is why ADR 008 leaves the flat-scroll-to-projected-rest handover to be judged on screen.
