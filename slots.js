/*!
 * slots-lite — a procedural slot machine as an SVG string.
 * MIT © 301ST (https://301.st) · for spintax.net
 *
 * One file, ES5, zero dependencies. Works as a <script> (defines `Slots`) and as a CommonJS
 * module (Node, bundlers) — ADR 001. The spec is docs/README.md: change the doc before the code.
 * The colour engine and the seed machinery are the family's, ported unchanged from cards-lite
 * (which took them from roulette-lite and hexagons-lite); a fixture test pins that they agree.
 */
(function (root, factory) {
	var api = factory();
	if (typeof module === 'object' && module.exports) module.exports = api;
	else root.Slots = api;
})(typeof self !== 'undefined' ? self : this, function () {
	'use strict';

	var NS = 'http://www.w3.org/2000/svg';
	var DEFAULT_BRAND = ['#00abf3', '#d6af3c', '#a91455'];
	// machine space: origin at the centre of the payline, y down (ADR 003). Provisional until M2.
	var CW = 200, GAP = 16, R = 260, VIEW = 60 * Math.PI / 180, STEP = 40 * Math.PI / 180, LEN = 20;

	// ── numbers and markup ──────────────────────────────────────────────────

	// Round, then String: no exponent notation, and no "-0" (it is a different string from "0").
	function n(v, d) {
		var p = Math.pow(10, d || 0), r = Math.round(v * p) / p;
		return String(r === 0 ? 0 : r);
	}
	function esc(s) {
		return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}
	// attrs is a flat [name, value, …] list; a null value drops the attribute
	function el(tag, attrs, inner) {
		var s = '<' + tag;
		for (var i = 0; i < attrs.length; i += 2) if (attrs[i + 1] != null) s += ' ' + attrs[i] + '="' + attrs[i + 1] + '"';
		return inner == null ? s + '/>' : s + '>' + inner + '</' + tag + '>';
	}

	// ── seeds ───────────────────────────────────────────────────────────────

	function fnv(str) {
		var h = 0x811c9dc5;
		for (var i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 0x01000193);
		return h >>> 0;
	}
	function fmix(h) {
		h = Math.imul(h ^ h >>> 16, 0x85ebca6b);
		h = Math.imul(h ^ h >>> 13, 0xc2b2ae35);
		return (h ^ h >>> 16) >>> 0;
	}
	function mulberry(a) {
		return function () {
			a = (a + 0x6D2B79F5) >>> 0;
			var x = Math.imul(a ^ (a >>> 15), 1 | a);
			x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
			return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
		};
	}
	// Every parameter reads its OWN stream, keyed by name. Nothing shares a cursor, so adding a
	// parameter later never re-rolls an existing machine (the hexagons lesson).
	function streams(seed) {
		var s = typeof seed === 'number' ? seed >>> 0 : fnv(String(seed));
		return function (key) { return mulberry(fmix(s ^ Math.imul(fnv(key), 0x9E3779B9))); };
	}

	// ── auto-palette: sRGB <-> CIE LCh(ab), D65 — ported unchanged from hexagons ──

	function parseColor(str) {
		str = String(str).trim();
		if (str.charAt(0) === '#') {
			var h = str.slice(1);
			if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
			var v = parseInt(h, 16);
			return [v >> 16 & 255, v >> 8 & 255, v & 255];
		}
		var m = str.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
		return m ? [+m[1], +m[2], +m[3]] : [255, 255, 255];
	}
	function toHex(c) {
		return '#' + ((1 << 24) + ((c[0] | 0) << 16) + ((c[1] | 0) << 8) + (c[2] | 0)).toString(16).slice(1);
	}
	function s2l(u) { u /= 255; return u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4); }
	function l2s(u) { return 255 * (u <= 0.0031308 ? u * 12.92 : 1.055 * Math.pow(u, 1 / 2.4) - 0.055); }
	function fwd(t) { return t > 216 / 24389 ? Math.pow(t, 1 / 3) : (24389 / 27 * t + 16) / 116; }
	function inv(t) { var c = t * t * t; return c > 216 / 24389 ? c : (116 * t - 16) * 27 / 24389; }

	function rgb2lch(rgb) {
		var r = s2l(rgb[0]), g = s2l(rgb[1]), b = s2l(rgb[2]);
		var x = (0.41246 * r + 0.35758 * g + 0.18044 * b) / 0.95047;
		var y = 0.21267 * r + 0.71515 * g + 0.07218 * b;
		var z = (0.01933 * r + 0.11919 * g + 0.9503 * b) / 1.08883;
		var fx = fwd(x), fy = fwd(y), fz = fwd(z);
		var L = 116 * fy - 16, A = 500 * (fx - fy), B = 200 * (fy - fz);
		var C = Math.sqrt(A * A + B * B);
		var H = Math.atan2(B, A) * 180 / Math.PI;
		return [L, C, (H + 360) % 360];
	}
	function lch2lin(L, C, H) {
		var A = C * Math.cos(H * Math.PI / 180), B = C * Math.sin(H * Math.PI / 180);
		var fy = (L + 16) / 116, fx = fy + A / 500, fz = fy - B / 200;
		var x = inv(fx) * 0.95047, y = inv(fy), z = inv(fz) * 1.08883;
		return [
			3.24045 * x - 1.53714 * y - 0.49853 * z,
			-0.96927 * x + 1.87601 * y + 0.04156 * z,
			0.05564 * x - 0.20403 * y + 1.05723 * z
		];
	}
	// Gamut policy: hold L and H, reduce C until inside sRGB. Never channel-clip — clipping
	// shifts hue, and hue is the brand's identity.
	function lch2rgb(L, C, H) {
		var lin = lch2lin(L, C, H), lo = 0, hi = C, i;
		if (!inGamut(lin)) {
			for (i = 0; i < 20; i++) {
				var mid = (lo + hi) / 2;
				lin = lch2lin(L, mid, H);
				if (inGamut(lin)) lo = mid; else hi = mid;
			}
			lin = lch2lin(L, lo, H);
		}
		return [clamp255(l2s(lin[0])), clamp255(l2s(lin[1])), clamp255(l2s(lin[2]))];
	}
	function inGamut(lin) {
		for (var i = 0; i < 3; i++) if (lin[i] < -0.0005 || lin[i] > 1.0005) return false;
		return true;
	}
	function clamp255(v) { return Math.max(0, Math.min(255, Math.round(v))); }
	function lum(rgb) { return 0.2126 * s2l(rgb[0]) + 0.7152 * s2l(rgb[1]) + 0.0722 * s2l(rgb[2]); }
	function contrast(a, b) {
		var x = lum(a), y = lum(b);
		return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
	}
	// Repair by shifting L only (fidelity: hue and chroma are the brand's)
	function ensureContrast(rgb, bgRgb, min, dir) {
		if (contrast(rgb, bgRgb) >= min) return rgb;
		var lch = rgb2lch(rgb);
		for (var L = lch[0]; L >= 2 && L <= 98; L += dir * 2) {
			var c = lch2rgb(L, lch[1], lch[2]);
			if (contrast(c, bgRgb) >= min) return c;
		}
		return rgb;
	}
	// hexagons' derive(), unchanged: same input, same colours as Hexagons.palette().
	function derive(brand, theme) {
		var arr = (typeof brand === 'string' ? [brand] : brand).map(function (x) {
			return rgb2lch(parseColor(x));
		});
		var chrom = [];
		for (var i = 0; i < arr.length; i++) if (arr[i][1] >= 12) chrom.push(arr[i]);
		var neutral = chrom.length === 0;
		var prim = neutral ? [50, 0, 0] : chrom[0];
		var acc = chrom.length > 1 ? chrom[1] : [0, prim[1], (prim[2] + 40) % 360];
		var hotH = (chrom.length > 2 ? chrom[2] : prim)[2];
		var C = prim[1], H = prim[2], light = theme === 'light';

		var bg = light
			? lch2rgb(97, neutral ? 0 : 3, H)
			: lch2rgb(6, Math.min(C * 0.2, 10), H);
		var halo = light
			? lch2rgb(92, Math.min(C * 0.2, 8), H)
			: lch2rgb(12, Math.min(C * 0.3, 15), H);
		var Ls = light ? [72, 52, 32] : [32, 58, 82];
		var dir = light ? -1 : 1;
		var stops = [
			ensureContrast(lch2rgb(Ls[0], C * 0.9, H), bg, 1.5, dir),
			ensureContrast(lch2rgb(Ls[1], C, H), bg, 2.5, dir),
			ensureContrast(lch2rgb(Ls[2], C * 0.55, H), bg, 5, dir)
		];
		var accent = ensureContrast(lch2rgb(light ? 45 : 70, acc[1], acc[2]), bg, 3, dir);
		var hot = ensureContrast(
			lch2rgb(light ? 28 : 92, neutral ? 0 : (light ? 24 : 12), hotH), bg, 7, dir);

		return { colors: stops, accent: accent, hot: hot, background: bg, halo: halo };
	}

	// ── colour: a classic machine from the brand (ADR 005, decided at M1) ──

	// cards-lite's capture with the machine's four windows: every chromatic brand colour takes the
	// role nearest its hue, nearest pairs settle first, each colour and each role at most once.
	// Four roles are never a brand colour — reels are paper, the bar is the one black symbol, the
	// shade and rules are ink, the trim is metal. The first colour left over is the cabinet.
	function roles(brand, theme) {
		var list = brand == null ? DEFAULT_BRAND : typeof brand === 'string' ? [brand] : brand;
		var chrom = [], grey = null, pairs = [], got = [], used = [], free = [], i, r;
		// violet is narrow so the blues (H 296–303) stay free for the cabinet (ADR 005, M1)
		var ROLE = [[28, 40], [85, 25], [325, 20], [145, 40]]; // red, gold, violet, green
		for (i = 0; i < list.length; i++) {
			var c = rgb2lch(parseColor(list[i]));
			if (c[1] >= 12) chrom.push({ lch: c, hex: list[i] });
			else if (!grey) grey = list[i];
		}
		for (i = 0; i < chrom.length; i++) {
			for (r = 0; r < 4; r++) {
				var d = Math.abs(chrom[i].lch[2] - ROLE[r][0]) % 360;
				d = Math.min(d, 360 - d);
				if (d <= ROLE[r][1]) pairs.push([d, i, r]);
			}
		}
		// ties broken by colour then role, so the order never depends on the engine's sort
		pairs.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1] || a[2] - b[2]; });
		for (i = 0; i < pairs.length; i++) {
			if (!got[pairs[i][2]] && !used[pairs[i][1]]) { got[pairs[i][2]] = chrom[pairs[i][1]].lch; used[pairs[i][1]] = 1; }
		}
		for (i = 0; i < chrom.length; i++) if (!used[i]) free.push(chrom[i]);
		var gold = got[1];
		var key = free[0] ? free[0].lch : grey || !chrom.length ? [50, 0, 0] : chrom[0].lch;
		var dk = theme === 'light' ? 'light' : 'dark';
		// the cabinet may reuse a captured hue — the card back's cascade
		var body = derive(free[0] ? free[0].hex : grey || (chrom.length ? chrom[0].hex : list), dk);
		// the field the machine sits on is the family's palette of the whole brand, so a machine
		// on a hexagon field reads as one picture (pinned by the parity fixture)
		var field = derive(list, dk);
		var bC = key[1], bH = key[2];
		var clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };
		// an unclaimed role leans toward the brand by at most 15 degrees (cards-lite, M1) — all but
		// gold, which leaned orange beside a blue brand and olive beside a green one (ADR 005, M1)
		var tint = function (hue) {
			if (bC < 12 || hue === 85) return hue;
			var t = ((bH - hue + 540) % 360) - 180;
			return (hue + clamp(t, -15, 15) + 360) % 360;
		};
		var strip = lch2rgb(96.5, Math.min(bC * 0.08, 4), bH);
		var role = function (c, L, fallbackC, lo, hi, hue, min) {
			return ensureContrast(c ? lch2rgb(L, c[1], c[2]) : lch2rgb(L, clamp(fallbackC, lo, hi), tint(hue)), strip, min, -1);
		};
		return {
			red: role(got[0], 46, bC * 1.2, 50, 75, 28, 3),
			// gold is lighter than a suit colour and guarded at 2.0, like cards' gilt: gold on paper
			// is low-contrast by nature; a bell and a lemon tell themselves apart by shape (M1)
			gold: role(gold, 62, bC, 45, 60, 85, 2),
			violet: role(got[2], 40, bC * 1.1, 40, 65, 325, 3),
			green: role(got[3], 45, bC, 35, 60, 145, 3),
			bar: ensureContrast(lch2rgb(14, Math.min(bC * 0.15, 6), bH), strip, 7, -1),
			strip: strip,
			ink: ensureContrast(lch2rgb(34, Math.min(bC * 0.25, 10), bH), strip, 3, -1),
			// metal: chrome when the brand brings a grey or no hue at all, otherwise brass
			trim: lch2rgb(66, grey || !chrom.length ? 0 : gold ? gold[1] * 0.5 : 25, gold ? gold[2] : 85),
			// the gem sits on a reel, so it takes the cabinet's hue, not the cabinet's colour: under the
			// light theme that is a pastel the paper would swallow
			gem: ensureContrast(lch2rgb(45, bC < 12 ? 0 : clamp(bC, 40, 70), bH), strip, 3, -1),
			body: body.colors[0],
			stroke: field.colors, background: field.background, halo: field.halo
		};
	}

	function palette(brand, opts) {
		var r = roles(brand, opts && opts.theme), out = {};
		for (var k in r) out[k] = k === 'stroke' ? r[k].map(toHex) : toHex(r[k]);
		return out;
	}

	// seeded ids: [a-z][a-z0-9]{5}, never repeated within one picture — cards-lite's, unchanged
	function tokens(S, salt) {
		var r = S('ids' + (salt || '')), used = {}, AZ = 'abcdefghijklmnopqrstuvwxyz', AZ09 = AZ + '0123456789';
		return function () {
			var tk;
			do {
				tk = AZ.charAt(Math.floor(r() * 26));
				for (var i = 0; i < 5; i++) tk += AZ09.charAt(Math.floor(r() * 36));
			} while (used[tk]);
			used[tk] = 1;
			return tk;
		};
	}

	// ── the symbols (ADR 004) ───────────────────────────────────────────────

	// The classic set: eight fixed paths on the 160-unit em, origin at its centre, integers only.
	// seven · cherries · their stem · bell · lemon · plum · the bar's plaque · the word BAR, the last
	// a stroked skeleton like cards' rank glyphs. Nothing else in the picture is a constant `d`.
	var D = {
		seven: 'M-46-64H48V-40L4 64H-30L14-36H-46Z',
		cherry: 'M-54 34a26 26 0 1 0 52 0a26 26 0 1 0-52 0M2 26a26 26 0 1 0 52 0a26 26 0 1 0-52 0',
		stem: 'M-28 8Q-18-40 30-62M28 0Q22-34 30-62',
		bell: 'M0-62C-30-62-40-32-42 0L-58 30H58L42 0C40-32 30-62 0-62ZM-12 44a12 12 0 1 0 24 0a12 12 0 1 0-24 0M-7-70a7 7 0 1 0 14 0a7 7 0 1 0-14 0',
		lemon: 'M-72 0L-60-8Q-50-44 0-44T60-8L72 0L60 8Q50 44 0 44T-60 8Z',
		plum: 'M6-52C40-56 54-24 50 14 46 48 24 66 0 64S-50 40-50 6C-50-28-30-56 6-52ZM3-52Q6-64 18-70L21-66Q12-62 11-52Z',
		plaque: 'M-60-20H60Q68-20 68-12V12Q68 20 60 20H-60Q-68 20-68 12V-12Q-68-20-60-20Z',
		word: 'M-40 12V-12H-29Q-22-12-22-6T-29 0H-40M-29 0Q-20 0-20 6T-29 12H-40M-11 12L0-12L11 12M-6 4H6M22 12V-12H33Q40-12 40-6T33 0H22M31 0L40 12'
	};
	var CLASSIC = ['seven', 'bar', 'bell', 'cherry', 'lemon', 'plum'], PROC = ['gem', 'star', 'coin'];
	var WEIGHT = { seven: 1, bar: 2, bell: 2, cherry: 3, lemon: 3, plum: 3, gem: 2, star: 2, coin: 2 };
	var TINT = { seven: 'red', bar: 'bar', bell: 'gold', cherry: 'red', lemon: 'gold', plum: 'violet', gem: 'gem', star: 'gold', coin: 'gold' };

	// The body of a procedural symbol, from its own streams keyed by its name: the same star on
	// every reel under one seed, and never a constant `d` (the ADR 004 test requires both)
	function proc(name, c) {
		var u = function (k) { return c.S('sym:' + name + ':' + k)(); }, p = c.p, d = '', i, r;
		if (name === 'star') {
			var pts = 5 + Math.floor(u('points') * 4), inner = 0.38 + 0.17 * u('inner');
			for (i = 0; i < 2 * pts; i++) {
				var a = -Math.PI / 2 + i * Math.PI / pts;
				r = i & 1 ? 68 * inner : 68;
				d += (i ? 'L' : 'M') + n(r * Math.cos(a), p) + ' ' + n(r * Math.sin(a) + 4, p);
			}
			return { d: d + 'Z' };
		}
		if (name === 'coin') {
			// a disc of seeded size, and 1–3 rings struck into it in paper
			var rings = 1 + Math.floor(u('rings') * 3), step = 8 + 6 * u('step'), rim = 58 + 6 * u('rim');
			for (i = 0; i < rings; i++) d += circle(rim - 10 - i * step, p);
			return { d: circle(rim, p), lines: d };
		}
		// gem: a crown over a pavilion, cut into 5–8 facets
		var f = 5 + Math.floor(u('facets') * 4), t = 30 + 14 * u('table'), deep = 44 + 20 * u('depth'), g = -10, top = -46;
		d = 'M' + n(-t, p) + ' ' + top + 'H' + n(t, p) + 'L66 ' + g + 'L0 ' + n(deep, p) + 'L-66 ' + g + 'Z';
		var lines = 'M-66 ' + g + 'H66';
		for (i = 1; i < f; i++) {
			var x = -66 + 132 * i / f;
			lines += 'M' + n(x * t / 66, p) + ' ' + top + 'L' + n(x, p) + ' ' + g + 'L0 ' + n(deep, p);
		}
		return { d: d, lines: lines };
	}
	function circle(r, p) {
		r = n(r, p);
		return 'M-' + r + ' 0a' + r + ' ' + r + ' 0 1 0 ' + 2 * r + ' 0a' + r + ' ' + r + ' 0 1 0-' + 2 * r + ' 0';
	}

	// flat fills, line strokes — one idiom for every symbol body, so `line` costs no path data
	function paint(c, col) {
		return c.flat ? ['fill', col] : ['fill', 'none', 'stroke', col, 'stroke-width', n(6 * c.w, 2)];
	}

	// A symbol as a group in <defs>, emitted once per picture however many cells show it. Its paths
	// carry no colour — the <use> paints — which is what lets the shade reuse the same `d`.
	function sym(name, bars, c) {
		return c.add(name + (name === 'bar' ? bars : ''), function () {
			var col = c.col(TINT[name]), pr = PROC.indexOf(name) >= 0 ? proc(name, c) : null;
			var body = c.add('d:' + name, function () {
				return el('path', ['id', '%', 'd', pr ? pr.d : D[name === 'bar' ? 'plaque' : name]]);
			});
			var paintBody = function (y) {
				var out = el('use', ['href', '#' + body, 'y', y || null].concat(paint(c, col)));
				// the shade: the same `d` again in black, masked to where a copy of it shifted up and
				// right does not reach — a crescent on the lower left. An overlay, so a pinned colour
				// is shaded without being parsed; flat only, since line has no fill to shade.
				if (c.flat) {
					var m = c.add('m:' + name, function () {
						return el('mask', ['id', '%'], el('use', ['href', '#' + body, 'fill', '#fff']) +
							el('use', ['href', '#' + body, 'x', 12, 'y', -10, 'fill', '#000']));
					});
					out += el('g', ['transform', y ? 'translate(0 ' + y + ')' : null],
						el('use', ['href', '#' + body, 'fill', '#000', 'fill-opacity', '.22', 'mask', 'url(#' + m + ')']));
				}
				return out;
			};
			var inner = '', i;
			if (name === 'bar') {
				var word = c.add('d:word', function () {
					return el('path', ['id', '%', 'd', D.word, 'fill', 'none', 'stroke-width', 6, 'stroke-linecap', 'round', 'stroke-linejoin', 'round']);
				});
				for (i = 0; i < bars; i++) {
					var y = (i - (bars - 1) / 2) * 46;
					inner += paintBody(y) + el('use', ['href', '#' + word, 'y', y || null, 'stroke', c.flat ? c.col('strip') : col]);
				}
			} else {
				inner = paintBody(0);
				if (name === 'cherry') inner += el('path', ['d', D.stem, 'fill', 'none', 'stroke', c.col('green'), 'stroke-width', 7, 'stroke-linecap', 'round']);
				if (pr && pr.lines) {
					inner += el('path', ['d', pr.lines, 'fill', 'none', 'stroke', c.flat ? c.col('strip') : col,
						'stroke-width', name === 'gem' ? 3 : 4, 'stroke-opacity', c.flat ? '.6' : null, 'stroke-linejoin', 'round']);
				}
			}
			return el('g', ['id', '%'], inner);
		});
	}

	// ── the context ─────────────────────────────────────────────────────────

	function context(o, what) {
		var S = streams(o.seed == null ? 1 : o.seed), r = roles(o.brand, o.theme), seen = {}, key = what;
		var c = {
			o: o, S: S, r: r, defs: '',
			p: o.precision == null ? 0 : o.precision,
			w: o.weight == null ? 1 : o.weight,
			flat: o.style !== 'line',
			col: function (role) {
				var pin = o[role];
				return pin != null && pin !== 'auto' ? esc(pin) : toHex(r[role]);
			}
		};
		// Ids are keyed by WHAT IS DRAWN — the geometry and every colour a def carries — so two
		// different machines under one seed on one page never share an id (cards-lite's lesson).
		// salt remains for the same picture twice.
		for (var k in TINT) key += c.col(TINT[k]);
		key += c.col('strip') + c.col('green') + c.col('ink') + c.flat + c.w + c.p;
		c.tk = tokens(S, (o.salt || '') + key);
		c.add = function (k, make) {
			if (!seen[k]) { var id = c.tk(), m; seen[k] = id; m = make(); c.defs += m.replace('"%"', '"' + id + '"'); }
			return seen[k];
		};
		return c;
	}

	function wrap(o, c, box, inner) {
		var a11y = o.title ? ['role', 'img', 'aria-label', esc(o.title)] : ['aria-hidden', 'true'];
		var vb = box.map(function (v) { return n(v, c.p); }).join(' ');
		return el('svg', ['xmlns', NS, 'viewBox', vb, 'width', o.size == null ? null : n(o.size),
			'height', o.size == null ? null : n(o.size * box[3] / box[2])].concat(a11y),
		(c.defs ? el('defs', [], c.defs) : '') + inner);
	}

	// ── the machine ─────────────────────────────────────────────────────────

	// A reel is a cyclic strip of LEN positions keyed by its index, so reels append: reel 2 of a
	// five-reel machine is reel 2 of the three-reel one. The symbol and the bar count read separate
	// streams, one draw each per position, so neither can shift the other.
	function strip(i, c) {
		var names = c.o.classic === false ? PROC : CLASSIC.concat(PROC), tot = 0, out = [], j, k;
		var rs = c.S('reel:' + i + ':strip'), rb = c.S('reel:' + i + ':bars');
		for (j = 0; j < names.length; j++) tot += WEIGHT[names[j]];
		for (j = 0; j < LEN; j++) {
			var v = rs() * tot;
			for (k = 0; v >= WEIGHT[names[k]]; k++) v -= WEIGHT[names[k]];
			out.push([names[k], 1 + Math.floor(rb() * 3)]);
		}
		return out;
	}

	function machine(opts) {
		var o = opts || {}, k = Math.max(3, Math.min(5, Math.round(o.reels) || 3));
		var c = context(o, 'machine' + k + (o.classic === false)), p = c.p;
		var ww = k * CW + (k - 1) * GAP, wh = 2 * R * Math.sin(VIEW), x0 = -ww / 2, y0 = -wh / 2;
		var bz = 24, bx = x0 - bz, by = y0 - bz, bw = ww + 2 * bz, bh = wh + 2 * bz;
		var box = [bx - 60, by - 200, bw + 120, bh + 360];
		var rx = 24 + c.S('cab:rx')() * 24;
		// flat fills the body; line draws it as a rule, the airy treatment. Under the light theme the
		// body is a rule unless flat is asked for: filled, it was a pastel field on a white page (M1)
		var body = (o.style ? c.flat : o.theme !== 'light')
			? ['fill', c.col('body')]
			: ['fill', 'none', 'stroke', c.col('body'), 'stroke-width', n(6 * c.w, p)];
		var out = el('rect', ['x', n(box[0] + 8, p), 'y', n(box[1] + 8, p), 'width', n(box[2] - 16, p),
			'height', n(box[3] - 16, p), 'rx', n(rx, p)].concat(body));
		out += el('rect', ['x', n(bx, p), 'y', n(by, p), 'width', n(bw, p), 'height', n(bh, p),
			'rx', n(rx / 2, p), 'fill', c.col('trim')]);
		// the window: ink between the reels, the paper strips, the cells projected onto the drum
		// (ADR 003: y = R sin θ, sy = cos θ, and nothing else knows it is a cylinder), one shade over
		// all of it, and the clip that makes the neighbours' halves correct
		var win = el('rect', ['x', n(x0, p), 'y', n(y0, p), 'width', n(ww, p), 'height', n(wh, p), 'fill', c.col('ink')]);
		for (var i = 0; i < k; i++) {
			var x = x0 + i * (CW + GAP), s = strip(i, c), stop = Math.floor(c.S('reel:' + i + ':stop')() * LEN);
			win += el('rect', ['x', n(x, p), 'y', n(y0, p), 'width', CW, 'height', n(wh, p), 'fill', c.col('strip')]);
			for (var row = -1; row <= 1; row++) {
				var cell = s[(stop + row + LEN) % LEN], th = row * STEP;
				win += el('use', ['href', '#' + sym(cell[0], cell[1], c), 'transform', 'translate(' + n(x + CW / 2, p) +
					' ' + n(R * Math.sin(th), p) + ')' + (row ? ' scale(1 ' + n(Math.cos(th), 3) + ')' : '')]);
			}
		}
		var shade = c.add('shade', function () {
			return el('linearGradient', ['id', '%', 'x2', 0, 'y2', 1],
				el('stop', ['stop-color', c.col('ink'), 'stop-opacity', '.55']) +
				el('stop', ['offset', '.5', 'stop-color', c.col('ink'), 'stop-opacity', 0]) +
				el('stop', ['offset', 1, 'stop-color', c.col('ink'), 'stop-opacity', '.55']));
		});
		win += el('rect', ['x', n(x0, p), 'y', n(y0, p), 'width', n(ww, p), 'height', n(wh, p), 'fill', 'url(#' + shade + ')']);
		var clip = c.add('window', function () {
			return el('clipPath', ['id', '%'], el('rect', ['x', n(x0, p), 'y', n(y0, p), 'width', n(ww, p), 'height', n(wh, p)]));
		});
		out += el('g', ['clip-path', 'url(#' + clip + ')'], win);
		if (o.payline !== false) {
			// a rule, like the strips are rects: a constant `d` here would widen ADR 004 unseen
			out += el('line', ['x1', n(x0, p), 'x2', n(-x0, p), 'stroke', c.col('ink'), 'stroke-width', n(4 * c.w, p)]);
		}
		return wrap(o, c, box, out);
	}

	// One symbol on its em — an icon. The name is the caller's, or the seed's.
	function symbol(opts) {
		var o = opts || {}, all = o.classic === false ? PROC : CLASSIC.concat(PROC);
		var name = all.indexOf(o.symbol) >= 0 ? o.symbol
			: all[Math.floor(streams(o.seed == null ? 1 : o.seed)('symbol')() * all.length)];
		var bars = Math.max(1, Math.min(3, Math.round(o.bars) || 1));
		var c = context(o, 'symbol' + name + bars);
		return wrap(o, c, [-80, -80, 160, 160], el('use', ['href', '#' + sym(name, bars, c)]));
	}

	return { machine: machine, symbol: symbol, palette: palette };
});
