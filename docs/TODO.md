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
  Then, on the user's review: the seven replaced by a calligraphic one refitted from the user's
  Recraft generation, and the gem rebuilt after a second reference (alternating lit crown, tall
  pavilion), still procedural. **5731 B.**
  Found on the way: `c.defs += make()` lost every def a nested `add()` wrote (JS reads the left
  side first) — invisible in cards-lite, which never nested.
- [x] M3 — done 2026-09-24. The cabinet: one body path with a `flat`/`arch`/`crown` top, a
  marquee of dark glass with the lattice in gold and a ring of bulbs, a trim-framed lower panel,
  the tray, the lever. The lattice is cards-lite's back port (three tiles, one seeded pattern for
  both panels, `lattice: 'none'`). The M1 light-theme rule now reaches every cabinet part, drawn in
  a new `outline` role — the cabinet hue's middle stop, ≥ 2.4 on the page — because the body colour
  was nearly invisible as a rule on a dark page (M2). `rows: 1`. The spec's bezel notches were
  dropped: their geometry depends only on the reel count, so they would have been a constant
  drawing. 34 tests, the new ones seen red against ten mutations; one branch the mutations proved
  dead (the ball above the cabinet's top) was removed. Output measured: 5.8–8.7 KB raw for three
  reels. **7076 B.**
- [x] M4 — done 2026-09-24. Five results constructed from their names on their own `result:*`
  streams, checked by a decoder and a checker written longhand in `test/results.test.mjs`;
  `symbols` pins over them. The spin, prototyped first (ADR 008 addendum): extras below the window,
  the group travels down, reels stop left to right, reduced motion shows the rest state, speed 0 is
  the static bytes. `init()`; `slots.d.ts`, type-checked with its errors seen red. 47 tests, the new
  ones seen red against nineteen mutations. **7924 B; budget frozen at 8192.**
  Review follow-up: a surviving mutation had been read as a redundant motion stream and the stream
  removed — it was a missing test. Two spins differing only in `speed` shared every class name, so
  the later `<style>` timed both (cards-lite's finding 3 again). The stream is back, salted with
  `speed`. And `rows: 1` showed a sliver of its first extra at rest; the extras start lower.
- [x] M5 — done 2026-09-24. `test/verify.html`, 13 checks, ALL GREEN in Chromium, Firefox and
  WebKit, both motion modes; `npm run gate:browser -- --mutate` breaks the library fourteen ways
  and every check has been seen red. The first mutation run printed one uncaught mutation under a
  green verdict — the check was missing and was added — and the runner now fails on any uncaught
  mutation (seen red). `index.html`, looked at in a browser: symbols moved onto reel paper (the
  bar's plaque vanished on a dark page) and the sheets stopped splitting in two. CI, release and
  bootstrap-publish workflows on `actions/*@v7` (Node 24 runtimes) and Node 22/24; the package
  packed and installed into an empty project, both import styles. README, CHANGELOG, RELEASING.
- [ ] M6 — integration in a static site, then 0.1.0 on the user's go

## Outside v0.1

- A flat video-slot grid (`sy = 1`, no shade) — offered on 2026-09-23 and not chosen; ADR 003 says
  it is the same code.
- A permanent marquee chase (ADR 008).
- More classic symbols — each one an ADR 004 amendment.
- Multiple paylines.
