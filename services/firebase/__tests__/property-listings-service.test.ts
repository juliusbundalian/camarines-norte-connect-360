import {getDocsFromServer} from 'firebase/firestore';
import {loadPublishedListings} from '../property-listings-service';
import fixtures from '../../../scripts/fixtures/property-listings.json';

jest.mock('../client', () => ({getFirestoreDb: () => ({})}));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(), query: jest.fn(), where: jest.fn(), getDocsFromServer: jest.fn(),
}));

const read = jest.mocked(getDocsFromServer);
const doc = (id: string, data: object) => ({id, data: () => data});
const danielle = fixtures['danielle-luxe'];
const belle = fixtures['belle-luxe'];

test('loads ordered cards with bundled images and independently validates optional metadata', async () => {
  read.mockResolvedValue({docs: [
    doc('belle-luxe', {...belle, latitude: 14.12, longitude: null, lotAreaSqm: 0, availability: 'unknown',
      inquiryContact: {agentName: 'Agent'}, seller: {displayName: 'Owner', kind: 'individual'}}),
    doc('bad-price', {...belle, price: '2000000'}),
    doc('danielle-luxe', {...danielle, latitude: 14.11, longitude: 122.96, description: 'Sample description',
      lotAreaSqm: 80.5, floorAreaSqm: 45, availability: 'reserved', subdivision: {name: 'Sample subdivision'},
      seller: {displayName: 'Sample seller', kind: 'company'}, agency: {name: 'Sample agency'},
      inquiryContact: {phone: '+63541234567', email: 'invalid', agentName: 'Agent'}}),
  ]} as Awaited<ReturnType<typeof getDocsFromServer>>);

  const listings = await loadPublishedListings();
  expect(listings.map(item => item.id)).toEqual(['danielle-luxe', 'belle-luxe']);
  expect(listings[0]).toMatchObject({
    photo: require('../../../assets/properties/danielle_luxe.png'),
    coordinates: {latitude: 14.11, longitude: 122.96},
    description: 'Sample description', lotAreaSqm: 80.5, floorAreaSqm: 45, availability: 'reserved',
    seller: {displayName: 'Sample seller', kind: 'company'}, agency: {name: 'Sample agency'},
    subdivision: {name: 'Sample subdivision'}, inquiryContact: {phone: '+63541234567', agentName: 'Agent'},
  });
  expect(listings[0]?.inquiryContact).not.toHaveProperty('email');
  expect(listings[1]).toMatchObject({coordinates: null, seller: {displayName: 'Owner', kind: 'individual'}});
  for (const key of ['agency', 'lotAreaSqm', 'availability', 'inquiryContact']) {
    expect(listings[1]).not.toHaveProperty(key);
  }
});
