/** Store for cross-panel map focus events. Any panel can request the HeroMap to fly to a location. */

export interface MapFocusTarget {
	coordinates: [number, number]; // [lng, lat]
	title: string;
	description?: string;
	color?: string;
	zoom?: number;
}

let target = $state<MapFocusTarget | null>(null);
let version = $state(0);

export const mapFocusStore = {
	get target() {
		return target;
	},

	get version() {
		return version;
	},

	focus(t: MapFocusTarget) {
		target = t;
		version++;
	},

	clear() {
		target = null;
	}
};
