import { describe, it, expect } from 'vitest';
import { matchMonitors } from '../monitor-matcher';

const monitors = [
	{ id: 'm1', keyword: 'bike lane', sources: ['council', 'news'] },
	{ id: 'm2', keyword: 'rezoning', sources: [] },
	{ id: 'm3', keyword: 'Oak Bay', sources: ['development'] }
];

const items = [
	{
		id: 'i1',
		title: 'New bike lane proposal for Shelbourne',
		description: 'A protected bike lane.'
	},
	{
		id: 'i2',
		title: 'Council meeting recap',
		description: 'Discussion about rezoning on Fort St.'
	},
	{ id: 'i3', title: 'Oak Bay development moratorium', description: 'Residents push back.' },
	{ id: 'i4', title: 'Nothing relevant here', description: 'Totally unrelated content.' }
];

describe('matchMonitors', () => {
	it('returns matches for keyword found in title', () => {
		const results = matchMonitors(monitors, items, 'council');
		const bikeMatch = results.find((r) => r.monitorId === 'm1' && r.itemId === 'i1');
		expect(bikeMatch).toBeDefined();
		expect(bikeMatch!.matchedIn).toBe('title');
		expect(bikeMatch!.keyword).toBe('bike lane');
	});

	it('returns matches for keyword found in description', () => {
		const results = matchMonitors(monitors, items, 'council');
		const rezoningMatch = results.find((r) => r.monitorId === 'm2' && r.itemId === 'i2');
		expect(rezoningMatch).toBeDefined();
		expect(rezoningMatch!.matchedIn).toBe('description');
	});

	it('is case-insensitive', () => {
		const results = matchMonitors(
			[{ id: 'cs', keyword: 'BIKE LANE', sources: [] }],
			[{ id: 'x', title: 'bike lane project' }],
			'news'
		);
		expect(results).toHaveLength(1);
	});

	it('filters by source when monitor has sources specified', () => {
		// m1 only matches council and news — not development
		const results = matchMonitors(monitors, items, 'development');
		const bikeInDev = results.find((r) => r.monitorId === 'm1');
		expect(bikeInDev).toBeUndefined();
	});

	it('matches all sources when monitor sources array is empty', () => {
		// m2 has empty sources — should match in any source
		const councilResults = matchMonitors(monitors, items, 'council');
		const devResults = matchMonitors(monitors, items, 'development');
		expect(councilResults.find((r) => r.monitorId === 'm2')).toBeDefined();
		expect(devResults.find((r) => r.monitorId === 'm2')).toBeDefined();
	});

	it('prefers title match over description match for same item', () => {
		const results = matchMonitors(
			[{ id: 'x', keyword: 'Oak Bay', sources: [] }],
			[{ id: 'y', title: 'Oak Bay village plan', description: 'Oak Bay council discusses plan' }],
			'news'
		);
		expect(results).toHaveLength(1);
		expect(results[0].matchedIn).toBe('title');
	});

	it('returns empty array when no monitors match', () => {
		const results = matchMonitors(
			monitors,
			[{ id: 'z', title: 'Completely unrelated' }],
			'council'
		);
		const relevant = results.filter((r) => r.itemId === 'z');
		expect(relevant).toHaveLength(0);
	});

	it('returns empty array for empty data', () => {
		expect(matchMonitors(monitors, [], 'council')).toHaveLength(0);
	});

	it('returns empty array for empty monitors', () => {
		expect(matchMonitors([], items, 'council')).toHaveLength(0);
	});

	it('handles items with missing title and description', () => {
		const results = matchMonitors(
			[{ id: 'x', keyword: 'test', sources: [] }],
			[{ id: 'a' }],
			'news'
		);
		expect(results).toHaveLength(0);
	});

	it('populates all MonitorMatch fields correctly', () => {
		const results = matchMonitors(
			[{ id: 'mon1', keyword: 'bike', sources: [] }],
			[{ id: 'item1', title: 'Bike infrastructure update', description: 'Details here' }],
			'council'
		);
		expect(results).toHaveLength(1);
		const m = results[0];
		expect(m.monitorId).toBe('mon1');
		expect(m.keyword).toBe('bike');
		expect(m.itemId).toBe('item1');
		expect(m.itemTitle).toBe('Bike infrastructure update');
		expect(m.matchedIn).toBe('title');
		expect(m.source).toBe('council');
		expect(m.matchedAt).toBeTruthy();
	});
});
