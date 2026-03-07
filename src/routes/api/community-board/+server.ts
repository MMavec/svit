import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { CommunityPost } from '$lib/types/index';
import { parseLimit, parseMunicipality, parseEnum } from '$lib/utils/api-validation';
import { hashCode } from '$lib/utils/hash';

const CACHE_MAX_AGE = 300; // 5 minutes

const validCategories = new Set([
	'for-sale',
	'free',
	'wanted',
	'services',
	'housing',
	'events',
	'other'
] as const);

/** Fetch from Craigslist Victoria RSS feeds */
async function fetchCraigslistPosts(): Promise<CommunityPost[]> {
	const feeds = [
		{
			url: 'https://victoria.craigslist.org/search/sss?format=rss',
			category: 'for-sale' as const
		},
		{
			url: 'https://victoria.craigslist.org/search/zip?format=rss',
			category: 'free' as const
		},
		{
			url: 'https://victoria.craigslist.org/search/bbb?format=rss',
			category: 'services' as const
		}
	];

	const results = await Promise.allSettled(
		feeds.map(async (feed) => {
			try {
				const response = await fetch(feed.url, {
					headers: { 'User-Agent': 'SVIT/1.0 (civic-dashboard)' },
					signal: AbortSignal.timeout(8000)
				});
				if (!response.ok) return [];

				const xml = await response.text();
				const posts: CommunityPost[] = [];

				// Parse RSS items
				const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
				let match;
				while ((match = itemRegex.exec(xml)) !== null && posts.length < 10) {
					const itemXml = match[1];
					const title = extractTag(itemXml, 'title');
					const description = extractTag(itemXml, 'description');
					const link = extractTag(itemXml, 'link');
					const pubDate = extractTag(itemXml, 'dc:date') || extractTag(itemXml, 'pubDate');

					if (title && link) {
						posts.push({
							id: `cl-${feed.category}-${hashCode(link)}`,
							title: stripHtml(title).slice(0, 200),
							description: stripHtml(description || '').slice(0, 500),
							category: feed.category,
							municipality: attributeMunicipality(title + ' ' + (description || '')),
							postedAt: pubDate || new Date().toISOString(),
							source: 'craigslist'
						});
					}
				}

				return posts;
			} catch {
				return [];
			}
		})
	);

	return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
}

/** Fetch from UsedVictoria RSS */
async function fetchUsedVictoriaPosts(): Promise<CommunityPost[]> {
	try {
		const response = await fetch('https://www.usedvictoria.com/rss', {
			headers: { 'User-Agent': 'SVIT/1.0 (civic-dashboard)' },
			signal: AbortSignal.timeout(8000)
		});
		if (!response.ok) return [];

		const xml = await response.text();
		const posts: CommunityPost[] = [];

		const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
		let match;
		while ((match = itemRegex.exec(xml)) !== null && posts.length < 15) {
			const itemXml = match[1];
			const title = extractTag(itemXml, 'title');
			const description = extractTag(itemXml, 'description');
			const link = extractTag(itemXml, 'link');
			const pubDate = extractTag(itemXml, 'pubDate');

			if (title && link) {
				posts.push({
					id: `uv-${hashCode(link)}`,
					title: stripHtml(title).slice(0, 200),
					description: stripHtml(description || '').slice(0, 500),
					category: classifyPost(title),
					municipality: attributeMunicipality(title + ' ' + (description || '')),
					postedAt: pubDate || new Date().toISOString(),
					source: 'usedvictoria'
				});
			}
		}

		return posts;
	} catch {
		return [];
	}
}

function extractTag(xml: string, tag: string): string {
	const regex = new RegExp(
		`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`,
		'i'
	);
	const match = regex.exec(xml);
	return match ? match[1].trim() : '';
}

function stripHtml(html: string): string {
	return html
		.replace(/<[^>]+>/g, '')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&rsquo;/g, '\u2019')
		.replace(/&ldquo;/g, '\u201C')
		.replace(/&rdquo;/g, '\u201D')
		.replace(/&mdash;/g, '\u2014')
		.replace(/&hellip;/g, '\u2026')
		.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
		.trim();
}

