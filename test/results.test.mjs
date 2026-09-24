// M4: the results. The library has no evaluator and must not grow one (ADR 006), so the checker is
// written out longhand here: it decodes the finished SVG back into symbol names — by the paths each
// cell paints, never by the library's own names — and checks each result against its definition.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Slots from '../slots.js';

const NAMES = ['seven', 'bar', 'bell', 'cherry', 'lemon', 'plum', 'gem', 'star', 'coin'];
const RESULTS = ['jackpot', 'three', 'bars', 'cherries', 'mixed'];

// the body path each symbol paints, for one seed: the procedural three change with it
function alphabet(seed) {
	const map = new Map();
	for (const name of NAMES) {
		const svg = Slots.symbol({ symbol: name, seed });
		map.set(svg.match(/<path id="[^"]+" d="([^"]+)"/u)[1], name);
	}
	return map;
}

// machine → reels, each a list of [name, bars] top to bottom
function decode(o) {
	const svg = Slots.machine(o), abc = alphabet(o.seed), defs = svg.slice(0, svg.indexOf('</defs>'));
	const paths = {}, groups = {};
	for (const m of defs.matchAll(/<path id="([^"]+)" d="([^"]+)"/gu)) paths[m[1]] = m[2];
	for (const m of defs.matchAll(/<g id="([^"]+)">(.*?)<\/g>(?=<g id=|<path id=|<mask |<linear|<clip|<pattern|$)/gu)) {
		const used = [...m[2].matchAll(/<use href="#([^"]+)"[^>]*fill="(?!#000)/gu)].map((u) => paths[u[1]]).filter(Boolean);
		const name = abc.get(used[0]);
		groups[m[1]] = [name, name === 'bar' ? used.length : 1];
	}
	const cols = new Map();
	const body = svg.slice(svg.indexOf('</defs>'));
	for (const m of body.matchAll(/<use href="#([^"]+)" transform="translate\((-?\d+) (-?\d+)\)/gu)) {
		if (Math.abs(Number(m[3])) > 200) continue; // a spin's extras, below the window
		if (!cols.has(m[2])) cols.set(m[2], []);
		cols.get(m[2]).push(groups[m[1]]);
	}
	return [...cols.entries()].sort((a, b) => a[0] - b[0]).map((e) => e[1]);
}
const payline = (reels, one) => reels.map((r) => r[one ? 0 : 1]);

test('the decoder reads what the machine draws: every cell names a symbol', () => {
	for (let seed = 1; seed <= 20; seed++) {
		const reels = decode({ seed, reels: 5 });
		assert.equal(reels.length, 5);
		for (const r of reels) for (const cell of r) assert.ok(NAMES.includes(cell[0]), `seed ${seed}: ${cell}`);
	}
});

test('every result satisfies its definition, checked longhand', () => {
	const seen = { cherries: new Set(), bars: new Set(), three: new Set() };
	for (let seed = 1; seed <= 60; seed++) {
		for (const reels of [3, 4, 5]) {
			const line = (result) => payline(decode({ seed, reels, result }));
			// jackpot: a seven on every reel
			assert.ok(line('jackpot').every(([n]) => n === 'seven'), `jackpot seed ${seed}`);
			// three: one symbol on every reel
			const three = line('three');
			assert.ok(three.every(([n]) => n === three[0][0]), `three seed ${seed}`);
			seen.three.add(three[0][0]);
			// bars: a bar on every reel, 1–3 plaques each
			const bars = line('bars');
			assert.ok(bars.every(([n, b]) => n === 'bar' && b >= 1 && b <= 3), `bars seed ${seed}`);
			bars.forEach(([, b]) => seen.bars.add(b));
			// cherries: cherries on the first one or two reels, and on none after them
			const ch = line('cherries').map(([n]) => n === 'cherry');
			const lead = ch.indexOf(false);
			assert.ok(lead === 1 || lead === 2, `cherries seed ${seed}: ${ch}`);
			assert.ok(ch.slice(lead).every((x) => !x), `cherries seed ${seed}: a cherry after the lead`);
			seen.cherries.add(lead);
			// mixed: no two neighbouring reels agree
			const mx = line('mixed');
			for (let i = 1; i < mx.length; i++) assert.notEqual(mx[i][0], mx[i - 1][0], `mixed seed ${seed}`);
		}
	}
	// and the seed reaches each result's free choices
	assert.ok(seen.three.size >= 6, `three drew ${seen.three.size} symbols`);
	assert.deepEqual([...seen.bars].sort(), [1, 2, 3]);
	assert.deepEqual([...seen.cherries].sort(), [1, 2]);
});

test('a result changes the payline only: the rows above and below stay the seed\'s', () => {
	for (let seed = 1; seed <= 30; seed++) {
		const plain = decode({ seed });
		for (const result of RESULTS) {
			const r = decode({ seed, result });
			for (let i = 0; i < 3; i++) {
				assert.deepEqual(r[i][0], plain[i][0], `${result} seed ${seed} reel ${i} top`);
				assert.deepEqual(r[i][2], plain[i][2], `${result} seed ${seed} reel ${i} bottom`);
			}
		}
	}
});

test('results append like the reels do: a five-reel result begins with the three-reel one', () => {
	for (let seed = 1; seed <= 30; seed++) {
		for (const result of RESULTS) {
			assert.deepEqual(decode({ seed, reels: 5, result }).slice(0, 3), decode({ seed, result }), `${result} seed ${seed}`);
		}
	}
});

test('classic: false ignores what it cannot draw, and draws the rest from the procedural three', () => {
	for (let seed = 1; seed <= 20; seed++) {
		const plain = payline(decode({ seed, classic: false }));
		for (const result of ['jackpot', 'bars', 'cherries']) {
			assert.deepEqual(payline(decode({ seed, classic: false, result })), plain, `${result} seed ${seed}`);
		}
		const three = payline(decode({ seed, classic: false, result: 'three' }));
		assert.ok(['gem', 'star', 'coin'].includes(three[0][0]) && three.every(([n]) => n === three[0][0]));
		const mx = payline(decode({ seed, classic: false, result: 'mixed' }));
		for (let i = 1; i < 3; i++) assert.notEqual(mx[i][0], mx[i - 1][0]);
	}
});

test('symbols pins exact cells, over the result; a bad name leaves the seed\'s cell', () => {
	const symbols = [['bell', 'seven', null], [null, 'plum', 'toString'], ['gem', 'bar', 'lemon']];
	for (let seed = 1; seed <= 20; seed++) {
		const plain = decode({ seed }), r = decode({ seed, symbols, result: 'jackpot' });
		assert.deepEqual(r.map((col) => col.map(([n]) => n)), [
			['bell', 'seven', plain[0][2][0]],
			[plain[1][0][0], 'plum', plain[1][2][0]],
			['gem', 'bar', 'lemon'],
		], `seed ${seed}`);
	}
	// under rows: 1 a reel's array is its one cell
	assert.deepEqual(payline(decode({ seed: 3, rows: 1, symbols: [['star'], ['star'], ['star']] }), true).map(([n]) => n), ['star', 'star', 'star']);
});

test('a result is never scored: nothing in the output or the API names a win', () => {
	const api = Object.keys(Slots).join();
	assert.doesNotMatch(api, /win|pay|odds|score|evaluate|rtp/iu);
	for (const result of RESULTS) {
		assert.doesNotMatch(Slots.machine({ result }), /win|pay|odds|score|jackpot|result/iu);
	}
});
