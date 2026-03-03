import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import type { WildlifeSighting } from '$lib/types/index';
import { CRD_CENTER, municipalities } from '$lib/config/municipalities';

const CACHE_MAX_AGE = 300; // 5 minutes

/** Fetch recent research-grade observations from iNaturalist in the CRD area */
async function fetchINaturalist(): Promise<WildlifeSighting[]> {
	try {
		const params = new URLSearchParams({
			lat: String(CRD_CENTER[1]),
			lng: String(CRD_CENTER[0]),
			radius: '25', // 25 km radius covers CRD
			order: 'desc',
			order_by: 'observed_on',
			per_page: '30',
			quality_grade: 'research',
			iconic_taxa: 'Aves,Mammalia,Actinopterygii,Reptilia,Amphibia,Mollusca,Arachnida,Insecta'
		});

		const response = await fetch(`https://api.inaturalist.org/v1/observations?${params}`, {
			headers: { 'User-Agent': 'SVIT/1.0', Accept: 'application/json' },
			signal: AbortSignal.timeout(10000)
		});

		if (!response.ok) return [];

		const data = await response.json();
		if (!data.results || !Array.isArray(data.results)) return [];

		return data.results
			.filter((obs: Record<string, unknown>) => obs.taxon)
			.map((obs: Record<string, unknown>) => {
				const taxon = obs.taxon as Record<string, unknown>;
				const photos = obs.photos as Array<Record<string, unknown>> | undefined;
				const location = obs.location as string | undefined;
				let coords: [number, number] | undefined;

				if (location) {
					const [lat, lng] = location.split(',').map(Number);
					if (!isNaN(lat) && !isNaN(lng)) {
						coords = [lng, lat];
					}
				}

				return {
					id: `inat-${obs.id}`,
					species: String(taxon.name || ''),
					commonName: String(taxon.preferred_common_name || taxon.name || 'Unknown'),
					category: mapIconicTaxon(String(taxon.iconic_taxon_name || '')),
					observedAt: String(obs.observed_on || obs.created_at || ''),
					location: obs.place_guess ? String(obs.place_guess) : undefined,
					coordinates: coords,
					observer: (obs.user as Record<string, unknown>)?.login
						? String((obs.user as Record<string, unknown>).login)
						: undefined,
					photoUrl: photos?.[0]?.url
						? String(photos[0].url).replace('square', 'medium')
						: undefined,
					municipality: coords ? attributeMunicipality(coords[0], coords[1]) : undefined,
					source: 'inaturalist'
				};
			});
	} catch {
		return [];
	}
}

/** Fetch recent bird observations from eBird in the CRD area */
async function fetchEBird(): Promise<WildlifeSighting[]> {
	const apiKey = env.EBIRD_API_KEY;
	if (!apiKey) return [];
	try {
		const params = new URLSearchParams({
			lat: String(CRD_CENTER[1]),
			lng: String(CRD_CENTER[0]),
			dist: '25',
			maxResults: '30',
			sort: 'date',
			cat: 'species',
			back: '14'
		});
		const response = await fetch(`https://api.ebird.org/v2/data/obs/geo/recent?${params}`, {
			headers: { 'X-eBirdApiToken': apiKey },
			signal: AbortSignal.timeout(10000)
		});
		if (!response.ok) return [];
		const data = await response.json();
		return data.map((obs: Record<string, unknown>) => ({
			id: `ebird-${obs.subId}-${obs.speciesCode}`,
			species: String(obs.sciName || ''),
			commonName: String(obs.comName || 'Unknown'),
			category: 'bird' as const,
			observedAt: String(obs.obsDt || ''),
			location: obs.locName ? String(obs.locName) : undefined,
			coordinates: [Number(obs.lng), Number(obs.lat)] as [number, number],
			observer: undefined,
			municipality: attributeMunicipality(Number(obs.lng), Number(obs.lat)),
			source: 'ebird'
		}));
	} catch {
		return [];
	}
}

function mapIconicTaxon(taxon: string): WildlifeSighting['category'] {
	switch (taxon) {
		case 'Aves':
			return 'bird';
		case 'Mammalia':
			return 'marine-mammal';
		case 'Actinopterygii':
			return 'fish';
		case 'Reptilia':
		case 'Amphibia':
			return 'reptile';
		case 'Mollusca':
		case 'Arachnida':
		case 'Insecta':
			return 'invertebrate';
		case 'Plantae':
			return 'plant';
		default:
			return 'other';
	}
}

