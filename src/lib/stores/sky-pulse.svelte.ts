/**
 * Sky Pulse Store — "The Living Sky"
 *
 * Aggregates data from existing API sources into normalized signals that drive
 * the animated background (StarrySky / CloudySky). All fetches go through the
 * IndexedDB cache layer, so panels that already fetched the same data won't
 * trigger redundant network calls.
 */

import { fetchSafetyAlerts } from '$lib/api/safety';
import { fetchWildlifeSightings } from '$lib/api/wildlife';
import { fetchWeatherTides } from '$lib/api/weather-tides';
import { fetchEnvironmentReadings } from '$lib/api/environment';
import { fetchMeetings } from '$lib/api/council';
import { fetchNews } from '$lib/api/news';
import { fetchSocialPosts } from '$lib/api/social';
import { fetchDevelopments } from '$lib/api/development';
import { fetchTransitAlerts } from '$lib/api/transit';
import { fetchConstruction } from '$lib/api/construction';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

// --- Reactive state with sensible defaults (sky looks normal before data arrives) ---

let civicActivity = $state(0.3);
let alertLevel = $state(0);
let alertSeverity = $state<'none' | 'advisory' | 'watch' | 'warning' | 'emergency'>('none');
let airQuality = $state(0.8);
let tideHeight = $state(0.5);
let temperature = $state(12);
let transitDisruptions = $state(0);
let dominantCategory = $state<'political' | 'safety' | 'nature' | 'community' | 'neutral'>(
	'neutral'
);
let recentSightings = $state<{ species: string; commonName: string; category: string }[]>([]);
let initialized = $state(false);

let refreshTimer: ReturnType<typeof setInterval> | null = null;

async function refresh() {
	try {
		const [
			safetyRes,
			wildlifeRes,
			weatherRes,
			envRes,
			councilRes,
			newsRes,
			socialRes,
			devRes,
			transitRes,
			constructionRes
		] = await Promise.allSettled([
			fetchSafetyAlerts({ limit: 50 }),
			fetchWildlifeSightings({ limit: 20 }),
			fetchWeatherTides(),
			fetchEnvironmentReadings({ limit: 20 }),
			fetchMeetings({ limit: 30 }),
			fetchNews({ limit: 50 }),
			fetchSocialPosts({ limit: 30 }),
			fetchDevelopments({ limit: 50 }),
			fetchTransitAlerts({ limit: 50 }),
			fetchConstruction({ limit: 50 })
		]);

		// Helper to safely extract data arrays from settled results
		function extract<T>(result: PromiseSettledResult<{ data: T }>): T | null {
			if (result.status === 'fulfilled' && result.value?.data) {
				return result.value.data;
			}
			return null;
		}

		// --- Civic Activity (0-1) ---
		const council = extract<unknown[]>(councilRes)?.length ?? 0;
		const news = extract<unknown[]>(newsRes)?.length ?? 0;
		const social = extract<unknown[]>(socialRes)?.length ?? 0;
		const dev = extract<unknown[]>(devRes)?.length ?? 0;
		const totalCivic = council + news + social + dev;
		civicActivity = Math.min(1, totalCivic / 100);

		// --- Safety Alerts ---
		const alerts = extract<{ severity: string; type: string }[]>(safetyRes) ?? [];
		alertLevel = Math.min(1, alerts.length / 10);

		const severityOrder = ['emergency', 'warning', 'watch', 'advisory'] as const;
		let highestSev: typeof alertSeverity = 'none';
		for (const sev of severityOrder) {
			if (alerts.some((a) => a.severity === sev)) {
				highestSev = sev;
				break;
			}
		}
		alertSeverity = highestSev;

		// --- Transit + Construction Disruptions (0-1) ---
		const transit = extract<unknown[]>(transitRes)?.length ?? 0;
		const construction = extract<unknown[]>(constructionRes)?.length ?? 0;
		transitDisruptions = Math.min(1, (transit + construction) / 15);

		// --- Wildlife Sightings (unique by category, max 5) ---
		const wildlife =
			extract<{ species: string; commonName: string; category: string }[]>(wildlifeRes) ?? [];
		const seenCategories: string[] = [];
		const sightings: typeof recentSightings = [];
		for (const w of wildlife) {
			if (!seenCategories.includes(w.category) && sightings.length < 5) {
				seenCategories.push(w.category);
				sightings.push({
					species: w.species,
					commonName: w.commonName,
					category: w.category
				});
			}
		}
		recentSightings = sightings;

		// --- Weather + Tides ---
		if (weatherRes.status === 'fulfilled' && weatherRes.value?.data) {
			const wd = weatherRes.value.data as {
				weather?: { current?: { temperature: number } };
				tides?: {
					current?: { height: number };
					predictions?: { height: number }[];
				};
			};
			if (wd.weather?.current) {
				temperature = wd.weather.current.temperature;
			}
			if (wd.tides?.current) {
				// Victoria Harbour tides range roughly -0.5m to 3.5m → normalize to 0-1
				tideHeight = Math.max(0, Math.min(1, (wd.tides.current.height + 0.5) / 4));
			} else if (wd.tides?.predictions?.length) {
				const next = wd.tides.predictions[0];
				tideHeight = Math.max(0, Math.min(1, (next.height + 0.5) / 4));
			}
		}

		// --- Air Quality ---
		const envReadings = extract<{ type: string; value: number }[]>(envRes) ?? [];
		const aqiReading = envReadings.find((e) => e.type === 'air-quality');
		if (aqiReading) {
			// AQI 0 = best, 150+ = bad. Invert and normalize so 1 = excellent, 0 = hazardous
			airQuality = Math.max(0, Math.min(1, 1 - aqiReading.value / 150));
		}

		// --- Dominant Data Category ---
		const categories: Record<string, number> = {
			political: council + dev,
			safety: alerts.length * 3,
			nature: wildlife.length,
			community: news + social
		};
		const maxVal = Math.max(...Object.values(categories));
		if (maxVal === 0) {
			dominantCategory = 'neutral';
		} else {
			const top = Object.entries(categories).find(([, v]) => v === maxVal);
			dominantCategory = (top?.[0] as typeof dominantCategory) ?? 'neutral';
		}

		initialized = true;
	} catch {
		// Silently fail — sky animations fall back to defaults
	}
}

export const skyPulseStore = {
	get civicActivity() {
		return civicActivity;
	},
	get alertLevel() {
		return alertLevel;
	},
	get alertSeverity() {
		return alertSeverity;
	},
	get airQuality() {
		return airQuality;
	},
	get tideHeight() {
		return tideHeight;
	},
	get temperature() {
		return temperature;
	},
	get transitDisruptions() {
		return transitDisruptions;
	},
	get dominantCategory() {
		return dominantCategory;
	},
	get recentSightings() {
		return recentSightings;
	},
	get initialized() {
		return initialized;
	},

	init() {
		if (typeof window === 'undefined') return;
		refresh();
		if (refreshTimer) clearInterval(refreshTimer);
		refreshTimer = setInterval(refresh, REFRESH_INTERVAL);
	},

	destroy() {
		if (refreshTimer) {
			clearInterval(refreshTimer);
			refreshTimer = null;
		}
	}
};
