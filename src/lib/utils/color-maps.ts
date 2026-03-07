/**
 * Shared color-mapping utilities for panel components.
 * Maps domain-specific status/severity/category values to CSS custom properties.
 */

/** Generic color map factory */
export function colorMap<T extends string>(
	map: Partial<Record<T, string>>,
	fallback = 'var(--text-tertiary)'
): (key: T) => string {
	return (key: T) => map[key] ?? fallback;
}

/** Safety alert severity → color */
export const safetyAlertColor = colorMap<'emergency' | 'warning' | 'watch' | 'advisory'>(
	{
		emergency: 'var(--status-critical)',
		warning: 'var(--status-high)',
		watch: 'var(--accent-warning)',
		advisory: 'var(--accent-primary)'
	},
	'var(--text-tertiary)'
);

/** Construction event severity → color */
export const constructionSeverityColor = colorMap<'MAJOR' | 'MODERATE' | 'MINOR' | 'UNKNOWN'>({
	MAJOR: 'var(--accent-danger)',
	MODERATE: 'var(--accent-warning)',
	MINOR: 'var(--accent-secondary)'
});

/** Transit alert severity → color */
export const transitSeverityColor = colorMap<'SEVERE' | 'WARNING' | 'INFO' | 'UNKNOWN'>({
	SEVERE: 'var(--accent-danger)',
	WARNING: 'var(--accent-warning)',
	INFO: 'var(--accent-primary)'
});

/** Development application status → color */
export const devStatusColor = colorMap<
	| 'proposed'
	| 'under-review'
	| 'approved'
	| 'under-construction'
	| 'complete'
	| 'denied'
	| 'withdrawn'
>({
	proposed: 'var(--accent-info)',
	'under-review': 'var(--accent-warning)',
	approved: 'var(--accent-secondary)',
	'under-construction': 'var(--status-high)',
	complete: 'var(--palette-green)',
	denied: 'var(--accent-danger)',
	withdrawn: 'var(--text-tertiary)'
});

/** Environment reading status → color */
export const envStatusColor = colorMap<
	'good' | 'moderate' | 'unhealthy-sensitive' | 'unhealthy' | 'hazardous'
>(
	{
		good: 'var(--accent-secondary)',
		moderate: 'var(--accent-warning)',
		'unhealthy-sensitive': 'var(--status-high)',
		unhealthy: 'var(--status-critical)',
		hazardous: 'var(--status-hazardous)'
	},
	'var(--text-tertiary)'
);

/** Wildlife sighting category → color */
export const wildlifeCategoryColor = colorMap<
	'bird' | 'marine-mammal' | 'mammal' | 'fish' | 'invertebrate' | 'reptile' | 'plant' | 'other'
>(
	{
		bird: 'var(--accent-warning)',
		'marine-mammal': 'var(--palette-blue)',
		mammal: 'var(--palette-orange, #d69e2e)',
		fish: 'var(--palette-cyan)',
		invertebrate: 'var(--palette-purple)',
		reptile: 'var(--palette-green)',
		plant: 'var(--accent-secondary)'
	},
	'var(--palette-muted)'
);

/** Community event category → color */
export const eventCategoryColor = colorMap<
	'arts' | 'sports' | 'community' | 'market' | 'festival' | 'education' | 'government' | 'other'
>({
	arts: 'var(--palette-purple)',
	sports: 'var(--status-critical)',
	community: 'var(--palette-blue)',
	market: 'var(--palette-green)',
	festival: 'var(--accent-warning)',
	education: 'var(--palette-cyan)',
	government: 'var(--palette-muted)'
});

/** Search result category → color */
export const searchCategoryColor = colorMap<string>({
	Council: 'var(--accent-primary)',
	News: 'var(--accent-warning)',
	Development: 'var(--accent-danger)',
	Event: 'var(--accent-secondary)',
	Safety: 'var(--status-critical)'
});
