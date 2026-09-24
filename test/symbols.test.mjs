// M2: the symbols and the drum. The centrepiece is the ADR 004 count: the classic set is allowed
// exactly eight fixed `d` values, and this file is what keeps that number honest — including the
// part that proves the procedural symbols and the cabinet are genuinely seeded.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Slots from '../slots.js';

const CLASSIC = ['seven', 'bar', 'bell', 'cherry', 'lemon', 'plum'];
const PROC = ['gem', 'star', 'coin'];
const ds = (svg) => [...svg.matchAll(/ d="([^"]+)"/gu)].map((m) => m[1]);
const intersect = (sets) => sets.reduce((a, b) => new Set([...a].filter((x) => b.has(x))));
const fixed = (draw, seeds = 100) => {
	const seen = [];
	for (let seed = 1; seed <= seeds; seed++) seen.push(new Set(ds(draw(seed))));
	return intersect(seen);
};

test('ADR 004: each classic symbol is its own fixed paths and nothing more', () => {
	const expect = { seven: 1, bar: 2, bell: 1, cherry: 2, lemon: 1, plum: 1 };
	for (const symbol of CLASSIC) {
		const f = fixed((seed) => Slots.symbol({ symbol, seed }));
		assert.equal(f.size, expect[symbol], `${symbol}: ${[...f].map((d) => d.slice(0, 16)).join(' | ')}`);
	}
});

test('ADR 004: the six classic symbols contribute eight fixed paths between them, and not one more', () => {
	const union = new Set();
	for (const symbol of CLASSIC) {
		for (const style of ['flat', 'line']) {
			for (const d of fixed((seed) => Slots.symbol({ symbol, seed, style, bars: 3 }), 12)) union.add(d);
		}
	}
	assert.equal(union.size, 8, `expected 8, got ${union.size}`);
});

test('ADR 004: the procedural symbols and the cabinet contribute no fixed path — the scope is real', () => {
	for (const symbol of PROC) {
		assert.equal(fixed((seed) => Slots.symbol({ symbol, seed }), 60).size, 0, symbol);
	}
	// a machine's fixed paths can only be classic ones; with classic: false it has none at all
	const classic = new Set();
	for (const symbol of CLASSIC) for (const d of ds(Slots.symbol({ symbol, bars: 3 }))) classic.add(d);
	for (const d of fixed((seed) => Slots.machine({ seed }), 60)) assert.ok(classic.has(d), `not classic: ${d.slice(0, 30)}`);
	assert.equal(fixed((seed) => Slots.machine({ seed, classic: false }), 60).size, 0);
	for (let seed = 1; seed <= 30; seed++) {
		for (const d of ds(Slots.machine({ seed, classic: false }))) assert.ok(!classic.has(d), `seed ${seed}`);
	}
});

test('a procedural symbol is one symbol per seed: the same gem on every reel', () => {
	// seeds checked to show a gem: `every` over none would pass for any library
	for (const seed of [1, 2, 3]) {
		const gem = ds(Slots.symbol({ symbol: 'gem', seed }))[0];
		const svg = Slots.machine({ seed, reels: 5 });
		assert.ok(ds(svg).includes(gem), `seed ${seed}: the machine's gem is the symbol's gem`);
	}
});

test('the shade: flat only, one mask per symbol, and a pinned colour is shaded without being parsed', () => {
	for (const symbol of [...CLASSIC, ...PROC]) {
		assert.equal((Slots.symbol({ symbol }).match(/<mask /gu) || []).length, 1, symbol);
		assert.doesNotMatch(Slots.symbol({ symbol, style: 'line' }), /<mask |mask=/u, `${symbol} line`);
	}
	const svg = Slots.symbol({ symbol: 'seven', red: 'var(--r, "#f00")' });
	assert.match(svg, /fill="var\(--r, &quot;#f00&quot;\)"/u);
	assert.match(svg, /fill="#000" fill-opacity="\.22" mask="url\(#[a-z][a-z0-9]{5}\)"/u);
	// the shade paints the same path the body does: it is a second painting, not a new `d`
	const body = svg.match(/<use href="#([a-z0-9]+)" fill="var/u)[1];
	assert.match(svg, new RegExp(`<use href="#${body}" fill="#000"`, 'u'));
});

test('every reference resolves: each href and url(#) names an id defined in the same picture', () => {
	for (const svg of [Slots.machine({ reels: 5, seed: 3 }), Slots.machine({ style: 'line' }), Slots.symbol({ symbol: 'bar', bars: 3 })]) {
		const ids = new Set([...svg.matchAll(/ id="([^"]+)"/gu)].map((m) => m[1]));
		const refs = [...svg.matchAll(/(?:href="#|url\(#)([^")]+)/gu)].map((m) => m[1]);
		assert.ok(refs.length > 0);
		for (const r of refs) assert.ok(ids.has(r), `unresolved #${r}`);
	}
});

