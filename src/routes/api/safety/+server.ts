import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { SafetyAlert } from '$lib/types/index';
import { CRD_BBOX } from '$lib/config/municipalities';
import { hashCode } from '$lib/utils/hash';
import { attributeMunicipality } from '$lib/utils/geo-attribution';

const CACHE_MAX_AGE = 300; // 5 minutes

const [CRD_WEST, CRD_SOUTH, CRD_EAST, CRD_NORTH] = CRD_BBOX;

/** Fetch Environment Canada weather alerts for Greater Victoria (zone bc43) */
async function fetchWeatherAlerts(): Promise<SafetyAlert[]> {
	try {
		const response = await fetch('https://weather.gc.ca/rss/battleboard/bc43_e.xml', {
			headers: { 'User-Agent': 'SVIT/1.0' },
			signal: AbortSignal.timeout(8000)
		});

		if (!response.ok) return [];

		const xml = await response.text();
		const alerts: SafetyAlert[] = [];

		// Parse ATOM entries
		const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
		for (const entry of entries) {
			const title = extractTag(entry, 'title') || '';
			const summary = extractTag(entry, 'summary') || '';
			const updated = extractTag(entry, 'updated') || '';
			const link = entry.match(/<link[^>]*href="([^"]*)"[^>]*\/>/)?.[1] || '';
			const id = extractTag(entry, 'id') || `ec-${hashCode(title)}`;

			// Skip non-alert entries (e.g. "No watches or warnings in effect")
			if (
				title.toLowerCase().includes('no watches') ||
				title.toLowerCase().includes('no warnings')
			) {
				continue;
			}

			const severity = classifyWeatherSeverity(title);

			alerts.push({
				id: `ec-${hashCode(id)}`,
				title,
				description: summary.replace(/<[^>]+>/g, '').trim(),
				type: 'weather',
				severity,
				status: 'active',
				issued: updated || new Date().toISOString(),
				url: link || undefined,
				sourceAgency: 'Environment Canada',
				source: 'envcan'
			});
		}

		return alerts;
	} catch {
		return [];
	}
}

/** Fetch BC Wildfire Service active fires in CRD area */
async function fetchWildfireAlerts(): Promise<SafetyAlert[]> {
	try {
		const params = new URLSearchParams({
			where: '1=1',
			geometry: `${CRD_WEST},${CRD_SOUTH},${CRD_EAST},${CRD_NORTH}`,
			geometryType: 'esriGeometryEnvelope',
			inSR: '4326',
			spatialRel: 'esriSpatialRelIntersects',
			outFields:
				'INCIDENT_NAME,FIRE_STATUS,CURRENT_SIZE,GEOGRAPHIC_DESCRIPTION,FIRE_CAUSE,LATITUDE,LONGITUDE,FIRE_URL,IGNITION_DATE',
			outSR: '4326',
			f: 'json',
			resultRecordCount: '50'
		});

		const response = await fetch(
			`https://services6.arcgis.com/ubm4tcTYICKBpist/ArcGIS/rest/services/BCWS_ActiveFires_PublicView/FeatureServer/0/query?${params}`,
			{
				signal: AbortSignal.timeout(10000)
			}
		);

		if (!response.ok) return [];

		const data = await response.json();
		if (!data.features || !Array.isArray(data.features)) return [];

		return data.features.map((f: { attributes: Record<string, unknown> }) => {
			const a = f.attributes;
			const lat = Number(a.LATITUDE || 0);
			const lng = Number(a.LONGITUDE || 0);
			const name = String(a.INCIDENT_NAME || 'Unknown Fire');
			const status = String(a.FIRE_STATUS || 'Active');
			const size = a.CURRENT_SIZE ? `${a.CURRENT_SIZE} ha` : '';

			return {
				id: `bcws-${hashCode(name + lat)}`,
				title: name,
				description: [
					status,
					size,
					a.GEOGRAPHIC_DESCRIPTION ? String(a.GEOGRAPHIC_DESCRIPTION) : '',
					a.FIRE_CAUSE ? `Cause: ${a.FIRE_CAUSE}` : ''
				]
					.filter(Boolean)
					.join(' — '),
				type: 'wildfire' as const,
				severity: classifyFireSeverity(status),
				status: 'active' as const,
				location: a.GEOGRAPHIC_DESCRIPTION ? String(a.GEOGRAPHIC_DESCRIPTION) : undefined,
				coordinates: lat && lng ? ([lng, lat] as [number, number]) : undefined,
				issued: a.IGNITION_DATE
					? new Date(Number(a.IGNITION_DATE)).toISOString()
					: new Date().toISOString(),
				url: a.FIRE_URL ? String(a.FIRE_URL) : undefined,
				sourceAgency: 'BC Wildfire Service',
				municipality: attributeMunicipality(lng, lat),
				source: 'bcws'
			};
		});
	} catch {
		return [];
	}
}

