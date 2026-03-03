export type Theme = 'dark' | 'light';

export interface Municipality {
	slug: string;
	name: string;
	abbreviation: string;
	color: string;
	bbox: [number, number, number, number]; // [west, south, east, north]
	population?: number;
	councilSource?: 'legistar' | 'escribemeetings' | 'civicweb' | 'diligent';
	councilUrl?: string;
}

export interface SavedItem {
	id: string;
	itemType:
		| 'meeting'
		| 'news'
		| 'development'
		| 'bylaw'
		| 'event'
		| 'wildlife'
		| 'thread'
		| 'other';
	externalId: string;
	title: string;
	description?: string;
	municipality?: string;
	url?: string;
	savedAt: string;
}

export interface PanelConfig {
	id: string;
	title: string;
	tier: 1 | 2 | 3 | 4;
	icon: string;
	defaultPosition: GridPosition;
	minWidth: number;
	minHeight: number;
}

export interface GridPosition {
	x: number;
	y: number;
	w: number;
	h: number;
}

export interface PanelLayout {
	[panelId: string]: GridPosition;
}

// --- Phase 1: Political Intelligence Types ---

export interface Meeting {
	id: string;
	title: string;
	body: string; // e.g. "Council", "Committee of the Whole"
	date: string; // ISO 8601
	time?: string;
	location?: string;
	status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
	municipality: string; // slug
	agendaUrl?: string;
	minutesUrl?: string;
	videoUrl?: string;
	source: 'escribemeetings' | 'legistar' | 'civicweb' | 'diligent' | 'manual';
	items?: AgendaItem[];
}

export interface AgendaItem {
	id: string;
	title: string;
	type?: 'bylaw' | 'motion' | 'report' | 'presentation' | 'correspondence' | 'other';
	description?: string;
	result?: string;
	voteResult?: VoteResult;
}

export interface VoteResult {
	inFavour: number;
	opposed: number;
	abstained: number;
	absent: number;
	passed: boolean;
	votes?: Vote[];
}

export interface Vote {
	councillorId: string;
	councillorName: string;
	vote: 'yes' | 'no' | 'abstain' | 'absent';
}

export interface Bylaw {
	id: string;
	number?: string;
	title: string;
	description?: string;
	status:
		| 'proposed'
		| 'first-reading'
		| 'second-reading'
		| 'public-hearing'
		| 'third-reading'
		| 'adopted'
		| 'defeated'
		| 'withdrawn';
	municipality: string;
	introducedDate?: string;
	lastActionDate?: string;
	sponsor?: string;
	type?: 'zoning' | 'tax' | 'regulatory' | 'amendment' | 'other';
	documentUrl?: string;
	source: string;
}

export interface Councillor {
	id: string;
	name: string;
	firstName: string;
	lastName: string;
	role: 'mayor' | 'councillor' | 'director' | 'chair';
	municipality: string;
	party?: string;
	photoUrl?: string;
	email?: string;
	phone?: string;
	social?: {
		bluesky?: string;
		twitter?: string;
		facebook?: string;
		website?: string;
	};
	committees?: string[];
	electedDate?: string;
	active: boolean;
}

export interface NewsItem {
	id: string;
	title: string;
	description: string;
	url: string;
	source: string; // e.g. "CHEK News", "Times Colonist"
	sourceSlug: string;
	published: string; // ISO 8601
	author?: string;
	imageUrl?: string;
	categories?: string[];
	municipality?: string; // attributed municipality slug
}

export interface SocialPost {
	id: string;
	author: string;
	authorHandle: string;
	authorAvatar?: string;
	content: string;
	url: string;
	platform: 'bluesky' | 'twitter' | 'facebook' | 'threads';
	published: string;
	likes?: number;
	reposts?: number;
	replies?: number;
	councillorId?: string; // linked to councillor if identified
	municipality?: string;
}

export interface PublicHearing {
	id: string;
	title: string;
	description?: string;
	date: string;
	time?: string;
	location?: string;
	municipality: string;
	relatedBylaw?: string; // bylaw ID or number
	status: 'upcoming' | 'open' | 'closed';
	submissionDeadline?: string;
	submissionUrl?: string;
	meetingId?: string;
	source: string;
}

export interface DevelopmentApplication {
	id: string;
	address: string;
	description: string;
	applicant?: string;
	type: 'residential' | 'commercial' | 'mixed-use' | 'institutional' | 'industrial' | 'other';
	status:
		| 'proposed'
		| 'under-review'
		| 'approved'
		| 'under-construction'
		| 'complete'
		| 'denied'
		| 'withdrawn';
	municipality: string;
	storeys?: number;
	units?: number;
	zoningCurrent?: string;
	zoningProposed?: string;
	submittedDate?: string;
	decisionDate?: string;
	publicHearingDate?: string;
	coordinates?: [number, number]; // [lng, lat]
	flagged: boolean; // true if 4+ storeys, 100+ units, or major rezoning
	flagReasons?: string[];
	documentUrl?: string;
	source: string;
}

// --- Phase 2: Community Intelligence Types ---

