import {getActivePropertySection, getPropertySectionTarget} from '../property-details-navigation';

const sections = {details: 480, description: 700, amenities: 1000, location: 1200, agent: 1550};

test('section targets account for retained chrome and clamp to the page limits', () => {
  expect(getPropertySectionTarget(700, 140, 2000, 800)).toBe(560);
  expect(getPropertySectionTarget(40, 140, 2000, 800)).toBe(0);
  expect(getPropertySectionTarget(1550, 140, 1800, 800)).toBe(1000);
  expect(getPropertySectionTarget(1550, 140, 500, 800)).toBe(0);
});

test('manual scrolling tracks sections below the retained header and tabs', () => {
  expect(getActivePropertySection(0, sections, 140, 1200)).toBe('details');
  expect(getActivePropertySection(565, sections, 140, 1200)).toBe('description');
  expect(getActivePropertySection(870, sections, 140, 1200)).toBe('amenities');
});

test('the final section becomes active at the bottom of a short final block', () => {
  expect(getActivePropertySection(1000, sections, 140, 1000)).toBe('agent');
  expect(getActivePropertySection(0, sections, 140, 0)).toBe('details');
});

test('remeasured sections and missing layout events are handled without stale offsets', () => {
  expect(getActivePropertySection(870, {...sections, amenities: 1400}, 140, 2000)).toBe('description');
  expect(getActivePropertySection(500, {}, 140, 1000)).toBe('details');
});
