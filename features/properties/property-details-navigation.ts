export const propertySections = [
  {id: 'details', label: 'Details'},
  {id: 'description', label: 'Description'},
  {id: 'amenities', label: 'Amenities'},
  {id: 'location', label: 'Location'},
  {id: 'agent', label: 'Agent'},
] as const;
export type PropertySection = typeof propertySections[number]['id'];
export type PropertySectionPositions = Partial<Record<PropertySection, number>>;

export function getPropertySectionTarget(y: number, chromeHeight: number, contentHeight: number, viewportHeight: number) {
  return Math.max(0, Math.min(y - chromeHeight, contentHeight - viewportHeight));
}

export function getActivePropertySection(
  offset: number, positions: PropertySectionPositions, chromeHeight: number, maxOffset: number,
): PropertySection {
  const measured = propertySections.filter(section => positions[section.id] !== undefined);
  if (maxOffset > 0 && offset >= maxOffset - 2) return measured.at(-1)?.id ?? 'details';
  let active: PropertySection = 'details';
  for (const section of measured) {
    if (positions[section.id]! <= offset + chromeHeight + 4) active = section.id;
  }
  return active;
}
