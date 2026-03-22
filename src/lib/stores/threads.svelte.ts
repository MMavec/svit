import { authStore } from '$lib/stores/auth.svelte';

// TODO: Add admin toggle for auth-required mode

const STORAGE_KEY = 'svit-threads';

export interface ThreadMessage {
	id: string;
	text: string;
	author: string;
	timestamp: string;
}

export interface Thread {
	id: string;
	title: string;
	municipality: string | null;
	messages: ThreadMessage[];
	createdAt: string;
}

function loadFromLocalStorage(): Thread[] {
	if (typeof window === 'undefined') return [];
	try {
		return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
	} catch {
		return [];
	}
}

function persist(data: Thread[]) {
	if (typeof window !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	}
}

function getNowISO(): string {
	return new Date(Date.now()).toISOString();
}

function getAuthorName(): string {
	if (authStore.isAuthenticated && authStore.user) {
		return authStore.user.email ?? 'User';
	}
	return 'Anonymous';
}

let threads = $state<Thread[]>(loadFromLocalStorage());

export const threadStore = {
	get threads() {
		return threads;
	},

	addThread(title: string, municipality: string | null): Thread {
		const thread: Thread = {
			id: crypto.randomUUID(),
			title: title.trim(),
			municipality: municipality || null,
			messages: [],
			createdAt: getNowISO()
		};
		threads = [thread, ...threads];
		persist(threads);
		return thread;
	},

	addMessage(threadId: string, text: string, author?: string): ThreadMessage | null {
		const thread = threads.find((t) => t.id === threadId);
		if (!thread) return null;
		const msg: ThreadMessage = {
			id: crypto.randomUUID(),
			text: text.trim(),
			author: author || getAuthorName(),
			timestamp: getNowISO()
		};
		thread.messages = [...thread.messages, msg];
		threads = [...threads];
		persist(threads);
		return msg;
	},

	getThreads(municipality?: string | null): Thread[] {
		if (!municipality) return threads;
		return threads.filter((t) => t.municipality === municipality);
	},

	deleteThread(threadId: string) {
		threads = threads.filter((t) => t.id !== threadId);
		persist(threads);
	}
};
