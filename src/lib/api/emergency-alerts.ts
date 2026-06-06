import type { EmergencyAlert } from '$lib/types/index';
import { apiFetch } from './fetcher';

export async function fetchEmergencyAlerts(params?: { limit?: number }) {
	return apiFetch<EmergencyAlert[]>('/emergency-alerts', { limit: params?.limit || 40 });
}
