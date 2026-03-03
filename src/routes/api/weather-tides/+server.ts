import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type {
	WeatherConditions,
	WeatherForecast,
	TidePrediction,
	TideObservation,
	WeatherTidesData
} from '$lib/types/index';

const CACHE_MAX_AGE = 900; // 15 minutes

// Environment Canada CityPage weather for Victoria
const EC_WEATHER_URL = 'https://dd.weather.gc.ca/citypage_weather/xml/BC/s0000828_e.xml';
const EC_WEATHER_FALLBACK = 'https://dd.weather.gc.ca/citypage_weather/xml/BC/s0000390_e.xml';

// CHS IWLS API for Victoria Harbour tides
const IWLS_BASE = 'https://api-iwls.dfo-mpo.gc.ca/api/v1';
const VICTORIA_HARBOUR_CODE = '07120';

// Cache the resolved station UUID across requests (module scope)
let cachedStationId: string | null = null;

/** Resolve CHS station code to IWLS UUID */
async function resolveStationId(): Promise<string | null> {
	if (cachedStationId) return cachedStationId;

	try {
		const response = await fetch(
			`${IWLS_BASE}/stations?chs-station-code=${VICTORIA_HARBOUR_CODE}`,
			{
				headers: { Accept: 'application/json' },
				signal: AbortSignal.timeout(8000)
			}
		);

		if (!response.ok) return null;

		const stations = await response.json();
		if (Array.isArray(stations) && stations.length > 0) {
			cachedStationId = stations[0].id;
			return cachedStationId;
		}
		return null;
	} catch {
		return null;
	}
}

/** Fetch Environment Canada weather conditions + forecast */
async function fetchWeatherData(): Promise<{
	current: WeatherConditions | null;
	forecast: WeatherForecast[];
}> {
	const empty = { current: null, forecast: [] };

	for (const url of [EC_WEATHER_URL, EC_WEATHER_FALLBACK]) {
		try {
			const response = await fetch(url, {
				headers: { 'User-Agent': 'SVIT/1.0' },
				signal: AbortSignal.timeout(8000)
			});

			if (!response.ok) continue;

			const xml = await response.text();
			if (!xml.includes('<siteData')) continue;

			const current = parseCurrentConditions(xml);
			const forecast = parseForecast(xml);

			return { current, forecast };
		} catch {
			continue;
		}
	}

	return empty;
}

function parseCurrentConditions(xml: string): WeatherConditions | null {
	const block = xml.match(/<currentConditions>[\s\S]*?<\/currentConditions>/);
	if (!block) return null;
	const cc = block[0];

	const station = cc.match(/<station[^>]*>([^<]*)<\/station>/)?.[1] || 'Victoria';
	const temperature = parseFloat(
		cc.match(/<temperature[^>]*unitType="metric"[^>]*>([^<]*)<\/temperature>/)?.[1] || ''
	);
	const condition = cc.match(/<condition>([^<]*)<\/condition>/)?.[1] || 'Unknown';
	const iconCode = cc.match(/<iconCode[^>]*>([^<]*)<\/iconCode>/)?.[1] || '00';
	const humidity = parseFloat(
		cc.match(/<relativeHumidity[^>]*>([^<]*)<\/relativeHumidity>/)?.[1] || '0'
	);
	const windSpeed = parseFloat(
		cc.match(/<speed[^>]*unitType="metric"[^>]*>([^<]*)<\/speed>/)?.[1] || '0'
	);
	const windGustStr = cc.match(/<gust[^>]*unitType="metric"[^>]*>([^<]*)<\/gust>/)?.[1];
	const windDirection = cc.match(/<direction>([^<]*)<\/direction>/)?.[1] || '';
	const pressure = parseFloat(
		cc.match(/<pressure[^>]*unitType="metric"[^>]*>([^<]*)<\/pressure>/)?.[1] || '0'
	);
	const pressureTrend = cc.match(/<pressure[^>]*tendency="([^"]*)"[^>]*>/)?.[1] || undefined;
	const visibility = parseFloat(
		cc.match(/<visibility[^>]*unitType="metric"[^>]*>([^<]*)<\/visibility>/)?.[1] || ''
	);
	const dateStamp = cc.match(
		/<dateTime[^>]*zone="UTC"[^>]*>[\s\S]*?<timeStamp>([^<]*)<\/timeStamp>[\s\S]*?<\/dateTime>/
	)?.[1];

	if (isNaN(temperature)) return null;

	return {
		temperature,
		temperatureUnit: 'C',
		condition,
		iconCode,
		windSpeed: isNaN(windSpeed) ? 0 : windSpeed,
		windDirection,
		windGust: windGustStr ? parseFloat(windGustStr) : undefined,
		humidity: isNaN(humidity) ? 0 : humidity,
		pressure: isNaN(pressure) ? 0 : pressure,
		pressureTrend: pressureTrend || undefined,
		visibility: isNaN(visibility) ? undefined : visibility,
		observedAt: dateStamp
			? `${dateStamp.slice(0, 4)}-${dateStamp.slice(4, 6)}-${dateStamp.slice(6, 8)}T${dateStamp.slice(8, 10)}:${dateStamp.slice(10, 12)}:00Z`
			: new Date().toISOString(),
		station
	};
}

