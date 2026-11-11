import {buildPropertyClusters, getPropertyClusters} from '../property-map-clusters';
import type {Listing} from '../listings';

const coordinate = {latitude: 14.0933, longitude: 122.9221};
const region = {...coordinate, latitudeDelta: 0.065, longitudeDelta: 0.05};
const listing = (id: string, offset = 0): Listing => ({
  id, name: id, area: 'Bibirao, Daet', location: 'Bibirao', type: 'House & Lot',
  market: 'For Sale', price: 2_000_000, amenities: [], photo: 1, photoCount: 1,
  coordinates: {...coordinate, longitude: coordinate.longitude + offset},
});

test('nearby listings cluster when zoomed out and separate when zoomed in', () => {
  const index = buildPropertyClusters([listing('one'), listing('two', 0.0013)]);
  const overview = getPropertyClusters(index, region, 400);
  expect(overview).toHaveLength(1);
  expect(overview[0]?.properties.count).toBe(2);
  expect(overview[0]?.properties).toMatchObject({cluster: true});
  const closeup = getPropertyClusters(index, {
    ...region, longitude: coordinate.longitude + 0.00065, longitudeDelta: 0.002,
  }, 400);
  expect(closeup).toHaveLength(2);
  expect(closeup.every(point => point.properties.count === 1)).toBe(true);
});

test('identical locations remain grouped at maximum zoom and preserve all listing IDs', () => {
  const index = buildPropertyClusters([listing('one'), listing('two')]);
  const [group] = getPropertyClusters(index, {...region, longitudeDelta: 0.00001}, 400);
  expect(group?.properties).toMatchObject({count: 2, listingIds: ['one', 'two']});
});

test('cluster counts include every property even when some share coordinates', () => {
  const index = buildPropertyClusters([listing('one'), listing('two'), listing('three', 0.0013)]);
  const [cluster] = getPropertyClusters(index, region, 400);
  expect(cluster?.properties.count).toBe(3);
  expect(cluster?.properties).toMatchObject({cluster: true, point_count: 2});
  if (cluster && 'cluster_id' in cluster.properties) {
    expect(index.getLeaves(cluster.properties.cluster_id, Infinity)
      .flatMap(point => point.properties.listingIds).sort()).toEqual(['one', 'three', 'two']);
    expect(index.getClusterExpansionZoom(cluster.properties.cluster_id)).toBeGreaterThan(13);
  }
});

test('filtered input determines counts and listings without coordinates are excluded', () => {
  const index = buildPropertyClusters([listing('matching'), {...listing('missing'), coordinates: null}]);
  const points = getPropertyClusters(index, region, 400);
  expect(points).toHaveLength(1);
  expect(points[0]?.properties).toMatchObject({count: 1, listingIds: ['matching']});
  expect(getPropertyClusters(buildPropertyClusters([]), region, 400)).toEqual([]);
});

test('only clusters in or near the current viewport are returned', () => {
  const index = buildPropertyClusters([listing('near'), listing('far', 0.2)]);
  expect(getPropertyClusters(index, region, 400)).toHaveLength(1);
  expect(getPropertyClusters(index, {...region, longitude: coordinate.longitude + 0.2}, 400)[0]?.properties)
    .toMatchObject({listingIds: ['far']});
});

test('a dense catalog renders as count markers at a wide zoom', () => {
  const listings = Array.from({length: 2000}, (_, i) => listing(String(i), i * 0.0000005));
  const points = getPropertyClusters(buildPropertyClusters(listings), region, 400);
  expect(points).toHaveLength(1);
  expect(points[0]?.properties.count).toBe(2000);
});
