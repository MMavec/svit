import type { Municipality } from '$lib/types/index';
import { municipalities, CRD_BBOX, CRD_CENTER } from '$lib/config/municipalities';

const STORAGE_KEY = 'svit-municipality';

function getInitialSlug(): string | null {
	if (typeof window === 'undefined') return null;
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored && municipalities.some((m) => m.slug === stored)) return stored;
	return null;
}

let selectedSlug = $state<string | null>(getInitialSlug());

export const municipalityStore = {
	get slug() {
		return selectedSlug;
	},
	get current(): Municipality | null {
		if (!selectedSlug) return null;
		return municipalities.find((m) => m.slug === selectedSlug) ?? null;
	},
	get isAllCRD() {
		return selectedSlug === null;
	},
	get label() {
		if (!selectedSlug) return 'All CRD';
		return this.current?.name ?? 'All CRD';
	},
	get bbox(): [number, number, number, number] {
		return this.current?.bbox ?? CRD_BBOX;
	},
	get center(): [number, number] {
		if (!this.current) return CRD_CENTER;
		const b = this.current.bbox;
		return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
	},
	get color(): string {
		return this.current?.color ?? '#63B3ED';
	},
	select(slug: string | null) {
		selectedSlug = slug;
		if (typeof window !== 'undefined') {
			if (slug) {
				localStorage.setItem(STORAGE_KEY, slug);
			} else {
				localStorage.removeItem(STORAGE_KEY);
			}
		}
	}
};