function classifyPost(title: string): CommunityPost['category'] {
	const lower = title.toLowerCase();
	if (lower.includes('free') || lower.includes('curb alert')) return 'free';
	if (lower.includes('wanted') || lower.includes('looking for') || lower.includes('iso'))
		return 'wanted';
	if (
		lower.includes('rent') ||
		lower.includes('bedroom') ||
		lower.includes('suite') ||
		lower.includes('apartment')
	)
		return 'housing';
	if (
		lower.includes('service') ||
		lower.includes('handyman') ||
		lower.includes('cleaning') ||
		lower.includes('repair')
	)
		return 'services';
	return 'for-sale';
}

function attributeMunicipality(text: string): string | undefined {
	const lower = text.toLowerCase();
	const mapping: Record<string, string> = {
		victoria: 'victoria',
		'oak bay': 'oak-bay',
		saanich: 'saanich',
		esquimalt: 'esquimalt',
		langford: 'langford',
		colwood: 'colwood',
		sidney: 'sidney',
		'north saanich': 'north-saanich',
		'central saanich': 'central-saanich',
		sooke: 'sooke',
		'view royal': 'view-royal',
		metchosin: 'metchosin',
		highlands: 'highlands'
	};
	for (const [name, slug] of Object.entries(mapping)) {
		if (lower.includes(name)) return slug;
	}
	return undefined;
}

function getSeedPosts(): CommunityPost[] {
	const now = new Date();
	return [
		{
			id: 'cb-seed-1',
			title: 'Moving Sale — Furniture, Kitchen Items, Garden Tools',
			description:
				'Downsizing — quality furniture, kitchen appliances, garden tools, and more. Everything must go. Cash or e-transfer.',
			category: 'for-sale',
			municipality: 'saanich',
			postedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
			source: 'seed'
		},
		{
			id: 'cb-seed-2',
			title: 'Free Firewood — Oak Bay Pickup',
			description:
				'Just had a tree taken down. Free firewood, already cut and split. Bring your own vehicle to load up.',
			category: 'free',
			municipality: 'oak-bay',
			postedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
			source: 'seed'
		},
		{
			id: 'cb-seed-3',
			title: 'Experienced House Painter Available',
			description:
				'25 years experience. Interior/exterior painting, deck staining. Free estimates. References available. Fully insured.',
			category: 'services',
			municipality: 'victoria',
			postedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
			source: 'seed'
		},
		{
			id: 'cb-seed-4',
			title: 'ISO: Used Kayak, Tandem Preferred',
			description:
				'Looking for a used tandem kayak in good condition. Budget around $500-800. Can pick up anywhere in CRD.',
			category: 'wanted',
			postedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
			source: 'seed'
		},
		{
			id: 'cb-seed-5',
			title: 'Garden Startup Kit — Free Seedlings & Pots',
			description:
				'Spring is here! Free tomato, pepper, and herb seedlings. Also have pots and potting soil. First come first served.',
			category: 'free',
			municipality: 'langford',
			postedAt: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(),
			source: 'seed'
		},
		{
			id: 'cb-seed-6',
			title: 'Estate Sale: Vintage Records, Books, China',
			description:
				'Large collection of vinyl records (jazz, classical, folk), hardcover books, bone china tea sets. Serious inquiries only.',
			category: 'for-sale',
			municipality: 'victoria',
			postedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
			source: 'seed'
		}
	];
}

export const GET: RequestHandler = async ({ url }) => {
	const municipality = parseMunicipality(url.searchParams.get('municipality'));
	const category = parseEnum(url.searchParams.get('category'), validCategories);
	const limit = parseLimit(url.searchParams.get('limit'), 30);

	// Fetch from multiple sources in parallel
	const [craigslistPosts, usedVictoriaPosts] = await Promise.all([
		fetchCraigslistPosts(),
		fetchUsedVictoriaPosts()
	]);

	let posts = [...craigslistPosts, ...usedVictoriaPosts];

	// Add seed data if we got few live results
	if (posts.length < 5) {
		posts = [...posts, ...getSeedPosts()];
	}

	if (municipality) {
		posts = posts.filter((p) => !p.municipality || p.municipality === municipality);
	}

	if (category) {
		posts = posts.filter((p) => p.category === category);
	}

	// Sort by most recent
	posts.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());

	posts = posts.slice(0, limit);

	return json(
		{
			data: posts,
			meta: { total: posts.length, municipality }
		},
		{
			headers: {
				'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=600`
			}
		}
	);
};
