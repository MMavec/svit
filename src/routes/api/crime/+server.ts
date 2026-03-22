import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { CrimeIncident } from '$lib/types/index';
import { hashCode } from '$lib/utils/hash';
import { attributeMunicipality } from '$lib/utils/geo-attribution';
import {
	parseLimit,
	parseMunicipality,
	parseHours,
	isJsonResponse
} from '$lib/utils/api-validation';

const CACHE_MAX_AGE = 300; // 5 minutes

/**
 * Fetch crime incidents from Victoria Open Data ArcGIS Hub.
 * Dataset: VicPD crime reports (publicly available).
 */
async function fetchVicPDIncidents(hours: number): Promise<CrimeIncident[]> {
	try {
		const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
		const params = new URLSearchParams({
			where: `reported_date >= '${cutoffDate.toISOString().split('T')[0]}'`,
			outFields:
				'incident_id,parent_incident_type,incident_type_primary,reported_date,hundred_block,neighbourhood,latitude,longitude',
			outSR: '4326',
			f: 'json',
			resultRecordCount: '200',
			orderByFields: 'reported_date DESC'
		});

		const response = await fetch(
			`https://opendata.victoria.ca/datasets/victoria-crime/FeatureServer/0/query?${params}`,
			{ signal: AbortSignal.timeout(10000) }
		);

		if (!response.ok) return [];
		if (!isJsonResponse(response)) return [];

		const data = await response.json();
		if (!data.features || !Array.isArray(data.features)) return [];

		return data.features.map((f: { attributes: Record<string, unknown> }) => {
			const a = f.attributes;
			const lat = Number(a.latitude || 0);
			const lng = Number(a.longitude || 0);
			const reportedDate = a.reported_date
				? new Date(Number(a.reported_date)).toISOString()
				: new Date().toISOString();
			const hour = new Date(reportedDate).getHours();
			const parentType = String(a.parent_incident_type || '');
			const primaryType = String(a.incident_type_primary || '');

			return {
				id: `vicpd-${hashCode(String(a.incident_id || '') + reportedDate)}`,
				title: primaryType || parentType || 'Incident',
				description: `${primaryType} reported at ${a.hundred_block || 'Unknown location'}`,
				type: classifyCrimeType(parentType, primaryType),
				severity: classifyCrimeSeverity(parentType, primaryType),
				reportedAt: reportedDate,
				hour,
				location: a.hundred_block ? String(a.hundred_block) : undefined,
				neighbourhood: a.neighbourhood ? String(a.neighbourhood) : undefined,
				coordinates: lat && lng ? ([lng, lat] as [number, number]) : undefined,
				status: 'reported' as const,
				sourceAgency: 'VicPD',
				municipality: lat && lng ? attributeMunicipality(lng, lat, 'victoria') : 'victoria',
				source: 'vicpd'
			};
		});
	} catch (err) {
		console.error('Failed to fetch VicPD crime data:', err);
		return [];
	}
}

function classifyCrimeType(parent: string, primary: string): CrimeIncident['type'] {
	const combined = `${parent} ${primary}`.toLowerCase();
	if (
		combined.includes('theft') ||
		combined.includes('break') ||
		combined.includes('burglary') ||
		combined.includes('mischief') ||
		combined.includes('property') ||
		combined.includes('shoplifting') ||
		combined.includes('arson')
	)
		return 'property';
	if (
		combined.includes('assault') ||
		combined.includes('robbery') ||
		combined.includes('weapons') ||
		combined.includes('homicide') ||
		combined.includes('sexual') ||
		combined.includes('harass')
	)
		return 'person';
	if (
		combined.includes('traffic') ||
		combined.includes('collision') ||
		combined.includes('driving') ||
		combined.includes('impaired') ||
		combined.includes('hit and run')
	)
		return 'traffic';
	if (
		combined.includes('drug') ||
		combined.includes('controlled substance') ||
		combined.includes('possession')
	)
		return 'drug';
	if (
		combined.includes('disorder') ||
		combined.includes('disturbance') ||
		combined.includes('noise') ||
		combined.includes('trespass') ||
		combined.includes('intoxicat')
	)
		return 'disorder';
	if (combined.includes('fraud') || combined.includes('forgery') || combined.includes('identity'))
		return 'fraud';
	return 'other';
}

