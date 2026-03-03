import type { Theme } from '$lib/types/index';

const STORAGE_KEY = 'svit-theme';

function getInitialTheme(): Theme {
	if (typeof window === 'undefined') return 'dark';
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === 'light' || stored === 'dark') return stored;
	return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

let current = $state<Theme>(getInitialTheme());

export const theme = {
	get value() {
		return current;
	},
	set value(t: Theme) {
		current = t;
		if (typeof window !== 'undefined') {
			localStorage.setItem(STORAGE_KEY, t);
			document.documentElement.setAttribute('data-theme', t);
		}
	},
	toggle() {
		this.value = current === 'dark' ? 'light' : 'dark';
	},
	init() {
		if (typeof window !== 'undefined') {
			document.documentElement.setAttribute('data-theme', current);
		}
	}
};
