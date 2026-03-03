import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { TreeObservation } from '$lib/types/index';
import { CRD_CENTER, municipalities } from '$lib/config/municipalities';

const CACHE_MAX_AGE = 900; // 15 minutes

/** Fetch recent tree observations from iNaturalist in the CRD area */
async function fetchTreeObservations(): Promise<TreeObservation[]> {
	try {
		const params = new URLSearchParams({
			lat: String(CRD_CENTER[1]),
			lng: String(CRD_CENTER[0]),
			radius: '25',
			order: 'desc',
			order_by: 'observed_on',
			per_page: '20',
			quality_grade: 'research',
			iconic_taxa: 'Plantae',
			term_id: '12', // Plant Phenology — filters to trees/plants
			taxon_name: 'Pinopsida,Magnoliopsida' // Conifers + broadleaf trees
		});

		const response = await fetch(
			`https://api.inaturalist.org/v1/observations?${params}`,
			{
				headers: { 'User-Agent': 'SVIT/1.0', Accept: 'application/json' },
				signal: AbortSignal.timeout(10000)
			}
		);

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
					id: `inat-tree-${obs.id}`,
					species: String(taxon.name || ''),
					commonName: String(taxon.preferred_common_name || taxon.name || 'Unknown Tree'),
					observedAt: String(obs.observed_on || obs.created_at || ''),
					location: obs.place_guess ? String(obs.place_guess) : undefined,
					coordinates: coords,
					heritage: false,
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

function attributeMunicipality(lng: number, lat: number): string | undefined {
	for (const m of municipalities) {
		const [w, s, e, n] = m.bbox;
		if (lng >= w && lng <= e && lat >= s && lat <= n) return m.slug;
	}
	return undefined;
}

function getSeedData(): TreeObservation[] {
	return [
		{
			id: 'tree-seed-1',
			species: 'Pseudotsuga menziesii',
			commonName: 'Douglas Fir',
			observedAt: '2026-03-01T10:00:00-08:00',
			location: 'Beacon Hill Park, Victoria',
			coordinates: [-123.363, 48.412],
			heritage: true,
			municipality: 'victoria',
			source: 'seed'
		},
		{
			id: 'tree-seed-2',
			species: 'Quercus garryana',
			commonName: 'Garry Oak',
			observedAt: '2026-02-28T14:30:00-08:00',
			location: 'Uplands Park, Oak Bay',
			coordinates: [-123.316, 48.449],
			heritage: true,
			municipality: 'oak-bay',
			source: 'seed'
		},
		{
			id: 'tree-seed-3',
			species: 'Arbutus menziesii',
			commonName: 'Pacific Madrone (Arbutus)',
			observedAt: '2026-03-01T16:00:00-08:00',
			location: 'Gonzales Hill, Victoria',
			coordinates: [-123.331, 48.413],
			heritage: false,
			municipality: 'victoria',
			source: 'seed'
		},
		{
			id: 'tree-seed-4',
			species: 'Thuja plicata',
			commonName: 'Western Red Cedar',
			observedAt: '2026-02-27T11:00:00-08:00',
			location: 'Goldstream Provincial Park',
			coordinates: [-123.547, 48.478],
			heritage: true,
			municipality: 'langford',
			source: 'seed'
		},
		{
			id: 'tree-seed-5',
			species: 'Acer macrophyllum',
			commonName: 'Bigleaf Maple',
			observedAt: '2026-03-02T09:30:00-08:00',
			location: 'Mount Douglas Park, Saanich',
			coordinates: [-123.340, 48.492],
			heritage: false,
			municipality: 'saanich',
			source: 'seed'
		},
		{
			id: 'tree-seed-6',
			species: 'Tsuga heterophylla',
			commonName: 'Western Hemlock',
			observedAt: '2026-02-26T15:00:00-08:00',
			location: 'East Sooke Regional Park',
			coordinates: [-123.650, 48.370],
			heritage: false,
			municipality: 'sooke',
			source: 'seed'
		},
		{
			id: 'tree-seed-7',
			species: 'Quercus garryana',
			commonName: 'Garry Oak',
			observedAt: '2026-03-01T13:00:00-08:00',
			location: 'Christmas Hill Nature Sanctuary',
			coordinates: [-123.377, 48.473],
			heritage: true,
			municipality: 'saanich',
			source: 'seed'
		},
		{
			id: 'tree-seed-8',
			species: 'Abies grandis',
			commonName: 'Grand Fir',
			observedAt: '2026-02-25T10:00:00-08:00',
			location: 'John Dean Provincial Park',
			coordinates: [-123.397, 48.592],
			heritage: false,
			municipality: 'north-saanich',
			source: 'seed'
		}
	];
}

export const GET: RequestHandler = async ({ url }) => {
	const municipality = url.searchParams.get('municipality');
	const heritage = url.searchParams.get('heritage');
	const limit = parseInt(url.searchParams.get('limit') || '20');

	let trees = await fetchTreeObservations();

	if (trees.length === 0) {
		trees = getSeedData();
	}

	if (municipality) {
		trees = trees.filter((t) => t.municipality === municipality);
	}

	if (heritage === 'true') {
		trees = trees.filter((t) => t.heritage);
	}

	// Sort by observation date (newest first)
	trees.sort((a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime());

	trees = trees.slice(0, limit);

	return json(
		{
			data: trees,
			meta: { total: trees.length, municipality }
		},
		{
			headers: {
				'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=1800`
			}
		}
	);
};
