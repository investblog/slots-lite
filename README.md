# slots-lite

A slot machine drawn by code. One call returns an SVG string — in Node at build time or in the
browser — so a static site gets its hero art with no script on the page. **`seed`** spins the
reels and shapes the cabinet; **`brand`** spins the colours: one hex, the whole machine — a red
seven, a gold bell, paper reels and a cabinet in your brand's main colour. Classic symbols beside
procedural ones, named results such as a jackpot as pictures only, flat or line art, and an
optional spin that stops for readers who asked for less motion. Zero dependencies, 7.7 KB gzipped.

[![npm](https://img.shields.io/npm/v/slots-lite.svg)](https://www.npmjs.com/package/slots-lite)
[![license](https://img.shields.io/npm/l/slots-lite.svg)](LICENSE)

**[Live demo →](https://investblog.github.io/slots-lite/)** — every option wired to a control, a
24-seed contact sheet, every result, and the nine symbols.

## Install

```sh
npm install slots-lite
```

Or from a CDN, no build step:

```html
<script src="https://cdn.jsdelivr.net/npm/slots-lite@0.1/slots.min.js"></script>
```

The file is one script in ES5 syntax that runs anywhere `Math.imul` does — current browsers and
supported Node releases (CI runs 22 and 24): a `<script>` gets the global `Slots`, Node and
bundlers get `module.exports`. Use the default import:

```js
import Slots from 'slots-lite';
```

## Use it

At build time — an Astro page, a static generator, anything that runs Node:

```js
const markup = Slots.machine({ seed: 'example.com', brand: '#7c5cff' });
// inline it: <div class="hero-art" aria-hidden="true" set:html={markup} />
```

In the browser:

```js
const machine = Slots.init('#hero-art', { seed: 42, result: 'jackpot', motion: 'spin' });
machine.set({ brand: '#c2410c' });   // re-renders; options you set stay set, pins stay pinned
machine.destroy();
```

`init()` returns `null` when the selector matches nothing.

The SVG has a `viewBox` and no size of its own: size it with CSS — `svg { width: 100%; height:
auto; }` — or the `size` option. The cabinet is seeded, so the aspect moves a little with the seed
(the top and the lever); measured over 200 seeds:

| Machine | Width / height |
|---|---|
| three reels (default) | 0.82–1.03 |
| four reels | 1.02–1.26 |
| five reels | 1.23–1.50 |
| `rows: 1` | 1.24–1.66 |

## The three calls

```js
Slots.machine({ seed: 7, reels: 5 });            // the whole machine — the heart of the library
Slots.symbol({ symbol: 'bar', bars: 3 });        // one symbol on its 160-unit em — an icon
Slots.palette('#00abf3', { theme: 'light' });    // the colours, to reuse on the page
```

## Symbols

Nine, in two kinds. The six **classic** ones are fixed drawings: `seven`, `bar` (one to three
plaques), `bell`, `cherry`, `lemon`, `plum`. The three **procedural** ones are drawn fresh by the
seed: `gem` (its facets, table and depth), `star` (5–8 points) and `coin` (its rings). A procedural
symbol is keyed by its name, so under one seed the gem is the same gem on every reel.

`classic: false` draws the procedural three only, and the output then carries no fixed path at all.

A reel is a 20-position strip drawn from a fixed weight table — data, not odds: it exists so that
a random machine does not look like a jackpot every third seed. Under `flat` every symbol carries
a crescent of shade on its lower left; under `line` it is drawn as strokes.

## Results — a picture, never a game

A result names **what the payline shows**, and the library builds it — it never decides a win,
pays, weights a reel by odds or keeps any state ([ADR 006](docs/decisions/006-results-are-data.md)).
Each one is correct by construction and reproducible from its seed:

| `result` | The payline |
|---|---|
| `jackpot` | a seven on every reel |
| `three` | one symbol, chosen by the seed, on every reel |
| `bars` | a bar on every reel, one to three plaques each |
| `cherries` | cherries on the first one or two reels, not on the rest |
| `mixed` | no two neighbouring reels agree |

The rows above and below the payline stay the seed's, and choosing a result moves nothing else.
`symbols` pins exact cells — an array per reel, top to bottom, `null` to leave a cell to the seed —
and wins over `result`:

```js
Slots.machine({ result: 'jackpot' });
Slots.machine({ seed: 7, symbols: [[null, 'bell', null], [null, 'bell', null], [null, 'seven', null]] });
Slots.machine({ seed: 7, rows: 1, symbols: [['gem'], ['gem'], ['gem']] });   // one name per reel under rows: 1
```

Under `classic: false` a result that needs a classic symbol (`jackpot`, `bars`, `cherries`) is
ignored; `three` and `mixed` draw from the procedural three.

## Colour: a machine that stays a slot machine

You pass one brand colour or several. Each is captured by the symbol colour nearest its hue — `red`
(the seven and the cherries), `gold` (bell, lemon, star, coin, the bulbs), `violet` (the plum) or
`green` (the cherry stem) — and the roles left unclaimed keep their classic hue, tinted toward your
brand. Gold is never tinted: a tinted bell stopped reading as gold. The first brand colour left
over paints the **cabinet**.

| Brand | Seven and cherries | Bell and lemon | Cabinet |
|---|---|---|---|
| spintax triad `#00abf3 #d6af3c #a91455` | the crimson | the gold | the blue |
| one blue (`#00abf3`) | classic red | classic gold | the blue |
| one red (`#c2410c`) | the red itself | classic gold | the red, darker |
| grey | classic red | classic gold | the grey |

Some roles are **always derived and never a brand colour**: `strip` — the reels are paper in both
themes, because a reel is read as a light band before it is read as anything else; `bar` — the bar
is the one black symbol; `ink` — the drum's shade, the payline and the window; `trim` — the metal
of the bezel, the tray and the lever; `outline` — the rule a `line` cabinet is drawn with, the
cabinet hue's middle stop, readable on the page in both themes; and `gem` — the cabinet's hue at a
depth that reads on the paper reel.

Under `theme: 'light'` the cabinet defaults to `line`: a filled cabinet over a white page is a large
pastel field that fights the page. `style: 'flat'` still fills it.

Every role can be pinned with any CSS colour, including a custom property — which is how a site
with a light/dark toggle recolours an inline machine with no script:

```js
Slots.machine({ seed: 7, body: 'var(--brand, #00abf3)', strip: 'var(--paper, #f0f6fc)' });
```

`'auto'` unpins. `Slots.palette(brand, { theme })` returns every derived colour for either theme —
plus `stroke`, `background` and `halo`, the brand's field colours, which a
[hexagons-lite](https://github.com/investblog/hexagons-lite) background behind the machine matches
— so you can publish them as your own custom properties at build time.

## Options

| Option | Default | What |
|---|---|---|
| `seed` | `1` | a string (a domain name is fine) or a 32-bit unsigned integer |
| `brand` | spintax triad | a hex or a list of them |
| `theme` | `'dark'` | `'dark'` \| `'light'` — the derived colours, and the cabinet's default style |
| `style` | `'flat'` | `'flat'` \| `'line'` — the symbols; the cabinet too, which otherwise is `flat` on dark and `line` on light |
| `reels` | `3` | 3–5; they append — reel *i* is the same reel whatever the count |
| `rows` | `3` | `3` \| `1` — one row is the payline alone |
| `result` | — | `'jackpot'` \| `'three'` \| `'bars'` \| `'cherries'` \| `'mixed'` |
| `symbols` | — | exact cells, an array per reel; wins over `result` |
| `payline`, `lever` | `true`, `true` | `false` removes them |
| `lattice` | `'auto'` | the cabinet's pattern — `'trigon'`, `'hex'` or `'octagon'` from the sibling libraries, or `'none'` |
| `classic` | `true` | `false` = the procedural symbols only, no fixed path |
| `motion`, `speed` | `false`, `1` | `'spin'` — a one-shot CSS spin; `speed` divides its time, `0` returns the static bytes |
| `red gold violet green bar strip ink trim gem body outline` | `'auto'` | any CSS colour |
| `weight` | `1` | line weight multiplier |
| `size` | — | width; the height follows the viewBox |
| `precision` | `0` | decimals for coordinates |
| `salt` | `''` | the same machine twice on one page |
| `title` | — | an accessible name; without it the picture is `aria-hidden` |

`symbol()` takes the shared options — seed, brand, theme, style, the colour pins, `classic`,
`weight`, `size`, `precision`, `salt`, `title` — plus `symbol` (a name; the seed picks one when it
is absent or unknown) and `bars` (1–3, for `bar` only). The full contract, including every seeded
range, is [docs/README.md](docs/README.md); the types are in `slots.d.ts`.

## Motion

`motion: 'spin'` spins the reels once, as CSS inside the SVG — no script on the page. Each reel's
symbols travel down past the window, as a real reel's do, and the reels stop left to right. The
animation runs `from` an offset with no `to`, so the picture at rest *is* the static machine, and
`prefers-reduced-motion: reduce` shows it there from the start rather than stranding it mid-spin.
To play it again, set the markup again. Every id, class and keyframe name is a seeded token keyed
by what is drawn — and a spin's by its `speed` — so two different machines on one page never share
a name that means two things; for the same machine twice, give each its own `salt`.

## Same seed, same bytes

The output for a given seed and options is byte-identical, and a seed is independent of the brand:
change the colours and no symbol moves. Within a minor version the output does not change; any
change to it is a minor release with a line in the changelog — pin the exact version if you render
at build time.

Nothing in the output names this library: no comments, no metadata, every id, class and keyframe a
seeded token. The one exception is counted and tested — the 8 fixed path strings of the six classic
symbols, which are the subject itself and cannot vary without ceasing to be a slot machine
([ADR 004](docs/decisions/004-classic-symbols-signature-exception.md)).

A three-reel machine is 5.8–8.7 KB of SVG, 1.5–2.1 KB gzipped; the library is 7924 B min+gzip,
held under an 8192 B budget by CI.

## The family

slots-lite is a sibling of five zero-dependency libraries by the same hands —
[cards-lite](https://github.com/investblog/cards-lite) (its direct parent, whose colour engine,
seeding and card-back lattices it shares),
[roulette-lite](https://github.com/investblog/roulette-lite),
[trigons-lite](https://github.com/investblog/trigons-lite),
[hexagons-lite](https://github.com/investblog/hexagons-lite) and
[octagons](https://github.com/investblog/octagons).

## Credits

Made in [301](https://301.st) · for [spintax.net](https://spintax.net)

MIT © [301ST](https://301.st)
