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
		bbox: [-123.465, 48.430, -123.280, 48.530],
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
		bbox: [-123.350, 48.410, -123.290, 48.460],
		population: 18015,
		councilSource: 'civicweb'
	},
	{
		slug: 'langford',
		name: 'Langford',
		abbreviation: 'LAN',
		color: '#C53030',
		bbox: [-123.540, 48.430, -123.430, 48.500],
		population: 46584,
		councilSource: 'escribemeetings',
		councilUrl: 'https://pub-langford.escribemeetings.com'
	},
	{
		slug: 'colwood',
		name: 'Colwood',
		abbreviation: 'COL',
		color: '#00B5D8',
		bbox: [-123.520, 48.410, -123.440, 48.460],
		population: 18961,
		councilSource: 'civicweb'
	},
	{
		slug: 'sooke',
		name: 'Sooke',
		abbreviation: 'SOO',
		color: '#38A169',
		bbox: [-123.770, 48.350, -123.680, 48.420],
		population: 15054,
		councilSource: 'civicweb'
	},
	{
		slug: 'sidney',
		name: 'Sidney',
		abbreviation: 'SID',
		color: '#DD6B20',
		bbox: [-123.420, 48.635, -123.380, 48.665],
		population: 12402,
		councilSource: 'civicweb'
	},
	{
		slug: 'north-saanich',
		name: 'North Saanich',
		abbreviation: 'NSA',
		color: '#3182CE',
		bbox: [-123.490, 48.610, -123.350, 48.700],
		population: 12236,
		councilSource: 'civicweb'
	},
	{
		slug: 'central-saanich',
		name: 'Central Saanich',
		abbreviation: 'CSA',
		color: '#805AD5',
		bbox: [-123.440, 48.540, -123.330, 48.610],
		population: 18681,
		councilSource: 'civicweb'
	},
	{
		slug: 'view-royal',
		name: 'View Royal',
		abbreviation: 'VRO',
		color: '#E53E3E',
		bbox: [-123.480, 48.440, -123.410, 48.480],
		population: 11575,
		councilSource: 'civicweb'
	},
	{
		slug: 'highlands',
		name: 'Highlands',
		abbreviation: 'HIG',
		color: '#319795',
		bbox: [-123.540, 48.480, -123.440, 48.540],
		population: 2442,
		councilSource: 'diligent',
		councilUrl: 'https://highlandsbc.diligent.community'
	},
	{
		slug: 'metchosin',
		name: 'Metchosin',
		abbreviation: 'MET',
		color: '#975A16',
		bbox: [-123.600, 48.350, -123.460, 48.440],
		population: 5078,
		councilSource: 'civicweb'
	}
];

/** Full CRD bounding box encompassing all municipalities */
export const CRD_BBOX: [number, number, number, number] = [-123.770, 48.300, -123.280, 48.700];

/** CRD center point (roughly Victoria harbour) */
export const CRD_CENTER: [number, number] = [-123.365, 48.428];

export function getMunicipality(slug: string): Municipality | undefined {
	return municipalities.find((m) => m.slug === slug);
}