export interface ConstructionEvent {
	id: string;
	headline: string;
	description: string;
	eventType: 'CONSTRUCTION' | 'INCIDENT' | 'SPECIAL_EVENT' | 'WEATHER_CONDITION';
	eventSubtypes?: string[];
	severity: 'MINOR' | 'MODERATE' | 'MAJOR' | 'UNKNOWN';
	status: 'ACTIVE' | 'ARCHIVED';
	roads: { name: string; from?: string; to?: string; direction?: string }[];
	coordinates?: [number, number]; // [lng, lat]
	created: string; // ISO 8601
	updated: string;
	municipality?: string;
	schedule?: {
		startDate?: string;
		endDate?: string;
	};
	source: string;
}

export interface TransitAlert {
	id: string;
	headerText: string;
	descriptionText: string;
	cause: string;
	effect: string;
	severity: 'INFO' | 'WARNING' | 'SEVERE' | 'UNKNOWN';
	activePeriodStart?: string;
	activePeriodEnd?: string;
	routeIds?: string[];
	routeShortNames?: string[];
	stopIds?: string[];
	url?: string;
	municipality?: string;
	source: string;
}

export interface SafetyAlert {
	id: string;
	title: string;
	description: string;
	type: 'weather' | 'wildfire' | 'road-incident' | 'earthquake' | 'tsunami' | 'other';
	severity: 'advisory' | 'watch' | 'warning' | 'emergency';
	status: 'active' | 'ended' | 'updated';
	location?: string;
	coordinates?: [number, number]; // [lng, lat]
	issued: string; // ISO 8601
	expires?: string;
	url?: string;
	sourceAgency: string;
	municipality?: string;
	source: string;
}

export interface PulseMetric {
	id: string;
	category: 'council' | 'development' | 'news' | 'social' | 'construction' | 'transit' | 'safety';
	label: string;
	currentCount: number;
	trend: number; // positive = up, negative = down, 0 = flat
	sparklineData?: number[]; // last N data points for mini chart
	lastUpdated: string;
}

export interface MapFeature {
	id: string;
	type: 'development' | 'construction' | 'fire' | 'transit-alert' | 'safety';
	coordinates: [number, number]; // [lng, lat]
	title: string;
	description: string;
	severity?: string;
	municipality?: string;
	color: string;
	icon: string;
}

// --- Phase 3: Quality of Life Types ---

export interface WeatherConditions {
	temperature: number;
	temperatureUnit: string;
	condition: string;
	iconCode: string;
	windSpeed: number;
	windDirection: string;
	windGust?: number;
	humidity: number;
	pressure: number;
	pressureTrend?: string;
	visibility?: number;
	observedAt: string;
	station: string;
}

export interface WeatherForecast {
	period: string;
	temperature: number;
	temperatureType: 'high' | 'low';
	condition: string;
	iconCode: string;
	pop?: number;
	summary: string;
}

export interface TidePrediction {
	time: string;
	height: number;
	type: 'high' | 'low';
}

export interface TideObservation {
	time: string;
	height: number;
}

export interface WeatherTidesData {
	weather: {
		current: WeatherConditions | null;
		forecast: WeatherForecast[];
	};
	tides: {
		current: TideObservation | null;
		predictions: TidePrediction[];
		station: string;
	};
}

export interface HousingMetric {
	id: string;
	label: string;
	value: number;
	unit: 'dollars' | 'percent' | 'count';
	change?: number; // % change from prior period
	period: string;
	municipality?: string;
	source: string;
}

export interface CommunityEvent {
	id: string;
	title: string;
	description: string;
	date: string; // ISO 8601
	endDate?: string;
	time?: string;
	location: string;
	venue?: string;
	category:
		| 'arts'
		| 'sports'
		| 'community'
		| 'market'
		| 'festival'
		| 'education'
		| 'government'
		| 'other';
	municipality?: string;
	url?: string;
	free: boolean;
	source: string;
}

export interface BudgetItem {
	id: string;
	municipality: string;
	year: number;
	category: string;
	amount: number;
	percentOfTotal: number;
	changeFromPrior?: number;
	type: 'revenue' | 'expenditure';
	source: string;
}

export interface WildlifeSighting {
	id: string;
	species: string;
	commonName: string;
	category: 'bird' | 'marine-mammal' | 'fish' | 'invertebrate' | 'plant' | 'reptile' | 'other';
	observedAt: string;
	location?: string;
	coordinates?: [number, number];
	observer?: string;
	photoUrl?: string;
	municipality?: string;
	source: string;
}

export interface TreeObservation {
	id: string;
	species: string;
	commonName: string;
	observedAt: string;
	location?: string;
	coordinates?: [number, number];
	heritage: boolean;
	photoUrl?: string;
	municipality?: string;
	source: string;
}

export interface EnvironmentReading {
	id: string;
	type: 'air-quality' | 'water-quality' | 'uv-index' | 'pollen' | 'ocean-temperature';
	metric: string;
	value: number;
	unit: string;
	status: 'good' | 'moderate' | 'unhealthy-sensitive' | 'unhealthy' | 'hazardous';
	location: string;
	coordinates?: [number, number];
	observedAt: string;
	municipality?: string;
	source: string;
}

// --- API Response Wrappers ---

export interface ApiResponse<T> {
	data: T;
	meta?: {
		total?: number;
		page?: number;
		perPage?: number;
		municipality?: string;
		cachedAt?: string;
	};
	error?: string;
}

export interface ThreadMessage {
	id: string;
	content: string;
	authorId: string;
	createdAt: string;
}
