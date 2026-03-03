import type { SavedItem } from '$lib/types/index';

const STORAGE_KEY = 'svit-bookmarks';

function loadFromLocalStorage(): SavedItem[] {
	if (typeof window === 'undefined') return [];
	try {
		return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
	} catch {
		return [];
	}
}

function persist(items: SavedItem[]) {
	if (typeof window !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
	}
}

function getNowISO(): string {
	return new Date(Date.now()).toISOString();
}

let items = $state<SavedItem[]>(loadFromLocalStorage());

export const bookmarkStore = {
	get items() {
		return items;
	},
	add(item: Omit<SavedItem, 'id' | 'savedAt'>) {
		const newItem: SavedItem = {
			...item,
			id: crypto.randomUUID(),
			savedAt: getNowISO()
		};
		items = [...items, newItem];
		persist(items);
	},
	remove(id: string) {
		items = items.filter((i) => i.id !== id);
		persist(items);
	},
	removeByExternalId(externalId: string) {
		items = items.filter((i) => i.externalId !== externalId);
		persist(items);
	},
	has(externalId: string): boolean {
		return items.some((i) => i.externalId === externalId);
	},
	getByType(type: SavedItem['itemType']): SavedItem[] {
		return items.filter((i) => i.itemType === type);
	}
};
