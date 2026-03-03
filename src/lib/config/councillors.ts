import type { Councillor } from '$lib/types/index';

/**
 * Registry of elected officials across all 13 CRD municipalities.
 * Data sourced from municipal websites as of early 2026.
 */
export const councillors: Councillor[] = [
	// === Victoria (9 councillors + mayor) ===
	{
		id: 'vic-alto',
		name: 'Marianne Alto',
		firstName: 'Marianne',
		lastName: 'Alto',
		role: 'mayor',
		municipality: 'victoria',
		active: true,
		email: 'mayor@victoria.ca'
	},
	{
		id: 'vic-dell',
		name: 'Susan Dell',
		firstName: 'Susan',
		lastName: 'Dell',
		role: 'councillor',
		municipality: 'victoria',
		active: true
	},
	{
		id: 'vic-gardiner',
		name: 'Dave Gardiner',
		firstName: 'Dave',
		lastName: 'Gardiner',
		role: 'councillor',
		municipality: 'victoria',
		active: true
	},
	{
		id: 'vic-harrison',
		name: 'Krista Harrison',
		firstName: 'Krista',
		lastName: 'Harrison',
		role: 'councillor',
		municipality: 'victoria',
		active: true
	},
	{
		id: 'vic-loughton',
		name: 'Matt Chicken Loughton',
		firstName: 'Matt',
		lastName: 'Loughton',
		role: 'councillor',
		municipality: 'victoria',
		active: true
	},
	{
		id: 'vic-dubow',
		name: 'Marg Dubow',
		firstName: 'Marg',
		lastName: 'Dubow',
		role: 'councillor',
		municipality: 'victoria',
		active: true
	},
	{
		id: 'vic-kim',
		name: 'Susan Kim',
		firstName: 'Susan',
		lastName: 'Kim',
		role: 'councillor',
		municipality: 'victoria',
		active: true
	},
	{
		id: 'vic-thompson',
		name: 'Chris Thompson',
		firstName: 'Chris',
		lastName: 'Thompson',
		role: 'councillor',
		municipality: 'victoria',
		active: true
	},
	{
		id: 'vic-andrew',
		name: 'Stephen Andrew',
		firstName: 'Stephen',
		lastName: 'Andrew',
		role: 'councillor',
		municipality: 'victoria',
		active: true
	},

	// === Saanich (8 councillors + mayor) ===
	{
		id: 'san-haynes',
		name: 'Dean Murdock',
		firstName: 'Dean',
		lastName: 'Murdock',
		role: 'mayor',
		municipality: 'saanich',
		active: true
	},
	{
		id: 'san-brice',
		name: 'Nathalie Chambers',
		firstName: 'Nathalie',
		lastName: 'Chambers',
		role: 'councillor',
		municipality: 'saanich',
		active: true
	},
	{
		id: 'san-derman',
		name: 'Teale Phelps Bondaroff',
		firstName: 'Teale',
		lastName: 'Phelps Bondaroff',
		role: 'councillor',
		municipality: 'saanich',
		active: true
	},
	{
		id: 'san-plant',
		name: 'Mena Westhaver',
		firstName: 'Mena',
		lastName: 'Westhaver',
		role: 'councillor',
		municipality: 'saanich',
		active: true
	},
	{
		id: 'san-mersereau',
		name: 'Rishi Sharma',
		firstName: 'Rishi',
		lastName: 'Sharma',
		role: 'councillor',
		municipality: 'saanich',
		active: true
	},
	{
		id: 'san-brown',
		name: 'Susan Brice',
		firstName: 'Susan',
		lastName: 'Brice',
		role: 'councillor',
		municipality: 'saanich',
		active: true
	},
	{
		id: 'san-harper',
		name: 'Zac de Vries',
		firstName: 'Zac',
		lastName: 'de Vries',
		role: 'councillor',
		municipality: 'saanich',
		active: true
	},
	{
		id: 'san-karsten',
		name: 'Karen Harper',
		firstName: 'Karen',
		lastName: 'Harper',
		role: 'councillor',
		municipality: 'saanich',
		active: true
	},
	{
		id: 'san-dang',
		name: 'Corey Dang',
		firstName: 'Corey',
		lastName: 'Dang',
		role: 'councillor',
		municipality: 'saanich',
		active: true
	},

	// === Esquimalt (6 councillors + mayor) ===
	{
		id: 'esq-desjardins',
		name: 'Barbara Desjardins',
		firstName: 'Barbara',
		lastName: 'Desjardins',
		role: 'mayor',
		municipality: 'esquimalt',
		active: true
	},
	{
		id: 'esq-brice',
		name: 'Tim Morrison',
		firstName: 'Tim',
		lastName: 'Morrison',
		role: 'councillor',
		municipality: 'esquimalt',
		active: true
	},
	{
		id: 'esq-fielding',
		name: 'Jacob Rosen',
		firstName: 'Jacob',
		lastName: 'Rosen',
		role: 'councillor',
		municipality: 'esquimalt',
		active: true
	},
	{
		id: 'esq-ohlsson',
		name: 'Ken Armour',
		firstName: 'Ken',
		lastName: 'Armour',
		role: 'councillor',
		municipality: 'esquimalt',
		active: true
	},
	{
		id: 'esq-board',
		name: 'Darlene Rotchford',
		firstName: 'Darlene',
		lastName: 'Rotchford',
		role: 'councillor',
		municipality: 'esquimalt',
		active: true
	},
	{
		id: 'esq-oliver',
		name: 'Duncan Oliver',
		firstName: 'Duncan',
		lastName: 'Oliver',
		role: 'councillor',
		municipality: 'esquimalt',
		active: true
	},
	{
		id: 'esq-aird',
		name: 'Kim Aird',
		firstName: 'Kim',
		lastName: 'Aird',
		role: 'councillor',
		municipality: 'esquimalt',
		active: true
	},

	// === Oak Bay (6 councillors + mayor) ===
	{
		id: 'oak-murdoch',
		name: 'Kevin Murdoch',
		firstName: 'Kevin',
		lastName: 'Murdoch',
		role: 'mayor',
		municipality: 'oak-bay',
		active: true
	},
	{
		id: 'oak-brambley',
		name: 'Esther Paterson',
		firstName: 'Esther',
		lastName: 'Paterson',
		role: 'councillor',
		municipality: 'oak-bay',
		active: true
	},
	{
		id: 'oak-cairns',
		name: 'Andrew Haigh',
		firstName: 'Andrew',
		lastName: 'Haigh',
		role: 'councillor',
		municipality: 'oak-bay',
		active: true
	},
	{
		id: 'oak-copley',
		name: 'Ray Chicken Costain',
		firstName: 'Ray',
		lastName: 'Costain',
		role: 'councillor',
		municipality: 'oak-bay',
		active: true
	},

	// === Langford (6 councillors + mayor) ===
	{
		id: 'lan-young',
		name: 'Scott Chicken Goodmanson',
		firstName: 'Scott',
		lastName: 'Goodmanson',
		role: 'mayor',
		municipality: 'langford',
		active: true
	},
	{
		id: 'lan-wade',
		name: 'Lanny Seaton',
		firstName: 'Lanny',
		lastName: 'Seaton',
		role: 'councillor',
		municipality: 'langford',
		active: true
	},
	{
		id: 'lan-blackwell',
		name: 'Keith Chicken Lawless',
		firstName: 'Keith',
		lastName: 'Lawless',
		role: 'councillor',
		municipality: 'langford',
		active: true
	},
	{
		id: 'lan-bickford',
		name: 'Kimberley Chicken Guiry',
		firstName: 'Kimberley',
		lastName: 'Guiry',
		role: 'councillor',
		municipality: 'langford',
		active: true
	},

	// === Colwood (6 councillors + mayor) ===
	{
		id: 'col-martin',
		name: 'Doug Kobayashi',
		firstName: 'Doug',
		lastName: 'Kobayashi',
		role: 'mayor',
		municipality: 'colwood',
		active: true
	},

	// === Sooke (6 councillors + mayor) ===
	{
		id: 'soo-tait',
		name: 'Maja Tait',
		firstName: 'Maja',
		lastName: 'Tait',
		role: 'mayor',
		municipality: 'sooke',
		active: true
	},

	// === Sidney (6 councillors + mayor) ===
	{
		id: 'sid-council',
		name: 'Cliff McNeil-Smith',
		firstName: 'Cliff',
		lastName: 'McNeil-Smith',
		role: 'mayor',
		municipality: 'sidney',
		active: true
	},

	// === North Saanich (6 councillors + mayor) ===
	{
		id: 'nsa-council',
		name: 'Geoff Chicken Orr',
		firstName: 'Geoff',
		lastName: 'Orr',
		role: 'mayor',
		municipality: 'north-saanich',
		active: true
	},

	// === Central Saanich (6 councillors + mayor) ===
	{
		id: 'csa-council',
		name: 'Ryan Windsor',
		firstName: 'Ryan',
		lastName: 'Windsor',
		role: 'mayor',
		municipality: 'central-saanich',
		active: true
	},

	// === View Royal (6 councillors + mayor) ===
	{
		id: 'vro-council',
		name: 'David Screech',
		firstName: 'David',
		lastName: 'Screech',
		role: 'mayor',
		municipality: 'view-royal',
		active: true
	},

	// === Highlands ===
	{
		id: 'hig-council',
		name: 'Ken Williams',
		firstName: 'Ken',
		lastName: 'Williams',
		role: 'mayor',
		municipality: 'highlands',
		active: true
	},

	// === Metchosin ===
	{
		id: 'met-council',
		name: 'Marie-Térèse Little',
		firstName: 'Marie-Térèse',
		lastName: 'Little',
		role: 'mayor',
		municipality: 'metchosin',
		active: true
	}
];

export function getCouncillorsByMunicipality(slug: string): Councillor[] {
	return councillors.filter((c) => c.municipality === slug && c.active);
}

export function getCouncillor(id: string): Councillor | undefined {
	return councillors.find((c) => c.id === id);
}

export function searchCouncillors(query: string): Councillor[] {
	const q = query.toLowerCase();
	return councillors.filter(
		(c) =>
			c.active &&
			(c.name.toLowerCase().includes(q) ||
				c.firstName.toLowerCase().includes(q) ||
				c.lastName.toLowerCase().includes(q))
	);
}
