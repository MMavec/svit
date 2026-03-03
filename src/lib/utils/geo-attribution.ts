import { municipalities } from '$lib/config/municipalities';

/** Attribute a municipality based on coordinates (lng/lat) falling within a municipality bbox */
export function attributeMunicipality(lng: number, lat: number): string | undefined {
	for (const m of municipalities) {
		const [w, s, e, n] = m.bbox;
		if (lng >= w && lng <= e && lat >= s && lat <= n) return m.slug;
	}
	return undefined;
}

/** Attribute a municipality based on text content matching known place names and keywords */
export function attributeMunicipalityByText(text: string): string | undefined {
	const lower = text.toLowerCase();
	const patterns: [string, string[]][] = [
		['victoria', ['victoria', 'downtown victoria', 'james bay', 'fernwood', 'fairfield', '#vic ']],
		['saanich', ['saanich', '#saanich', 'gordon head', 'cordova bay', 'royal oak']],
		['esquimalt', ['esquimalt']],
		['oak-bay', ['oak bay', '#oakbay']],
		['langford', ['langford', '#langford', 'westhills', 'bear mountain']],
		['colwood', ['colwood']],
		['sooke', ['sooke']],
		['sidney', ['sidney']],
		['north-saanich', ['north saanich']],
		['central-saanich', ['central saanich', 'brentwood bay', 'brentwood']],
		['view-royal', ['view royal']],
		['highlands', ['highlands', 'highlands district']],
		['metchosin', ['metchosin']]
	];

	for (const [slug, keywords] of patterns) {
		if (keywords.some((kw) => lower.includes(kw))) {
			return slug;
		}
	}
	return undefined;
}
