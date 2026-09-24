---
type: note
status: active
tags: [architecture, overview, spec]
project: slots-lite
---

# slots-lite — spec / dev source of truth

Docs for developers and agents. `index.html` will be the verification surface, `test/` the gate.
Contract-first: change the doc here **before** the code, then code.

**Status (2026-09-23): M0 done.** This spec, ADRs 001–008, the engine ported from
`cards-lite/cards.js` @ `8f377bc`, `palette()` and `machine()` drawing the blank machine; 15 Node
tests, each seen red; **measured 3347 B** against the provisional 8192; looked at in Chromium. The
repository is local and nothing is published: no GitHub repo, no npm package, version `0.0.0`.
Numbers marked *provisional* below are forecasts, not measurements, and each one names the
milestone that replaces it with a measurement. This line is kept true at every milestone.

## The pitch, in one paragraph

A slot machine drawn by code. One call returns an SVG string — in Node at build time or in the
browser — so a static site gets its hero art with no script on the page. Two knobs span the
variant space: **`seed`** spins the reels and shapes the cabinet, **`brand`** spins the colours
(one hex, the whole machine). The classic symbols — seven, bar, bell, cherry, lemon, plum — sit
beside three procedural ones — gem, star, coin — that the seed draws fresh. A result such as a
jackpot is a named preset that places symbols; nothing is ever scored. Two styles behind one knob,
`line` or `flat`, and an optional CSS spin that lands on the picture and stops for readers who
asked for less motion. Zero dependencies, a few KB.

## The load-bearing idea

A mechanical reel is a **drum seen through a window**. The eye reads it as a drum because the
symbols above and below the payline are foreshortened and darker, not because anything is drawn in
3D. So:

> **Every visible cell is a reel index and an angle. The angle alone gives its placement:
> `y = R·sin θ`, `sy = cos θ` — one `translate(x y) scale(1 sy)` per cell. The shading of the drum
> is one gradient over the window, drawn once.**

Nothing else in the picture knows it is looking at a cylinder. Symbols are drawn upright on a flat
em; the window clips; the gradient darkens the edges. That is the analogue of cards' "a spread
compiles to placements" and roulette's "`view: 'top'` is the same code with θ = 0": the whole
drum illusion is a two-number projection and one `<linearGradient>`.

### Machine space

Origin at the centre of the reel window (the centre of the payline), y down. Looked at on screen
at M2 and kept as they were: at 360 px wide the foreshortened rows read as a drum.

| Constant | Value | What |
|---|---|---|
| `EM` | 160 | the symbol em, square, origin at its centre |
| `CW` | 200 | reel width — the em plus 20 units of strip either side |
| `GAP` | 16 | the divider between reels |
| `R` | 260 | drum radius |
| `STEP` | 40° | the angle between neighbouring symbols on a reel |
| `VIEW` | ±60° | the window's half-angle for `rows: 3`; ±24° for `rows: 1` |

With these numbers the three rows sit at y = −167, 0, +167 with `sy` = 0.77, 1, 0.77, and the
window is `n·CW + (n−1)·GAP` wide by `2·R·sin 60° ≈ 450` tall. A symbol at the edge of the window
is clipped, which is correct: a real window shows parts of the neighbours.

### Anatomy of a machine

| Part | Geometry | Seeded? |
|---|---|---|
| Reel strip | `CW` wide, the window's height, paper (`strip`) in both themes | no |
| Symbol cell | the symbol at `translate(x, R sin θ) scale(1, cos θ)` | which symbol |
| Drum shade | one vertical gradient over the window: `ink` at α .55 → 0 → .55 | no |
| Payline | a `<line>` across the window at y = 0 | no |
| Bezel | the window's frame in `trim`, 24 wide | its radius |
| Cabinet body | one path around everything: sides a seeded margin out from the bezel, the top `flat`, `arch` (a curve rising 50–100) or `crown` (two art-deco steps) | margin, top, rise, radius |
| Marquee | an `ink` panel above the window carrying the lattice, ringed by `gold` bulbs | height, bulb pitch |
| Lower panel | a `trim`-framed panel below the window carrying the lattice in paper | height |
| Lattice | the family's trigon / hex / octagon tile (cards' back port, ADR 008 there), one `<pattern>` for both panels | kind, pitch, turn, phase, weight |
| Tray | a `trim` coin tray at the foot with an `ink` opening | depth |
| Lever | a `trim` plate and rod on the right, a `red` ball; `lever: false` removes it | length, angle, ball size |

