import type { PanelConfig } from '$lib/types/index';
import {
	Activity,
	Baby,
	Banknote,
	BatteryCharging,
	Bell,
	Bike,
	Building2,
	Bus,
	CalendarDays,
	Castle,
	Droplets,
	Fish,
	GraduationCap,
	Hammer,
	HardHat,
	House,
	KeyRound,
	Landmark,
	Leaf,
	MapPin,
	MapPinned,
	Megaphone,
	MessageCircle,
	MessagesSquare,
	Network,
	Newspaper,
	Pin,
	ScrollText,
	ShieldAlert,
	ShoppingCart,
	Siren,
	Store,
	Tag,
	TrafficCone,
	TreePine,
	Trees,
	TrendingUp,
	TriangleAlert,
	Umbrella,
	UsersRound,
	Vote,
	WavesHorizontal,
	Wine,
	ZapOff
} from '@lucide/svelte';

export const panels: PanelConfig[] = [
	// Tier 1 — Political Intelligence
	{
		id: 'council-watch',
		title: 'Council Watch',
		tier: 1,
		icon: Landmark,
		defaultPosition: { x: 0, y: 0, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'bylaw-tracker',
		title: 'Bylaw Tracker',
		tier: 1,
		icon: ScrollText,
		defaultPosition: { x: 4, y: 0, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'voices',
		title: 'Voices',
		tier: 1,
		icon: MessagesSquare,
		defaultPosition: { x: 8, y: 0, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'public-hearings',
		title: 'Public Hearings',
		tier: 1,
		icon: Megaphone,
		defaultPosition: { x: 0, y: 6, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'development-watch',
		title: 'Development Watch',
		tier: 1,
		icon: Building2,
		defaultPosition: { x: 4, y: 6, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'councillor-profiles',
		title: 'Councillors & Mayors',
		tier: 1,
		icon: UsersRound,
		defaultPosition: { x: 8, y: 6, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},

	// Tier 2 — Community Intelligence
	{
		id: 'local-wire',
		title: 'Local Wire',
		tier: 2,
		icon: Newspaper,
		defaultPosition: { x: 0, y: 12, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'pulse',
		title: 'Pulse',
		tier: 2,
		icon: Activity,
		defaultPosition: { x: 4, y: 12, w: 4, h: 6 },
		minWidth: 2,
		minHeight: 3
	},
	{
		id: 'construction-roads',
		title: 'Construction & Roads',
		tier: 2,
		icon: TrafficCone,
		defaultPosition: { x: 8, y: 12, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'transit',
		title: 'Transit',
		tier: 2,
		icon: Bus,
		defaultPosition: { x: 0, y: 18, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'safety-emergency',
		title: 'Safety & Emergency',
		tier: 2,
		icon: Siren,
		defaultPosition: { x: 4, y: 18, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'crime-incidents',
		title: 'Crime & Incidents',
		tier: 2,
		icon: ShieldAlert,
		defaultPosition: { x: 8, y: 18, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'weather-tides',
		title: 'Weather & Tides',
		tier: 2,
		icon: WavesHorizontal,
		defaultPosition: { x: 0, y: 24, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},

	// Tier 3 — Quality of Life
	{
		id: 'housing',
		title: 'Housing & Development',
		tier: 3,
		icon: House,
		defaultPosition: { x: 4, y: 24, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'events',
		title: 'Community Events',
		tier: 3,
		icon: CalendarDays,
		defaultPosition: { x: 8, y: 24, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'budget-finance',
		title: 'Budget & Finance',
		tier: 3,
		icon: Banknote,
		defaultPosition: { x: 0, y: 30, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'wildlife-marine',
		title: 'Wildlife & Marine',
		tier: 3,
		icon: Fish,
		defaultPosition: { x: 4, y: 30, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'trees-urban-forest',
		title: 'Trees & Urban Forest',
		tier: 3,
		icon: Trees,
		defaultPosition: { x: 8, y: 30, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'nature-environment',
		title: 'Nature & Environment',
		tier: 3,
		icon: Leaf,
		defaultPosition: { x: 0, y: 36, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'demographics',
		title: 'Demographics',
		tier: 3,
		icon: TrendingUp,
		defaultPosition: { x: 4, y: 36, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},

	// Tier 3 — Topic Watch (public, localStorage-backed)
	{
		id: 'my-monitors',
		title: 'Topic Watch',
		tier: 3,
		icon: Bell,
		defaultPosition: { x: 8, y: 36, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'connections',
		title: 'Connections',
		tier: 3,
		icon: Network,
		defaultPosition: { x: 0, y: 42, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'threads',
		title: 'Threads',
		tier: 3,
		icon: MessageCircle,
		defaultPosition: { x: 4, y: 42, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},

	// Tier 3 — Active Senior Mode panels
	{
		id: 'grocery-flyers',
		title: 'Grocery Flyers',
		tier: 3,
		icon: ShoppingCart,
		defaultPosition: { x: 8, y: 42, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'local-food-drink',
		title: 'Local Food & Drink',
		tier: 3,
		icon: Wine,
		defaultPosition: { x: 0, y: 48, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'real-estate-market',
		title: 'Real Estate Market',
		tier: 3,
		icon: KeyRound,
		defaultPosition: { x: 4, y: 48, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'community-board',
		title: 'Community Board',
		tier: 3,
		icon: Pin,
		defaultPosition: { x: 8, y: 48, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},

	// Tier 3 — Family Mode panels
	{
		id: 'family-activities',
		title: 'Family Activities',
		tier: 3,
		icon: Baby,
		defaultPosition: { x: 0, y: 54, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'parks-recreation',
		title: 'Parks & Recreation',
		tier: 3,
		icon: TreePine,
		defaultPosition: { x: 4, y: 54, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'schools-libraries',
		title: 'Schools & Libraries',
		tier: 3,
		icon: GraduationCap,
		defaultPosition: { x: 8, y: 54, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'demolition-permits',
		title: 'Demolition Permits',
		tier: 3,
		icon: Hammer,
		defaultPosition: { x: 0, y: 60, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'permit-pulse',
		title: 'Building Activity',
		tier: 3,
		icon: HardHat,
		defaultPosition: { x: 4, y: 60, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'business-licences',
		title: 'Business Licences',
		tier: 3,
		icon: Store,
		defaultPosition: { x: 8, y: 60, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'assessment-values',
		title: 'Assessment Values',
		tier: 3,
		icon: Tag,
		defaultPosition: { x: 0, y: 66, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'ev-charging',
		title: 'EV Charging',
		tier: 3,
		icon: BatteryCharging,
		defaultPosition: { x: 4, y: 66, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'mobility',
		title: 'Mobility',
		tier: 3,
		icon: Bike,
		defaultPosition: { x: 8, y: 66, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'cooling-centres',
		title: 'Cooling & Water',
		tier: 3,
		icon: Droplets,
		defaultPosition: { x: 0, y: 72, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'heritage',
		title: 'Heritage Sites',
		tier: 3,
		icon: Castle,
		defaultPosition: { x: 4, y: 72, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'public-amenities',
		title: 'Public Amenities',
		tier: 3,
		icon: MapPin,
		defaultPosition: { x: 8, y: 72, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'patios',
		title: 'Patios & Parklets',
		tier: 3,
		icon: Umbrella,
		defaultPosition: { x: 0, y: 78, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'power-outages',
		title: 'Power Outages',
		tier: 3,
		icon: ZapOff,
		defaultPosition: { x: 4, y: 78, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'emergency-alerts',
		title: 'Emergency Alerts',
		tier: 3,
		icon: TriangleAlert,
		defaultPosition: { x: 8, y: 78, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'public-land',
		title: 'City-Owned Land',
		tier: 3,
		icon: MapPinned,
		defaultPosition: { x: 0, y: 84, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	},
	{
		id: 'council-votes',
		title: 'Council Votes',
		tier: 3,
		icon: Vote,
		defaultPosition: { x: 4, y: 84, w: 4, h: 6 },
		minWidth: 3,
		minHeight: 4
	}
];

export function getPanelsByTier(tier: 1 | 2 | 3 | 4): PanelConfig[] {
	return panels.filter((p) => p.tier === tier);
}

export function getPanel(id: string): PanelConfig | undefined {
	return panels.find((p) => p.id === id);
}
