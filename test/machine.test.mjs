// The machine's contract: determinism, the brand/seed split, the reel count, an output with no
// signature, and the light-theme cabinet. The symbols and the drum have their own file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Slots from '../slots.js';

// geometry with the paint taken out; ids are keyed by what is drawn, colours included, so they are
// renamed in order of first appearance rather than dropped — a changed reference still shows
const paintless = (svg) => svg.replace(/(fill|stroke|stop-color)="[^"]*"/gu, '');
const geometry = (svg) => {
	const names = new Map();
	return paintless(svg).replace(/(id="|#)([a-z][a-z0-9]{5})\b/gu, (m, pre, tk) => {
		if (!names.has(tk)) names.set(tk, `ID${names.size}`);
		return pre + names.get(tk);
	});
};
// the body: what follows </defs>, which holds rects and paths of its own (cards-lite, M5)
const body = (svg) => svg.slice(svg.indexOf('</defs>') + 7);

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
	// the seed picks which symbols are shown, so a machine's colour list moves with it; what may not
	// move is the colour of any one thing — the cabinet, and each symbol drawn alone
	// a url(#…) is a reference to a seeded id, not a colour
	const colours = (svg) => (svg.match(/(fill|stroke|stop-color)="(?!url)[^"]*"/gu) || []).join();
	const cabinet = (svg) => colours(body(svg).slice(0, body(svg).indexOf('<g')));
	assert.ok(cabinet(Slots.machine({ seed: 2 })).length > 0);
	assert.equal(cabinet(Slots.machine({ seed: 2 })), cabinet(Slots.machine({ seed: 3 })));
	for (const symbol of ['seven', 'bar', 'cherry', 'gem', 'star', 'coin']) {
		assert.equal(colours(Slots.symbol({ symbol, seed: 2 })), colours(Slots.symbol({ symbol, seed: 3 })), symbol);
	}
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
	const cab = (o) => body(Slots.machine(o)).match(/<rect [^>]*>/u)[0];
	assert.match(cab({}), /fill="#/u, 'dark fills');
	assert.match(cab({ theme: 'light' }), /fill="none" stroke="#/u, 'light draws a rule');
	assert.match(cab({ theme: 'light', style: 'flat' }), /fill="#/u, 'an explicit flat still fills');
	assert.match(cab({ style: 'line' }), /fill="none"/u, 'line is a rule in the dark too');
});

test('passing a default is the same as leaving it out, to the byte', () => {
	for (const seed of [1, 'spintax.net']) {
		const plain = Slots.machine({ seed });
		for (const o of [{ lattice: 'auto' }, { result: '' }, { result: null }, { symbols: [] }, { symbols: null }]) {
			assert.equal(Slots.machine({ seed, ...o }), plain, JSON.stringify(o));
		}
	}
});