function parseForecast(xml: string): WeatherForecast[] {
	const forecasts: WeatherForecast[] = [];
	const entries = xml.match(/<forecast>[\s\S]*?<\/forecast>/g) || [];

	for (const entry of entries.slice(0, 6)) {
		const period = entry.match(/<period[^>]*>([^<]*)<\/period>/)?.[1] || '';
		const summary = entry.match(/<textSummary>([^<]*)<\/textSummary>/)?.[1] || '';
		const iconCode =
			entry.match(
				/<abbreviatedForecast>[\s\S]*?<iconCode[^>]*>([^<]*)<\/iconCode>[\s\S]*?<\/abbreviatedForecast>/
			)?.[1] || '00';
		const condition =
			entry.match(
				/<abbreviatedForecast>[\s\S]*?<textSummary>([^<]*)<\/textSummary>[\s\S]*?<\/abbreviatedForecast>/
			)?.[1] || '';
		const pop = entry.match(
			/<abbreviatedForecast>[\s\S]*?<pop[^>]*>([^<]*)<\/pop>[\s\S]*?<\/abbreviatedForecast>/
		)?.[1];

		// Temperature: check class attribute for high/low
		const tempMatch = entry.match(
			/<temperatures>[\s\S]*?<temperature[^>]*class="([^"]*)"[^>]*unitType="metric"[^>]*>([^<]*)<\/temperature>[\s\S]*?<\/temperatures>/
		);
		const temperatureType = (tempMatch?.[1] === 'high' ? 'high' : 'low') as 'high' | 'low';
		const temperature = parseFloat(tempMatch?.[2] || '0');

		if (period) {
			forecasts.push({
				period,
				temperature: isNaN(temperature) ? 0 : temperature,
				temperatureType,
				condition,
				iconCode,
				pop: pop ? parseInt(pop) : undefined,
				summary
			});
		}
	}

	return forecasts;
}

/** Fetch CHS IWLS tide data for Victoria Harbour */
async function fetchTideData(): Promise<{
	current: TideObservation | null;
	predictions: TidePrediction[];
	station: string;
}> {
	const empty = { current: null, predictions: [], station: 'Victoria Harbour' };

	const stationId = await resolveStationId();
	if (!stationId) return empty;

	const now = new Date();
	const from = now.toISOString();
	const to = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
	const recentFrom = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

	try {
		const [hiloResult, obsResult] = await Promise.allSettled([
			// High/low tide predictions for next 48 hours
			fetch(
				`${IWLS_BASE}/stations/${stationId}/data?time-series-code=wlp-hilo&from=${from}&to=${to}`,
				{
					headers: { Accept: 'application/json' },
					signal: AbortSignal.timeout(10000)
				}
			).then((r) => (r.ok ? r.json() : [])),

			// Recent observations for current water level
			fetch(
				`${IWLS_BASE}/stations/${stationId}/data?time-series-code=wlo&from=${recentFrom}&to=${from}&resolution=FIFTEEN_MINUTES`,
				{
					headers: { Accept: 'application/json' },
					signal: AbortSignal.timeout(10000)
				}
			).then((r) => (r.ok ? r.json() : []))
		]);

		const predictions: TidePrediction[] = [];
		if (hiloResult.status === 'fulfilled' && Array.isArray(hiloResult.value)) {
			for (const entry of hiloResult.value.slice(0, 8)) {
				predictions.push({
					time: entry.eventDate || entry.time || '',
					height: typeof entry.value === 'number' ? entry.value : parseFloat(entry.value || '0'),
					type: (entry.event || '').toLowerCase().includes('high') ? 'high' : 'low'
				});
			}
		}

		let current: TideObservation | null = null;
		if (
			obsResult.status === 'fulfilled' &&
			Array.isArray(obsResult.value) &&
			obsResult.value.length > 0
		) {
			const latest = obsResult.value[obsResult.value.length - 1];
			current = {
				time: latest.eventDate || latest.time || now.toISOString(),
				height: typeof latest.value === 'number' ? latest.value : parseFloat(latest.value || '0')
			};
		}

		return { current, predictions, station: 'Victoria Harbour' };
	} catch {
		return empty;
	}
}

