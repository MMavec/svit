import { describe, it, expect, vi, beforeEach } from 'vitest';

// The bookmarks store uses $state (Svelte 5 runes) so we test the
// underlying persistence logic and API contract via a fresh import each test.
// Vitest's jsdom + test-setup.ts provides localStorage mock.

describe('bookmarks store', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.resetModules();
	});

	async function getStore() {
		const mod = await import('../bookmarks.svelte');
		return mod.bookmarkStore;
	}

	it('starts with empty items when localStorage is empty', async () => {
		const store = await getStore();
		expect(store.items).toEqual([]);
	});

	it('adds a bookmark and persists to localStorage', async () => {
		const store = await getStore();
		store.add({
			itemType: 'meeting',
			externalId: 'ext-1',
			title: 'Council meeting'
		});

		expect(store.items).toHaveLength(1);
		expect(store.items[0].title).toBe('Council meeting');
		expect(store.items[0].externalId).toBe('ext-1');
		expect(store.items[0].id).toBeTruthy();
		expect(store.items[0].savedAt).toBeTruthy();

		// Check localStorage
		const stored = JSON.parse(localStorage.getItem('svit-bookmarks') || '[]');
		expect(stored).toHaveLength(1);
	});

	it('has() returns true for existing and false for missing items', async () => {
		const store = await getStore();
		store.add({ itemType: 'news', externalId: 'news-1', title: 'Article' });

		expect(store.has('news-1')).toBe(true);
		expect(store.has('nonexistent')).toBe(false);
	});

	it('removes a bookmark by id', async () => {
		const store = await getStore();
		store.add({ itemType: 'event', externalId: 'evt-1', title: 'Festival' });
		const id = store.items[0].id;

		store.remove(id);
		expect(store.items).toHaveLength(0);
	});

	it('removes a bookmark by externalId', async () => {
		const store = await getStore();
		store.add({ itemType: 'development', externalId: 'dev-1', title: 'Rezoning' });

		store.removeByExternalId('dev-1');
		expect(store.items).toHaveLength(0);
		expect(store.has('dev-1')).toBe(false);
	});

	it('getByType filters correctly', async () => {
		const store = await getStore();
		store.add({ itemType: 'meeting', externalId: 'a', title: 'Meeting A' });
		store.add({ itemType: 'news', externalId: 'b', title: 'News B' });
		store.add({ itemType: 'meeting', externalId: 'c', title: 'Meeting C' });

		const meetings = store.getByType('meeting');
		expect(meetings).toHaveLength(2);
		expect(meetings.every((m) => m.itemType === 'meeting')).toBe(true);
	});

	it('loads persisted bookmarks on re-import', async () => {
		const store1 = await getStore();
		store1.add({ itemType: 'wildlife', externalId: 'w-1', title: 'Orca sighting' });

		// Reset module to simulate fresh load
		vi.resetModules();
		const store2 = await getStore();
		expect(store2.items).toHaveLength(1);
		expect(store2.items[0].title).toBe('Orca sighting');
	});

	it('handles corrupted localStorage gracefully', async () => {
		localStorage.setItem('svit-bookmarks', 'not-valid-json!!!');
		const store = await getStore();
		expect(store.items).toEqual([]);
	});
});