All of it is built from the seeded numbers, so the cabinet contributes no fixed `d` (ADR 004). The
cabinet follows the **cabinet style**: `style` when it is given, otherwise `flat` in the dark theme
and `line` in the light one (M1). A `line` cabinet draws its body, panels and tray as rules in
`outline` — the cabinet hue's middle stop, which the family's `derive()` guarantees ≥ 2.5 against
the page — because the body colour itself was nearly invisible as a rule on a dark page (M2). The
reels, the symbols, the bulbs and the ball follow `style` only; they are small or paper.

`rows: 1` narrows the window to ±24° — one row, the payline — and the cabinet follows the window:
the lower panel goes, the lever shortens. Two machines on one page never share an id that means
two things: the id key carries every colour, the cabinet style and the lattice asked for.

## Symbols

Nine symbols in two kinds. Every symbol is drawn upright on the 160-unit em, painted by one
`paint()` idiom — `fill` when `flat`, `stroke` when `line` — so `line` costs no path data.

| Symbol | Kind | Role colour | Notes |
|---|---|---|---|
| `seven` | classic, fixed `d` | `red` | the jackpot symbol |
| `bar` | classic, fixed `d` | `bar` plaque, `strip` lettering | the plaque and the word BAR as one stroked skeleton (cards' rank-glyph idiom); single / double / triple are the same two `d` placed 1–3 times with `<use>` — no new path |
| `bell` | classic, fixed `d` | `gold` | |
| `cherry` | classic, fixed `d` | `red`, stem `green` | a pair on one stem, one `d` per colour |
| `lemon` | classic, fixed `d` | `gold` | |
| `plum` | classic, fixed `d` | `violet` | |
| `gem` | procedural | `gem` — the cabinet's hue, guarded on paper | a table, a crown of alternating triangles (every other one lit with paper under `flat`) and a tall pavilion to a point: 2–4 table facets, table width, crown height, depth |
| `star` | procedural | `gold` | 5–8 points, inner ratio 0.38–0.55 |
| `coin` | procedural | `gold` | a rim and 1–3 rings, optionally a lattice face |

**The classic set is a counted exception to no-signature** (ADR 004), the same move as cards-lite's
ADR 005: fixed subject geometry, counted, and pinned by a test that the seed-invariant `d` set is
exactly that list: **exactly 8** since M2 — seven, cherries, their stem, bell, lemon, plum, the bar's
plaque and its lettering. The payline is a `<line>` and the strips are `<rect>`s, so the cabinet
carries no `d` at all. A
procedural symbol's identity is keyed by its name (`sym:gem:facets`), so the gem is the same gem on
every reel under one seed, and it contributes **zero** seed-invariant `d` values — the test
requires that too. `classic: false` draws only the procedural three and emits no fixed path at all.

Each symbol `d` is emitted **once per picture** into `<defs>`, carrying no colour, and placed with
`<use>`, which paints it — cards' glyph idiom; a machine of fifteen visible cells carries at most
nine symbols' paths.

**The shade.** Under `flat` every symbol's body carries a crescent of shadow on its lower left, the
flat-illustration idiom: the same `d` painted a second time in `#000` at a low opacity, masked to
where the body is **not** covered by a copy of itself shifted up and right. It is a second painting
of an existing path, never a new one, so it adds nothing to the ADR 004 count; and it is an overlay,
not a derived colour, so a pinned role — which the renderer never parses — is shaded the same way.
A two-colour symbol shades its body only (the cherries, not the stem; the plaque, not the
lettering). Under `line` there is no fill to shade and no shade is drawn.

## Colour — a classic machine from the brand

The capture algorithm is cards-lite's ADR 006 (roulette's ADR 011 before it): chromatic brand
colours (LCh chroma ≥ 12) take the role nearest their hue, nearest pairs settle first, each colour
and each role at most once, ties broken by colour order then role order. An unclaimed role takes
its classic hue **tinted** toward the brand by at most 15° — except `gold`, which keeps 85°: tinted,
it turned orange beside a blue brand and olive beside a green one, and a bell stopped being gold.