/** Fetch USGS earthquakes in the CRD region */
async function fetchEarthquakes(): Promise<SafetyAlert[]> {
	try {
		const now = new Date();
		const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

		const params = new URLSearchParams({
			format: 'geojson',
			minlatitude: String(CRD_SOUTH - 0.5),
			maxlatitude: String(CRD_NORTH + 0.5),
			minlongitude: String(CRD_WEST - 0.5),
			maxlongitude: String(CRD_EAST + 0.5),
			starttime: thirtyDaysAgo.toISOString().split('T')[0],
			orderby: 'time',
			limit: '20'
		});

		const response = await fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?${params}`, {
			signal: AbortSignal.timeout(10000)
		});

		if (!response.ok) return [];

		const data = await response.json();
		if (!data.features || !Array.isArray(data.features)) return [];

		return data.features.map(
			(f: {
				id: string;
				properties: Record<string, unknown>;
				geometry: { coordinates: number[] };
			}) => {
				const p = f.properties;
				const [lng, lat, depth] = f.geometry.coordinates;
				const mag = Number(p.mag || 0);
				const place = String(p.place || 'Unknown location');
				const time = p.time ? new Date(Number(p.time)).toISOString() : now.toISOString();

				return {
					id: `usgs-${f.id}`,
					title: `M${mag.toFixed(1)} Earthquake — ${place}`,
					description: `Magnitude ${mag.toFixed(1)} at ${depth.toFixed(1)} km depth. ${place}.`,
					type: 'earthquake' as const,
					severity: classifyEarthquakeSeverity(mag),
					status: 'active' as const,
					location: place,
					coordinates: [lng, lat] as [number, number],
					issued: time,
					url: p.url ? String(p.url) : undefined,
					sourceAgency: 'USGS',
					municipality: attributeMunicipality(lng, lat),
					source: 'usgs'
				};
			}
		);
	} catch {
		return [];
	}
}

function classifyEarthquakeSeverity(magnitude: number): SafetyAlert['severity'] {
	if (magnitude >= 5.0) return 'emergency';
	if (magnitude >= 3.0) return 'warning';
	if (magnitude >= 2.0) return 'watch';
	return 'advisory';
}

/** Fetch road incidents from DriveBC Open511 (reuse construction API pattern) */
async function fetchRoadIncidents(): Promise<SafetyAlert[]> {
	try {
		const params = new URLSearchParams({
			area_id: 'drivebc.ca/2',
			status: 'ACTIVE',
			event_type: 'INCIDENT',
			format: 'json',
			limit: '50'
		});

		const response = await fetch(`https://api.open511.gov.bc.ca/events?${params}`, {
			headers: { 'User-Agent': 'SVIT/1.0' },
			signal: AbortSignal.timeout(10000)
		});

		if (!response.ok) return [];

		const data = await response.json();
		if (!data.events) return [];

		const alerts: SafetyAlert[] = [];

		for (const evt of data.events) {
			const coords = evt.geography?.coordinates;
			if (coords) {
				const [lng, lat] = coords;
				if (lng < CRD_WEST || lng > CRD_EAST || lat < CRD_SOUTH || lat > CRD_NORTH) {
					continue;
				}
			}

			const severity = evt.severity === 'MAJOR' ? 'warning' : 'advisory';

			alerts.push({
				id: `incident-${hashCode(String(evt.id))}`,
				title: evt.roads?.[0]?.name ? `Road Incident — ${evt.roads[0].name}` : 'Road Incident',
				description: String(evt.description || ''),
				type: 'road-incident',
				severity,
				status: 'active',
				location: evt.roads?.[0]?.name || undefined,
				coordinates: coords ? [coords[0], coords[1]] : undefined,
				issued: evt.created || new Date().toISOString(),
				sourceAgency: 'DriveBC',
				municipality: coords ? attributeMunicipality(coords[0], coords[1]) : undefined,
				source: 'drivebc'
			});
		}

		return alerts;
	} catch {
		return [];
	}
}

function classifyWeatherSeverity(title: string): SafetyAlert['severity'] {
	const lower = title.toLowerCase();
	if (lower.includes('emergency') || lower.includes('tornado')) return 'emergency';
	if (lower.includes('warning')) return 'warning';
	if (lower.includes('watch')) return 'watch';
	return 'advisory';
}

