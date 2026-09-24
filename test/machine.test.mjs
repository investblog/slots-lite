// M0: the blank machine. It carries no symbols yet, so what it can prove is the contract around
// them: determinism, the brand/seed split, the reel count, and an output with no signature.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Slots from '../slots.js';

const geometry = (svg) => svg.replace(/(fill|stroke)="[^"]*"/gu, '');

test('same seed and options give the same bytes; the default seed is fixed', () => {
	assert.equal(Slots.machine({ seed: 'spintax.net' }), Slots.machine({ seed: 'spintax.net' }));
	assert.equal(Slots.machine(), Slots.machine({ seed: 1 }));
});

test('the seed reaches the picture', () => {
	const seen = new Set();
	for (let s = 0; s < 20; s++) seen.add(Slots.machine({ seed: s }));
	assert.ok(seen.size > 1, 'twenty seeds did not all draw the same machine');
});

test('brand never touches geometry, and seed never touches colour', () => {
	for (const seed of [1, 'a', 'spintax.net']) {
		assert.equal(geometry(Slots.machine({ seed, brand: '#d97706' })), geometry(Slots.machine({ seed })));
	}
	const colours = (svg) => (svg.match(/(fill|stroke)="[^"]*"/gu) || []).join();
	assert.equal(colours(Slots.machine({ seed: 2 })), colours(Slots.machine({ seed: 3 })));
});

test('reels: 3 by default, 3–5 honoured, anything else clamped — the house never throws', () => {
	const strips = (svg) => (svg.match(/width="200"/gu) || []).length;
	assert.equal(strips(Slots.machine()), 3);
	assert.equal(strips(Slots.machine({ reels: 4 })), 4);
	assert.equal(strips(Slots.machine({ reels: 5 })), 5);
	assert.equal(strips(Slots.machine({ reels: 9 })), 5);
	assert.equal(strips(Slots.machine({ reels: 'x' })), 3);
});

test('no signature: no comments, metadata, data-* or names in the output', () => {
	for (const o of [{}, { style: 'line', theme: 'light', title: 'A slot machine' }]) {
		const svg = Slots.machine(o);
		assert.doesNotMatch(svg, /<!--|<desc|<metadata|data-|xlink|version=|slots|lite|301|spintax/iu);
	}
});

test('a11y: hidden by default, an escaped label with a title', () => {
	assert.match(Slots.machine(), /aria-hidden="true"/u);
	const svg = Slots.machine({ title: 'Jackpot <3 & "more"' });
	assert.match(svg, /role="img" aria-label="Jackpot &lt;3 &amp; &quot;more&quot;"/u);
	assert.doesNotMatch(svg, /aria-hidden/u);
});

test('size sets the width and the height follows the viewBox', () => {
	const svg = Slots.machine({ size: 360 });
	const vb = svg.match(/viewBox="([^"]+)"/u)[1].split(' ').map(Number);
	assert.match(svg, /width="360"/u);
	assert.match(svg, new RegExp(`height="${Math.round(360 * vb[3] / vb[2])}"`, 'u'));
});

test('under the light theme the cabinet is a rule unless flat is asked for (ADR 005, M1)', () => {
	// the cabinet is the first shape drawn, before the bezel
	const body = (o) => Slots.machine(o).match(/<rect [^>]*>/u)[0];
	assert.match(body({}), /fill="#/u, 'dark fills');
	assert.match(body({ theme: 'light' }), /fill="none" stroke="#/u, 'light draws a rule');
	assert.match(body({ theme: 'light', style: 'flat' }), /fill="#/u, 'an explicit flat still fills');
	assert.match(body({ style: 'line' }), /fill="none"/u, 'line is a rule in the dark too');
});
