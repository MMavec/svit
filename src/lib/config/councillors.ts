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
			twitter: 'marianneyyj',
			website: 'https://www.victoria.ca/mayor-council'
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
		email: 'jcaradonna@victoria.ca',
		social: {
			twitter: 'jcaradonna'
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
		email: 'ccoleman@victoria.ca'
	},
	{
		id: 'vic-dell',
		name: 'Matt Dell',
		firstName: 'Matt',
		lastName: 'Dell',
		role: 'councillor',
		municipality: 'victoria',
		active: true,
		email: 'mdell@victoria.ca',
		social: {
			twitter: 'mattdellyyj'
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
		email: 'mgardiner@victoria.ca'
	},
	{
		id: 'vic-hammond',
		name: 'Stephen Hammond',
		firstName: 'Stephen',
		lastName: 'Hammond',
		role: 'councillor',
		municipality: 'victoria',
		active: true,
		email: 'shammond@victoria.ca'
	},
	{
		id: 'vic-kim',
		name: 'Susan Kim',
		firstName: 'Susan',
		lastName: 'Kim',
		role: 'councillor',
		municipality: 'victoria',
		active: true,
		email: 'skim@victoria.ca'
	},
	{
		id: 'vic-loughton',
		name: 'Krista Loughton',
		firstName: 'Krista',
		lastName: 'Loughton',
		role: 'councillor',
		municipality: 'victoria',
		active: true,
		email: 'kloughton@victoria.ca'
	},
	{
		id: 'vic-thompson',
		name: 'Dave Thompson',
		firstName: 'Dave',
		lastName: 'Thompson',
		role: 'councillor',
		municipality: 'victoria',
		active: true,
		email: 'dthompson@victoria.ca'
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
			twitter: 'DeanMurdock',
			website: 'https://www.saanich.ca/mayor-council'
		}
	},
	{
		id: 'san-brice',
		name: 'Susan Brice',
		firstName: 'Susan',
		lastName: 'Brice',
		role: 'councillor',
		municipality: 'saanich',
		active: true,
		email: 'susan.brice@saanich.ca'
	},
	{
		id: 'san-brownoff',
		name: 'Judy Brownoff',
		firstName: 'Judy',
		lastName: 'Brownoff',
		role: 'councillor',
		municipality: 'saanich',
		active: true,
		email: 'judy.brownoff@saanich.ca'
	},
	{
		id: 'san-chambers',
		name: 'Nathalie Chambers',
		firstName: 'Nathalie',
		lastName: 'Chambers',
		role: 'councillor',
		municipality: 'saanich',
		active: true,
		email: 'nathalie.chambers@saanich.ca'
	},
	{
		id: 'san-devries',
		name: 'Zac de Vries',
		firstName: 'Zac',
		lastName: 'de Vries',
		role: 'councillor',
		municipality: 'saanich',
		active: true,
		email: 'zac.devries@saanich.ca',
		social: {
			twitter: 'zabordevries'
		}
	},
	{
		id: 'san-harper',
		name: 'Karen Harper',
		firstName: 'Karen',
		lastName: 'Harper',
		role: 'councillor',
		municipality: 'saanich',
		active: true,
		email: 'karen.harper@saanich.ca'
	},
	{
		id: 'san-phelps-bondaroff',
		name: 'Teale Phelps Bondaroff',
		firstName: 'Teale',
		lastName: 'Phelps Bondaroff',
		role: 'councillor',
		municipality: 'saanich',
		active: true,
		email: 'teale.phelpsbondaroff@saanich.ca',
		social: {
			twitter: 'TealePB',
			bluesky: 'tealepb.bsky.social'
		}
	},
	{
		id: 'san-plant',
		name: 'Colin Plant',
		firstName: 'Colin',
		lastName: 'Plant',
		role: 'councillor',
		municipality: 'saanich',
		active: true,
		email: 'colin.plant@saanich.ca'
	},
	{
		id: 'san-westhaver',
		name: 'Mena Westhaver',
		firstName: 'Mena',
		lastName: 'Westhaver',
		role: 'councillor',
		municipality: 'saanich',
		active: true,
		email: 'mena.westhaver@saanich.ca'
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
			facebook: 'MayorBarbaraDesjardins',
			website: 'https://www.esquimalt.ca/mayor-council'
		}
	},
	{
		id: 'esq-armour',
		name: 'Ken Armour',
		firstName: 'Ken',
		lastName: 'Armour',
		role: 'councillor',
		municipality: 'esquimalt',
		active: true,
		email: 'karmour@esquimalt.ca'
	},
	{
		id: 'esq-boardman',
		name: 'Andrea Boardman',
		firstName: 'Andrea',
		lastName: 'Boardman',
		role: 'councillor',
		municipality: 'esquimalt',
		active: true,
		email: 'aboardman@esquimalt.ca'
	},
	{
		id: 'esq-brame',
		name: 'Meagan Brame',
		firstName: 'Meagan',
		lastName: 'Brame',
		role: 'councillor',
		municipality: 'esquimalt',
		active: true,
		email: 'mbrame@esquimalt.ca'
	},
	{
		id: 'esq-cavens',
		name: 'Duncan Cavens',
		firstName: 'Duncan',
		lastName: 'Cavens',
		role: 'councillor',
		municipality: 'esquimalt',
		active: true,
		email: 'dcavens@esquimalt.ca'
	},
	{
		id: 'esq-helliwell',
		name: 'Jacob Helliwell',
		firstName: 'Jacob',
		lastName: 'Helliwell',
		role: 'councillor',
		municipality: 'esquimalt',
		active: true,
		email: 'jhelliwell@esquimalt.ca'
	},
	{
		id: 'esq-morrison',
		name: 'Tim Morrison',
		firstName: 'Tim',
		lastName: 'Morrison',
		role: 'councillor',
		municipality: 'esquimalt',
		active: true,
		email: 'tmorrison@esquimalt.ca'
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
			twitter: 'KevinMurdoch1',
			website: 'https://www.oakbay.ca/mayor-council'
		}
	},
	{
		id: 'oak-appleton',
		name: 'Andrew Appleton',
		firstName: 'Andrew',
		lastName: 'Appleton',
		role: 'councillor',
		municipality: 'oak-bay',
		active: true,
		email: 'aappleton@oakbay.ca'
	},
	{
		id: 'oak-braithwaite',
		name: 'Hazel Braithwaite',
		firstName: 'Hazel',
		lastName: 'Braithwaite',
		role: 'councillor',
		municipality: 'oak-bay',
		active: true,
		email: 'hbraithwaite@oakbay.ca'
	},
	{
		id: 'oak-green',
		name: 'Cairine Green',
		firstName: 'Cairine',
		lastName: 'Green',
		role: 'councillor',
		municipality: 'oak-bay',
		active: true,
		email: 'cgreen@oakbay.ca'
	},
	{
		id: 'oak-paterson',
		name: 'Esther Paterson',
		firstName: 'Esther',
		lastName: 'Paterson',
		role: 'councillor',
		municipality: 'oak-bay',
		active: true,
		email: 'epaterson@oakbay.ca'
	},
	{
		id: 'oak-smart',
		name: 'Carrie Smart',
		firstName: 'Carrie',
		lastName: 'Smart',
		role: 'councillor',
		municipality: 'oak-bay',
		active: true,
		email: 'csmart@oakbay.ca'
	},
	{
		id: 'oak-watson',
		name: 'Lesley Watson',
		firstName: 'Lesley',
		lastName: 'Watson',
		role: 'councillor',
		municipality: 'oak-bay',
		active: true,
		email: 'lwatson@oakbay.ca'
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
			facebook: 'CityOfLangford',
			website: 'https://www.langford.ca/mayor-council'
		}
	},
	{
		id: 'lan-guiry',
		name: 'Kimberley Guiry',
		firstName: 'Kimberley',
		lastName: 'Guiry',
		role: 'councillor',
		municipality: 'langford',
		active: true,
		email: 'kguiry@langford.ca'
	},
	{
		id: 'lan-harder',
		name: 'Colby Harder',
		firstName: 'Colby',
		lastName: 'Harder',
		role: 'councillor',
		municipality: 'langford',
		active: true,
		email: 'charder@langford.ca'
	},
	{
		id: 'lan-morley',
		name: 'Mark Morley',
		firstName: 'Mark',
		lastName: 'Morley',
		role: 'councillor',
		municipality: 'langford',
		active: true,
		email: 'mmorley@langford.ca'
	},
	{
		id: 'lan-szpak',
		name: 'Lillian Szpak',
		firstName: 'Lillian',
		lastName: 'Szpak',
		role: 'councillor',
		municipality: 'langford',
		active: true,
		email: 'lszpak@langford.ca'
	},
	{
		id: 'lan-wagner',
		name: 'Mary Wagner',
		firstName: 'Mary',
		lastName: 'Wagner',
		role: 'councillor',
		municipality: 'langford',
		active: true,
		email: 'mwagner@langford.ca'
	},
	{
		id: 'lan-yacucha',
		name: 'Keith Yacucha',
		firstName: 'Keith',
		lastName: 'Yacucha',
		role: 'councillor',
		municipality: 'langford',
		active: true,
		email: 'kyacucha@langford.ca'
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
			website: 'https://www.colwood.ca/mayor-council'
		}
	},
	{
		id: 'col-day',
		name: 'Cynthia Day',
		firstName: 'Cynthia',
		lastName: 'Day',
		role: 'councillor',
		municipality: 'colwood',
		active: true,
		email: 'cday@colwood.ca'
	},
	{
		id: 'col-grove',
		name: 'David Grove',
		firstName: 'David',
		lastName: 'Grove',
		role: 'councillor',
		municipality: 'colwood',
		active: true,
		email: 'dgrove@colwood.ca'
	},
	{
		id: 'col-jantzen',
		name: 'Dean Jantzen',
		firstName: 'Dean',
		lastName: 'Jantzen',
		role: 'councillor',
		municipality: 'colwood',
		active: true,
		email: 'djantzen@colwood.ca'
	},
	{
		id: 'col-jordison',
		name: 'Kim Jordison',
		firstName: 'Kim',
		lastName: 'Jordison',
		role: 'councillor',
		municipality: 'colwood',
		active: true,
		email: 'kjordison@colwood.ca'
	},
	{
		id: 'col-olsen',
		name: 'Misty Olsen',
		firstName: 'Misty',
		lastName: 'Olsen',
		role: 'councillor',
		municipality: 'colwood',
		active: true,
		email: 'molsen@colwood.ca'
	},
	{
		id: 'col-ward',
		name: 'Ian Ward',
		firstName: 'Ian',
		lastName: 'Ward',
		role: 'councillor',
		municipality: 'colwood',
		active: true,
		email: 'iward@colwood.ca'
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
			twitter: 'MajaTait',
			website: 'https://www.sooke.ca/mayor-council'
		}
	},
	{
		id: 'soo-bateman',
		name: 'Jeff Bateman',
		firstName: 'Jeff',
		lastName: 'Bateman',
		role: 'councillor',
		municipality: 'sooke',
		active: true,
		email: 'jbateman@sooke.ca'
	},
	{
		id: 'soo-beddows',
		name: 'Al Beddows',
		firstName: 'Al',
		lastName: 'Beddows',
		role: 'councillor',
		municipality: 'sooke',
		active: true,
		email: 'abeddows@sooke.ca'
	},
	{
		id: 'soo-haldane',
		name: 'Herb Haldane',
		firstName: 'Herb',
		lastName: 'Haldane',
		role: 'councillor',
		municipality: 'sooke',
		active: true,
		email: 'hhaldane@sooke.ca'
	},
	{
		id: 'soo-mcmath',
		name: 'Megan McMath',
		firstName: 'Megan',
		lastName: 'McMath',
		role: 'councillor',
		municipality: 'sooke',
		active: true,
		email: 'mmcmath@sooke.ca'
	},
	{
		id: 'soo-pearson',
		name: 'Kevin Pearson',
		firstName: 'Kevin',
		lastName: 'Pearson',
		role: 'councillor',
		municipality: 'sooke',
		active: true,
		email: 'kpearson@sooke.ca'
	},
	{
		id: 'soo-stpierre',
		name: 'Tony St. Pierre',
		firstName: 'Tony',
		lastName: 'St. Pierre',
		role: 'councillor',
		municipality: 'sooke',
		active: true,
		email: 'tstpierre@sooke.ca'
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
			website: 'https://www.sidney.ca/mayor-council'
		}
	},
	{
		id: 'sid-duck',
		name: 'Steve Duck',
		firstName: 'Steve',
		lastName: 'Duck',
		role: 'councillor',
		municipality: 'sidney',
		active: true,
		email: 'sduck@sidney.ca'
	},
	{
		id: 'sid-duncan',
		name: 'Sara Duncan',
		firstName: 'Sara',
		lastName: 'Duncan',
		role: 'councillor',
		municipality: 'sidney',
		active: true,
		email: 'sduncan@sidney.ca'
	},
	{
		id: 'sid-garnett',
		name: 'Scott Garnett',
		firstName: 'Scott',
		lastName: 'Garnett',
		role: 'councillor',
		municipality: 'sidney',
		active: true,
		email: 'sgarnett@sidney.ca'
	},
	{
		id: 'sid-novek',
		name: 'Richard Novek',
		firstName: 'Richard',
		lastName: 'Novek',
		role: 'councillor',
		municipality: 'sidney',
		active: true,
		email: 'rnovek@sidney.ca'
	},
	{
		id: 'sid-okeeffe',
		name: "Terri O'Keeffe",
		firstName: 'Terri',
		lastName: "O'Keeffe",
		role: 'councillor',
		municipality: 'sidney',
		active: true,
		email: 'tokeeffe@sidney.ca'
	},
	{
		id: 'sid-rintoul',
		name: 'Chad Rintoul',
		firstName: 'Chad',
		lastName: 'Rintoul',
		role: 'councillor',
		municipality: 'sidney',
		active: true,
		email: 'crintoul@sidney.ca'
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
			website: 'https://www.northsaanich.ca/mayor-council'
		}
	},
	{
		id: 'nsa-dibattista',
		name: 'Phil DiBattista',
		firstName: 'Phil',
		lastName: 'DiBattista',
		role: 'councillor',
		municipality: 'north-saanich',
		active: true,
		email: 'pdibattista@northsaanich.ca'
	},
	{
		id: 'nsa-marshall',
		name: 'Kristine Marshall',
		firstName: 'Kristine',
		lastName: 'Marshall',
		role: 'councillor',
		municipality: 'north-saanich',
		active: true,
		email: 'kmarshall@northsaanich.ca'
	},
	{
		id: 'nsa-mcclintock',
		name: 'Jack McClintock',
		firstName: 'Jack',
		lastName: 'McClintock',
		role: 'councillor',
		municipality: 'north-saanich',
		active: true,
		email: 'jmcclintock@northsaanich.ca'
	},
	{
		id: 'nsa-mcconkey',
		name: 'Irene McConkey',
		firstName: 'Irene',
		lastName: 'McConkey',
		role: 'councillor',
		municipality: 'north-saanich',
		active: true,
		email: 'imcconkey@northsaanich.ca'
	},
	{
		id: 'nsa-shrivastava',
		name: 'Sanjiv Shrivastava',
		firstName: 'Sanjiv',
		lastName: 'Shrivastava',
		role: 'councillor',
		municipality: 'north-saanich',
		active: true,
		email: 'sshrivastava@northsaanich.ca'
	},
	{
		id: 'nsa-stock',
		name: 'Celia Stock',
		firstName: 'Celia',
		lastName: 'Stock',
		role: 'councillor',
		municipality: 'north-saanich',
		active: true,
		email: 'cstock@northsaanich.ca'
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
			website: 'https://www.centralsaanich.ca/mayor-council'
		}
	},
	{
		id: 'csa-graham',
		name: 'Christopher Graham',
		firstName: 'Christopher',
		lastName: 'Graham',
		role: 'councillor',
		municipality: 'central-saanich',
		active: true,
		email: 'cgraham@csaanich.ca'
	},
	{
		id: 'csa-king',
		name: 'Zeb King',
		firstName: 'Zeb',
		lastName: 'King',
		role: 'councillor',
		municipality: 'central-saanich',
		active: true,
		email: 'zking@csaanich.ca'
	},
	{
		id: 'csa-newton',
		name: 'Gord Newton',
		firstName: 'Gord',
		lastName: 'Newton',
		role: 'councillor',
		municipality: 'central-saanich',
		active: true,
		email: 'gnewton@csaanich.ca'
	},
	{
		id: 'csa-paltiel',
		name: 'Niall Paltiel',
		firstName: 'Niall',
		lastName: 'Paltiel',
		role: 'councillor',
		municipality: 'central-saanich',
		active: true,
		email: 'npaltiel@csaanich.ca'
	},
	{
		id: 'csa-riddell',
		name: 'Sarah Riddell',
		firstName: 'Sarah',
		lastName: 'Riddell',
		role: 'councillor',
		municipality: 'central-saanich',
		active: true,
		email: 'sriddell@csaanich.ca'
	},
	{
		id: 'csa-thompson',
		name: 'Bob Thompson',
		firstName: 'Bob',
		lastName: 'Thompson',
		role: 'councillor',
		municipality: 'central-saanich',
		active: true,
		email: 'bthompson@csaanich.ca'
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
			website: 'https://www.viewroyal.ca/mayor-council'
		}
	},
	{
		id: 'vro-brown',
		name: 'Don Brown',
		firstName: 'Don',
		lastName: 'Brown',
		role: 'councillor',
		municipality: 'view-royal',
		active: true,
		email: 'dbrown@viewroyal.ca'
	},
	{
		id: 'vro-kowalewich',
		name: 'Damian Kowalewich',
		firstName: 'Damian',
		lastName: 'Kowalewich',
		role: 'councillor',
		municipality: 'view-royal',
		active: true,
		email: 'dkowalewich@viewroyal.ca'
	},
	{
		id: 'vro-lemon',
		name: 'Gery Lemon',
		firstName: 'Gery',
		lastName: 'Lemon',
		role: 'councillor',
		municipality: 'view-royal',
		active: true,
		email: 'glemon@viewroyal.ca'
	},
	{
		id: 'vro-mackenzie',
		name: 'Alison Mackenzie',
		firstName: 'Alison',
		lastName: 'Mackenzie',
		role: 'councillor',
		municipality: 'view-royal',
		active: true,
		email: 'amackenzie@viewroyal.ca'
	},
	{
		id: 'vro-mattson',
		name: 'Ron Mattson',
		firstName: 'Ron',
		lastName: 'Mattson',
		role: 'councillor',
		municipality: 'view-royal',
		active: true,
		email: 'rmattson@viewroyal.ca'
	},
	{
		id: 'vro-rogers',
		name: 'John Rogers',
		firstName: 'John',
		lastName: 'Rogers',
		role: 'councillor',
		municipality: 'view-royal',
		active: true,
		email: 'jrogers@viewroyal.ca'
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
			website: 'https://www.highlands.ca/mayor-council'
		}
	},
	{
		id: 'hig-anderson',
		name: 'Leslie Anderson',
		firstName: 'Leslie',
		lastName: 'Anderson',
		role: 'councillor',
		municipality: 'highlands',
		active: true,
		email: 'landerson@highlands.ca'
	},
	{
		id: 'hig-abaird',
		name: 'Ann Baird',
		firstName: 'Ann',
		lastName: 'Baird',
		role: 'councillor',
		municipality: 'highlands',
		active: true,
		email: 'abaird@highlands.ca'
	},
	{
		id: 'hig-gbaird',
		name: 'Gord Baird',
		firstName: 'Gord',
		lastName: 'Baird',
		role: 'councillor',
		municipality: 'highlands',
		active: true,
		email: 'gbaird@highlands.ca'
	},
	{
		id: 'hig-mclean',
		name: 'Marcie McLean',
		firstName: 'Marcie',
		lastName: 'McLean',
		role: 'councillor',
		municipality: 'highlands',
		active: true,
		email: 'mmclean@highlands.ca'
	},
	{
		id: 'hig-roessingh',
		name: 'Karel Roessingh',
		firstName: 'Karel',
		lastName: 'Roessingh',
		role: 'councillor',
		municipality: 'highlands',
		active: true,
		email: 'kroessingh@highlands.ca'
	},
	{
		id: 'hig-stanton',
		name: 'Rose Stanton',
		firstName: 'Rose',
		lastName: 'Stanton',
		role: 'councillor',
		municipality: 'highlands',
		active: true,
		email: 'rstanton@highlands.ca'
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
			website: 'https://www.metchosin.ca/mayor-council'
		}
	},
	{
		id: 'met-donaldson',
		name: 'Shelly Donaldson',
		firstName: 'Shelly',
		lastName: 'Donaldson',
		role: 'councillor',
		municipality: 'metchosin',
		active: true,
		email: 'sdonaldson@metchosin.ca'
	},
	{
		id: 'met-epp',
		name: 'Sharie Epp',
		firstName: 'Sharie',
		lastName: 'Epp',
		role: 'councillor',
		municipality: 'metchosin',
		active: true,
		email: 'sepp@metchosin.ca'
	},
	{
		id: 'met-gray',
		name: 'Steve Gray',
		firstName: 'Steve',
		lastName: 'Gray',
		role: 'councillor',
		municipality: 'metchosin',
		active: true,
		email: 'sgray@metchosin.ca'
	},
	{
		id: 'met-shukin',
		name: 'Jay Shukin',
		firstName: 'Jay',
		lastName: 'Shukin',
		role: 'councillor',
		municipality: 'metchosin',
		active: true,
		email: 'jshukin@metchosin.ca'
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
