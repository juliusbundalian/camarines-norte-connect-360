import type {Listing} from './listings';

export type PropertyMapProps = {listings: readonly Listing[]; onOpenListing?: (id: string, cardTop?: number) => void};

export const propertyMapEnabled = false;

export function PropertyMap(_props: PropertyMapProps) {
  return null;
}
