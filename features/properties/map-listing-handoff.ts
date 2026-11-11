import type {Listing} from './listings';

let pending: Listing | undefined;

export function stageMapListing(listing: Listing) {
  pending = listing;
}

export function readMapListing(id: string) {
  return pending?.id === id ? pending : undefined;
}

export function clearMapListing(listing: Listing) {
  if (pending === listing) pending = undefined;
}
