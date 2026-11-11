import {act, fireEvent, render, screen, within} from '@testing-library/react-native';
import PropertiesPage from '../../../app/(main)/(tabs)/properties';
import {router} from 'expo-router';

import {loadPublishedListings} from '../../../services/firebase/property-listings-service';
import fixtures from '../../../scripts/fixtures/property-listings.json';
import type {Listing} from '../listings';

jest.mock('../../../services/firebase/property-listings-service', () => ({loadPublishedListings: jest.fn()}));
jest.mock('expo-router', () => ({
  router: {push: jest.fn()},
  useFocusEffect: (effect: () => void) => require('react').useEffect(effect, [effect]),
}));
jest.mock('../PropertyMap', () => ({
  ...jest.requireActual('../PropertyMap.android'),
  propertyMapEnabled: true,
}));
jest.mock('react-native-maps', () => {
  const {Pressable, View} = require('react-native');
  return {
    __esModule: true,
    default: View,
    Marker: ({accessibilityLabel, onPress}: {accessibilityLabel: string; onPress: () => void}) => (
      <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} />
    ),
    PROVIDER_GOOGLE: 'google',
  };
});

const load = jest.mocked(loadPublishedListings);
const samples: Listing[] = Object.entries(fixtures).map(([id, data]) => ({
  ...data,
  id,
  market: 'For Sale',
  coordinates: null,
  photo: id === 'danielle-luxe'
    ? require('../../../assets/properties/danielle_luxe.png')
    : require('../../../assets/properties/belle_luxe.png'),
}));

beforeEach(() => load.mockReset().mockResolvedValue(samples));

