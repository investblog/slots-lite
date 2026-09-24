// The browser half of the gate, run by hand: `npm run gate:browser [-- --mutate]`.
//
// It serves the repo, opens test/verify.html in every engine it can find, and does it twice —
// once normally and once under prefers-reduced-motion, because the reduced path is a different
// branch of the page and was for a while only reasoned about.
//
// With --mutate it then breaks the library on purpose, one anchor at a time, and reports any
// check that never went red. That is the M5 lesson in executable form: five checks in this repo
// passed against a library that was broken in cards-lite, and the only thing that would have told us was
// watching them fail. Ported from cards-lite with its guards; only the mutations are this library's.
//
// **It writes to slots.js, so read this before changing it.** The original bytes are taken once,
// before anything is written, and put back from memory — never with `git checkout`, which
// restores the INDEX and would silently discard uncommitted work in the very file a person is
// most likely to be editing when they reach for this script. Restoration is wired to SIGINT,
// SIGTERM and exit as well as to the finally block, because a Ctrl-C between the write and the
// browser is otherwise a broken slots.js left on disk — and the first version of this header
// claimed to handle a crash while doing no such thing.
//
// Playwright is NOT a dependency of this package — the library ships with none, and CI runs the
// Node gate only. This script uses whatever playwright is already on the machine; if none is,
// it says so and exits 0, because a missing dev tool is not a failing library.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'slots.js');
const MUTATE = process.argv.includes('--mutate');

// taken before a single byte is written anywhere, and the only source of truth for putting it back
const ORIGINAL = fs.readFileSync(SRC);
let dirty = false;
function restore() {
	if (!dirty) return;
	fs.writeFileSync(SRC, ORIGINAL);
	dirty = false;
}
process.on('exit', restore);
for (const sig of ['SIGINT', 'SIGTERM']) {
	process.on(sig, () => { restore(); process.exit(130); });
}

function playwright() {
	const require = createRequire(import.meta.url);
	for (const id of ['playwright', 'playwright-core']) {
		try { return require(id); } catch { /* keep looking */ }
	}
	// the common case on this machine: playwright lives inside a globally installed MCP server
	try {
		// execSync, not execFileSync: npm is a .cmd on Windows, which Node refuses to spawn
		// without a shell — and a shell with an args array is the deprecated combination
		const root = execSync('npm root -g', { encoding: 'utf8' }).trim();
		return createRequire(path.join(root, '@playwright', 'mcp', 'package.json'))('playwright-core');
	} catch { return null; }
}

const TYPES = { '.html': 'text/html;charset=utf-8', '.js': 'text/javascript;charset=utf-8', '.css': 'text/css' };
function serve() {
	return new Promise((res) => {
		const s = http.createServer((req, rq) => {
			let f;
			// a bad %-escape throws out of the handler, which would take the process down past
			// every finally — and the path must stay inside the repo: this server is a dev tool,
			// not a file share
			try { f = path.resolve(ROOT, '.' + decodeURIComponent(req.url.split('?')[0])); } catch { f = null; }
			if (!f || (f !== ROOT && !f.startsWith(ROOT + path.sep))) { rq.writeHead(403); return rq.end('no'); }
			fs.readFile(f, (e, d) => {
				if (e) { rq.writeHead(404); return rq.end('no'); }
				// no-store, so a run never reads the previous version of the library
				rq.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
				rq.end(d);
			});
		});
		// loopback only: `listen(port)` alone binds every interface, opening the repo to the LAN
		s.listen(0, '127.0.0.1', () => res([s, s.address().port]));
	});
}

async function verify(pw, engine, port, motion) {
	const browser = await pw[engine].launch();
	try {
		const page = await (await browser.newContext({ reducedMotion: motion })).newPage();
		await page.goto(`http://localhost:${port}/test/verify.html`);
		// the page sets its title to PASS or FAIL when it is done; a suite that dies leaves the
		// original title, which is the third outcome and must not read as either
		await page.waitForFunction(() => document.title !== 'slots-lite — verify', null, { timeout: 60000 });
		/* global document -- the three lines below run inside the page, not in Node */
		return await page.evaluate(() => ({
			verdict: document.getElementById('verdict').textContent,
			all: [...document.querySelectorAll('#out li')].map((l) => l.textContent.split(' — ')[0]),
			fails: [...document.querySelectorAll('#out li.fail')].map((l) => l.textContent),
		}));
	} finally { await browser.close(); }
}

