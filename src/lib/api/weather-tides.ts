import type { WeatherTidesData } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchWeatherTides() {
	return apiFetch<WeatherTidesData>('/weather-tides');
}
