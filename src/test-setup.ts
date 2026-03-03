import { vi } from 'vitest';

const storage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
	getItem: vi.fn((key: string) => storage[key] || null),
	setItem: vi.fn((key: string, val: string) => {
		storage[key] = val;
	}),
	removeItem: vi.fn((key: string) => {
		delete storage[key];
	}),
	clear: vi.fn(() => {
		Object.keys(storage).forEach((k) => delete storage[k]);
	})
});

vi.stubGlobal(
	'matchMedia',
	vi.fn(() => ({
		matches: false,
		addListener: vi.fn(),
		removeListener: vi.fn()
	}))
);
