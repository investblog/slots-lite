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
	var CW = 200, GAP = 16, R = 260, VIEW = 60 * Math.PI / 180;

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
			body: body.colors[0],
			stroke: field.colors, background: field.background, halo: field.halo
		};
	}

	function palette(brand, opts) {
		var r = roles(brand, opts && opts.theme), out = {};
		for (var k in r) out[k] = k === 'stroke' ? r[k].map(toHex) : toHex(r[k]);
		return out;
	}

	// ── the machine ─────────────────────────────────────────────────────────

	function context(o) {
		var r = roles(o.brand, o.theme);
		return {
			o: o, S: streams(o.seed == null ? 1 : o.seed), r: r,
			p: o.precision == null ? 0 : o.precision,
			w: o.weight == null ? 1 : o.weight,
			flat: o.style !== 'line',
			col: function (role) {
				var pin = o[role];
				return pin != null && pin !== 'auto' ? esc(pin) : toHex(r[role]);
			}
		};
	}

	function wrap(o, c, box, inner) {
		var a11y = o.title ? ['role', 'img', 'aria-label', esc(o.title)] : ['aria-hidden', 'true'];
		var vb = box.map(function (v) { return n(v, c.p); }).join(' ');
		return el('svg', ['xmlns', NS, 'viewBox', vb, 'width', o.size == null ? null : n(o.size),
			'height', o.size == null ? null : n(o.size * box[3] / box[2])].concat(a11y), inner);
	}

	// M0: the blank machine — body, bezel, window, paper strips and the payline — so the geometry
	// is on screen from the first day. Symbols (M2) and the cabinet's parts (M3) come later.
	function machine(opts) {
		var o = opts || {}, c = context(o), p = c.p;
		var k = Math.max(3, Math.min(5, Math.round(o.reels) || 3));
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
		out += el('rect', ['x', n(x0, p), 'y', n(y0, p), 'width', n(ww, p), 'height', n(wh, p), 'fill', c.col('ink')]);
		for (var i = 0; i < k; i++) {
			out += el('rect', ['x', n(x0 + i * (CW + GAP), p), 'y', n(y0, p), 'width', CW, 'height', n(wh, p),
				'fill', c.col('strip')]);
		}
		if (o.payline !== false) {
			out += el('path', ['d', 'M' + n(x0, p) + ' 0H' + n(-x0, p), 'stroke', c.col('ink'),
				'stroke-width', n(4 * c.w, p)]);
		}
		return wrap(o, c, box, out);
	}

	return { machine: machine, palette: palette };
});