function attributeMunicipality(lng: number, lat: number): string | undefined {
	for (const m of municipalities) {
		const [w, s, e, n] = m.bbox;
		if (lng >= w && lng <= e && lat >= s && lat <= n) return m.slug;
	}
	return undefined;
}

function getSeedData(): WildlifeSighting[] {
	return [
		{
			id: 'wild-seed-1',
			species: 'Haliaeetus leucocephalus',
			commonName: 'Bald Eagle',
			category: 'bird',
			observedAt: '2026-03-01T14:30:00-08:00',
			location: 'Clover Point, Victoria',
			coordinates: [-123.345, 48.404],
			observer: 'birdwatcher_yyj',
			municipality: 'victoria',
			source: 'seed'
		},
		{
			id: 'wild-seed-2',
			species: 'Orcinus orca',
			commonName: 'Orca (Killer Whale)',
			category: 'marine-mammal',
			observedAt: '2026-02-28T10:15:00-08:00',
			location: 'Race Rocks, Metchosin',
			coordinates: [-123.532, 48.298],
			observer: 'pacific_whalers',
			municipality: 'metchosin',
			source: 'seed'
		},
		{
			id: 'wild-seed-3',
			species: 'Ardea herodias',
			commonName: 'Great Blue Heron',
			category: 'bird',
			observedAt: '2026-03-01T08:00:00-08:00',
			location: 'Beacon Hill Park',
			coordinates: [-123.362, 48.411],
			observer: 'naturalist42',
			municipality: 'victoria',
			source: 'seed'
		},
		{
			id: 'wild-seed-4',
			species: 'Phoca vitulina',
			commonName: 'Harbour Seal',
			category: 'marine-mammal',
			observedAt: '2026-03-02T07:45:00-08:00',
			location: 'Oak Bay Marina',
			coordinates: [-123.306, 48.426],
			observer: 'marine_bio_uvic',
			municipality: 'oak-bay',
			source: 'seed'
		},
		{
			id: 'wild-seed-5',
			species: 'Calypte anna',
			commonName: "Anna's Hummingbird",
			category: 'bird',
			observedAt: '2026-03-02T09:20:00-08:00',
			location: 'Gorge Waterway, Esquimalt',
			coordinates: [-123.4, 48.443],
			observer: 'hummingbird_fan',
			municipality: 'esquimalt',
			source: 'seed'
		},
		{
			id: 'wild-seed-6',
			species: 'Enhydra lutris',
			commonName: 'Sea Otter',
			category: 'marine-mammal',
			observedAt: '2026-02-27T15:30:00-08:00',
			location: 'Whiffin Spit, Sooke',
			coordinates: [-123.726, 48.353],
			observer: 'sooke_nature',
			municipality: 'sooke',
			source: 'seed'
		},
		{
			id: 'wild-seed-7',
			species: 'Oncorhynchus tshawytscha',
			commonName: 'Chinook Salmon',
			category: 'fish',
			observedAt: '2026-02-26T11:00:00-08:00',
			location: 'Goldstream Provincial Park',
			coordinates: [-123.547, 48.478],
			municipality: 'langford',
			source: 'seed'
		},
		{
			id: 'wild-seed-8',
			species: 'Megaptera novaeangliae',
			commonName: 'Humpback Whale',
			category: 'marine-mammal',
			observedAt: '2026-03-01T12:00:00-08:00',
			location: 'Haro Strait off Sidney',
			coordinates: [-123.37, 48.65],
			observer: 'whale_research_bc',
			municipality: 'sidney',
			source: 'seed'
		}
	];
}

export const GET: RequestHandler = async ({ url }) => {
	const municipality = url.searchParams.get('municipality');
	const category = url.searchParams.get('category');
	const limit = parseInt(url.searchParams.get('limit') || '20');

	const [inatResult, ebirdResult] = await Promise.allSettled([fetchINaturalist(), fetchEBird()]);
	let sightings = [
		...(inatResult.status === 'fulfilled' ? inatResult.value : []),
		...(ebirdResult.status === 'fulfilled' ? ebirdResult.value : [])
	];
	if (sightings.length === 0) sightings = getSeedData();

	if (municipality) {
		sightings = sightings.filter((s) => s.municipality === municipality);
	}

	if (category) {
		sightings = sightings.filter((s) => s.category === category);
	}

	// Sort by observation date (newest first)
	sightings.sort((a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime());

	sightings = sightings.slice(0, limit);

	return json(
		{
			data: sightings,
			meta: { total: sightings.length, municipality }
		},
		{
			headers: {
				'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=600`
			}
		}
	);
};
