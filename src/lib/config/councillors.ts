import type { Councillor } from '$lib/types/index';

/**
 * Registry of elected officials across all 13 CRD municipalities.
 * Data sourced from official municipal websites, verified March 2026.
 * Term: 2022-2026 (October 2022 election).
 *
 * Updates:
 * - Esquimalt: Meagan Brame replaced Darlene Rotchford (2025 by-election,
 *   after Rotchford elected to BC Legislature Oct 2024).
 * - Sooke: Herb Haldane replaced Dana Lajeunesse (July 2025 by-election,
 *   after Lajeunesse elected MLA for Juan de Fuca-Malahat Nov 2024).
 *
 * Note: Social media handles (Twitter, Facebook, Bluesky) have been removed
 * as they could not be verified. Only official municipal website URLs and
 * mayor email addresses are included.
 */
export const councillors: Councillor[] = [
	// === Victoria (8 councillors + mayor) ===
	{
		id: 'vic-alto',
		name: 'Marianne Alto',
		firstName: 'Marianne',
		lastName: 'Alto',
		role: 'mayor',
		municipality: 'victoria',
		active: true,
		email: 'mayor@victoria.ca',
		social: {
			website: 'https://www.victoria.ca/city-government/mayor-council/mayor-marianne-alto'
		}
	},
	{
		id: 'vic-caradonna',
		name: 'Jeremy Caradonna',
		firstName: 'Jeremy',
		lastName: 'Caradonna',
		role: 'councillor',
		municipality: 'victoria',
		active: true,
		social: {
			website:
				'https://www.victoria.ca/city-government/mayor-council/council-member-jeremy-caradonna'
		}
	},
	{
		id: 'vic-coleman',
		name: 'Chris Coleman',
		firstName: 'Chris',
		lastName: 'Coleman',
		role: 'councillor',
		municipality: 'victoria',
		active: true,
		social: {
			website:
				'https://www.victoria.ca/city-government/mayor-council/council-member-chris-coleman'
		}
	},
	{
		id: 'vic-dell',
		name: 'Matt Dell',
		firstName: 'Matt',
		lastName: 'Dell',
		role: 'councillor',
		municipality: 'victoria',
		active: true,
		social: {
			website: 'https://www.victoria.ca/city-government/mayor-council/council-member-matt-dell'
		}
	},
	{
		id: 'vic-gardiner',
		name: 'Marg Gardiner',
		firstName: 'Marg',
		lastName: 'Gardiner',
		role: 'councillor',
		municipality: 'victoria',
		active: true,
		social: {
			website:
				'https://www.victoria.ca/city-government/mayor-council/council-member-marg-gardiner'
		}
	},
	{
		id: 'vic-hammond',
		name: 'Stephen Hammond',
		firstName: 'Stephen',
		lastName: 'Hammond',
		role: 'councillor',
		municipality: 'victoria',
		active: true,
		social: {
			website:
				'https://www.victoria.ca/city-government/mayor-council/council-member-stephen-hammond'
		}
	},
	{
		id: 'vic-kim',
		name: 'Susan Kim',
		firstName: 'Susan',
		lastName: 'Kim',
		role: 'councillor',
		municipality: 'victoria',
		active: true,
		social: {
			website: 'https://www.victoria.ca/city-government/mayor-council/council-member-susan-kim'
		}
	},
	{
		id: 'vic-loughton',
		name: 'Krista Loughton',
		firstName: 'Krista',
		lastName: 'Loughton',
		role: 'councillor',
		municipality: 'victoria',
		active: true,
		social: {
			website:
				'https://www.victoria.ca/city-government/mayor-council/council-member-krista-loughton'
		}
	},
	{
		id: 'vic-thompson',
		name: 'Dave Thompson',
		firstName: 'Dave',
		lastName: 'Thompson',
		role: 'councillor',
		municipality: 'victoria',
		active: true,
		social: {
			website:
				'https://www.victoria.ca/city-government/mayor-council/council-member-dave-thompson'
		}
	},

	// === Saanich (8 councillors + mayor) ===
	{
		id: 'san-murdock',
		name: 'Dean Murdock',
		firstName: 'Dean',
		lastName: 'Murdock',
		role: 'mayor',
		municipality: 'saanich',
		active: true,
		email: 'mayor@saanich.ca',
		social: {
			website: 'https://www.saanich.ca/en/our-community/mayor-and-council.htm'
		}
	},
	{
		id: 'san-brice',
		name: 'Susan Brice',
		firstName: 'Susan',
		lastName: 'Brice',
		role: 'councillor',
		municipality: 'saanich',
		active: true
	},
	{
		id: 'san-brownoff',
		name: 'Judy Brownoff',
		firstName: 'Judy',
		lastName: 'Brownoff',
		role: 'councillor',
		municipality: 'saanich',
		active: true
	},
	{
		id: 'san-chambers',
		name: 'Nathalie Chambers',
		firstName: 'Nathalie',
		lastName: 'Chambers',
		role: 'councillor',
		municipality: 'saanich',
		active: true
	},
	{
		id: 'san-devries',
		name: 'Zac de Vries',
		firstName: 'Zac',
		lastName: 'de Vries',
		role: 'councillor',
		municipality: 'saanich',
		active: true
	},
	{
		id: 'san-harper',
		name: 'Karen Harper',
		firstName: 'Karen',
		lastName: 'Harper',
		role: 'councillor',
		municipality: 'saanich',
		active: true
	},
	{
		id: 'san-phelps-bondaroff',
		name: 'Teale Phelps Bondaroff',
		firstName: 'Teale',
		lastName: 'Phelps Bondaroff',
		role: 'councillor',
		municipality: 'saanich',
		active: true
	},
	{
		id: 'san-plant',
		name: 'Colin Plant',
		firstName: 'Colin',
		lastName: 'Plant',
		role: 'councillor',
		municipality: 'saanich',
		active: true
	},
	{
		id: 'san-westhaver',
		name: 'Mena Westhaver',
		firstName: 'Mena',
		lastName: 'Westhaver',
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
		active: true,
		email: 'mayor@esquimalt.ca',
		social: {
			website: 'https://www.esquimalt.ca/municipal-hall/mayor-council'
		}
	},
	{
		id: 'esq-armour',
		name: 'Ken Armour',
		firstName: 'Ken',
		lastName: 'Armour',
		role: 'councillor',
		municipality: 'esquimalt',
		active: true
	},
	{
		id: 'esq-boardman',
		name: 'Andrea Boardman',
		firstName: 'Andrea',
		lastName: 'Boardman',
		role: 'councillor',
		municipality: 'esquimalt',
		active: true
	},
	{
		id: 'esq-brame',
		name: 'Meagan Brame',
		firstName: 'Meagan',
		lastName: 'Brame',
		role: 'councillor',
		municipality: 'esquimalt',
		active: true
	},
	{
		id: 'esq-cavens',
		name: 'Duncan Cavens',
		firstName: 'Duncan',
		lastName: 'Cavens',
		role: 'councillor',
		municipality: 'esquimalt',
		active: true
	},
	{
		id: 'esq-helliwell',
		name: 'Jacob Helliwell',
		firstName: 'Jacob',
		lastName: 'Helliwell',
		role: 'councillor',
		municipality: 'esquimalt',
		active: true
	},
	{
		id: 'esq-morrison',
		name: 'Tim Morrison',
		firstName: 'Tim',
		lastName: 'Morrison',
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
		active: true,
		email: 'mayor@oakbay.ca',
		social: {
			website: 'https://www.oakbay.ca/municipal-hall/mayor-council'
		}
	},
	{
		id: 'oak-appleton',
		name: 'Andrew Appleton',
		firstName: 'Andrew',
		lastName: 'Appleton',
		role: 'councillor',
		municipality: 'oak-bay',
		active: true
	},
	{
		id: 'oak-braithwaite',
		name: 'Hazel Braithwaite',
		firstName: 'Hazel',
		lastName: 'Braithwaite',
		role: 'councillor',
		municipality: 'oak-bay',
		active: true
	},
	{
		id: 'oak-green',
		name: 'Cairine Green',
		firstName: 'Cairine',
		lastName: 'Green',
		role: 'councillor',
		municipality: 'oak-bay',
		active: true
	},
	{
		id: 'oak-paterson',
		name: 'Esther Paterson',
		firstName: 'Esther',
		lastName: 'Paterson',
		role: 'councillor',
		municipality: 'oak-bay',
		active: true
	},
	{
		id: 'oak-smart',
		name: 'Carrie Smart',
		firstName: 'Carrie',
		lastName: 'Smart',
		role: 'councillor',
		municipality: 'oak-bay',
		active: true
	},
	{
		id: 'oak-watson',
		name: 'Lesley Watson',
		firstName: 'Lesley',
		lastName: 'Watson',
		role: 'councillor',
		municipality: 'oak-bay',
		active: true
	},

	// === Langford (6 councillors + mayor) ===
	{
		id: 'lan-goodmanson',
		name: 'Scott Goodmanson',
		firstName: 'Scott',
		lastName: 'Goodmanson',
		role: 'mayor',
		municipality: 'langford',
		active: true,
		email: 'mayor@langford.ca',
		social: {
			website: 'https://www.langford.ca/city-hall/mayor-council/'
		}
	},
	{
		id: 'lan-guiry',
		name: 'Kimberley Guiry',
		firstName: 'Kimberley',
		lastName: 'Guiry',
		role: 'councillor',
		municipality: 'langford',
		active: true
	},
	{
		id: 'lan-harder',
		name: 'Colby Harder',
		firstName: 'Colby',
		lastName: 'Harder',
		role: 'councillor',
		municipality: 'langford',
		active: true
	},
	{
		id: 'lan-morley',
		name: 'Mark Morley',
		firstName: 'Mark',
		lastName: 'Morley',
		role: 'councillor',
		municipality: 'langford',
		active: true
	},
	{
		id: 'lan-szpak',
		name: 'Lillian Szpak',
		firstName: 'Lillian',
		lastName: 'Szpak',
		role: 'councillor',
		municipality: 'langford',
		active: true
	},
	{
		id: 'lan-wagner',
		name: 'Mary Wagner',
		firstName: 'Mary',
		lastName: 'Wagner',
		role: 'councillor',
		municipality: 'langford',
		active: true
	},
	{
		id: 'lan-yacucha',
		name: 'Keith Yacucha',
		firstName: 'Keith',
		lastName: 'Yacucha',
		role: 'councillor',
		municipality: 'langford',
		active: true
	},

	// === Colwood (6 councillors + mayor) ===
	{
		id: 'col-kobayashi',
		name: 'Doug Kobayashi',
		firstName: 'Doug',
		lastName: 'Kobayashi',
		role: 'mayor',
		municipality: 'colwood',
		active: true,
		email: 'mayor@colwood.ca',
		social: {
			website: 'https://www.colwood.ca/government/mayor-council'
		}
	},
	{
		id: 'col-day',
		name: 'Cynthia Day',
		firstName: 'Cynthia',
		lastName: 'Day',
		role: 'councillor',
		municipality: 'colwood',
		active: true
	},
	{
		id: 'col-grove',
		name: 'David Grove',
		firstName: 'David',
		lastName: 'Grove',
		role: 'councillor',
		municipality: 'colwood',
		active: true
	},
	{
		id: 'col-jantzen',
		name: 'Dean Jantzen',
		firstName: 'Dean',
		lastName: 'Jantzen',
		role: 'councillor',
		municipality: 'colwood',
		active: true
	},
	{
		id: 'col-jordison',
		name: 'Kim Jordison',
		firstName: 'Kim',
		lastName: 'Jordison',
		role: 'councillor',
		municipality: 'colwood',
		active: true
	},
	{
		id: 'col-olsen',
		name: 'Misty Olsen',
		firstName: 'Misty',
		lastName: 'Olsen',
		role: 'councillor',
		municipality: 'colwood',
		active: true
	},
	{
		id: 'col-ward',
		name: 'Ian Ward',
		firstName: 'Ian',
		lastName: 'Ward',
		role: 'councillor',
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
		active: true,
		email: 'mayor@sooke.ca',
		social: {
			website: 'https://sooke.ca/district-government/mayor-council/'
		}
	},
	{
		id: 'soo-bateman',
		name: 'Jeff Bateman',
		firstName: 'Jeff',
		lastName: 'Bateman',
		role: 'councillor',
		municipality: 'sooke',
		active: true
	},
	{
		id: 'soo-beddows',
		name: 'Al Beddows',
		firstName: 'Al',
		lastName: 'Beddows',
		role: 'councillor',
		municipality: 'sooke',
		active: true
	},
	{
		id: 'soo-haldane',
		name: 'Herb Haldane',
		firstName: 'Herb',
		lastName: 'Haldane',
		role: 'councillor',
		municipality: 'sooke',
		active: true
	},
	{
		id: 'soo-mcmath',
		name: 'Megan McMath',
		firstName: 'Megan',
		lastName: 'McMath',
		role: 'councillor',
		municipality: 'sooke',
		active: true
	},
	{
		id: 'soo-pearson',
		name: 'Kevin Pearson',
		firstName: 'Kevin',
		lastName: 'Pearson',
		role: 'councillor',
		municipality: 'sooke',
		active: true
	},
	{
		id: 'soo-stpierre',
		name: 'Tony St. Pierre',
		firstName: 'Tony',
		lastName: 'St. Pierre',
		role: 'councillor',
		municipality: 'sooke',
		active: true
	},

	// === Sidney (6 councillors + mayor) ===
	{
		id: 'sid-mcneil-smith',
		name: 'Cliff McNeil-Smith',
		firstName: 'Cliff',
		lastName: 'McNeil-Smith',
		role: 'mayor',
		municipality: 'sidney',
		active: true,
		email: 'mayor@sidney.ca',
		social: {
			website: 'https://www.sidney.ca/municipal-hall/mayor-council'
		}
	},
	{
		id: 'sid-duck',
		name: 'Steve Duck',
		firstName: 'Steve',
		lastName: 'Duck',
		role: 'councillor',
		municipality: 'sidney',
		active: true
	},
	{
		id: 'sid-duncan',
		name: 'Sara Duncan',
		firstName: 'Sara',
		lastName: 'Duncan',
		role: 'councillor',
		municipality: 'sidney',
		active: true
	},
	{
		id: 'sid-garnett',
		name: 'Scott Garnett',
		firstName: 'Scott',
		lastName: 'Garnett',
		role: 'councillor',
		municipality: 'sidney',
		active: true
	},
	{
		id: 'sid-novek',
		name: 'Richard Novek',
		firstName: 'Richard',
		lastName: 'Novek',
		role: 'councillor',
		municipality: 'sidney',
		active: true
	},
	{
		id: 'sid-okeeffe',
		name: "Terri O'Keeffe",
		firstName: 'Terri',
		lastName: "O'Keeffe",
		role: 'councillor',
		municipality: 'sidney',
		active: true
	},
	{
		id: 'sid-rintoul',
		name: 'Chad Rintoul',
		firstName: 'Chad',
		lastName: 'Rintoul',
		role: 'councillor',
		municipality: 'sidney',
		active: true
	},

	// === North Saanich (6 councillors + mayor) ===
	{
		id: 'nsa-jones',
		name: 'Peter Jones',
		firstName: 'Peter',
		lastName: 'Jones',
		role: 'mayor',
		municipality: 'north-saanich',
		active: true,
		email: 'mayor@northsaanich.ca',
		social: {
			website: 'https://www.northsaanich.ca/government/mayor-council'
		}
	},
	{
		id: 'nsa-dibattista',
		name: 'Phil DiBattista',
		firstName: 'Phil',
		lastName: 'DiBattista',
		role: 'councillor',
		municipality: 'north-saanich',
		active: true
	},
	{
		id: 'nsa-marshall',
		name: 'Kristine Marshall',
		firstName: 'Kristine',
		lastName: 'Marshall',
		role: 'councillor',
		municipality: 'north-saanich',
		active: true
	},
	{
		id: 'nsa-mcclintock',
		name: 'Jack McClintock',
		firstName: 'Jack',
		lastName: 'McClintock',
		role: 'councillor',
		municipality: 'north-saanich',
		active: true
	},
	{
		id: 'nsa-mcconkey',
		name: 'Irene McConkey',
		firstName: 'Irene',
		lastName: 'McConkey',
		role: 'councillor',
		municipality: 'north-saanich',
		active: true
	},
	{
		id: 'nsa-shrivastava',
		name: 'Sanjiv Shrivastava',
		firstName: 'Sanjiv',
		lastName: 'Shrivastava',
		role: 'councillor',
		municipality: 'north-saanich',
		active: true
	},
	{
		id: 'nsa-stock',
		name: 'Celia Stock',
		firstName: 'Celia',
		lastName: 'Stock',
		role: 'councillor',
		municipality: 'north-saanich',
		active: true
	},

	// === Central Saanich (6 councillors + mayor) ===
	{
		id: 'csa-windsor',
		name: 'Ryan Windsor',
		firstName: 'Ryan',
		lastName: 'Windsor',
		role: 'mayor',
		municipality: 'central-saanich',
		active: true,
		email: 'mayor@csaanich.ca',
		social: {
			website: 'https://www.centralsaanich.ca/government/mayor-council'
		}
	},
	{
		id: 'csa-graham',
		name: 'Christopher Graham',
		firstName: 'Christopher',
		lastName: 'Graham',
		role: 'councillor',
		municipality: 'central-saanich',
		active: true
	},
	{
		id: 'csa-king',
		name: 'Zeb King',
		firstName: 'Zeb',
		lastName: 'King',
		role: 'councillor',
		municipality: 'central-saanich',
		active: true
	},
	{
		id: 'csa-newton',
		name: 'Gord Newton',
		firstName: 'Gord',
		lastName: 'Newton',
		role: 'councillor',
		municipality: 'central-saanich',
		active: true
	},
	{
		id: 'csa-paltiel',
		name: 'Niall Paltiel',
		firstName: 'Niall',
		lastName: 'Paltiel',
		role: 'councillor',
		municipality: 'central-saanich',
		active: true
	},
	{
		id: 'csa-riddell',
		name: 'Sarah Riddell',
		firstName: 'Sarah',
		lastName: 'Riddell',
		role: 'councillor',
		municipality: 'central-saanich',
		active: true
	},
	{
		id: 'csa-thompson',
		name: 'Bob Thompson',
		firstName: 'Bob',
		lastName: 'Thompson',
		role: 'councillor',
		municipality: 'central-saanich',
		active: true
	},

	// === View Royal (6 councillors + mayor) ===
	{
		id: 'vro-tobias',
		name: 'Sid Tobias',
		firstName: 'Sid',
		lastName: 'Tobias',
		role: 'mayor',
		municipality: 'view-royal',
		active: true,
		email: 'mayor@viewroyal.ca',
		social: {
			website: 'https://www.viewroyal.ca/EN/main/government/mayor-council.html'
		}
	},
	{
		id: 'vro-brown',
		name: 'Don Brown',
		firstName: 'Don',
		lastName: 'Brown',
		role: 'councillor',
		municipality: 'view-royal',
		active: true
	},
	{
		id: 'vro-kowalewich',
		name: 'Damian Kowalewich',
		firstName: 'Damian',
		lastName: 'Kowalewich',
		role: 'councillor',
		municipality: 'view-royal',
		active: true
	},
	{
		id: 'vro-lemon',
		name: 'Gery Lemon',
		firstName: 'Gery',
		lastName: 'Lemon',
		role: 'councillor',
		municipality: 'view-royal',
		active: true
	},
	{
		id: 'vro-mackenzie',
		name: 'Alison Mackenzie',
		firstName: 'Alison',
		lastName: 'Mackenzie',
		role: 'councillor',
		municipality: 'view-royal',
		active: true
	},
	{
		id: 'vro-mattson',
		name: 'Ron Mattson',
		firstName: 'Ron',
		lastName: 'Mattson',
		role: 'councillor',
		municipality: 'view-royal',
		active: true
	},
	{
		id: 'vro-rogers',
		name: 'John Rogers',
		firstName: 'John',
		lastName: 'Rogers',
		role: 'councillor',
		municipality: 'view-royal',
		active: true
	},

	// === Highlands (6 councillors + mayor) ===
	{
		id: 'hig-williams',
		name: 'Ken Williams',
		firstName: 'Ken',
		lastName: 'Williams',
		role: 'mayor',
		municipality: 'highlands',
		active: true,
		email: 'mayor@highlands.ca',
		social: {
			website: 'https://www.highlands.ca/government/mayor-council'
		}
	},
	{
		id: 'hig-anderson',
		name: 'Leslie Anderson',
		firstName: 'Leslie',
		lastName: 'Anderson',
		role: 'councillor',
		municipality: 'highlands',
		active: true
	},
	{
		id: 'hig-abaird',
		name: 'Ann Baird',
		firstName: 'Ann',
		lastName: 'Baird',
		role: 'councillor',
		municipality: 'highlands',
		active: true
	},
	{
		id: 'hig-gbaird',
		name: 'Gord Baird',
		firstName: 'Gord',
		lastName: 'Baird',
		role: 'councillor',
		municipality: 'highlands',
		active: true
	},
	{
		id: 'hig-mclean',
		name: 'Marcie McLean',
		firstName: 'Marcie',
		lastName: 'McLean',
		role: 'councillor',
		municipality: 'highlands',
		active: true
	},
	{
		id: 'hig-roessingh',
		name: 'Karel Roessingh',
		firstName: 'Karel',
		lastName: 'Roessingh',
		role: 'councillor',
		municipality: 'highlands',
		active: true
	},
	{
		id: 'hig-stanton',
		name: 'Rose Stanton',
		firstName: 'Rose',
		lastName: 'Stanton',
		role: 'councillor',
		municipality: 'highlands',
		active: true
	},

	// === Metchosin (4 councillors + mayor) ===
	{
		id: 'met-little',
		name: 'Marie-Terese Little',
		firstName: 'Marie-Terese',
		lastName: 'Little',
		role: 'mayor',
		municipality: 'metchosin',
		active: true,
		email: 'mayor@metchosin.ca',
		social: {
			website: 'https://www.metchosin.ca/government/mayor-council'
		}
	},
	{
		id: 'met-donaldson',
		name: 'Shelly Donaldson',
		firstName: 'Shelly',
		lastName: 'Donaldson',
		role: 'councillor',
		municipality: 'metchosin',
		active: true
	},
	{
		id: 'met-epp',
		name: 'Sharie Epp',
		firstName: 'Sharie',
		lastName: 'Epp',
		role: 'councillor',
		municipality: 'metchosin',
		active: true
	},
	{
		id: 'met-gray',
		name: 'Steve Gray',
		firstName: 'Steve',
		lastName: 'Gray',
		role: 'councillor',
		municipality: 'metchosin',
		active: true
	},
	{
		id: 'met-shukin',
		name: 'Jay Shukin',
		firstName: 'Jay',
		lastName: 'Shukin',
		role: 'councillor',
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
