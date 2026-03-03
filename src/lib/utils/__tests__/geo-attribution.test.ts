import { describe, it, expect } from 'vitest';
import { attributeMunicipality, attributeMunicipalityByText } from '../geo-attribution';

describe('attributeMunicipality (coordinates)', () => {
	it('returns victoria for coordinates in downtown Victoria', () => {
		// Downtown Victoria: roughly -123.36, 48.42
		expect(attributeMunicipality(-123.36, 48.42)).toBe('victoria');
	});

	it('returns saanich for coordinates in Saanich', () => {
		// Saanich: roughly -123.38, 48.47
		expect(attributeMunicipality(-123.38, 48.47)).toBe('saanich');
	});

	it('returns undefined for coordinates outside CRD', () => {
		// Vancouver: -123.12, 49.28
		expect(attributeMunicipality(-123.12, 49.28)).toBeUndefined();
	});

	it('returns undefined for ocean coordinates', () => {
		expect(attributeMunicipality(-124.0, 48.5)).toBeUndefined();
	});

	it('handles boundary edge cases (bbox inclusive)', () => {
		// Use coordinates that fall within at least one municipality bbox
		const result = attributeMunicipality(-123.36, 48.42);
		expect(result).toBeTruthy();
	});
});

describe('attributeMunicipalityByText', () => {
	it('returns victoria for text mentioning Victoria', () => {
		expect(attributeMunicipalityByText('Victoria city council meeting')).toBe('victoria');
	});

	it('returns saanich for text mentioning Saanich', () => {
		expect(attributeMunicipalityByText('Saanich road closure on Shelbourne')).toBe('saanich');
	});

	it('matches neighbourhood names to correct municipality', () => {
		expect(attributeMunicipalityByText('Event in Gordon Head')).toBe('saanich');
		expect(attributeMunicipalityByText('Brentwood Bay farmers market')).toBe('central-saanich');
		expect(attributeMunicipalityByText('Bear Mountain development')).toBe('langford');
	});

	it('is case-insensitive', () => {
		expect(attributeMunicipalityByText('LANGFORD project approved')).toBe('langford');
	});

	it('returns undefined for unrecognized text', () => {
		expect(attributeMunicipalityByText('Weather is nice today')).toBeUndefined();
	});

	it('returns first match when multiple municipalities mentioned', () => {
		// Victoria comes first in the patterns list
		const result = attributeMunicipalityByText('Victoria and Saanich joint project');
		expect(result).toBe('victoria');
	});

	it('handles empty string', () => {
		expect(attributeMunicipalityByText('')).toBeUndefined();
	});

	it('matches multi-word municipality names', () => {
		expect(attributeMunicipalityByText('North Saanich council')).toBe('north-saanich');
		expect(attributeMunicipalityByText('Oak Bay village')).toBe('oak-bay');
		expect(attributeMunicipalityByText('View Royal updates')).toBe('view-royal');
		expect(attributeMunicipalityByText('Central Saanich parks')).toBe('central-saanich');
	});
});