| Role | Target hue | Window | Draws |
|---|---|---|---|
| `red` | 28° | ±40 | seven, cherries |
| `gold` | 85° | ±25 | bell, lemon, star, coin, bulbs |
| `violet` | 325° | ±20 | plum |
| `green` | 145° | ±40 | the cherry stem |

Derived, never a brand colour — the constants a machine is read by:

- `strip` — the reel paper, lch(96.5, min(C·0.08, 4), H), **both themes**. A reel is read as a
  light band before it is read as anything else, exactly as a card face is.
- `bar` — near-black, cards' `spade` formula: the bar plaque is the one black symbol.
- `ink` — the drum shade, the payline, the dividers.
- `trim` — metal: chrome for a grey brand, otherwise a brass from `gold`'s hue at lower chroma.
- `outline` — a `line` cabinet's rule: the cabinet colour's middle `derive()` stop, ≥ 2.5 against
  the page in both themes.
- `gem` — the procedural gem: the cabinet's hue at the suit lightness, guarded ≥ 3 against the
  paper. The cabinet colour itself cannot sit on a reel — in the light theme it is a pastel.

The **cabinet body** is the first brand colour left over after capture, then the grey, then the
first chromatic colour — the card back's cascade. With the default spintax triad the crimson is
captured by `red` and the gold by `gold`, so the **blue is the cabinet**: the brand's main colour
becomes the machine, which is what a hero background wants.

The table was decided at M1 on a prototype outside the library — seven brands, both themes, the
marks on the reels at 360 px — by the user (ADR 005, addendum). What the prototype settled:

- `violet` is 325° ±20, not 320° ±35: the wide window took royal blue (H 296) and indigo (H 303),
  so a blue brand drew a blue plum on a blue cabinet. The narrow one keeps violet, purple and
  fuchsia (309–325) and leaves the blues to the cabinet.
- A bell and a lemon in one `gold` read as two symbols: shape tells them apart, colour need not.
- Under `theme: 'light'` the **cabinet defaults to `line`**: a filled body over a white page was a
  pastel field at contrast 1.98 against the paper, and a blue brand came out lavender. An explicit
  `style: 'flat'` still fills it — cards-lite's back, the same escape.

**Pins win.** Any role accepts any CSS colour string; the renderer never parses a pin, only escapes
`" < > &`. `'auto'` unpins.

**The invariant:** *every machine reads as a slot machine whatever the brand — paper reels, one black
symbol, a red seven, a gold bell; and every brand colour given is used.*

## Results — presets are data

A result names **what the payline shows**. The library contains no evaluator: nothing computes a
win, nothing pays, nothing weights a reel by odds, and there is no game state. The arrow runs one
way only — name → symbols. Each result is correct **by construction**.

| Result | Construction |
|---|---|
| `jackpot` | three sevens on the payline (the payline cell of every reel is `seven`) |
| `three` | one symbol by the seed, on every reel's payline cell |
| `bars` | a bar on every payline cell, 1–3 plaques each by the seed |
| `cherries` | cherries on the first one or two reels' payline cells, not on the rest |
| `mixed` | payline symbols drawn so that no two neighbouring reels agree |

The rows above and below the payline stay the seed's in every result. `symbols` pins exact cells
(an array per reel, top to bottom); precedence is `symbols` > `result` > seed.

> **The seed never changes what a seven looks like. It may change whether the seven is on the line.**

## Reels — what the seed places

Each reel is keyed by its **index**: `reel:0:*`, `reel:1:*`. A reel is a cyclic strip of symbols
drawn from a fixed weight table (data, not odds — it exists so that a random machine does not look
like a jackpot every third seed):

| Symbol | seven | bar | bell | cherry | lemon | plum | gem | star | coin |
|---|---|---|---|---|---|---|---|---|---|
| Weight | 1 | 2 | 2 | 3 | 3 | 3 | 2 | 2 | 2 |

