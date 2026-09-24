// M0: the module contract (ADR 001) and the palette port (ADR 005). What this file proves is that
// the library loads the three ways the family promises, and that the machine's roles come out of
// the brand with the constants the spec names — before any symbol is drawn.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import Slots from '../slots.js';

const require = createRequire(import.meta.url);
const ROLES = ['red', 'gold', 'violet', 'green', 'bar', 'strip', 'ink', 'trim', 'body', 'background', 'halo'];
const BRANDS = [undefined, '#00abf3', ['#00abf3', '#d6af3c', '#a91455'], '#8a8a8a', '#d97706', '#7c3aed', ['#2f9e44', '#8a8a8a']];

test('loads as an ES module default import and as CommonJS, and they are the same object', () => {
	const cjs = require('../slots.js');
	assert.equal(typeof Slots.machine, 'function');
	assert.equal(typeof Slots.palette, 'function');
	assert.equal(Slots.machine, cjs.machine);
});

test('as a <script>: the UMD tail defines exactly one global and touches nothing else', () => {
	const src = readFileSync(new URL('../slots.js', import.meta.url), 'utf8');
	assert.match(src, /root\.Slots = api;/u);
	assert.match(src, /typeof module === 'object' && module\.exports/u);
	assert.doesNotMatch(src, /window\.\w+\s*=/u);
});

test('every role resolves to a colour, for every brand in both themes', () => {
	for (const brand of BRANDS) {
		for (const theme of ['dark', 'light']) {
			const p = Slots.palette(brand, { theme });
			for (const k of ROLES) assert.match(p[k], /^#[0-9a-f]{6}$/u, `${k} for ${brand} ${theme}`);
			assert.equal(p.stroke.length, 3);
			assert.equal(new Set(['red', 'gold', 'violet', 'green', 'bar'].map((r) => p[r])).size, 5,
				`five distinct symbol colours for ${brand} ${theme}`);
		}
	}
});

test('the derived roles are constants: paper reels in both themes, a near-black bar', () => {
	for (const brand of BRANDS) {
		const dark = Slots.palette(brand, { theme: 'dark' }), light = Slots.palette(brand, { theme: 'light' });
		assert.equal(dark.strip, light.strip, `the strip is paper in both themes for ${brand}`);
		const L = (hex) => parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16) + parseInt(hex.slice(5, 7), 16);
		assert.ok(L(dark.strip) > 700, `the strip is light for ${brand}`);
		assert.ok(L(dark.bar) < 150, `the bar is near-black for ${brand}`);
	}
});

test('the default triad: crimson is the seven, gold is the bell, and the blue is left for the cabinet', () => {
	const p = Slots.palette();
	const own = Slots.palette('#00abf3');
	assert.equal(p.body, own.body, 'the cabinet is the blue, the colour no symbol role captured');
	// the triad lists the blue first, so the test above cannot tell "left over" from "first":
	// with the crimson listed first, only the leftover rule still gives the blue cabinet
	assert.equal(Slots.palette(['#a91455', '#00abf3']).body, own.body, 'the leftover, not the first colour');
	assert.equal(p.gold, Slots.palette(['#d6af3c']).gold, 'the brand gold is the gold role');
});

test('pins win, and are escaped rather than parsed', () => {
	const svg = Slots.machine({ body: 'var(--x, "#123")', strip: 'auto' });
	assert.match(svg, /fill="var\(--x, &quot;#123&quot;\)"/u);
	assert.ok(svg.includes(`fill="${Slots.palette().strip}"`), "'auto' unpins");
});
