import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { newsSources } from '$lib/config/news-sources';
import type { NewsItem } from '$lib/types/index';
import { hashCode } from '$lib/utils/hash';
import { attributeMunicipalityByText } from '$lib/utils/geo-attribution';
import { parseLimit, parseMunicipality, parseEnum } from '$lib/utils/api-validation';
import { isValidHttpUrl } from '$lib/utils/sanitize';

const validNewsSources = new Set(newsSources.map((s) => s.slug));

const CACHE_MAX_AGE = 300; // 5 minutes

/** Parse RSS XML into NewsItem objects */
function parseRss(xml: string, sourceSlug: string, sourceName: string): NewsItem[] {
	// Cap input length to prevent ReDoS on malformed feeds
	const safeXml = xml.length > 500_000 ? xml.slice(0, 500_000) : xml;
	const items: NewsItem[] = [];
	const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
	let match;

	while ((match = itemRegex.exec(safeXml)) !== null) {
		const itemXml = match[1];

		const title = extractTag(itemXml, 'title');
		const link = extractTag(itemXml, 'link');
		const description = extractTag(itemXml, 'description');
		const pubDate = extractTag(itemXml, 'pubDate');
		const author = extractTag(itemXml, 'dc:creator') || extractTag(itemXml, 'author');
		const categories = extractAllTags(itemXml, 'category');

		// Try to extract image from description or media tags
		const imageUrl =
			extractAttr(itemXml, 'media:content', 'url') ||
			extractAttr(itemXml, 'enclosure', 'url') ||
			extractImageFromHtml(description);

		const cleanLink = link.trim();
		if (title && cleanLink && isValidHttpUrl(cleanLink)) {
			items.push({
				id: `${sourceSlug}-${hashCode(cleanLink)}`,
				title: stripHtml(stripCdata(title)),
				description: stripHtml(stripCdata(description || '')).slice(0, 300),
				url: cleanLink,
				source: sourceName,
				sourceSlug,
				published: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
				author: author ? stripCdata(author) : undefined,
				imageUrl: isValidHttpUrl(imageUrl) ? imageUrl : undefined,
				categories: categories.map((c) => stripCdata(c))
			});
		}
	}

	return items;
}

function extractTag(xml: string, tag: string): string {
	const regex = new RegExp(`<${tag}[^>]{0,200}>([\\s\\S]{0,10000}?)</${tag}>`, 'i');
	const match = regex.exec(xml);
	return match ? match[1].trim() : '';
}

function extractAllTags(xml: string, tag: string): string[] {
	const regex = new RegExp(`<${tag}[^>]{0,200}>([\\s\\S]{0,10000}?)</${tag}>`, 'gi');
	const results: string[] = [];
	let match;
	while ((match = regex.exec(xml)) !== null) {
		results.push(match[1].trim());
	}
	return results;
}

function extractAttr(xml: string, tag: string, attr: string): string {
	const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, 'i');
	const match = regex.exec(xml);
	return match ? match[1] : '';
}

function extractImageFromHtml(html: string): string {
	const match = /<img[^>]+src="([^"]+)"/.exec(html);
	return match ? match[1] : '';
}

function stripCdata(str: string): string {
	return str.replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1').trim();
}

function stripHtml(str: string): string {
	return str
		.replace(/<[^>]*>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&#8217;/g, "'")
		.replace(/&#8216;/g, "'")
		.replace(/&#8220;/g, '\u201c')
		.replace(/&#8221;/g, '\u201d')
		.replace(/&#8211;/g, '\u2013')
		.replace(/&#8212;/g, '\u2014')
		.replace(/&#8230;/g, '\u2026')
		.replace(/&rsquo;/g, "'")
		.replace(/&lsquo;/g, "'")
		.replace(/&rdquo;/g, '\u201d')
		.replace(/&ldquo;/g, '\u201c')
		.replace(/&mdash;/g, '\u2014')
		.replace(/&ndash;/g, '\u2013')
		.replace(/&hellip;/g, '\u2026')
		.replace(/&apos;/g, "'")
		.replace(/&quot;/g, '"')
		.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
		.trim();
}

export const GET: RequestHandler = async ({ url }) => {
	const municipality = parseMunicipality(url.searchParams.get('municipality'));
	const limit = parseLimit(url.searchParams.get('limit'), 50);
	const sourceFilter = parseEnum(url.searchParams.get('source'), validNewsSources);

	// Filter sources by municipality if requested
	let sources = newsSources;
	if (sourceFilter) {
		sources = sources.filter((s) => s.slug === sourceFilter);
	}

	// Fetch all feeds in parallel
	const feedPromises = sources.map(async (source) => {
		try {
			const response = await fetch(source.feedUrl, {
				headers: { 'User-Agent': 'SVIT/1.0 (civic-dashboard)' },
				signal: AbortSignal.timeout(8000)
			});
			if (!response.ok) return [];
			const xml = await response.text();
			const items = parseRss(xml, source.slug, source.name);

			// Attribute municipality: use source's default, or try to detect from content
			return items.map((item) => ({
				...item,
				municipality:
					item.municipality ||
					source.municipality ||
					attributeMunicipalityByText(item.title + ' ' + item.description)
			}));
		} catch (err) {
			console.error('Failed to fetch RSS feed:', err);
			return [];
		}
	});

	const allFeeds = await Promise.all(feedPromises);
	let items = allFeeds.flat();

	// Filter by municipality if requested
	if (municipality) {
		items = items.filter((item) => !item.municipality || item.municipality === municipality);
	}

	// Sort by published date (newest first) and limit
	items.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
	items = items.slice(0, limit);

	return json(
		{ data: items, meta: { total: items.length, municipality } },
		{
			headers: {
				'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=600`
			}
		}
	);
};
