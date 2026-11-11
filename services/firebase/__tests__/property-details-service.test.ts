import {doc, getDocFromServer} from 'firebase/firestore';
import {loadPublishedListing} from '../property-listings-service';
import fixtures from '../../../scripts/fixtures/property-listings.json';

jest.mock('../client', () => ({getFirestoreDb: () => ({})}));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(), query: jest.fn(), where: jest.fn(), getDocsFromServer: jest.fn(),
  doc: jest.fn(), getDocFromServer: jest.fn(),
}));
const read = jest.mocked(getDocFromServer);
const snapshot = (data?: object) => ({
  id: 'belle-luxe', exists: () => !!data, data: () => data,
}) as Awaited<ReturnType<typeof getDocFromServer>>;

test('loads a published detail through the same legacy-compatible decoder', async () => {
  read.mockResolvedValueOnce(snapshot({...fixtures['belle-luxe'], published: true}));
  expect(await loadPublishedListing('belle-luxe')).toMatchObject({
    id: 'belle-luxe', name: 'Belle Luxe', price: 2000000, coordinates: null,
  });
  expect(doc).toHaveBeenCalledWith({}, 'propertyListings', 'belle-luxe');
});

test.each(['', '.', '..', 'folder/listing'])('invalid document ID %s is unavailable without a request', async id => {
  expect(await loadPublishedListing(id)).toBeNull();
  expect(read).not.toHaveBeenCalled();
});

test('missing, unpublished, malformed and access-denied records are unavailable', async () => {
  read.mockResolvedValueOnce(snapshot())
    .mockResolvedValueOnce(snapshot({...fixtures['belle-luxe'], published: false}))
    .mockResolvedValueOnce(snapshot({published: true, name: 'Incomplete'}))
    .mockRejectedValueOnce({code: 'permission-denied'});
  for (let i = 0; i < 4; i++) expect(await loadPublishedListing('belle-luxe')).toBeNull();
});

test('network failure remains retryable', async () => {
  read.mockRejectedValueOnce(new Error('offline'));
  await expect(loadPublishedListing('belle-luxe')).rejects.toThrow('offline');
});
