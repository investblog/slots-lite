---
type: decision
status: accepted
date: 2026-09-23
tags: [colour]
project: slots-lite
---

# 005 — a classic machine from the brand, by hue capture

## Context

A slot machine is read by a few colour constants — paper reels, a red seven, a gold bell, a black
bar — and by a large body that can carry the brand. cards-lite's capture (its ADR 006) already
does "brand colours take the role nearest their hue; the rest get their classic hue, tinted".

## Decision

Four captured roles: `red` 28° ±40, `gold` 85° ±25, `violet` 320° ±35, `green` 145° ±40.
Four derived roles, never a brand colour: `strip` (paper, both themes), `bar` (near-black), `ink`,
`trim` (chrome or brass). The **cabinet body** is the first brand colour left over after capture,
then the grey, then the first chromatic — the card back's cascade. With the default triad the blue
is left over and becomes the cabinet.

**Provisional.** This table is decided by the user at M1 on a prototype outside the library —
seven brands, both themes — and this ADR gets an addendum with what was measured, as cards-lite's
ADR 006 did.

## Consequences

- `roles()` is written at M0 from this table so that `palette()` exists; M1 may change every number
  in it, and nothing else in the library may depend on those numbers until then.
