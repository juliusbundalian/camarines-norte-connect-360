import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {PropertyDetailsScreen} from '../PropertyDetailsScreen';
import {loadPublishedListing} from '../../../services/firebase/property-listings-service';
import type {Listing} from '../listings';
import {AccessibilityInfo} from 'react-native';

const mockRouter = {back: jest.fn(), canGoBack: jest.fn(() => true), dismissTo: jest.fn()};
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useFocusEffect: (effect: () => void) => require('react').useEffect(effect, [effect]),
}));
jest.mock('../../../services/firebase/property-listings-service', () => ({loadPublishedListing: jest.fn()}));
const load = jest.mocked(loadPublishedListing);
const listing: Listing = {
  id: 'belle-luxe', name: 'Belle Luxe', area: 'West Ville, Bibirao, Daet', location: 'Bibirao',
  type: 'House & Lot', market: 'For Sale', price: 2_000_000, amenities: ['Car Port'],
  photo: 1, photoCount: 18, coordinates: null, bedrooms: 0, bathrooms: 1,
  description: 'A home in Daet. '.repeat(40), seller: {displayName: 'Example seller', kind: 'individual'},
};
beforeEach(() => {
  load.mockReset().mockResolvedValue(listing);
  mockRouter.canGoBack.mockReturnValue(true);
});

test('map details render immediately while the server refresh is pending', async () => {
  let finish!: (value: Listing) => void;
  load.mockReturnValueOnce(new Promise(resolve => {finish = resolve;}));
  await render(<PropertyDetailsScreen id="belle-luxe" mapCardTop={400} initialListing={listing} />);
  expect(screen.getByText('Belle Luxe')).toBeTruthy();
  expect(screen.queryByLabelText('Loading property')).toBeNull();
  await act(async () => finish({...listing, price: 2_100_000}));
  expect(screen.getByText('₱2,100,000')).toBeTruthy();
});

test('guests can browse actual facts, expand description, and see deferred actions disabled', async () => {
  await render(<PropertyDetailsScreen id="belle-luxe" />);
  expect(await screen.findByText('Belle Luxe')).toBeTruthy();
  expect(screen.getByText('₱2,000,000')).toBeTruthy();
  expect(screen.getByText('0')).toBeTruthy();
  expect(screen.getByText('1/1')).toBeTruthy();
  expect(screen.queryByText('1/18')).toBeNull();
  expect(screen.getByRole('button', {name: 'Send Inquiry'})).toBeDisabled();
  expect(screen.getByRole('button', {name: 'Book Viewing'})).toBeDisabled();
  await fireEvent.press(screen.getByRole('button', {name: 'Read more'}));
  expect(screen.getByRole('button', {name: 'Read less'})).toBeTruthy();
});

test('load failure retries and an unavailable property retains a working Back action', async () => {
  load.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(null);
  await render(<PropertyDetailsScreen id="missing" />);
  await fireEvent.press(await screen.findByRole('button', {name: 'Retry'}));
  expect(await screen.findByText('Property unavailable')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', {name: 'Back'}));
  expect(mockRouter.back).toHaveBeenCalled();
});

test('cold-entry Back dismisses to Properties', async () => {
  mockRouter.canGoBack.mockReturnValue(false);
  await render(<PropertyDetailsScreen id="belle-luxe" />);
  await screen.findByText('Belle Luxe');
  await fireEvent.press(screen.getByRole('button', {name: 'Back'}));
  expect(mockRouter.dismissTo).toHaveBeenCalledWith('/properties');
});

test('a short multiline description is fully visible without needing Read more', async () => {
  const description = 'First line\nSecond line\nThird line\nFourth line\nFifth line\nSixth line';
  load.mockResolvedValueOnce({...listing, description});
  await render(<PropertyDetailsScreen id="belle-luxe" />);
  expect(await screen.findByText(description)).not.toHaveProp('numberOfLines', 5);
  expect(screen.queryByRole('button', {name: 'Read more'})).toBeNull();
});

test('the photo viewer respects the system reduced-motion preference', async () => {
  const preference = jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValueOnce(true);
  try {
    await render(<PropertyDetailsScreen id="belle-luxe" />);
    await screen.findByText('Belle Luxe');
    await fireEvent.press(screen.getByRole('button', {name: 'View property photo'}));
    expect(screen.getByTestId('property-photo-viewer')).toHaveProp('animationType', 'none');
    await fireEvent.press(screen.getByRole('button', {name: 'Close property photo'}));
    expect(screen.queryByTestId('property-photo-viewer')).toBeNull();
  } finally {
    preference.mockRestore();
  }
});

test('switching property ID ignores an older request completing late', async () => {
  let finish!: (value: Listing) => void;
  load.mockReturnValueOnce(new Promise(resolve => {finish = resolve;}));
  const {rerender} = await render(<PropertyDetailsScreen id="old" />);
  await rerender(<PropertyDetailsScreen id="belle-luxe" />);
  await screen.findByText('Belle Luxe');
  await act(async () => finish({...listing, name: 'Stale property'}));
  expect(screen.queryByText('Stale property')).toBeNull();
});

test('section taps and manual scrolling update the selected navigation tab', async () => {
  await render(<PropertyDetailsScreen id="belle-luxe" />);
  await screen.findByText('Belle Luxe');
  await fireEvent(screen.getByTestId('property-details-scroll'), 'layout', {
    nativeEvent: {layout: {height: 800, width: 412}},
  });
  await fireEvent(screen.getByTestId('property-details-scroll'), 'contentSizeChange', 412, 2400);
  await fireEvent(screen.getByTestId('property-tabs-anchor'), 'layout', {
    nativeEvent: {layout: {y: 428}},
  });
  for (const [id, y] of Object.entries({details: 480, description: 700, amenities: 1000, location: 1200, agent: 1800})) {
    await fireEvent(screen.getByTestId(`property-section-${id}`), 'layout', {
      nativeEvent: {layout: {y}},
    });
  }
  await fireEvent.press(screen.getByRole('tab', {name: 'Location'}));
  expect(screen.getByRole('tab', {name: 'Location'})).toBeSelected();
  await fireEvent(screen.getByTestId('property-details-scroll'), 'contentSizeChange', 412, 1400);
  await fireEvent.press(screen.getByRole('tab', {name: 'Location'}));
  await fireEvent.scroll(screen.getByTestId('property-details-scroll'), {
    nativeEvent: {contentOffset: {y: 600}, contentSize: {height: 1400, width: 412},
      layoutMeasurement: {height: 800, width: 412}},
  });
  expect(screen.getByRole('tab', {name: 'Location'})).toBeSelected();
  await fireEvent(screen.getByTestId('property-details-scroll'), 'contentSizeChange', 412, 2400);
  await fireEvent(screen.getByTestId('property-details-scroll'), 'scrollBeginDrag');
  await fireEvent.scroll(screen.getByTestId('property-details-scroll'), {
    nativeEvent: {contentOffset: {y: 900}, contentSize: {height: 2400, width: 412},
      layoutMeasurement: {height: 800, width: 412}},
  });
  expect(screen.getByRole('tab', {name: 'Amenities'})).toBeSelected();
});