function classifyCrimeSeverity(parent: string, primary: string): CrimeIncident['severity'] {
	const combined = `${parent} ${primary}`.toLowerCase();
	if (
		combined.includes('homicide') ||
		combined.includes('weapons') ||
		combined.includes('sexual assault') ||
		combined.includes('arson')
	)
		return 'critical';
	if (
		combined.includes('assault') ||
		combined.includes('robbery') ||
		combined.includes('break and enter') ||
		combined.includes('impaired')
	)
		return 'serious';
	if (
		combined.includes('theft') ||
		combined.includes('fraud') ||
		combined.includes('mischief') ||
		combined.includes('collision')
	)
		return 'moderate';
	return 'minor';
}

const SEVERITY_ORDER: Record<string, number> = {
	critical: 0,
	serious: 1,
	moderate: 2,
	minor: 3
};

function getSeedIncidents(): CrimeIncident[] {
	const now = Date.now();
	const day = 24 * 60 * 60 * 1000;

	// Realistic 30-day CRD crime data with temporal patterns
	const seeds: Omit<CrimeIncident, 'id' | 'hour'>[] = [
		// Property crimes (peak: 2-5 AM, 10 AM-2 PM)
		{
			title: 'Theft from Vehicle',
			description: 'Theft from motor vehicle in parking lot. Window smashed, personal items taken.',
			type: 'property',
			severity: 'moderate',
			reportedAt: new Date(now - 0.3 * day).toISOString(),
			location: '800-block Fort Street',
			neighbourhood: 'Harris Green',
			coordinates: [-123.354, 48.425],
			status: 'reported',
			sourceAgency: 'VicPD',
			municipality: 'victoria',
			source: 'seed'
		},
		{
			title: 'Break and Enter (Residential)',
			description:
				'Residential break and enter. Entry through rear window. Electronics and jewelry taken.',
			type: 'property',
			severity: 'serious',
			reportedAt: new Date(now - 0.8 * day).toISOString(),
			location: '3200-block Quadra Street',
			neighbourhood: 'Quadra',
			coordinates: [-123.362, 48.44],
			status: 'under-investigation',
			sourceAgency: 'Saanich Police',
			municipality: 'saanich',
			source: 'seed'
		},
		{
			title: 'Shoplifting',
			description: 'Shoplifting at retail store. Suspect fled on foot.',
			type: 'property',
			severity: 'minor',
			reportedAt: new Date(now - 1.2 * day).toISOString(),
			location: '700-block Douglas Street',
			neighbourhood: 'Downtown',
			coordinates: [-123.365, 48.427],
			status: 'reported',
			sourceAgency: 'VicPD',
			municipality: 'victoria',
			source: 'seed'
		},
		{
			title: 'Mischief (Graffiti)',
			description: 'Graffiti damage to commercial building exterior wall.',
			type: 'property',
			severity: 'minor',
			reportedAt: new Date(now - 2.1 * day).toISOString(),
			location: '1400-block Government Street',
			neighbourhood: 'James Bay',
			coordinates: [-123.368, 48.42],
			status: 'reported',
			sourceAgency: 'VicPD',
			municipality: 'victoria',
			source: 'seed'
		},
		{
			title: 'Theft of Bicycle',
			description: 'Locked bicycle stolen from rack outside coffee shop.',
			type: 'property',
			severity: 'moderate',
			reportedAt: new Date(now - 2.5 * day).toISOString(),
			location: '2500-block Blanshard Street',
			neighbourhood: 'Hillside',
			coordinates: [-123.358, 48.437],
			status: 'reported',
			sourceAgency: 'VicPD',
			municipality: 'victoria',
			source: 'seed'
		},
		{
			title: 'Theft from Vehicle',
			description: 'Catalytic converter stolen from parked vehicle overnight.',
			type: 'property',
			severity: 'moderate',
			reportedAt: new Date(now - 3.1 * day).toISOString(),
			location: '2900-block Tillicum Road',
			neighbourhood: 'Tillicum',
			coordinates: [-123.393, 48.448],
			status: 'under-investigation',
			sourceAgency: 'Saanich Police',
			municipality: 'saanich',
			source: 'seed'
		},
		{
			title: 'Break and Enter (Commercial)',
			description: 'Commercial break and enter. Cash register and stock taken.',
			type: 'property',
			severity: 'serious',
			reportedAt: new Date(now - 4.3 * day).toISOString(),
			location: '700-block Goldstream Avenue',
			neighbourhood: 'Langford',
			coordinates: [-123.506, 48.45],
			status: 'under-investigation',
			sourceAgency: 'West Shore RCMP',
			municipality: 'langford',
			source: 'seed'
		},
		// Person crimes (peak: evening)
		{
			title: 'Assault',
			description: 'Assault causing bodily harm outside a nightclub. Suspect known to victim.',
			type: 'person',
			severity: 'serious',
			reportedAt: new Date(now - 1.5 * day).toISOString(),
			location: '500-block Yates Street',
			neighbourhood: 'Downtown',
			coordinates: [-123.362, 48.427],
			status: 'under-investigation',
			sourceAgency: 'VicPD',
			municipality: 'victoria',
			source: 'seed'
		},
		{
			title: 'Robbery',
			description: 'Robbery at convenience store. Suspect demanded cash and fled on foot.',
			type: 'person',
			severity: 'serious',
			reportedAt: new Date(now - 3.7 * day).toISOString(),
			location: '1200-block Esquimalt Road',
			neighbourhood: 'Esquimalt',
			coordinates: [-123.398, 48.432],
			status: 'under-investigation',
			sourceAgency: 'Esquimalt Police',
			municipality: 'esquimalt',
			source: 'seed'
		},
		{
			title: 'Uttering Threats',
			description: 'Threats made during neighbour dispute. No weapons involved.',
			type: 'person',
			severity: 'moderate',
			reportedAt: new Date(now - 5.2 * day).toISOString(),
			location: '1600-block Oak Bay Avenue',
			neighbourhood: 'Oak Bay',
			coordinates: [-123.33, 48.43],
			status: 'resolved',
			sourceAgency: 'Oak Bay Police',
			municipality: 'oak-bay',
			source: 'seed'
		},
		// Traffic (peak: rush hours)
		{
			title: 'Hit and Run',
			description:
				'Hit and run collision in parking lot. Vehicle sustained damage. Suspect vehicle description obtained.',
			type: 'traffic',
			severity: 'moderate',
			reportedAt: new Date(now - 0.5 * day).toISOString(),
			location: '3000-block Douglas Street',
			neighbourhood: 'Mayfair',
			coordinates: [-123.363, 48.44],
			status: 'under-investigation',
			sourceAgency: 'Saanich Police',
			municipality: 'saanich',
			source: 'seed'
		},
		{
			title: 'Impaired Driving',
			description:
				'Driver arrested for impaired driving after failing roadside screening. Vehicle impounded.',
			type: 'traffic',
			severity: 'serious',
			reportedAt: new Date(now - 2.8 * day).toISOString(),
			location: 'Trans-Canada Highway at Helmcken',
			neighbourhood: 'View Royal',
			coordinates: [-123.44, 48.457],
			status: 'cleared',
			sourceAgency: 'West Shore RCMP',
			municipality: 'view-royal',
			source: 'seed'
		},
		// Drug (peak: evening/night)
		{
			title: 'Drug Possession',
			description:
				'Controlled substance seized during routine check. Individual referred to treatment services.',
			type: 'drug',
			severity: 'minor',
			reportedAt: new Date(now - 1.8 * day).toISOString(),
			location: '900-block Pandora Avenue',
			neighbourhood: 'Downtown',
			coordinates: [-123.357, 48.427],
			status: 'cleared',
			sourceAgency: 'VicPD',
			municipality: 'victoria',
			source: 'seed'
		},
		// Disorder (peak: weekend nights)
		{
			title: 'Disturbance',
			description: 'Noise complaint and disturbance at residential address. Parties dispersed.',
			type: 'disorder',
			severity: 'minor',
			reportedAt: new Date(now - 0.7 * day).toISOString(),
			location: '400-block Cook Street',
			neighbourhood: 'Fairfield',
			coordinates: [-123.35, 48.418],
			status: 'resolved',
			sourceAgency: 'VicPD',
			municipality: 'victoria',
			source: 'seed'
		},
		{
			title: 'Trespassing',
			description: 'Trespassing at closed park after hours. Individual escorted from premises.',
			type: 'disorder',
			severity: 'minor',
			reportedAt: new Date(now - 4.0 * day).toISOString(),
			location: 'Beacon Hill Park',
			neighbourhood: 'James Bay',
			coordinates: [-123.361, 48.413],
			status: 'resolved',
			sourceAgency: 'VicPD',
			municipality: 'victoria',
			source: 'seed'
		},
		// Fraud
		{
			title: 'Identity Fraud',
			description:
				'Victim reported unauthorized use of personal information. Financial accounts compromised.',
			type: 'fraud',
			severity: 'moderate',
			reportedAt: new Date(now - 3.4 * day).toISOString(),
			location: '2600-block Quadra Street',
			neighbourhood: 'North Park',
			coordinates: [-123.36, 48.435],
			status: 'under-investigation',
			sourceAgency: 'VicPD',
			municipality: 'victoria',
			source: 'seed'
		},
		{
			title: 'Online Scam',
			description: 'Victim lost funds through online marketplace scam. Investigation ongoing.',
			type: 'fraud',
			severity: 'moderate',
			reportedAt: new Date(now - 6.1 * day).toISOString(),
			location: '1800-block Cedar Hill Cross Road',
			neighbourhood: 'Cedar Hill',
			coordinates: [-123.34, 48.447],
			status: 'under-investigation',
			sourceAgency: 'Saanich Police',
			municipality: 'saanich',
			source: 'seed'
		},
		// More property crimes (fill out the distribution)
		{
			title: 'Theft Under $5000',
			description: 'Theft of merchandise from retail store. Suspect identified via surveillance.',
			type: 'property',
			severity: 'minor',
			reportedAt: new Date(now - 5.5 * day).toISOString(),
			location: '800-block Cloverdale Avenue',
			neighbourhood: 'Lake Hill',
			coordinates: [-123.36, 48.46],
			status: 'under-investigation',
			sourceAgency: 'Saanich Police',
			municipality: 'saanich',
			source: 'seed'
		},
		{
			title: 'Vehicle Theft',
			description: 'Older model pickup truck stolen from residential driveway overnight.',
			type: 'property',
			severity: 'serious',
			reportedAt: new Date(now - 6.8 * day).toISOString(),
			location: '600-block Station Avenue',
			neighbourhood: 'Langford',
			coordinates: [-123.505, 48.449],
			status: 'reported',
			sourceAgency: 'West Shore RCMP',
			municipality: 'langford',
			source: 'seed'
		},
		{
			title: 'Mischief (Damage to Property)',
			description: 'Windows smashed at bus shelter. Damage estimated at $1,200.',
			type: 'property',
			severity: 'minor',
			reportedAt: new Date(now - 7.2 * day).toISOString(),
			location: '2300-block Oak Bay Avenue',
			neighbourhood: 'Oak Bay',
			coordinates: [-123.325, 48.432],
			status: 'reported',
			sourceAgency: 'Oak Bay Police',
			municipality: 'oak-bay',
			source: 'seed'
		}
	];

	return seeds.map((s) => ({
		...s,
		id: `crime-seed-${hashCode(s.title + s.reportedAt)}`,
		hour: new Date(s.reportedAt).getHours()
	}));
}

