// The colour engine and derive() were ported from cards-lite unchanged (ADR 001), which ported them
// from hexagons-lite, and the family's promise is that a brand reads the same across the siblings —
// a page can put a machine on a hexagon field and expect one palette, not two that nearly agree.
//
// The fixture is what hexagons really returns (`hexagons.js @ 9f9b933`), carried from cards-lite.
// Here the field (`stroke`, `background`, `halo`) is derived from the whole brand, not from the
// cabinet's colour, so parity holds for any brand by construction rather than by coincidence.
//
// If this fails, one of the engines drifted. Find out WHICH before regenerating the fixture:
// regenerating it silently is how a drift becomes the new truth.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Slots from '../slots.js';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/palette-parity.json', import.meta.url), 'utf8'));

test('palette parity with hexagons-lite: stroke, background and halo, to the byte', () => {
	assert.ok(fixture.cases.length >= 16, 'the fixture still covers the brands it was made for');
	for (const c of fixture.cases) {
		const p = Slots.palette(c.brand, { theme: c.theme });
		const where = `${c.brand} ${c.theme}`;
		assert.deepEqual(p.stroke, c.colors, `${where}: the three stroke colours`);
		assert.equal(p.background, c.background, `${where}: background`);
		assert.equal(p.halo, c.halo, `${where}: halo`);
	}
});

test('and the machine roles are NOT the sibling palette: this library adds its own', () => {
	const p = Slots.palette('#7c5cff');
	for (const role of ['red', 'gold', 'violet', 'green', 'bar', 'strip', 'ink', 'trim', 'body']) {
		assert.match(p[role], /^#[0-9a-f]{6}$/u, `${role} is a colour of this library's own`);
	}
	assert.notEqual(p.strip, p.background, 'the reel strip is paper, not the field behind it');
});
