/**
 * Headline deduplication for news items.
 *
 * When the same story appears from multiple RSS sources, keeps only the most
 * authoritative copy based on the current municipality view.
 */

/** Source slugs ordered by priority for the "All CRD" view (lower index = higher priority) */
const ALL_CRD_PRIORITY: string[] = [
	'vicnews',
	'victoriabuzz',
	'chek',
	'saanich-news',
	'oakbay-news',
	'goldstream',
	'peninsula',
	'cbc-bc'
];

/**
 * Maps each municipality slug to its preferred source slugs (ordered by priority).
 * Regional sources (CHEK, CBC BC) serve as fallback for every municipality.
 */
const MUNICIPALITY_SOURCE_PRIORITY: Record<string, string[]> = {
	victoria: ['vicnews', 'victoriabuzz', 'chek', 'cbc-bc'],
	saanich: ['saanich-news', 'chek', 'cbc-bc'],
	'oak-bay': ['oakbay-news', 'chek', 'cbc-bc'],
	langford: ['goldstream', 'chek', 'cbc-bc'],
	colwood: ['goldstream', 'chek', 'cbc-bc'],
	sooke: ['goldstream', 'chek', 'cbc-bc'],
	metchosin: ['goldstream', 'chek', 'cbc-bc'],
	highlands: ['goldstream', 'chek', 'cbc-bc'],
	sidney: ['peninsula', 'chek', 'cbc-bc'],
	'north-saanich': ['peninsula', 'chek', 'cbc-bc'],
	'central-saanich': ['peninsula', 'chek', 'cbc-bc'],
	esquimalt: ['chek', 'vicnews', 'cbc-bc'],
	'view-royal': ['chek', 'goldstream', 'cbc-bc']
};

/** Normalize a headline for exact-match comparison. */
export function normalizeHeadline(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^\w\s]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

/** Extract the set of meaningful words (3+ characters) from a normalized title. */
function extractWords(normalized: string): Set<string> {
	return new Set(normalized.split(' ').filter((w) => w.length >= 3));
}

/**
 * Calculate word overlap ratio between two titles.
 * Returns a value between 0 and 1, where 1 means identical word sets.
 * Uses Jaccard similarity: |intersection| / |union|.
 */
export function titleSimilarity(a: string, b: string): number {
	const wordsA = extractWords(normalizeHeadline(a));
	const wordsB = extractWords(normalizeHeadline(b));

	if (wordsA.size === 0 && wordsB.size === 0) return 1;
	if (wordsA.size === 0 || wordsB.size === 0) return 0;

	let intersectionCount = 0;
	for (const word of wordsA) {
		if (wordsB.has(word)) intersectionCount++;
	}

	const unionCount = new Set([...wordsA, ...wordsB]).size;
	return intersectionCount / unionCount;
}

/** The minimum shape required for deduplication. */
interface Deduplicatable {
	title: string;
	sourceSlug?: string;
	source?: string;
}

/**
 * Get the priority rank for a source slug given the current municipality view.
 * Lower rank = higher priority. Unknown sources get a high rank (least preferred).
 */
function getSourcePriority(sourceSlug: string, municipality: string | null): number {
	const priorityList = municipality
		? (MUNICIPALITY_SOURCE_PRIORITY[municipality] ?? ALL_CRD_PRIORITY)
		: ALL_CRD_PRIORITY;

	const index = priorityList.indexOf(sourceSlug);
	return index === -1 ? 999 : index;
}

/** Similarity threshold: titles with 80%+ word overlap are considered near-duplicates. */
const SIMILARITY_THRESHOLD = 0.8;

/**
 * Deduplicate news items, keeping the most authoritative source for each story.
 *
 * @param items - Array of items with at least a `title` field
 * @param municipality - The selected municipality slug, or null for "All CRD"
 * @returns Deduplicated array preserving original order (order of kept items)
 */
export function deduplicateNews<T extends Deduplicatable>(
	items: T[],
	municipality: string | null
): T[] {
	if (items.length <= 1) return items;

	// Each item gets assigned to a "group" of duplicates. We track which item
	// in each group is the best (most authoritative) and the original index of
	// that best item so we can preserve ordering.
	const groups: { bestItem: T; bestPriority: number; bestIndex: number }[] = [];
	// For each item, which group index it belongs to (-1 = not yet assigned)
	const itemGroup: number[] = new Array(items.length).fill(-1);
	// Pre-compute normalized titles
	const normalized = items.map((item) => normalizeHeadline(item.title));

	for (let i = 0; i < items.length; i++) {
		if (itemGroup[i] !== -1) continue; // already grouped

		const priority = getSourcePriority(items[i].sourceSlug ?? '', municipality);
		const groupIndex = groups.length;
		groups.push({ bestItem: items[i], bestPriority: priority, bestIndex: i });
		itemGroup[i] = groupIndex;

		// Find all items that match this one
		for (let j = i + 1; j < items.length; j++) {
			if (itemGroup[j] !== -1) continue;

			const isMatch =
				normalized[i] === normalized[j] ||
				(normalized[i].length > 0 &&
					normalized[j].length > 0 &&
					titleSimilarity(items[i].title, items[j].title) >= SIMILARITY_THRESHOLD);

			if (isMatch) {
				itemGroup[j] = groupIndex;
				const jPriority = getSourcePriority(items[j].sourceSlug ?? '', municipality);
				if (jPriority < groups[groupIndex].bestPriority) {
					groups[groupIndex].bestItem = items[j];
					groups[groupIndex].bestPriority = jPriority;
					groups[groupIndex].bestIndex = j;
				}
			}
		}
	}

	// Return best items from each group, sorted by their original position
	// to preserve the chronological order from the input
	return groups.sort((a, b) => a.bestIndex - b.bestIndex).map((g) => g.bestItem);
}
