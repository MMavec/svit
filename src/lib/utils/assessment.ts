// Server-side helper: look up 2026 BC Assessment land + improvement values for Victoria parcels,
// used to enrich demolition / development cards. NOTE: year-built and sale history are NOT in any
// free/open dataset (BC Assessment Residential Inventory + Data Advice are access-restricted), so
// this only provides assessed VALUE, joined by FOLIO.

const ASSESS_LAYER =
	'https://services.arcgis.com/EHSKalEvBxdO9ljW/arcgis/rest/services/Property_Assessment_Report_2026/FeatureServer/0';

export interface AssessedValue {
	land: number;
	improvement: number;
	total: number;
}

/** Decode a Victoria permit `gislink` to an integer FOLIO. Letter-prefixed gislinks have no match. */
export function gislinkToFolio(gislink: unknown): number | null {
	const s = String(gislink ?? '').trim();
	if (!/^\d+$/.test(s)) return null;
	const n = parseInt(s, 10);
	return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Batched lookup of assessed values for a list of FOLIO numbers. Returns a folio -> value map.
 * Best-effort: any failure yields whatever was fetched so far (enrichment is never required).
 */
export async function fetchAssessedValues(folios: number[]): Promise<Map<number, AssessedValue>> {
	const map = new Map<number, AssessedValue>();
	const unique = [...new Set(folios.filter((f) => Number.isFinite(f) && f > 0))];
	if (unique.length === 0) return map;

	try {
		// Chunk to keep the WHERE clause well under ArcGIS length limits.
		for (let i = 0; i < unique.length; i += 150) {
			const chunk = unique.slice(i, i + 150);
			const params = new URLSearchParams({
				where: `FOLIO IN (${chunk.join(',')}) AND assess_type='GENERAL'`,
				outFields: 'FOLIO,land_net,impr_net',
				returnGeometry: 'false',
				f: 'json'
			});
			const res = await fetch(`${ASSESS_LAYER}/query?${params}`, {
				headers: { 'User-Agent': 'SVIT/1.0' },
				signal: AbortSignal.timeout(10000)
			});
			if (!res.ok) continue;
			const data = (await res.json()) as {
				features?: { attributes: Record<string, unknown> }[];
				error?: unknown;
			};
			if (data.error || !Array.isArray(data.features)) continue;
			for (const f of data.features) {
				const folio = Number(f.attributes.FOLIO);
				if (!Number.isFinite(folio) || map.has(folio)) continue;
				const land = Number(f.attributes.land_net) || 0;
				const improvement = Number(f.attributes.impr_net) || 0;
				if (land <= 0 && improvement <= 0) continue;
				map.set(folio, { land, improvement, total: land + improvement });
			}
		}
	} catch {
		// best-effort
	}
	return map;
}
