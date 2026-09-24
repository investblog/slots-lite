// Types for slots-lite. The library ships as one ES5 file with a UMD tail (ADR 001), so this
// declares a single value and exports it with `export =`.

type Colour = string;
type Pin = Colour | 'auto';

declare namespace Slots {
	type Name = 'seven' | 'bar' | 'bell' | 'cherry' | 'lemon' | 'plum' | 'gem' | 'star' | 'coin';
	/** A name that constructs what the payline shows. Nothing is ever scored (ADR 006). */
	type Result = 'jackpot' | 'three' | 'bars' | 'cherries' | 'mixed';

	/** Shared by machine() and symbol(). */
	interface Common {
		/** A string (a domain name is fine) or a number taken as a 32-bit unsigned integer. */
		seed?: number | string;
		brand?: string | string[];
		theme?: 'dark' | 'light';
		/** The symbols' style; the cabinet's too, which otherwise is flat on dark and line on light. */
		style?: 'line' | 'flat';
		weight?: number;
		red?: Pin;
		gold?: Pin;
		violet?: Pin;
		green?: Pin;
		bar?: Pin;
		strip?: Pin;
		ink?: Pin;
		trim?: Pin;
		gem?: Pin;
		body?: Pin;
		outline?: Pin;
		/** false draws only the procedural three and emits no fixed path (ADR 004). */
		classic?: boolean;
		/** Width; the height follows the viewBox. */
		size?: number;
		/** Decimals for coordinates. */
		precision?: number;
		/** Extra entropy for ids — the same picture twice on one page. */
		salt?: string;
		/** role="img" and an escaped aria-label; otherwise aria-hidden. */
		title?: string;
	}

	interface MachineOptions extends Common {
		/** 3–5; they append: reel i is the same reel whatever the count. */
		reels?: number;
		rows?: 3 | 1;
		result?: Result;
		/** Exact cells: an array per reel, top to bottom (one name under rows: 1). Wins over result. */
		symbols?: Array<Array<Name | null>>;
		payline?: boolean;
		lever?: boolean;
		lattice?: 'auto' | 'trigon' | 'hex' | 'octagon' | 'none';
		/** A one-shot CSS spin that lands on the static picture; reduced motion shows it at rest. */
		motion?: boolean | 'spin';
		/** Divides the spin's time; 0 returns the static bytes exactly. */
		speed?: number;
	}

	interface SymbolOptions extends Common {
		/** The seed picks one when absent or unknown. */
		symbol?: Name;
		/** 1–3 plaques, for bar only. */
		bars?: number;
	}

	interface Palette {
		red: string;
		gold: string;
		violet: string;
		green: string;
		bar: string;
		strip: string;
		ink: string;
		trim: string;
		gem: string;
		body: string;
		outline: string;
		/** The family's palette of the whole brand — a hexagons-lite field matches it. */
		stroke: string[];
		background: string;
		halo: string;
	}

	interface Handle {
		el: Element;
		get(): MachineOptions;
		/** Merges into the current options and redraws; pins stay pinned. */
		set(opts: MachineOptions): void;
		destroy(): void;
	}
}

declare const Slots: {
	/** Pure: the whole machine as an SVG string. Runs in Node and in the browser. */
	machine(opts?: Slots.MachineOptions): string;
	/** Pure: one symbol on its 160-unit em — an icon. */
	symbol(opts?: Slots.SymbolOptions): string;
	palette(brand?: string | string[], opts?: { theme?: 'dark' | 'light' }): Slots.Palette;
	/** Browser only. Returns null when the selector matches nothing. */
	init(target: string | Element, opts?: Slots.MachineOptions): Slots.Handle | null;
};

export = Slots;
