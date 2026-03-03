import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { SocialPost } from '$lib/types/index';

const CACHE_MAX_AGE = 300; // 5 minutes

const BLUESKY_SEARCH_TERMS = ['yyj', 'yyjpoli', 'yyjevents', 'victoria bc', 'saanich', 'crd bc'];

/** Fetch posts from Bluesky AT Protocol public API */
async function fetchBlueskyPosts(searchTerm: string): Promise<SocialPost[]> {
	try {
		const params = new URLSearchParams({
			q: searchTerm,
			limit: '25',
			sort: 'latest'
		});

		const response = await fetch(
			`https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?${params}`,
			{
				headers: {
					Accept: 'application/json',
					'User-Agent': 'SVIT/1.0 (civic-dashboard)'
				},
				signal: AbortSignal.timeout(8000)
			}
		);

		if (!response.ok) return [];

		const data = await response.json();
		if (!data.posts || !Array.isArray(data.posts)) return [];

		return data.posts.map(
			(post: {
				uri: string;
				author: { displayName?: string; handle: string; avatar?: string };
				record: { text: string; createdAt: string };
				likeCount?: number;
				repostCount?: number;
				replyCount?: number;
			}) => ({
				id: `bsky-${hashCode(post.uri)}`,
				author: post.author.displayName || post.author.handle,
				authorHandle: post.author.handle,
				authorAvatar: post.author.avatar,
				content: post.record.text,
				url: `https://bsky.app/profile/${post.author.handle}/post/${post.uri.split('/').pop()}`,
				platform: 'bluesky' as const,
				published: post.record.createdAt,
				likes: post.likeCount || 0,
				reposts: post.repostCount || 0,
				replies: post.replyCount || 0,
				municipality: attributeMunicipality(post.record.text)
			})
		);
	} catch {
		return [];
	}
}

/** Generate seed social posts when API is unavailable */
function getSeedPosts(): SocialPost[] {
	const now = new Date();
	return [
		{
			id: 'seed-bsky-1',
			author: 'Victoria Civic Watch',
			authorHandle: 'viccivicwatch.bsky.social',
			content:
				"Tonight's council meeting agenda includes the controversial rezoning proposal for 1200 Douglas St. Public hearing expected to draw a crowd. #yyj #yyjpoli",
			url: 'https://bsky.app',
			platform: 'bluesky',
			published: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
			likes: 24,
			reposts: 8,
			replies: 12,
			municipality: 'victoria'
		},
		{
			id: 'seed-bsky-2',
			author: 'Saanich Watch',
			authorHandle: 'saanichwatch.bsky.social',
			content:
				'Saanich council voted 5-4 to approve the new cycling infrastructure plan for Shelbourne corridor. Big investment in active transportation. #saanich #yyj',
			url: 'https://bsky.app',
			platform: 'bluesky',
			published: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
			likes: 45,
			reposts: 15,
			replies: 23,
			municipality: 'saanich'
		},
		{
			id: 'seed-bsky-3',
			author: 'CRD Updates',
			authorHandle: 'crdupdates.bsky.social',
			content:
				'CRD board meeting tomorrow at 1:30 PM. Key agenda items: regional water supply, transit funding, and the affordable housing strategy update. #crd #yyj',
			url: 'https://bsky.app',
			platform: 'bluesky',
			published: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
			likes: 18,
			reposts: 6,
			replies: 4,
			municipality: undefined
		},
		{
			id: 'seed-bsky-4',
			author: 'Langford Civic',
			authorHandle: 'langfordcivic.bsky.social',
			content:
				'New 12-storey mixed-use development proposed for Goldstream Ave. 180 units. Council review next week. This is the third major development in 6 months. #langford #yyj',
			url: 'https://bsky.app',
			platform: 'bluesky',
			published: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
			likes: 32,
			reposts: 11,
			replies: 27,
			municipality: 'langford'
		},
		{
			id: 'seed-bsky-5',
			author: 'Oak Bay Local',
			authorHandle: 'oakbaylocal.bsky.social',
			content:
				'Oak Bay council approved changes to heritage conservation bylaws. Stricter protections for pre-1940 homes in Uplands. #oakbay #yyj',
			url: 'https://bsky.app',
			platform: 'bluesky',
			published: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(),
			likes: 15,
			reposts: 3,
			replies: 8,
			municipality: 'oak-bay'
		}
	];
}

function attributeMunicipality(text: string): string | undefined {
	const lower = text.toLowerCase();
	const patterns: [string, string[]][] = [
		['victoria', ['victoria', '#vic ', 'james bay', 'fernwood']],
		['saanich', ['saanich', '#saanich']],
		['esquimalt', ['esquimalt']],
		['oak-bay', ['oak bay', '#oakbay']],
		['langford', ['langford', '#langford']],
		['colwood', ['colwood']],
		['sooke', ['sooke']],
		['sidney', ['sidney']],
		['north-saanich', ['north saanich']],
		['central-saanich', ['central saanich', 'brentwood']],
		['view-royal', ['view royal']],
		['highlands', ['highlands district']],
		['metchosin', ['metchosin']]
	];

	for (const [slug, keywords] of patterns) {
		if (keywords.some((kw) => lower.includes(kw))) return slug;
	}
	return undefined;
}

function hashCode(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
	}
	return Math.abs(hash).toString(36);
}

export const GET: RequestHandler = async ({ url }) => {
	const municipality = url.searchParams.get('municipality');
	const limit = parseInt(url.searchParams.get('limit') || '30');

	// Fetch from Bluesky for each search term
	const promises = BLUESKY_SEARCH_TERMS.map((term) => fetchBlueskyPosts(term));
	const results = await Promise.all(promises);
	let posts = results.flat();

	// Deduplicate by post ID
	const seen = new Set<string>();
	posts = posts.filter((post) => {
		if (seen.has(post.id)) return false;
		seen.add(post.id);
		return true;
	});

	// If no live data, use seed posts
	if (posts.length === 0) {
		posts = getSeedPosts();
	}

	// Filter by municipality
	if (municipality) {
		posts = posts.filter((p) => !p.municipality || p.municipality === municipality);
	}

	// Sort by date (newest first)
	posts.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
	posts = posts.slice(0, limit);

	return json(
		{ data: posts, meta: { total: posts.length, municipality } },
		{
			headers: {
				'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=600`
			}
		}
	);
};
