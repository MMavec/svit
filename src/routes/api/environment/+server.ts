import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { EnvironmentReading } from '$lib/types/index';
import { env } from '$env/dynamic/private';
import { parseLimit, parseMunicipality } from '$lib/utils/api-validation';

const CACHE_MAX_AGE = 300; // 5 minutes

/** Fetch air quality data from AQICN (World Air Quality Index) for Victoria */
async function fetchAirQuality(): Promise<EnvironmentReading[]> {
	const token = env.AQICN_API_TOKEN;
	if (!token) return [];

	try {
		const response = await fetch(`https://api.waqi.info/feed/victoria-topaz/?token=${token}`, {
			signal: AbortSignal.timeout(8000)
		});

		if (!response.ok) return [];

		const data = await response.json();
		if (data.status !== 'ok' || !data.data) return [];

		const aqi = data.data;
		const readings: EnvironmentReading[] = [];

		// Overall AQI
		readings.push({
			id: 'aqicn-aqi',
			type: 'air-quality',
			metric: 'Air Quality Index',
			value: Number(aqi.aqi || 0),
			unit: 'AQI',
			status: classifyAQI(Number(aqi.aqi || 0)),
			location: String(aqi.city?.name || 'Victoria, BC'),
			coordinates: aqi.city?.geo
				? [Number(aqi.city.geo[1]), Number(aqi.city.geo[0])]
				: [-123.365, 48.428],
			observedAt: aqi.time?.iso || new Date().toISOString(),
			municipality: 'victoria',
			source: 'aqicn'
		});

		// Individual pollutants
		const iaqi = aqi.iaqi || {};
		if (iaqi.pm25) {
			readings.push({
				id: 'aqicn-pm25',
				type: 'air-quality',
				metric: 'PM2.5',
				value: Number(iaqi.pm25.v),
				unit: 'ug/m3',
				status: classifyAQI(Number(iaqi.pm25.v)),
				location: String(aqi.city?.name || 'Victoria, BC'),
				observedAt: aqi.time?.iso || new Date().toISOString(),
				municipality: 'victoria',
				source: 'aqicn'
			});
		}
		if (iaqi.pm10) {
			readings.push({
				id: 'aqicn-pm10',
				type: 'air-quality',
				metric: 'PM10',
				value: Number(iaqi.pm10.v),
				unit: 'ug/m3',
				status: classifyAQI(Number(iaqi.pm10.v)),
				location: String(aqi.city?.name || 'Victoria, BC'),
				observedAt: aqi.time?.iso || new Date().toISOString(),
				municipality: 'victoria',
				source: 'aqicn'
			});
		}
		if (iaqi.o3) {
			readings.push({
				id: 'aqicn-o3',
				type: 'air-quality',
				metric: 'Ozone',
				value: Number(iaqi.o3.v),
				unit: 'ppb',
				status: classifyAQI(Number(iaqi.o3.v)),
				location: String(aqi.city?.name || 'Victoria, BC'),
				observedAt: aqi.time?.iso || new Date().toISOString(),
				municipality: 'victoria',
				source: 'aqicn'
			});
		}

		return readings;
	} catch {
		return [];
	}
}

/** Fetch UV index from Environment Canada */
async function fetchUVIndex(): Promise<EnvironmentReading[]> {
	try {
		const response = await fetch(
			'https://dd.weather.gc.ca/observations/xml/BC/yesterday/yesterday_bc_e.xml',
			{
				headers: { 'User-Agent': 'SVIT/1.0' },
				signal: AbortSignal.timeout(8000)
			}
		);

		if (!response.ok) return [];

		// UV data is harder to parse from EC — return empty for now, seed will cover it
		return [];
	} catch {
		return [];
	}
}

/** Fetch ocean temperature data from Ocean Networks Canada (ONC) */
async function fetchONCData(): Promise<EnvironmentReading[]> {
	const token = env.ONC_API_TOKEN;
	if (!token) return [];

	try {
		const dateFrom = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
		const params = new URLSearchParams({
			method: 'getByLocation',
			token,
			locationCode: 'SEVIP',
			deviceCategoryCode: 'CTD',
			propertyCode: 'seawatertemperature',
			dateFrom,
			rowLimit: '1',
			outputFormat: 'Object'
		});

		const response = await fetch(`https://data.oceannetworks.ca/api/scalardata?${params}`, {
			signal: AbortSignal.timeout(10000)
		});
		if (!response.ok) return [];

		const data = await response.json();
		const sensorData = data?.sensorData?.[0];
		if (!sensorData?.data?.values?.length) return [];

		const latestValue = sensorData.data.values[sensorData.data.values.length - 1];
		const latestTime =
			sensorData.data.sampleTimes?.[sensorData.data.sampleTimes.length - 1] ||
			new Date().toISOString();

		return [
			{
				id: 'onc-ocean-temp',
				type: 'ocean-temperature',
				metric: 'Sea Temperature',
				value: Math.round(Number(latestValue) * 10) / 10,
				unit: '\u00B0C',
				status: classifyOceanTemp(Number(latestValue)),
				location: 'Victoria Harbour (VENUS)',
				coordinates: [-123.39, 48.4283],
				observedAt: latestTime,
				municipality: 'victoria',
				source: 'onc'
			}
		];
	} catch {
		return [];
	}
}

