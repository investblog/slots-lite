// M4: the spin and init(). The spin's contract is that it is removable: speed 0 is the static
// bytes, switching it on renames nothing in the static picture, and reduced motion leaves the
// reader looking at the result. init() is checked against a stand-in element — no DOM needed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Slots from '../slots.js';

const spin = (o) => Slots.machine({ motion: 'spin', ...o });
// the static body back out of a spinning one: no <style>, no class groups, no extras
// (under rows: 1 the window ends above 167, so the extras begin there)
const still = (svg, one) => svg.slice(svg.indexOf('</defs>'))
	.replace(/<style>.*?<\/style>/u, '')
	.replace(/<g class="[a-z0-9]+">(.*?)<\/g>(?=<rect|<\/g>)/gu, '$1')
	.replace(/<use href="#[a-z0-9]+" transform="translate\(-?\d+ (\d{3,})\)"\/>/gu, (m, y) => (Number(y) > (one ? 0 : 200) ? '' : m));

test('speed 0 and no motion are the static bytes exactly', () => {
	for (let seed = 1; seed <= 10; seed++) {
		const plain = Slots.machine({ seed });
		assert.equal(spin({ seed, speed: 0 }), plain);
		assert.equal(Slots.machine({ seed, motion: false }), plain);
	}
});

test('switching the spin on renames nothing and moves nothing in the static picture', () => {
	for (let seed = 1; seed <= 30; seed++) {
		for (const o of [{}, { reels: 5 }, { rows: 1 }, { result: 'jackpot' }, { theme: 'light' }]) {
			const moving = spin({ seed, ...o }), plain = Slots.machine({ seed, ...o });
			// the static defs are an untouched prefix: the extras' symbols are appended after them
			assert.ok(moving.startsWith(plain.slice(0, plain.indexOf('</defs>'))), `defs, seed ${seed} ${JSON.stringify(o)}`);
			assert.equal(still(moving, o.rows === 1), plain.slice(plain.indexOf('</defs>')), `body, seed ${seed} ${JSON.stringify(o)}`);
		}
	}
});

test('the spin: one keyframe and class per reel, down from a whole number of cells, left to right', () => {
	for (let seed = 1; seed <= 30; seed++) {
		const svg = spin({ seed, reels: 5 }), css = svg.match(/<style>(.*?)<\/style>/u)[1];
		const kfs = [...css.matchAll(/@keyframes ([a-z0-9]+)\{from\{transform:translateY\((-\d+)px\)\}\}/gu)];
		assert.equal(kfs.length, 5);
		for (const [, , dy] of kfs) {
			const cells = -Number(dy) / 167;
			assert.ok(Number.isInteger(cells) && cells >= 8 && cells <= 14, `seed ${seed}: ${dy}`);
		}
		const runs = [...css.matchAll(/\.([a-z0-9]+)\{animation:([a-z0-9]+) ([\d.]+)s /gu)];
		assert.equal(runs.length, 5);
		for (let i = 1; i < 5; i++) assert.ok(Number(runs[i][3]) > Number(runs[i - 1][3]), 'reels stop left to right');
		// every class is gated by reduced motion, and the animated group carries no transform
		const gate = css.match(/@media\(prefers-reduced-motion:reduce\)\{(.*?)\{animation:none\}\}/u)[1];
		assert.deepEqual(gate.split(',').sort(), runs.map((r) => '.' + r[1]).sort());
		for (const [, cls] of runs) assert.match(svg, new RegExp(`<g class="${cls}">`, 'u'));
		assert.doesNotMatch(svg, /<g class="[^"]+" transform=/u);
	}
	// speed divides the time
	const t = (s) => Number(spin({ seed: 1, speed: s }).match(/animation:[a-z0-9]+ ([\d.]+)s/u)[1]);
	assert.equal(t(2), t(1) / 2);
});

test('the extras a reel carries are its own strip, and the spin keeps its names off another machine', () => {
	// two spinning machines under one seed on one page share no motion name
	const names = (svg) => new Set([...svg.match(/<style>(.*?)<\/style>/u)[1].matchAll(/@keyframes ([a-z0-9]+)|\.([a-z0-9]+)\{/gu)]
		.map((m) => m[1] || m[2]));
	const a = names(spin({ seed: 1 })), b = names(spin({ seed: 1, result: 'jackpot' }));
	assert.equal([...a].filter((x) => b.has(x)).length, 0);
	// the extras continue the strip: a reel's cells are the same whether or not it spins
	for (let seed = 1; seed <= 10; seed++) {
		const svg = spin({ seed });
		const groups = [...svg.matchAll(/<g class="[a-z0-9]+">(.*?)<\/g>/gu)].map((m) => m[1]);
		assert.equal(groups.length, 3);
		for (const g of groups) {
			const ys = [...g.matchAll(/translate\(-?\d+ (-?\d+)\)/gu)].map((m) => Number(m[1]));
			assert.deepEqual(ys.slice(0, 3), [-167, 0, 167]);
			ys.slice(3).forEach((y, j) => assert.equal(y, 167 * (j + 2)));
		}
	}
});

test('init(): draws into an element, merges options across set(), and destroy() clears it', () => {
	const host = { innerHTML: '' };
	const h = Slots.init(host, { seed: 4, brand: '#d97706' });
	assert.equal(host.innerHTML, Slots.machine({ seed: 4, brand: '#d97706' }));
	h.set({ result: 'jackpot' });
	assert.equal(host.innerHTML, Slots.machine({ seed: 4, brand: '#d97706', result: 'jackpot' }), 'a pin survives set()');
	assert.deepEqual(h.get(), { seed: 4, brand: '#d97706', result: 'jackpot' });
	h.get().seed = 9;
	assert.equal(h.get().seed, 4, 'get() returns a copy');
	assert.equal(h.el, host);
	h.destroy();
	assert.equal(host.innerHTML, '');
	// a selector that finds nothing is not an error
	globalThis.document = { querySelector: () => null };
	try { assert.equal(Slots.init('#missing'), null); } finally { delete globalThis.document; }
});

test('two spins that differ only in speed share no motion name, so neither times the other', () => {
	const names = (svg) => new Set([...svg.match(/<style>(.*?)<\/style>/u)[1].matchAll(/@keyframes ([a-z0-9]+)|\.([a-z0-9]+)\{/gu)]
		.map((m) => m[1] || m[2]));
	for (let seed = 1; seed <= 10; seed++) {
		const a = names(spin({ seed })), b = names(spin({ seed, speed: 2 }));
		assert.equal([...a].filter((x) => b.has(x)).length, 0, `seed ${seed}`);
	}
});

test('at rest no extra shows: each one lies wholly below the window, in both row counts', () => {
	for (let seed = 1; seed <= 20; seed++) {
		for (const [one, half] of [[false, 225], [true, 106]]) {
			const svg = spin({ seed, rows: one ? 1 : 3 });
			for (const g of svg.matchAll(/<g class="[a-z0-9]+">(.*?)<\/g>/gu)) {
				const ys = [...g[1].matchAll(/translate\(-?\d+ (-?\d+)\)/gu)].map((m) => Number(m[1]));
				// the landing cells are the first one or three; the rest are extras, 80 units tall above centre
				for (const y of ys.slice(one ? 1 : 3)) assert.ok(y - 80 >= half, `seed ${seed} rows ${one ? 1 : 3}: an extra at ${y}`);
			}
		}
	}
});
