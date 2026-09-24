# Changelog

From here on, any change to the output bytes for the same (seed, options) is a minor version with
a line here saying what changed (roulette-lite's ADR 010, adopted by ADR 001).

## 0.1.0 — 2026-09-24

First release.

- `Slots.machine(opts)` — a whole slot machine as an SVG string, in Node at build time or in the
  browser: the cabinet, the reel window and three to five reels. `reels` appends — under one
  seed, reels 0–2 of a five-reel machine are the three-reel machine's reels.
- The reel is a drum seen through a window (ADR 003): every visible cell is a reel index and an
  angle, placed by `y = R·sin θ`, `sy = cos θ`, and one gradient over the window shades the drum.
  Nothing else in the picture knows it is a cylinder. `rows: 1` narrows the window to the payline.
- Nine symbols. Six classic ones — seven, bar, bell, cherry, lemon, plum — with fixed paths, a
  counted and tested exception to no-signature: **exactly 8** seed-invariant `d` values (ADR 004).
  Three procedural ones — gem, star, coin — drawn fresh by the seed and keyed by name, so the gem
  is the same gem on every reel. `classic: false` draws only those three and emits no fixed path.
  Each symbol's path is written once into `<defs>` and placed with `<use>`.
- `Slots.symbol(opts)` — one symbol on its 160-unit em, an icon; `bars` sets a bar's 1–3 plaques.
- Under `flat` every symbol body carries a crescent of shade on its lower left — the same path
  painted a second time and masked, so it adds no path and shades a pinned colour the same way.
- A classic machine from any brand: the brand's hues are captured by the `red`, `gold`, `violet`
  and `green` roles, the unclaimed ones keep their classic hue tinted toward the brand — except
  gold, which is never tinted — and the first colour left over paints the cabinet (ADR 005). With
  the default spintax triad the blue is the cabinet. The reels are paper (`strip`) in both themes
  and the bar is the one black symbol.
- The cabinet: one body path with a `flat`, `arch` or `crown` top, a marquee of dark glass ringed
  by bulbs, a trim-framed lower panel, the tray and a lever (`lever: false` removes it). The
  marquee and the panel carry the family's trigon, hex or octagon lattice, ported from cards-lite
  (`lattice: 'none'` leaves them plain). The cabinet contributes no fixed path.
- Under `theme: 'light'` the cabinet defaults to `line`, drawn in a new `outline` role — the
  cabinet hue's middle stop — because a filled body over a white page was a pastel field that
  fought the page. An explicit `style: 'flat'` still fills it.
- Five named results as data, never an evaluator: `jackpot`, `three`, `bars`, `cherries`, `mixed`
  — each constructs what the payline shows, on streams of its own, so choosing one moves nothing
  else. `symbols` pins exact cells over any result. Nothing is scored, paid or weighted by odds
  (ADR 006).
- Optional one-shot CSS spin (`motion: 'spin'`): each reel's cells travel down from the strip's
  own next positions and the reels stop left to right. It animates `from` an offset with no `to`,
  so `prefers-reduced-motion: reduce` shows the machine at rest, and `speed: 0` returns the static
  bytes exactly (ADR 008). Every class and keyframe name is a seeded token salted with `speed`.
- Every role can be pinned with any CSS colour, `var()` included — the renderer never parses a pin.
- `Slots.palette(brand, { theme })` and `Slots.init(el, opts)` (browser); `slots.d.ts`.
- No signature in the output beyond the counted classic set: every id, class and keyframe is a
  seeded token, keyed by what is drawn, so two different machines under one seed on one page never
  share an id that means two things.
- 50 Node tests, a browser verify page of 13 checks green in Chromium, Firefox and WebKit and in
  both motion modes — every one of them seen to fail against a deliberately broken library — and
  7939 B min+gzip against an 8192 B budget (ADR 007).
