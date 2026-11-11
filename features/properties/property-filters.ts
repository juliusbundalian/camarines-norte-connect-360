import type {Listing} from './listings';

export const markets = ['For Rent', 'For Sale'] as const;
export const propertyTypes = ['All', 'Apartment', 'Villa', 'Townhouse', 'Duplex', 'Bungalow', 'Hotel', 'Compound', 'Whole Building', 'Penthouse', 'House & Lot'];
export const amenities = ['Balcony', 'Private Pool', 'Car Port', 'Garden', 'Walk-in Closet', 'Built in Cabinets'];
export const locations = ['Anywhere', 'Alawihao', 'Awitan', 'Bagasbas', 'Barangay I (Hilabod)', 'Barangay II (Pasig)', 'Barangay III (Iraya)', 'Barangay IV (Mantagbac)', 'Bibirao'];

export type FilterSection = 'market' | 'type' | 'price' | 'amenities' | 'location';
export type Filters = {
  market: Listing['market'] | null;
  type: string;
  minimum: string;
  maximum: string;
  amenities: readonly string[];
  location: string;
};

export const defaultMarket = 'For Sale';

export const defaultFilters: Filters = {
  market: null,
  type: 'All',
  minimum: '',
  maximum: '',
  amenities: [],
  location: 'Anywhere',
};

export function activeSections(filters: Filters): Record<FilterSection, boolean> {
  return {
    market: filters.market !== defaultFilters.market,
    type: filters.type !== defaultFilters.type,
    price: Boolean(filters.minimum.trim() || filters.maximum.trim()),
    amenities: filters.amenities.length > 0,
    location: filters.location !== defaultFilters.location,
  };
}

export function priceBound(value: string, fallback: number): number {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (!/^\d+$|^\d{1,3}(,\d{3})+$/.test(trimmed)) return NaN;
  const amount = Number(trimmed.replaceAll(',', ''));
  return Number.isSafeInteger(amount) ? amount : NaN;
}

export function filterListings(items: readonly Listing[], filters: Filters, search: string): Listing[] | null {
  const minimum = priceBound(filters.minimum, 0);
  const maximum = priceBound(filters.maximum, Infinity);
  if (Number.isNaN(minimum) || Number.isNaN(maximum) || minimum > maximum) return null;

  const query = search.trim().toLowerCase();
  return items.filter(listing =>
    listing.market === (filters.market ?? defaultMarket) &&
    (filters.type === 'All' || listing.type === filters.type) &&
    (filters.location === 'Anywhere' || listing.location === filters.location) &&
    listing.price >= minimum && listing.price <= maximum &&
    filters.amenities.every(amenity => listing.amenities.includes(amenity)) &&
    `${listing.name} ${listing.area}`.toLowerCase().includes(query),
  );
}

export const formatPrice = (amount: number) => `₱${amount.toLocaleString('en-PH')}`;