function getSeedData(): WeatherTidesData {
	const now = new Date();
	return {
		weather: {
			current: {
				temperature: 9,
				temperatureUnit: 'C',
				condition: 'Mostly Cloudy',
				iconCode: '03',
				windSpeed: 22,
				windDirection: 'SW',
				windGust: 35,
				humidity: 82,
				pressure: 1012.5,
				pressureTrend: 'falling',
				visibility: 24,
				observedAt: now.toISOString(),
				station: 'Victoria Intl Airport'
			},
			forecast: [
				{
					period: 'Tonight',
					temperature: 5,
					temperatureType: 'low',
					condition: 'Cloudy',
					iconCode: '10',
					pop: 30,
					summary: 'Cloudy. 30 percent chance of showers overnight. Low 5.'
				},
				{
					period: 'Tuesday',
					temperature: 11,
					temperatureType: 'high',
					condition: 'Mix of sun and cloud',
					iconCode: '02',
					pop: 20,
					summary: 'A mix of sun and cloud. High 11.'
				},
				{
					period: 'Tuesday night',
					temperature: 4,
					temperatureType: 'low',
					condition: 'Clear',
					iconCode: '30',
					summary: 'Clear. Low 4.'
				},
				{
					period: 'Wednesday',
					temperature: 10,
					temperatureType: 'high',
					condition: 'Rain',
					iconCode: '12',
					pop: 80,
					summary: 'Rain. High 10.'
				}
			]
		},
		tides: {
			current: {
				time: now.toISOString(),
				height: 2.1
			},
			predictions: [
				{
					time: new Date(now.getTime() + 2 * 3600000).toISOString(),
					height: 3.2,
					type: 'high'
				},
				{
					time: new Date(now.getTime() + 8 * 3600000).toISOString(),
					height: 0.6,
					type: 'low'
				},
				{
					time: new Date(now.getTime() + 14 * 3600000).toISOString(),
					height: 2.9,
					type: 'high'
				},
				{
					time: new Date(now.getTime() + 20 * 3600000).toISOString(),
					height: 0.8,
					type: 'low'
				}
			],
			station: 'Victoria Harbour'
		}
	};
}

export const GET: RequestHandler = async () => {
	const [weatherResult, tideResult] = await Promise.allSettled([
		fetchWeatherData(),
		fetchTideData()
	]);

	const weather =
		weatherResult.status === 'fulfilled' ? weatherResult.value : { current: null, forecast: [] };

	const tides =
		tideResult.status === 'fulfilled'
			? tideResult.value
			: { current: null, predictions: [], station: 'Victoria Harbour' };

	// If both sources returned nothing, use seed data
	const noWeather = !weather.current && weather.forecast.length === 0;
	const noTides = !tides.current && tides.predictions.length === 0;

	const data: WeatherTidesData = noWeather && noTides ? getSeedData() : { weather, tides };

	return json(
		{
			data,
			meta: {
				sources: {
					weather: weather.current ? 'live' : 'seed',
					tides: tides.predictions.length > 0 ? 'live' : 'seed'
				}
			}
		},
		{
			headers: {
				'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=1800`
			}
		}
	);
};
