// M3: the cabinet. What a browser shows and a test can still pin: the cabinet style reaches every
// part, the lever and its ball stay inside the frame, the lattice is the one asked for, one row is
// one row, and the cabinet's numbers are its own streams.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Slots from '../slots.js';

// the body only: <defs> holds rects and paths of its own (cards-lite, M5)
const body = (svg) => svg.slice(svg.indexOf('</defs>') + 7);
const viewBox = (svg) => svg.match(/viewBox="([^"]+)"/u)[1].split(' ').map(Number);

test('the cabinet style reaches every part: body, marquee, panel and tray are rules under light', () => {
	const count = (o) => {
		const p = Slots.palette(o.brand, { theme: o.theme });
		return (body(Slots.machine(o)).match(new RegExp(`stroke="${p.outline}"`, 'gu')) || []).length;
	};
	for (let seed = 1; seed <= 20; seed++) {
		// the body, the marquee's glass, the panel and the tray: four rules, or none
		assert.equal(count({ seed, theme: 'light' }), 4, `light, seed ${seed}`);
		assert.equal(count({ seed, style: 'line' }), 4, `line, seed ${seed}`);
		assert.equal(count({ seed }), 0, `dark flat, seed ${seed}`);
		assert.equal(count({ seed, theme: 'light', style: 'flat' }), 0, `light flat, seed ${seed}`);
	}
});

test('outline holds its contrast against the page in both themes, where the body colour did not', () => {
	const lum = (hex) => {
		const [r, g, b] = hex.slice(1).match(/../gu).map((h) => parseInt(h, 16) / 255)
			.map((u) => (u <= 0.04045 ? u / 12.92 : ((u + 0.055) / 1.055) ** 2.4));
		return 0.2126 * r + 0.7152 * g + 0.0722 * b;
	};
	const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
	for (const brand of [undefined, '#1d4ed8', '#d97706', '#2f9e44', '#7c3aed', '#8a8a8a', '#0f172a', '#fde047']) {
		for (const theme of ['dark', 'light']) {
			const p = Slots.palette(brand, { theme });
			assert.ok(cr(p.outline, p.background) >= 2.4, `${brand} ${theme}: ${p.outline} on ${p.background}`);
		}
	}
});

test('the lever and its ball stay inside the frame, and lever: false removes them', () => {
	for (let seed = 1; seed <= 60; seed++) {
		for (const o of [{ seed }, { seed, rows: 1 }, { seed, reels: 5 }]) {
			const svg = Slots.machine(o), [x, y, w, h] = viewBox(svg), red = Slots.palette().red;
			const ball = body(svg).match(new RegExp(`<circle cx="(-?\\d+)" cy="(-?\\d+)" r="(\\d+)" fill="${red}"`, 'u'));
			assert.ok(ball, `seed ${seed}: a red ball`);
			const [cx, cy, r] = ball.slice(1).map(Number);
			assert.ok(cx + r <= x + w && cy - r >= y && cy + r <= y + h, `seed ${seed} ${JSON.stringify(o)}: ball out of frame`);
		}
		assert.doesNotMatch(Slots.machine({ seed, lever: false }), new RegExp(`fill="${Slots.palette().red}"(?! fill-opacity)[^>]*r=|<circle[^>]*fill="${Slots.palette().red}"`, 'u'));
	}
});

test('the frame holds the whole cabinet: nothing the body draws lies outside the viewBox', () => {
	for (let seed = 1; seed <= 60; seed++) {
		const svg = Slots.machine({ seed }), [x, y, w, h] = viewBox(svg);
		const b = body(svg), path = b.match(/<path d="([^"]+)"/u)[1];
		for (const m of b.matchAll(/<rect x="(-?\d+)" y="(-?\d+)" width="(\d+)" height="(\d+)"/gu)) {
			const [rx, ry, rw, rh] = m.slice(1).map(Number);
			assert.ok(rx >= x && ry >= y && rx + rw <= x + w && ry + rh <= y + h, `seed ${seed}: rect ${m[0]}`);
		}
		// the top of the body — a crown's step, or an arch's peak, which for a quadratic with its
		// control at the centre is halfway between the ends and the control — is inside the frame
		const vs = [...path.matchAll(/V(-?\d+)/gu)].map((m) => Number(m[1]));
		const arch = path.match(/V(-?\d+)Q0 (-?\d+)/u);
		const peak = Math.min(...vs, arch ? (Number(arch[1]) + Number(arch[2])) / 2 : Infinity);
		assert.ok(peak >= y, `seed ${seed}: the top at ${peak} above ${y}`);
	}
});

