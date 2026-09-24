# slots-lite

A procedural slot machine as an SVG string — the cabinet, the reel window and the reels, from a
seed, in your brand's colours. One call at build time (Node) or in the browser; zero dependencies.

**Status: in development (M0). Not published to npm yet.** The API below is the planned one;
today `machine()` draws the blank machine and `palette()` returns the colours.

```js
const Slots = require('slots-lite');

Slots.machine({ seed: 'example.com', brand: '#00abf3', reels: 3 }); // → '<svg …>…</svg>'
Slots.palette('#00abf3', { theme: 'light' });                     // → { red, gold, body, … }
```

Planned for v0.1: classic symbols (seven, bar, bell, cherry, lemon, plum) beside procedural ones
(gem, star, coin), named results (`jackpot`, `three`, …) as pictures only — the library never
decides a win — and an optional CSS spin that respects `prefers-reduced-motion`.

Part of a family: [cards-lite](https://github.com/investblog/cards-lite),
[roulette-lite](https://github.com/investblog/roulette-lite),
[trigons-lite](https://github.com/investblog/trigons-lite),
[hexagons-lite](https://github.com/investblog/hexagons-lite),
[octagons](https://github.com/investblog/octagons).

Made in [301](https://301.st) · for [spintax.net](https://spintax.net). MIT.
