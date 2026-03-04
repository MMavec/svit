import type { LeadSubmission } from '$lib/types/index';

const STORAGE_KEY = 'svit-lead-capture';

interface LeadState {
	submitted: boolean;
	dismissed: boolean;
	dismissedAt?: string;
}

function getLeadState(): LeadState {
	if (typeof window === 'undefined') return { submitted: false, dismissed: false };
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored ? JSON.parse(stored) : { submitted: false, dismissed: false };
	} catch {
		return { submitted: false, dismissed: false };
	}
}

function persist(s: LeadState) {
	if (typeof window !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
	}
}

let state = $state<LeadState>(getLeadState());
let showPrompt = $state(false);
let showModal = $state(false);

export const leadStore = {
	get submitted() {
		return state.submitted;
	},
	get dismissed() {
		return state.dismissed;
	},
	get showPrompt() {
		return showPrompt;
	},
	set showPrompt(v: boolean) {
		showPrompt = v;
	},
	get showModal() {
		return showModal;
	},
	set showModal(v: boolean) {
		showModal = v;
	},

	shouldShowPrompt(): boolean {
		return !state.submitted && !state.dismissed;
	},

	markSubmitted() {
		state = { ...state, submitted: true };
		showPrompt = false;
		showModal = false;
		persist(state);
	},

	dismiss() {
		state = { ...state, dismissed: true, dismissedAt: Date.now().toString() };
		showPrompt = false;
		persist(state);
	},

	openModal() {
		showModal = true;
		showPrompt = false;
	},

	async submitLead(data: LeadSubmission): Promise<{ success: boolean; error?: string }> {
		try {
			const res = await fetch('/api/leads', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			});
			const result = await res.json();
			if (result.success) {
				this.markSubmitted();
				return { success: true };
			}
			return { success: false, error: result.error || 'Submission failed' };
		} catch {
			return { success: false, error: 'Network error. Please try again.' };
		}
	}
};
