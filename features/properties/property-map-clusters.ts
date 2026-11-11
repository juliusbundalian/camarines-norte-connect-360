import Supercluster, {type PointFeature} from 'supercluster';
import type {Region} from 'react-native-maps';
import type {Listing} from './listings';

type LocationProperties = {listingIds: string[]; count: number};
type CountProperties = {count: number};
export type PropertyClusterIndex = Supercluster<LocationProperties, CountProperties>;
export type PropertyMapPoint = ReturnType<PropertyClusterIndex['getClusters']>[number];
export const propertyClusterMaxZoom = 20;

export function buildPropertyClusters(listings: readonly Listing[]): PropertyClusterIndex {
  // Co-located properties must remain one selectable location even at the closest zoom.
  const locations = new Map<string, PointFeature<LocationProperties>>();
  for (const listing of listings) {
    if (!listing.coordinates) continue;
    const {latitude, longitude} = listing.coordinates;
    const key = `${latitude},${longitude}`;
    const existing = locations.get(key);
    if (existing) {
      existing.properties.listingIds.push(listing.id);
      existing.properties.count += 1;
    } else {
      locations.set(key, {
        type: 'Feature',
        geometry: {type: 'Point', coordinates: [longitude, latitude]},
        properties: {listingIds: [listing.id], count: 1},
      });
    }
  }
  return new Supercluster<LocationProperties, CountProperties>({
    radius: 56,
    extent: 256,
    maxZoom: propertyClusterMaxZoom,
    map: properties => ({count: properties.count}),
    reduce: (total, properties) => {total.count += properties.count;},
  }).load([...locations.values()]);
}

export function getPropertyClusters(index: PropertyClusterIndex, region: Region, width: number) {
  const zoom = Math.max(0, Math.min(propertyClusterMaxZoom,
    Math.floor(Math.log2(360 * Math.max(width, 1) / (256 * Math.max(region.longitudeDelta, 0.000001))))));
  // Include a margin so markers remain visible as they cross the viewport edge.
  return index.getClusters([
    region.longitude - region.longitudeDelta * 0.6,
    region.latitude - region.latitudeDelta * 0.6,
    region.longitude + region.longitudeDelta * 0.6,
    region.latitude + region.latitudeDelta * 0.6,
  ], zoom);
}