// Each entry breaks one thing the page claims to check. The label says what was broken, never
// which check should notice — a mutation that reddens a check nobody expected is information.
// `reduce: true` runs it under prefers-reduced-motion, and in every engine rather than one,
// because that branch is where a lazily-created animation would hide.
const MUTATIONS = [
	{ label: 'machine is not a function', edits: [['return { machine: machine,', 'return { machine: 0,']] },
	{ label: 'unclosed <defs>', edits: [["(c.defs ? el('defs', [], c.defs) : '')", "(c.defs ? '<defs>' + c.defs : '')"]] },
	{ label: 'id key without the cabinet style', edits: [['c.flat + c.cab + c.w', 'c.flat + c.w']] },
	{ label: 'salt ignored for ids', edits: [["S('ids' + (salt || ''))", "S('ids')"]] },
	{ label: 'pins ignored', edits: [["return pin != null && pin !== 'auto' ? esc(pin) : toHex(r[role]);", 'return toHex(r[role]);']] },
	{ label: 'the shade painted clear', edits: [["'fill-opacity', '.22'", "'fill-opacity', '0'"]] },
	{ label: 'a jackpot of bells', edits: [["return ['seven', cell[1]]", "return ['bell', cell[1]]"]] },
	{ label: 'no foreshortening', edits: [["(sy ? ' scale(1 ' + n(sy, 3) + ')' : '')", "''"]] },
	{ label: 'the window clip cut', edits: [["out += el('g', ['clip-path', 'url(#' + clip + ')'], win);", "out += el('g', [], win);"]] },
	{ label: 'the spin travels up', edits: [["'{from{transform:translateY(' + -167 * N + 'px)}}.'", "'{from{transform:translateY(' + 167 * N + 'px)}}.'"]] },
	// the settle check guards `from` with no `to`, so breaking it takes both halves: something to
	// travel toward, and a forwards fill to keep it there once the spin has finished
	{ label: 'a to-based spin that stays', edits: [["'{from{transform:translateY(' + -167 * N + 'px)}}.'", "'{from{transform:translateY(' + -167 * N + 'px)}to{transform:translateY(40px)}}.'"],
		["'s cubic-bezier(.2,.7,.3,1.08)}'", "'s cubic-bezier(.2,.7,.3,1.08) forwards}'"]] },
	{ label: 'reduced-motion gate cut', reduce: true, edits: [["'@media(prefers-reduced-motion:reduce){'", "'@media(BROKEN:reduce){'"]] },
	// the other half of the reduced-motion promise: nothing animates AND nothing is adrift
	{ label: 'reduced motion leaves reels adrift', reduce: true, edits: [["'{animation:none}}'", "'{animation:none;transform:translateY(40px)}}'"]] },
	{ label: 'destroy() leaves markup', edits: [["destroy: function () { host.innerHTML = ''; }", "destroy: function () { host.innerHTML = 'x'; }"]] },
];

async function main() {
	const pw = playwright();
	if (!pw) {
		console.log('no playwright on this machine — skipping the browser gate.');
		console.log('install one with:  npm i -g playwright  &&  npx playwright install');
		return 0;
	}
	const [server, port] = await serve();
	// an engine that is not installed is not a failing library: counted apart, so it neither
	// fails the run nor silently cancels the mutation pass
	let red = 0; const missing = [], engines = [];
	let names = [];
	try {
		for (const engine of ['chromium', 'firefox', 'webkit']) {
			let ran = false;
			for (const motion of ['no-preference', 'reduce']) {
				let r;
				try { r = await verify(pw, engine, port, motion); } catch (e) {
					console.log(`${engine} / ${motion}: could not run — ${e.message.split('\n')[0]}`);
					missing.push(`${engine}/${motion}`); continue;
				}
				ran = true;
				names = [...new Set([...names, ...r.all])];
				console.log(`${(engine + ' / ' + motion).padEnd(26)} ${r.verdict}`);
				r.fails.forEach((f) => console.log('     ✘ ' + f));
				if (!r.verdict.startsWith('ALL GREEN')) red++;
			}
			if (ran) engines.push(engine);
		}
		if (missing.length) console.log(`(not run: ${missing.join(', ')})`);

		if (MUTATE && !red && engines.length) {
			console.log('\n── mutations: break the library, watch the page go red ──');
			const seen = new Set();
			for (const m of MUTATIONS) {
				let src = ORIGINAL.toString(), ok = true;
				for (const [a, b] of m.edits) {
					// a mutation that lands twice, or not at all, proves nothing
					if (src.split(a).length !== 2) { ok = false; break; }
					src = src.replace(a, b);
				}
				if (!ok) { console.log(`SKIP  ${m.label.padEnd(34)} the anchor has moved; fix this mutation`); red++; continue; }
				fs.writeFileSync(SRC, src);
				dirty = true;
				// a reduce mutation runs everywhere: that branch is where an engine difference
				// would hide
				const where = m.reduce ? engines : [engines[0]];
				let caught = false, note = '';
				for (const engine of where) {
					let r;
					try { r = await verify(pw, engine, port, m.reduce ? 'reduce' : 'no-preference'); } catch (e) {
						note = ` (${engine}: ${e.message.split('\n')[0]})`; continue;
					}
					// a mutation that kills the suite outright shows no failing <li> at all, and
					// counting only those would read it as "nobody noticed"
					if (r.fails.length || !r.verdict.startsWith('ALL GREEN')) caught = true;
					r.fails.map((f) => f.split(' — ')[0]).forEach((f) => seen.add(f));
				}
				console.log(`${caught ? 'RED  ' : '.... '} ${m.label.padEnd(34)} ${where.join(', ')}${note}`);
				// a mutation nobody noticed is a missing check, not a detail of the log: it fails the
				// run (the first slots-lite run printed one "...." under a green verdict)
				if (!caught) red++;
				restore();
			}
			const never = names.filter((n) => !seen.has(n));
			console.log(never.length
				? '\nNEVER SEEN FAILING — write a mutation for each, or the check is decoration:\n' + never.map((n) => '  ' + n).join('\n')
				: '\nevery check on the page has been seen to fail.');
			red += never.length;
		}
	} finally {
		server.close();
		restore();
	}
	console.log(red ? `\n${red} problem(s)` : '\nthe browser gate is green.');
	return red ? 1 : 0;
}

// exitCode rather than exit(): on a Windows TTY stdout is asynchronous, and exiting on the heels
// of the last console.log can cut the summary off
process.exitCode = await main();
