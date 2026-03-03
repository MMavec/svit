export interface MonitorMatch {
	monitorId: string;
	keyword: string;
	itemId: string;
	itemTitle: string;
	matchedIn: 'title' | 'description';
	source: string;
	matchedAt: string;
}

export function matchMonitors(
	monitors: Array<{ id: string; keyword: string; sources?: string[] }>,
	data: Array<{ id: string; title?: string; description?: string }>,
	source: string
): MonitorMatch[] {
	const matches: MonitorMatch[] = [];
	const now = new Date(Date.now()).toISOString();

	for (const monitor of monitors) {
		if (monitor.sources && monitor.sources.length > 0 && !monitor.sources.includes(source)) {
			continue;
		}

		const term = monitor.keyword.toLowerCase();

		for (const item of data) {
			const title = item.title || '';
			const desc = item.description || '';

			if (title.toLowerCase().includes(term)) {
				matches.push({
					monitorId: monitor.id,
					keyword: monitor.keyword,
					itemId: item.id,
					itemTitle: title,
					matchedIn: 'title',
					source,
					matchedAt: now
				});
			} else if (desc.toLowerCase().includes(term)) {
				matches.push({
					monitorId: monitor.id,
					keyword: monitor.keyword,
					itemId: item.id,
					itemTitle: title || desc.slice(0, 60),
					matchedIn: 'description',
					source,
					matchedAt: now
				});
			}
		}
	}

	return matches;
}
