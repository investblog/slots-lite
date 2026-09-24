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

## Addendum — 2026-09-24: M1, decided on the prototype by the user

Seven brands × both themes (the spintax triad, single blue `#1d4ed8`, terracotta `#d97706`, green
`#2f9e44`, violet `#7c3aed`, grey `#8a8a8a`, blue + terracotta) were rendered outside the library,
with stand-in marks on the reels at 360 px, dark on `background` and light on a white page. Three
things came back:

**1. `violet` is 325° ±20.** Measured, the 320° ±35 window captured royal blue (`#1d4ed8`, H 296 —
24° from the centre) and indigo (`#4338ca`, H 303 — 17°). On screen a blue brand drew a blue plum on a blue
cabinet, and "the brand's main colour becomes the machine" held only for the triad, whose blue is
at H 256. At 325° ±20 violet (`#7c3aed`, H 309), purple (`#9333ea`, 313), fuchsia (`#c026d3`,
324) and dark purples (`#86198f`, 325; `#581c87`, 314) are still in; both blues are out; crimson
(`#a91455`, H 3) and pink (`#db2777`, H 0) still go to `red`. The fallback hue moves with the centre.

**2. `gold` is never tinted.** With the ±15° lean an unclaimed gold turned orange for the blue and
violet brands (`#ce862d`, H 70) and olive for the green one (`#a19920`, H 100). Held at 85° it is
`#b99020` for all three. A captured gold is untouched — terracotta's orange bell is its own brand
colour, captured at 21°. A bell and a lemon in one gold read as two symbols by shape.

**3. Under `theme: 'light'` the cabinet defaults to `line`.** The filled body in the light theme is
`derive()`'s L 72 stop: contrast 1.98 against the paper for every brand, a large pastel field on a
white page, and lavender (`#aca7ff`) for a blue brand. Two filled alternatives were shown — the
L 52 stop and the brand colour as given — and the user chose the family's escape instead, as
cards-lite's back does. An explicit `style: 'flat'` still fills it.

The invariant held in all seven: paper reels, one black symbol, a red seven, a gold bell. Unchanged
by this addendum: `derive()`, so `stroke`, `background` and `halo` stay byte-identical to hexagons.
