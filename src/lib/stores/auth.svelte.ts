import { supabase, isConfigured } from '$lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

let user = $state<User | null>(null);
let session = $state<Session | null>(null);
let loading = $state(true);
let showAuthModal = $state(false);

async function initialize() {
	if (!isConfigured() || !supabase) {
		loading = false;
		return;
	}

	const {
		data: { session: currentSession }
	} = await supabase.auth.getSession();

	session = currentSession;
	user = currentSession?.user ?? null;
	loading = false;

	supabase.auth.onAuthStateChange((_event, newSession) => {
		session = newSession;
		user = newSession?.user ?? null;
	});
}

export const authStore = {
	get user() {
		return user;
	},
	get session() {
		return session;
	},
	get loading() {
		return loading;
	},
	get isAuthenticated() {
		return user !== null;
	},
	get showAuthModal() {
		return showAuthModal;
	},
	set showAuthModal(v: boolean) {
		showAuthModal = v;
	},
	get configured() {
		return isConfigured();
	},
	initialize,
	async signInWithEmail(email: string, password: string) {
		if (!supabase) return { error: 'Supabase not configured' };
		const { error } = await supabase.auth.signInWithPassword({ email, password });
		return { error: error?.message ?? null };
	},
	async signUpWithEmail(email: string, password: string) {
		if (!supabase) return { error: 'Supabase not configured' };
		const { error } = await supabase.auth.signUp({ email, password });
		return { error: error?.message ?? null };
	},
	async signOut() {
		if (!supabase) return;
		await supabase.auth.signOut();
		user = null;
		session = null;
	},
	async resetPassword(email: string) {
		if (!supabase) return { error: 'Supabase not configured' };
		const { error } = await supabase.auth.resetPasswordForEmail(email);
		return { error: error?.message ?? null };
	}
};