test('the map uses filtered pins and the list toggle keeps the current search', async () => {
  load.mockResolvedValueOnce(samples.map(listing => listing.id === 'danielle-luxe'
    ? {...listing, coordinates: {latitude: 14.11, longitude: 122.96}, locationApproximate: true}
    : listing));
  await render(<PropertiesPage />);
  await fireEvent.press(await screen.findByRole('button', {name: 'Show property map'}));
  expect(screen.queryByText('Recommended')).toBeNull();
  expect(screen.queryByText('Some pin locations are approximate')).toBeNull();
  expect(screen.queryByRole('button', {name: 'Preview Belle Luxe'})).toBeNull();
  await fireEvent.press(screen.getByRole('button', {name: 'Preview Danielle Luxe'}));
  expect(screen.getByText('Danielle Luxe')).toBeTruthy();
  expect(screen.getByText('₱2,900,000')).toBeTruthy();
  expect(screen.getByText('Approximate location')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', {name: 'Close property preview'}));
  expect(screen.queryByText('Danielle Luxe')).toBeNull();
  await fireEvent.press(screen.getByRole('button', {name: 'Preview Danielle Luxe'}));

  await fireEvent.changeText(screen.getByLabelText('Search by area or building'), 'Belle');
  expect(screen.queryByText('Danielle Luxe')).toBeNull();
  expect(screen.queryByRole('button', {name: 'Close property preview'})).toBeNull();
  expect(screen.getByText('Locations aren’t available for these properties yet')).toBeTruthy();

  await fireEvent.press(screen.getByRole('button', {name: 'Show property list'}));
  expect(screen.getByText('Belle Luxe')).toBeTruthy();
  expect(screen.queryByText('Danielle Luxe')).toBeNull();
});

test('shows loading, lets a guest retry a failed load, and distinguishes a successful empty catalog', async () => {
  let reject!: (error: Error) => void;
  load.mockReturnValueOnce(new Promise((_, fail) => {reject = fail;})).mockResolvedValueOnce([]);
  await render(<PropertiesPage />);
  expect(screen.getByText('Loading properties…')).toBeTruthy();
  expect(screen.queryByText('No properties found')).toBeNull();

  await act(async () => reject(new Error('unavailable')));
  expect(screen.getByText('Could not load properties')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', {name: 'Retry'}));
  expect(await screen.findByText('No properties found')).toBeTruthy();
});

test('uses the loaded catalog for both the cards and the filter preview', async () => {
  load.mockResolvedValueOnce([{...samples[0]!, name: 'Catalog listing'}]);
  await render(<PropertiesPage />);
  expect(await screen.findByText('Catalog listing')).toBeTruthy();
  expect(screen.getByText('1 property')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', {name: 'Price'}));
  expect(screen.getByRole('button', {name: 'Show 1 result'})).toBeTruthy();
});

test('the Properties route shows the supplied sample listings', async () => {
  await render(<PropertiesPage />);
  expect(screen.getByPlaceholderText('Search properties in Daet...')).toBeTruthy();
  expect(screen.getByText('Danielle Luxe')).toBeTruthy();
  expect(screen.getByText('Belle Luxe')).toBeTruthy();
});

test('opening a listing uses its ID for the details route', async () => {
  await render(<PropertiesPage />);
  await fireEvent.press(await screen.findByRole('button', {name: 'Open Belle Luxe'}));
  expect(router.push).toHaveBeenCalledWith({pathname: '/property/[id]', params: {id: 'belle-luxe'}});
});

test('combines search with an open-ended price filter and keeps search when clearing filters', async () => {
  await render(<PropertiesPage />);
  await fireEvent.changeText(screen.getByLabelText('Search by area or building'), 'Danielle');
  await fireEvent.press(screen.getByRole('button', {name: 'Price'}));
  await fireEvent.changeText(screen.getByLabelText('Maximum'), '2,000,000');
  await fireEvent.press(screen.getByRole('button', {name: 'Show 0 results'}));
  expect(screen.getByText('No properties found')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', {name: 'Clear All'}));
  expect(screen.getByText('Danielle Luxe')).toBeTruthy();
  expect(screen.queryByText('Belle Luxe')).toBeNull();
});

test('discarding the sheet preserves the applied filters', async () => {
  await render(<PropertiesPage />);
  await fireEvent.press(screen.getByRole('button', {name: 'Filter properties'}));
  await fireEvent.press(screen.getByRole('button', {name: 'For Rent'}));
  await fireEvent(screen.getByTestId('property-filter-sheet'), 'requestClose');
  expect(screen.getByText('2 properties')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', {name: 'Filter properties'}));
  expect(screen.getByRole('button', {name: 'For Sale', selected: true})).toBeTruthy();
});

test('shows a form-level error only when an inverted range is submitted', async () => {
  const {Alert} = require('react-native');
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await render(<PropertiesPage />);
  await fireEvent.press(screen.getByRole('button', {name: 'Price'}));
  await fireEvent.changeText(screen.getByLabelText('Minimum'), '3000000');
  await fireEvent.changeText(screen.getByLabelText('Maximum'), '2000000');
  expect(alert).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', {name: 'Show results'}));
  expect(alert).toHaveBeenCalledWith('Check the price range', expect.any(String));
  alert.mockRestore();
});

test('applying an explicit For Sale selection activates its chip', async () => {
  await render(<PropertiesPage />);
  await fireEvent.press(screen.getByRole('button', {name: 'For Sale'}));
  await fireEvent.press(screen.getByRole('button', {name: 'For Sale', selected: true}));
  await fireEvent.press(screen.getByRole('button', {name: 'Show 2 results'}));
  expect(screen.getByRole('button', {name: 'For Sale', selected: true})).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', {name: 'Clear All'}));
  expect(screen.getByRole('button', {name: 'For Sale', selected: false})).toBeTruthy();
});

test('Reset clears the draft while leaving the applied filters in place until Show results', async () => {
  await render(<PropertiesPage />);
  await fireEvent.press(screen.getByRole('button', {name: 'Filter properties'}));
  await fireEvent.press(screen.getByRole('button', {name: 'For Rent'}));
  await fireEvent.press(screen.getByRole('button', {name: 'Show 0 results'}));

  await fireEvent.press(screen.getByRole('button', {name: 'Filter properties'}));
  await fireEvent.press(screen.getByRole('button', {name: 'Reset'}));
  await fireEvent(screen.getByTestId('property-filter-sheet'), 'requestClose');
  expect(screen.getByText('No properties found')).toBeTruthy();

  await fireEvent.press(screen.getByRole('button', {name: 'Filter properties'}));
  await fireEvent.press(screen.getByRole('button', {name: 'Reset'}));
  await fireEvent.press(screen.getByRole('button', {name: 'Show 2 results'}));
  expect(screen.getByText('2 properties')).toBeTruthy();
});

test('tapping outside the filter sheet discards the draft', async () => {
  await render(<PropertiesPage />);
  await fireEvent.press(screen.getByRole('button', {name: 'Filter properties'}));
  await fireEvent.press(screen.getByRole('button', {name: 'For Rent'}));
  await fireEvent.press(screen.getByRole('button', {name: 'Dismiss filters'}));
  expect(screen.queryByText('Filter')).toBeNull();
  expect(screen.getByText('2 properties')).toBeTruthy();
});

test.each([
  ['For Sale', 'For Rent'],
  ['Property Type', 'Apartment'],
  ['Price', 'Minimum'],
  ['Amenities', 'Car Port'],
  ['Location', 'Anywhere'],
  ['Filter properties', 'all'],
])('%s shows only its filter controls', async (chip, visibleControl) => {
  await render(<PropertiesPage />);
  await fireEvent.press(screen.getByRole('button', {name: chip}));
  const sheet = within(screen.getByTestId('property-filter-sheet'));
  for (const label of ['For Rent', 'Apartment', 'Minimum', 'Car Port', 'Anywhere']) {
    const control = label === 'Minimum' ? sheet.queryByLabelText(label) : sheet.queryByRole('button', {name: label});
    if (visibleControl === 'all' || visibleControl === label) expect(control).toBeTruthy();
    else expect(control).toBeNull();
  }
});

test('resetting Price leaves the applied market filter in place', async () => {
  await render(<PropertiesPage />);
  await fireEvent.press(screen.getByRole('button', {name: 'For Sale'}));
  await fireEvent.press(screen.getByRole('button', {name: 'For Rent'}));
  await fireEvent.press(screen.getByRole('button', {name: 'Show 0 results'}));

  await fireEvent.press(screen.getByRole('button', {name: 'Price'}));
  await fireEvent.changeText(screen.getByLabelText('Minimum'), '2000000');
  await fireEvent.press(screen.getByRole('button', {name: 'Reset'}));
  await fireEvent.press(screen.getByRole('button', {name: 'Show 0 results'}));
  expect(screen.getByRole('button', {name: 'For Rent', selected: true})).toBeTruthy();
  expect(screen.getByRole('button', {name: 'Price', selected: false})).toBeTruthy();
});

test('price slider adjustments and typed prices stay in sync', async () => {
  await render(<PropertiesPage />);
  await fireEvent.press(screen.getByRole('button', {name: 'Price'}));
  const minimum = screen.getByLabelText('Minimum price slider');
  await fireEvent(screen.getByLabelText('Minimum'), 'changeText', '2,000,000');
  expect(minimum).toHaveAccessibilityValue({text: '₱2,000,000'});

  await fireEvent(minimum, 'accessibilityAction', {nativeEvent: {actionName: 'increment'}});
  expect(screen.getByLabelText('Minimum')).toHaveDisplayValue('2050000');
  expect(screen.getByRole('button', {name: 'Show 1 result'})).toBeTruthy();

  await fireEvent.changeText(screen.getByLabelText('Maximum'), '0');
  expect(screen.getByLabelText('Maximum price slider')).toHaveAccessibilityValue({text: '₱0'});
  await fireEvent.press(screen.getByRole('button', {name: 'Reset'}));
  expect(screen.getByLabelText('Minimum')).toHaveDisplayValue('');
  expect(screen.getByLabelText('Maximum')).toHaveDisplayValue('');
});