// Decode a machine back into reels of symbol identities: a cell's identity is its group with every
// reference replaced by the path it paints — so the test never needs the library's own names.
function reels(svg) {
	const defs = svg.slice(0, svg.indexOf('</defs>')), paths = {}, groups = {};
	for (const m of defs.matchAll(/<path id="([^"]+)" d="([^"]+)"/gu)) paths[m[1]] = m[2];
	for (const m of defs.matchAll(/<g id="([^"]+)">(.*?)<\/g>(?=<g id=|<path id=|<mask |<linear|<clip|$)/gu)) {
		groups[m[1]] = m[2].replace(/#([a-z0-9]+)/gu, (x, id) => paths[id] || '').replace(/url\([^)]*\)/gu, '');
	}
	const cols = new Map();
	for (const m of svg.slice(svg.indexOf('</defs>')).matchAll(/<use href="#([^"]+)" transform="translate\((-?\d+) (-?\d+)/gu)) {
		if (!cols.has(m[2])) cols.set(m[2], []);
		cols.get(m[2]).push(groups[m[1]]);
	}
	return [...cols.entries()].sort((a, b) => a[0] - b[0]).map((e) => e[1]);
}

test('reels append: under one seed, a five-reel machine begins with the three-reel one', () => {
	for (let seed = 1; seed <= 40; seed++) {
		const three = reels(Slots.machine({ seed })), five = reels(Slots.machine({ seed, reels: 5 }));
		assert.equal(three.length, 3);
		assert.equal(five.length, 5);
		assert.ok(three.flat().every(Boolean), `seed ${seed}: a cell did not decode`);
		assert.deepEqual(five.slice(0, 3), three, `seed ${seed}`);
	}
});

test('the drum: three rows per reel, foreshortened above and below the payline', () => {
	// the body only: <defs> holds translate()s of its own, inside a double or triple bar
	const svg = Slots.machine({ seed: 2 }).split('</defs>')[1];
	const cells = [...svg.matchAll(/transform="translate\((-?\d+) (-?\d+)\)(?: scale\(1 ([\d.]+)\))?"/gu)];
	assert.equal(cells.length, 9);
	for (const m of cells) {
		const y = Number(m[2]);
		assert.ok([-167, 0, 167].includes(y), `row at ${y}`);
		assert.equal(m[3] === undefined, y === 0, 'only the payline row is unscaled');
		if (m[3]) assert.equal(m[3], '0.766');
	}
});

test('symbol(): the seed picks when no name is given; a bad name falls back; bars are clamped', () => {
	assert.equal(Slots.symbol({ seed: 5 }), Slots.symbol({ seed: 5 }));
	const picked = new Set();
	for (let seed = 1; seed <= 60; seed++) picked.add(ds(Slots.symbol({ seed })).join());
	assert.ok(picked.size >= 6, `the seed reached ${picked.size} symbols`);
	assert.equal(Slots.symbol({ symbol: 'toString', seed: 5 }), Slots.symbol({ seed: 5 }));
	const plaques = (svg) => svg.split(`fill="${Slots.palette().bar}"`).length - 1;
	assert.equal(plaques(Slots.symbol({ symbol: 'bar', bars: 3 })), 3);
	assert.equal(plaques(Slots.symbol({ symbol: 'bar', bars: 9 })), 3);
	assert.equal(plaques(Slots.symbol({ symbol: 'bar' })), 1);
	assert.match(Slots.symbol({ symbol: 'bell' }), /viewBox="-80 -80 160 160"/u);
	// classic: false never draws a classic symbol, whatever was asked
	for (const symbol of CLASSIC) assert.ok(PROC.some((p) => Slots.symbol({ symbol, classic: false, seed: 1 }) === Slots.symbol({ symbol: p, seed: 1, classic: false })), symbol);
});