export const GET: RequestHandler = async ({ url }) => {
	const municipality = parseMunicipality(url.searchParams.get('municipality'));
	const limit = parseLimit(url.searchParams.get('limit'), 50, 200);
	const hours = parseHours(url.searchParams.get('hours'), 168, 6, 720);
	const typeFilter = url.searchParams.get('type') || null;

	// Fetch live sources in parallel
	const [vicpdResult] = await Promise.allSettled([fetchVicPDIncidents(hours)]);

	let incidents: CrimeIncident[] = [
		...(vicpdResult.status === 'fulfilled' ? vicpdResult.value : [])
	];

	// Seed fallback when live APIs return nothing
	if (incidents.length === 0) {
		incidents = getSeedIncidents();
	}

	// Filter by time window (hours)
	const cutoff = Date.now() - hours * 60 * 60 * 1000;
	incidents = incidents.filter((i) => new Date(i.reportedAt).getTime() >= cutoff);

	// Filter by municipality
	if (municipality) {
		incidents = incidents.filter((i) => i.municipality === municipality);
	}

	// Filter by type
	if (typeFilter) {
		incidents = incidents.filter((i) => i.type === typeFilter);
	}

	// Sort by severity (most severe first), then by date (newest first)
	incidents.sort((a, b) => {
		const sevDiff = (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9);
		if (sevDiff !== 0) return sevDiff;
		return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
	});

	incidents = incidents.slice(0, limit);

	// Build hourly distribution for the 24h clock
	const hourly = new Array(24).fill(0);
	for (const i of incidents) {
		hourly[i.hour]++;
	}

	// Build type breakdown
	const typeCounts: Record<string, number> = {};
	for (const i of incidents) {
		typeCounts[i.type] = (typeCounts[i.type] || 0) + 1;
	}

	return json(
		{
			data: incidents,
			meta: {
				total: incidents.length,
				municipality,
				hourlyDistribution: hourly,
				typeCounts,
				sources: {
					vicpd: vicpdResult.status === 'fulfilled' ? vicpdResult.value.length : 0
				}
			}
		},
		{
			headers: {
				'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=600`
			}
		}
	);
};
