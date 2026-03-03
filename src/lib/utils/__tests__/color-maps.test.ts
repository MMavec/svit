import { describe, it, expect } from 'vitest';
import {
	colorMap,
	safetyAlertColor,
	constructionSeverityColor,
	transitSeverityColor,
	devStatusColor,
	envStatusColor,
	wildlifeCategoryColor,
	eventCategoryColor,
	searchCategoryColor
} from '../color-maps';

describe('colorMap factory', () => {
	it('returns mapped value for known key', () => {
		const map = colorMap<'a' | 'b'>({ a: 'red', b: 'blue' });
		expect(map('a')).toBe('red');
		expect(map('b')).toBe('blue');
	});

	it('returns default fallback for unknown key', () => {
		const map = colorMap<'a' | 'b'>({ a: 'red' });
		expect(map('b')).toBe('var(--text-tertiary)');
	});

	it('returns custom fallback when provided', () => {
		const map = colorMap<'a' | 'b'>({ a: 'red' }, 'var(--custom)');
		expect(map('b')).toBe('var(--custom)');
	});
});

describe('safetyAlertColor', () => {
	it('maps emergency to critical', () => {
		expect(safetyAlertColor('emergency')).toBe('var(--status-critical)');
	});
	it('maps warning to high', () => {
		expect(safetyAlertColor('warning')).toBe('var(--status-high)');
	});
	it('maps watch to accent-warning', () => {
		expect(safetyAlertColor('watch')).toBe('var(--accent-warning)');
	});
	it('maps advisory to accent-primary', () => {
		expect(safetyAlertColor('advisory')).toBe('var(--accent-primary)');
	});
});

describe('constructionSeverityColor', () => {
	it('maps MAJOR to danger', () => {
		expect(constructionSeverityColor('MAJOR')).toBe('var(--accent-danger)');
	});
	it('maps UNKNOWN to fallback', () => {
		expect(constructionSeverityColor('UNKNOWN')).toBe('var(--text-tertiary)');
	});
});

describe('transitSeverityColor', () => {
	it('maps SEVERE to danger', () => {
		expect(transitSeverityColor('SEVERE')).toBe('var(--accent-danger)');
	});
	it('maps INFO to primary', () => {
		expect(transitSeverityColor('INFO')).toBe('var(--accent-primary)');
	});
});

describe('devStatusColor', () => {
	it('maps proposed to info', () => {
		expect(devStatusColor('proposed')).toBe('var(--accent-info)');
	});
	it('maps complete to green', () => {
		expect(devStatusColor('complete')).toBe('var(--palette-green)');
	});
	it('maps denied to danger', () => {
		expect(devStatusColor('denied')).toBe('var(--accent-danger)');
	});
	it('maps withdrawn to tertiary', () => {
		expect(devStatusColor('withdrawn')).toBe('var(--text-tertiary)');
	});
});

describe('envStatusColor', () => {
	it('maps good to secondary', () => {
		expect(envStatusColor('good')).toBe('var(--accent-secondary)');
	});
	it('maps hazardous to hazardous', () => {
		expect(envStatusColor('hazardous')).toBe('var(--status-hazardous)');
	});
});

describe('wildlifeCategoryColor', () => {
	it('maps bird to warning', () => {
		expect(wildlifeCategoryColor('bird')).toBe('var(--accent-warning)');
	});
	it('maps other to muted', () => {
		expect(wildlifeCategoryColor('other')).toBe('var(--palette-muted)');
	});
});

describe('eventCategoryColor', () => {
	it('maps arts to purple', () => {
		expect(eventCategoryColor('arts')).toBe('var(--palette-purple)');
	});
	it('maps sports to critical', () => {
		expect(eventCategoryColor('sports')).toBe('var(--status-critical)');
	});
});

describe('searchCategoryColor', () => {
	it('maps Council to primary', () => {
		expect(searchCategoryColor('Council')).toBe('var(--accent-primary)');
	});
	it('maps Development to danger', () => {
		expect(searchCategoryColor('Development')).toBe('var(--accent-danger)');
	});
	it('maps Safety to critical', () => {
		expect(searchCategoryColor('Safety')).toBe('var(--status-critical)');
	});
});