function classifyOceanTemp(tempC: number): EnvironmentReading['status'] {
	if (tempC >= 5 && tempC <= 15) return 'good';
	if (tempC >= 3 && tempC <= 18) return 'moderate';
	return 'unhealthy-sensitive';
}

function classifyAQI(value: number): EnvironmentReading['status'] {
	if (value <= 50) return 'good';
	if (value <= 100) return 'moderate';
	if (value <= 150) return 'unhealthy-sensitive';
	if (value <= 200) return 'unhealthy';
	return 'hazardous';
}

function getSeedData(): EnvironmentReading[] {
	return [
		{
			id: 'env-seed-1',
			type: 'air-quality',
			metric: 'Air Quality Index',
			value: 28,
			unit: 'AQI',
			status: 'good',
			location: 'Victoria Topaz',
			coordinates: [-123.365, 48.428],
			observedAt: '2026-03-02T08:00:00-08:00',
			municipality: 'victoria',
			source: 'seed'
		},
		{
			id: 'env-seed-2',
			type: 'air-quality',
			metric: 'PM2.5',
			value: 8,
			unit: 'ug/m3',
			status: 'good',
			location: 'Victoria Topaz',
			coordinates: [-123.365, 48.428],
			observedAt: '2026-03-02T08:00:00-08:00',
			municipality: 'victoria',
			source: 'seed'
		},
		{
			id: 'env-seed-3',
			type: 'air-quality',
			metric: 'PM10',
			value: 12,
			unit: 'ug/m3',
			status: 'good',
			location: 'Victoria Topaz',
			observedAt: '2026-03-02T08:00:00-08:00',
			municipality: 'victoria',
			source: 'seed'
		},
		{
			id: 'env-seed-4',
			type: 'air-quality',
			metric: 'Ozone',
			value: 32,
			unit: 'ppb',
			status: 'good',
			location: 'Victoria Topaz',
			observedAt: '2026-03-02T08:00:00-08:00',
			municipality: 'victoria',
			source: 'seed'
		},
		{
			id: 'env-seed-5',
			type: 'uv-index',
			metric: 'UV Index',
			value: 3,
			unit: 'index',
			status: 'moderate',
			location: 'Victoria, BC',
			observedAt: '2026-03-02T12:00:00-08:00',
			municipality: 'victoria',
			source: 'seed'
		},
		{
			id: 'env-seed-6',
			type: 'pollen',
			metric: 'Pollen Count',
			value: 4.2,
			unit: 'grains/m3',
			status: 'moderate',
			location: 'Greater Victoria',
			observedAt: '2026-03-02T10:00:00-08:00',
			source: 'seed'
		},
		{
			id: 'env-seed-7',
			type: 'water-quality',
			metric: 'Coliform Level',
			value: 12,
			unit: 'CFU/100mL',
			status: 'good',
			location: 'Thetis Lake',
			coordinates: [-123.457, 48.462],
			observedAt: '2026-03-01T09:00:00-08:00',
			municipality: 'langford',
			source: 'seed'
		},
		{
			id: 'env-seed-8',
			type: 'water-quality',
			metric: 'Coliform Level',
			value: 8,
			unit: 'CFU/100mL',
			status: 'good',
			location: 'Elk/Beaver Lake',
			coordinates: [-123.38, 48.49],
			observedAt: '2026-03-01T09:00:00-08:00',
			municipality: 'saanich',
			source: 'seed'
		},
		{
			id: 'env-seed-9',
			type: 'ocean-temperature',
			metric: 'Sea Temperature',
			value: 9.2,
			unit: '\u00B0C',
			status: 'good',
			location: 'Victoria Harbour (VENUS)',
			coordinates: [-123.39, 48.4283],
			observedAt: '2026-03-02T06:00:00-08:00',
			municipality: 'victoria',
			source: 'seed'
		}
	];
}

export const GET: RequestHandler = async ({ url }) => {
	const municipality = parseMunicipality(url.searchParams.get('municipality'));
	const type = url.searchParams.get('type');
	const limit = parseLimit(url.searchParams.get('limit'), 20);

	const [aqiResult, uvResult, oncResult] = await Promise.allSettled([
		fetchAirQuality(),
		fetchUVIndex(),
		fetchONCData()
	]);

	let readings: EnvironmentReading[] = [
		...(aqiResult.status === 'fulfilled' ? aqiResult.value : []),
		...(uvResult.status === 'fulfilled' ? uvResult.value : []),
		...(oncResult.status === 'fulfilled' ? oncResult.value : [])
	];

	if (readings.length === 0) readings = getSeedData();

	if (municipality) {
		readings = readings.filter((r) => !r.municipality || r.municipality === municipality);
	}

	if (type) {
		readings = readings.filter((r) => r.type === type);
	}

	readings = readings.slice(0, limit);

	return json(
		{
			data: readings,
			meta: {
				total: readings.length,
				municipality,
				sources: {
					airQuality: aqiResult.status === 'fulfilled' ? aqiResult.value.length : 0,
					uv: uvResult.status === 'fulfilled' ? uvResult.value.length : 0,
					ocean: oncResult.status === 'fulfilled' ? oncResult.value.length : 0
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