A strip is 20 positions. Each draws its symbol from `reel:i:strip` and, separately, a bar count 1–3
from `reel:i:bars` — one draw per position whatever the symbol, so a count never shifts the strip.
The stop — which position sits on the payline — is `reel:i:stop`. `classic: false` draws from the
procedural three only.

`reels` is 3 (default), 4 or 5, and it **appends**: under one seed, reels 0–2 of a five-reel machine
are the three reels of the three-reel machine. `rows` is 3 (default) or 1.

## Motion — the spin

Off by default. `motion: 'spin' | true`, `speed` divides the periods, `0` turns motion off and
returns the static bytes exactly.

- **CSS, not SMIL** (roulette's ADR 006): `prefers-reduced-motion` cannot gate SMIL without script.
- **`from` with no `to`.** Each reel's strip group animates from a start offset to identity, so the
  rest state *is* the static picture and `animation: none` under reduced motion leaves the reader
  looking at the result, not at a blur.
- The strip scrolls **flat** under the drum shade, carrying 8–14 extra symbols above the window
  (keyed `reel:i:spin`) that pass through it; the projection applies at rest. Whether the switch
  from flat scroll to projected rest reads on screen is an **open question for M4**, answered on a
  prototype before the code, with the fallback stated now: the scrolling symbols are drawn with
  the same `sy` as the row they are passing.
- Reels stop left to right, each by its own seeded class and `animation-delay`; a slight overshoot
  lands in the timing function, not in extra keyframes.
- **An animated element never carries a `transform` attribute**; the placement sits on an outer
  `<g>`. No type, universal or `:nth-child` selectors — the inline `<style>` is document-global.
- The spin is one-shot. A permanent marquee chase is backlog, not v0.1.

## API

```js
Slots.machine(opts)             // → string. The whole machine. Pure; Node and browser.
Slots.symbol(opts)              // → string. One symbol on its em — an icon. Pure.
Slots.palette(brand, {theme})   // → {red, gold, violet, green, bar, strip, ink, trim, gem, body, outline, background, halo, stroke}
Slots.init(el, opts)            // browser → {el, get(), set(opts), destroy()}
```

### Options

| Option | Default | What |
|---|---|---|
| `seed` | `1` | a string (a domain name is fine), or a number taken as a 32-bit unsigned integer |
| `brand` | spintax triad `['#00abf3','#d6af3c','#a91455']` | hex or hex[] |
| `theme` | `'dark'` | `'dark'` \| `'light'` — derived colours only |
| `style` | `'flat'` | `'line'` \| `'flat'`; the cabinet defaults to `line` under `theme: 'light'` |
| `weight` | `1` | line weight multiplier |
| `red gold violet green bar strip ink trim gem body outline` | `'auto'` | any CSS colour string |
| `classic` | `true` | `false` = procedural symbols only, no fixed path |
| `size` | — | width; the height follows the viewBox |
| `precision` | `0` | decimals for coordinates |
| `salt` | `''` | extra entropy for ids — the same picture twice on one page |
| `title` | — | `role="img"` + escaped `aria-label`; otherwise `aria-hidden="true"` |

`machine()` adds `reels` (3–5), `rows` (3 \| 1), `result`, `symbols`, `payline` (`true`),
`lever` (`true`), `lattice` (`'auto'` \| `'trigon'` \| `'hex'` \| `'octagon'` \| `'none'`) and
`motion` / `speed`. `symbol()` adds `symbol` (a name; the seed picks one when absent) and `bars`
(1–3, for `bar` only).

## Determinism

- Every seeded parameter draws from its **own** sub-seed:
  `u(k) = mulberry32(fmix32(seed32 ^ imul(fnv(k), 0x9E3779B9)))`; a string seed goes through
  FNV-1a — the family's `streams()`, ported unchanged.
- **Namespaces:** `reel:i:*` a reel's strip, stop and spin · `sym:name:*` a procedural symbol's
  identity · `cab:*` the cabinet · `result:*` the preset's choices · `ids` (+ `salt`) tokens.
- Ids are keyed by what is drawn, not only by the seed, so two different machines under one seed
  on one page never share an id (cards-lite's lesson; `salt` is for the same picture twice).
- No `Math.random`, no `Date`. The default seed is fixed: a build must reproduce.
- **Contract:** same (seed, options) → byte-identical string within a minor version (roulette's
  ADR 010). **`brand` never touches geometry, `seed` never touches colour, and `brand` never
  changes which symbol is drawn.**

## No signature

Nothing in the output names or fingerprints the tool (roulette's ADR 005): no comments,
`<desc>`/`<metadata>`, `data-*`, `xlink`, `version`, library names. Every id, class and
custom-property name is a seeded token. The one carved exception is the counted classic set
(ADR 004 here).

## Performance and size

- Library: budget in `package.json` `config.sizeBudget`, measured by `npm run size` (terser in
  process + gzip level 9, never the `gzip` CLI). **Provisional 8192 B at M0** (ADR 007) — a
  forecast from cards-lite's measured parts, frozen after M4 at the measured size + 2.5%.
  Measured at M0: **3347 B** (the engine, `roles()` and the blank machine; cards' M0 was 3108).
  At M2: **5731 B** — the symbols, the shade, the drum, the strips and `symbol()` added 2384 B
  against a forecast of ~1.1 KB for the symbols alone (240 B of it the calligraphic seven and the
  reworked gem). 2.4 KB remain for the cabinet, the spin, `init()` and the results, which ADR 007
  forecast at ~2.7 KB: the budget will have to move at the M4 freeze.
- Output, measured at M3 over 60 seeds (forecast 5–9 KB raw for three reels):

  | Machine | Raw | Gzip |
  |---|---|---|
  | three reels (default) | 5.8–8.7 KB, median 6.9 | 1.5–2.1 KB |
  | five reels | 7.8–10.7 KB, median 9.1 | 1.7–2.3 KB |
  | `style: 'line'` | 4.8–6.8 KB | 1.3–1.8 KB |
  | `rows: 1` | 3.9–5.4 KB | 1.1–1.4 KB |
- Library at M3: **7076 B** — the cabinet and the lattice port added 1345 B. 1116 B remain for
  the results, the spin and `init()` (forecast ~0.9 KB); the budget is decided at the M4 freeze.

## Promotion

Credits live only in the README, the demo and package.json — never in the output. Demo panel and
footer: "Made in [301](https://301.st) · for [spintax.net](https://spintax.net)".

## Naming, layout, release

- Package `slots-lite`, global `Slots`, repo `investblog/slots-lite`, source `slots.js`, generated
  `slots.min.js` (not committed), types `slots.d.ts` (M4) — ADR 002.
- ES5 IIFE with a UMD tail: CommonJS gets `module.exports`, a browser gets `window.Slots`; default
  import only (roulette's ADR 007). ES5 is the syntax, not the runtime: `Math.imul` is fine.
- ESLint 10, the family's since cards-lite piloted it.
- Release: OIDC trusted publishing after the house token bootstrap — `RELEASING.md` at M5, copied
  from cards-lite. The npm account must be publish-ready before the first publish.

## Acceptance criteria (v0.1)

- `machine()` and `symbol()` run in Node ESM, CommonJS and a `<script>`.
- Same (seed, options) → identical bytes; the brand/seed independence tests pass, including
  "brand never changes which symbol is drawn", and `reels` appends.
- The classic-set exception test passes: the seed-invariant `d` set is exactly the counted list,
  and the procedural symbols and the cabinet contribute none.
- Every result satisfies a check **written longhand in the test file** — the library has no
  evaluator and must not grow one.
- Both styles × both themes look right in a browser — a contact sheet shown to the user at M2
  and M3.
- `npm run lint`, `npm test`, `npm run size` pass; the browser gate (cache-busted) is ALL GREEN in
  Chromium, Firefox and WebKit, with and without `prefers-reduced-motion`, and every check in it
  has been seen to fail against a deliberately broken library.

## See also

- `docs/decisions/` — the ADRs; `docs/TODO.md` — the backlog.
- Siblings: [cards-lite](https://github.com/investblog/cards-lite) (the direct parent),
  [roulette-lite](https://github.com/investblog/roulette-lite),
  [trigons-lite](https://github.com/investblog/trigons-lite),
  [hexagons-lite](https://github.com/investblog/hexagons-lite),
  [octagons](https://github.com/investblog/octagons).