test('lattice: auto is seeded, a name is honoured, none draws no pattern', () => {
	const kinds = new Set();
	for (let seed = 1; seed <= 30; seed++) kinds.add(Slots.machine({ seed }).match(/<pattern [^>]*height="([\d.]+)"/u) ? 'x' : '');
	assert.ok(!kinds.has(''), 'every auto machine has a pattern');
	const segs = (svg) => (svg.match(/<pattern[^>]*><path d="([^"]+)"/u)[1].match(/M/gu) || []).length;
	// a tile's segment count names its kind: trigon 5, octagon 8, hex 7
	assert.equal(segs(Slots.machine({ lattice: 'trigon' })), 5);
	assert.equal(segs(Slots.machine({ lattice: 'octagon' })), 8);
	assert.equal(segs(Slots.machine({ lattice: 'hex' })), 7);
	const seen = new Set();
	for (let seed = 1; seed <= 30; seed++) seen.add(segs(Slots.machine({ seed })));
	assert.deepEqual([...seen].sort(), [5, 7, 8]);
	assert.doesNotMatch(Slots.machine({ lattice: 'none' }), /<pattern/u);
});

test('rows: 1 is one row — the payline — and a shorter window', () => {
	for (let seed = 1; seed <= 10; seed++) {
		const b = body(Slots.machine({ seed, rows: 1 }));
		const cells = [...b.matchAll(/<use href="#[a-z0-9]+" transform="translate\((-?\d+) (-?\d+)\)/gu)];
		assert.equal(cells.length, 3);
		assert.ok(cells.every((m) => m[2] === '0'));
		// 2·R·sin 24° = 211.5, rounded
		assert.match(Slots.machine({ seed, rows: 1 }), /<clipPath id="[a-z0-9]+"><rect x="-316" y="-106" width="632" height="212"/u);
	}
});

test('the cabinet varies with the seed: all three tops appear, and brand never moves it', () => {
	const tops = new Set();
	for (let seed = 1; seed <= 40; seed++) {
		const d = body(Slots.machine({ seed })).match(/<path d="([^"]+)"/u)[1];
		tops.add(d.includes('Q0 ') ? 'arch' : (d.match(/H/gu) || []).length > 3 ? 'crown' : 'flat');
		const cab = (svg) => body(svg).match(/<path d="([^"]+)"/u)[1];
		assert.equal(cab(Slots.machine({ seed, brand: '#d97706', theme: 'light' })), cab(Slots.machine({ seed })));
	}
	assert.deepEqual([...tops].sort(), ['arch', 'crown', 'flat']);
	// the side margin is seeded too: the body's left edge moves with the seed
	const lefts = new Set();
	for (let seed = 1; seed <= 40; seed++) lefts.add(body(Slots.machine({ seed })).match(/<path d="M(-?\d+)/u)[1]);
	assert.ok(lefts.size > 10, `the left edge took ${lefts.size} values`);
});

test('two machines on one page: an id they share always means the same thing', () => {
	// every def by id — the element's own markup, nested defs included
	const defs = (svg) => {
		const d = svg.slice(0, svg.indexOf('</defs>')), out = new Map();
		for (const m of d.matchAll(/<(\w+) id="([^"]+)"/gu)) {
			const at = m.index, close = d.indexOf(`</${m[1]}>`, at), self = d.indexOf('/>', at);
			const end = close >= 0 && (self < 0 || close < self || m[1] !== 'path') ? close : self;
			out.set(m[2], d.slice(at, end));
		}
		return out;
	};
	const V = [{}, { theme: 'light' }, { theme: 'light', style: 'flat' }, { style: 'line' }, { theme: 'light', style: 'line' }, { lattice: 'none' },
		{ lattice: 'trigon' }, { lattice: 'hex' }, { lattice: 'octagon' }, { rows: 1 }, { reels: 5 }, { lever: false },
		{ brand: '#d97706' }, { classic: false }, { weight: 2 }];
	for (const seed of [1, 7, 'spintax.net']) {
		const all = V.map((o) => defs(Slots.machine({ seed, ...o })));
		for (let i = 0; i < V.length; i++) {
			for (let j = i + 1; j < V.length; j++) {
				for (const [id, markup] of all[i]) {
					if (all[j].has(id)) assert.equal(all[j].get(id), markup, `seed ${seed}: #${id} differs between ${JSON.stringify(V[i])} and ${JSON.stringify(V[j])}`);
				}
			}
		}
	}
});