function classifyFireSeverity(status: string): SafetyAlert['severity'] {
	const lower = status.toLowerCase();
	if (lower.includes('out of control') || lower.includes('wildfire')) return 'emergency';
	if (lower.includes('being held') || lower.includes('new')) return 'warning';
	if (lower.includes('under control')) return 'watch';
	return 'advisory';
}

const SEVERITY_ORDER: Record<string, number> = {
	emergency: 0,
	warning: 1,
	watch: 2,
	advisory: 3
};

function getSeedAlerts(): SafetyAlert[] {
	return [
		{
			id: 'safety-seed-1',
			title: 'Wind Warning — Greater Victoria',
			description:
				'Strong southeast winds of 70 km/h gusting to 90 km/h expected tonight. Loose objects may become projectiles. Possible power outages.',
			type: 'weather',
			severity: 'warning',
			status: 'active',
			issued: '2026-03-01T14:00:00-08:00',
			expires: '2026-03-02T06:00:00-08:00',
			url: 'https://weather.gc.ca/warnings/index_e.html?prov=bc',
			sourceAgency: 'Environment Canada',
			source: 'seed'
		},
		{
			id: 'safety-seed-2',
			title: 'Rainfall Advisory — Greater Victoria',
			description:
				'Rain, at times heavy, expected over the next 24 hours. Total amounts of 30-50mm. Watch for localized flooding in low-lying areas.',
			type: 'weather',
			severity: 'advisory',
			status: 'active',
			issued: '2026-03-01T10:00:00-08:00',
			expires: '2026-03-02T10:00:00-08:00',
			sourceAgency: 'Environment Canada',
			source: 'seed'
		},
		{
			id: 'safety-seed-3',
			title: 'Brush Fire — Mount Douglas Park',
			description:
				'Being Held — 0.5 ha — Mount Douglas Park, Saanich. Cause: Human activity. Fire crews on scene maintaining containment lines.',
			type: 'wildfire',
			severity: 'watch',
			status: 'active',
			location: 'Mount Douglas Park',
			coordinates: [-123.34, 48.49],
			issued: '2026-02-28T16:00:00-08:00',
			sourceAgency: 'BC Wildfire Service',
			municipality: 'saanich',
			source: 'seed'
		},
		{
			id: 'safety-seed-4',
			title: 'Road Incident — Highway 1',
			description:
				'Multi-vehicle incident on Trans-Canada Highway near Thetis Lake overpass. Right lane blocked westbound. Emergency services on scene.',
			type: 'road-incident',
			severity: 'advisory',
			status: 'active',
			location: 'Highway 1',
			coordinates: [-123.44, 48.457],
			issued: '2026-03-02T08:15:00-08:00',
			sourceAgency: 'DriveBC',
			municipality: 'view-royal',
			source: 'seed'
		}
	];
}

function extractTag(xml: string, tag: string): string | null {
	const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
	return match ? match[1].trim() : null;
}

export const GET: RequestHandler = async ({ url }) => {
	const municipality = url.searchParams.get('municipality');
	const limit = parseInt(url.searchParams.get('limit') || '50');

	// Fetch all sources in parallel — one failing source doesn't break others
	const [weatherResult, fireResult, incidentResult, quakeResult] = await Promise.allSettled([
		fetchWeatherAlerts(),
		fetchWildfireAlerts(),
		fetchRoadIncidents(),
		fetchEarthquakes()
	]);

	let alerts: SafetyAlert[] = [
		...(weatherResult.status === 'fulfilled' ? weatherResult.value : []),
		...(fireResult.status === 'fulfilled' ? fireResult.value : []),
		...(incidentResult.status === 'fulfilled' ? incidentResult.value : []),
		...(quakeResult.status === 'fulfilled' ? quakeResult.value : [])
	];

	// If all sources returned nothing, use seed data
	if (alerts.length === 0) {
		alerts = getSeedAlerts();
	}

	// Filter by municipality
	if (municipality) {
		alerts = alerts.filter((a) => a.municipality === municipality);
	}

	// Sort by severity (most severe first) then by date (newest first)
	alerts.sort((a, b) => {
		const sevDiff = (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9);
		if (sevDiff !== 0) return sevDiff;
		return new Date(b.issued).getTime() - new Date(a.issued).getTime();
	});

	alerts = alerts.slice(0, limit);

	return json(
		{
			data: alerts,
			meta: {
				total: alerts.length,
				municipality,
				sources: {
					weather: weatherResult.status === 'fulfilled' ? weatherResult.value.length : 0,
					wildfire: fireResult.status === 'fulfilled' ? fireResult.value.length : 0,
					incidents: incidentResult.status === 'fulfilled' ? incidentResult.value.length : 0,
					earthquakes: quakeResult.status === 'fulfilled' ? quakeResult.value.length : 0
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
