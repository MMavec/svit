import type { Municipality } from '$lib/types/index';

export const municipalities: Municipality[] = [
	{
		slug: 'victoria',
		name: 'Victoria',
		abbreviation: 'VIC',
		color: '#2B6CB0',
		bbox: [-123.395, 48.402, -123.329, 48.445],
		population: 91867,
		councilSource: 'escribemeetings',
		councilUrl: 'https://pub-victoria.escribemeetings.com'
	},
	{
		slug: 'saanich',
		name: 'Saanich',
		abbreviation: 'SAN',
		color: '#2F855A',
		bbox: [-123.465, 48.43, -123.28, 48.53],
		population: 117735,
		councilSource: 'civicweb'
	},
	{
		slug: 'esquimalt',
		name: 'Esquimalt',
		abbreviation: 'ESQ',
		color: '#6B46C1',
		bbox: [-123.445, 48.424, -123.382, 48.455],
		population: 17533,
		councilSource: 'legistar',
		councilUrl: 'https://webapi.legistar.com/v1/esquimalt/'
	},
	{
		slug: 'oak-bay',
		name: 'Oak Bay',
		abbreviation: 'OAK',
		color: '#D69E2E',
		bbox: [-123.35, 48.41, -123.29, 48.46],
		population: 18015,
		councilSource: 'civicweb'
	},
	{
		slug: 'langford',
		name: 'Langford',
		abbreviation: 'LAN',
		color: '#C53030',
		bbox: [-123.54, 48.43, -123.43, 48.5],
		population: 46584,
		councilSource: 'escribemeetings',
		councilUrl: 'https://pub-langford.escribemeetings.com'
	},
	{
		slug: 'colwood',
		name: 'Colwood',
		abbreviation: 'COL',
		color: '#00B5D8',
		bbox: [-123.52, 48.41, -123.44, 48.46],
		population: 18961,
		councilSource: 'civicweb'
	},
	{
		slug: 'sooke',
		name: 'Sooke',
		abbreviation: 'SOO',
		color: '#38A169',
		bbox: [-123.77, 48.35, -123.68, 48.42],
		population: 15054,
		councilSource: 'civicweb'
	},
	{
		slug: 'sidney',
		name: 'Sidney',
		abbreviation: 'SID',
		color: '#DD6B20',
		bbox: [-123.42, 48.635, -123.38, 48.665],
		population: 12402,
		councilSource: 'civicweb'
	},
	{
		slug: 'north-saanich',
		name: 'North Saanich',
		abbreviation: 'NSA',
		color: '#3182CE',
		bbox: [-123.49, 48.61, -123.35, 48.7],
		population: 12236,
		councilSource: 'civicweb'
	},
	{
		slug: 'central-saanich',
		name: 'Central Saanich',
		abbreviation: 'CSA',
		color: '#805AD5',
		bbox: [-123.44, 48.54, -123.33, 48.61],
		population: 18681,
		councilSource: 'civicweb'
	},
	{
		slug: 'view-royal',
		name: 'View Royal',
		abbreviation: 'VRO',
		color: '#E53E3E',
		bbox: [-123.48, 48.44, -123.41, 48.48],
		population: 11575,
		councilSource: 'civicweb'
	},
	{
		slug: 'highlands',
		name: 'Highlands',
		abbreviation: 'HIG',
		color: '#319795',
		bbox: [-123.54, 48.48, -123.44, 48.54],
		population: 2442,
		councilSource: 'diligent',
		councilUrl: 'https://highlandsbc.diligent.community'
	},
	{
		slug: 'metchosin',
		name: 'Metchosin',
		abbreviation: 'MET',
		color: '#975A16',
		bbox: [-123.6, 48.35, -123.46, 48.44],
		population: 5078,
		councilSource: 'civicweb'
	}
];

/** Full CRD bounding box encompassing all municipalities */
export const CRD_BBOX: [number, number, number, number] = [-123.77, 48.3, -123.28, 48.7];

/** CRD center point (roughly Victoria harbour) */
export const CRD_CENTER: [number, number] = [-123.365, 48.428];

export function getMunicipality(slug: string): Municipality | undefined {
	return municipalities.find((m) => m.slug === slug);
}
