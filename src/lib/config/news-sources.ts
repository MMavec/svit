export interface NewsSource {
	slug: string;
	name: string;
	feedUrl: string;
	siteUrl: string;
	/** Primary municipality focus, or null for region-wide */
	municipality: string | null;
	color: string;
	priority: number; // lower = higher priority
}

export const newsSources: NewsSource[] = [
	{
		slug: 'chek',
		name: 'CHEK News',
		feedUrl: 'https://www.cheknews.ca/feed/',
		siteUrl: 'https://cheknews.ca',
		municipality: null,
		color: '#e31937',
		priority: 1
	},
	{
		slug: 'vicnews',
		name: 'Victoria News',
		feedUrl: 'https://www.vicnews.com/feed/',
		siteUrl: 'https://www.vicnews.com',
		municipality: 'victoria',
		color: '#1a5276',
		priority: 2
	},
	{
		slug: 'victoriabuzz',
		name: 'Victoria Buzz',
		feedUrl: 'https://www.victoriabuzz.com/feed/',
		siteUrl: 'https://www.victoriabuzz.com',
		municipality: 'victoria',
		color: '#ff6b35',
		priority: 3
	},
	{
		slug: 'saanich-news',
		name: 'Saanich News',
		feedUrl: 'https://www.saanichnews.com/feed/',
		siteUrl: 'https://www.saanichnews.com',
		municipality: 'saanich',
		color: '#2e7d32',
		priority: 4
	},
	{
		slug: 'oakbay-news',
		name: 'Oak Bay News',
		feedUrl: 'https://www.oakbaynews.com/feed/',
		siteUrl: 'https://www.oakbaynews.com',
		municipality: 'oak-bay',
		color: '#c49102',
		priority: 5
	},
	{
		slug: 'goldstream',
		name: 'Goldstream Gazette',
		feedUrl: 'https://www.goldstreamgazette.com/feed/',
		siteUrl: 'https://www.goldstreamgazette.com',
		municipality: 'langford',
		color: '#8b6914',
		priority: 6
	},
	{
		slug: 'peninsula',
		name: 'Peninsula News Review',
		feedUrl: 'https://www.peninsulanewsreview.com/feed/',
		siteUrl: 'https://www.peninsulanewsreview.com',
		municipality: 'sidney',
		color: '#0d47a1',
		priority: 7
	},
	{
		slug: 'cbc-bc',
		name: 'CBC British Columbia',
		feedUrl: 'https://www.cbc.ca/webfeed/rss/rss-canada-britishcolumbia',
		siteUrl: 'https://www.cbc.ca/news/canada/british-columbia',
		municipality: null,
		color: '#cc0000',
		priority: 8
	}
];

export function getNewsSource(slug: string): NewsSource | undefined {
	return newsSources.find((s) => s.slug === slug);
}
