import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { CouncilVote, CouncillorScore } from '$lib/types/index';
import votesData from '$lib/data/council-votes.json';

const CACHE_MAX_AGE = 21600; // 6 hours (refreshed by the scrape-council-votes GitHub Action)

interface VotesFile {
	generatedAt: string;
	source: string;
	meetingsProcessed: number;
	latestMeeting: string | null;
	councillors: string[];
	scorecard: CouncillorScore[];
	votes: CouncilVote[];
}

const data = votesData as VotesFile;

export const GET: RequestHandler = async ({ url }) => {
	const councillor = url.searchParams.get('councillor');
	const splitOnly = url.searchParams.get('split') === 'true';
	const limit = Math.min(Number(url.searchParams.get('limit')) || 60, 200);

	let votes = data.votes;
	if (councillor) {
		votes = votes.filter(
			(v) => v.opposed.includes(councillor) || (v.valid && v.inFavour.includes(councillor))
		);
	}
	if (splitOnly) votes = votes.filter((v) => v.split);

	const total = votes.length;
	votes = votes.slice(0, limit);

	return json(
		{
			data: votes,
			meta: {
				total,
				generatedAt: data.generatedAt,
				latestMeeting: data.latestMeeting,
				meetingsProcessed: data.meetingsProcessed,
				councillors: data.councillors,
				scorecard: data.scorecard,
				note: `Per-councillor recorded votes parsed from City of Victoria minutes. Minutes are adopted at the following meeting, so this trails live council by a few weeks (latest: ${data.latestMeeting}).`
			}
		},
		{
			headers: {
				'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=86400`
			}
		}
	);
};
