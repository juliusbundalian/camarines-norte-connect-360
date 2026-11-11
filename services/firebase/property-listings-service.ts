import {collection, doc, getDocFromServer, getDocsFromServer, query, where} from 'firebase/firestore';
import type {Listing} from '../../features/properties/listings';
import {getFirestoreDb} from './client';

const photos = new Map<string, Listing['photo']>([
  ['danielle-luxe', require('../../assets/properties/danielle_luxe.png')],
  ['belle-luxe', require('../../assets/properties/belle_luxe.png')],
]);

function nonempty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function nonnegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function within(value: unknown, limit: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= limit;
}

function positive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function record(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
}

function decodeListing(id: string, data: Record<string, unknown>): {listing: Listing; displayOrder: number} | null {
  const {name, area, location, type, market, price, amenities, bedrooms, bathrooms, photoKey, photoCount,
    latitude, longitude, displayOrder, description, lotAreaSqm, floorAreaSqm, availability} = data;
  const photo = typeof photoKey === 'string' ? photos.get(photoKey) : undefined;
  if (!nonempty(name) || !nonempty(area) || !nonempty(location) || !nonempty(type) ||
      (market !== 'For Sale' && market !== 'For Rent') || !nonnegativeInteger(price) ||
      !Array.isArray(amenities) || !amenities.every(nonempty) || !nonnegativeInteger(photoCount) ||
      photo === undefined || !nonnegativeInteger(displayOrder)) return null;

  const listing: Listing = {
    id, name, area, location, type, market, price, amenities, photoCount, photo,
    coordinates: within(latitude, 90) && within(longitude, 180) ? {latitude, longitude} : null,
  };
  if (listing.coordinates && data.locationApproximate === true) listing.locationApproximate = true;
  if (nonnegativeInteger(bedrooms)) listing.bedrooms = bedrooms;
  if (nonnegativeInteger(bathrooms)) listing.bathrooms = bathrooms;
  if (positive(data.monthlyAmount)) listing.monthlyAmount = data.monthlyAmount;
  if (nonempty(data.furnishing)) listing.furnishing = data.furnishing;
  if (nonempty(description)) listing.description = description;
  if (positive(lotAreaSqm)) listing.lotAreaSqm = lotAreaSqm;
  if (positive(floorAreaSqm)) listing.floorAreaSqm = floorAreaSqm;
  if (availability === 'available' || availability === 'reserved' || availability === 'sold' || availability === 'leased') {
    listing.availability = availability;
  }

  const seller = record(data.seller);
  if (seller && nonempty(seller.displayName) && (seller.kind === 'individual' || seller.kind === 'company')) {
    listing.seller = {displayName: seller.displayName, kind: seller.kind};
  }
  const agent = record(data.agent);
  if (nonempty(agent?.name)) {
    listing.agent = {name: agent.name};
    if (nonempty(agent.role)) listing.agent.role = agent.role;
  }
  const agency = record(data.agency);
  if (nonempty(agency?.name)) {
    listing.agency = {name: agency.name};
    if (nonempty(agency.role)) listing.agency.role = agency.role;
  }
  const subdivision = record(data.subdivision);
  if (nonempty(subdivision?.name)) listing.subdivision = {name: subdivision.name};

  const contact = record(data.inquiryContact);
  const inquiryContact: NonNullable<Listing['inquiryContact']> = {};
  if (nonempty(contact?.phone) && /^\+?[\d ()-]+$/.test(contact.phone) && contact.phone.replace(/\D/g, '').length >= 7) {
    inquiryContact.phone = contact.phone;
  }
  if (nonempty(contact?.email) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
    inquiryContact.email = contact.email;
  }
  if (inquiryContact.phone || inquiryContact.email) {
    if (nonempty(contact?.agentName)) inquiryContact.agentName = contact.agentName;
    listing.inquiryContact = inquiryContact;
  }

  return {listing, displayOrder};
}

export async function loadPublishedListings(): Promise<Listing[]> {
  const catalog = collection(getFirestoreDb(), 'propertyListings');
  const snapshot = await getDocsFromServer(query(catalog, where('published', '==', true)));
  return snapshot.docs
    .map(doc => decodeListing(doc.id, doc.data()))
    .filter(item => item !== null)
    .sort((left, right) => left.displayOrder - right.displayOrder || left.listing.id.localeCompare(right.listing.id))
    .map(({listing}) => listing);
}

export async function loadPublishedListing(id: string): Promise<Listing | null> {
  if (!id || id === '.' || id === '..' || id.includes('/')) return null;
  try {
    const snapshot = await getDocFromServer(doc(getFirestoreDb(), 'propertyListings', id));
    const data = snapshot.data();
    if (!snapshot.exists() || data?.published !== true) return null;
    return decodeListing(snapshot.id, data)?.listing ?? null;
  } catch (error) {
    // Published-only rules also deny direct reads of missing or private documents.
    if (error && typeof error === 'object' && 'code' in error && error.code === 'permission-denied') return null;
    throw error;
  }
}
