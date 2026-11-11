import {fireEvent, render, screen} from '@testing-library/react-native';
import {PropertyMap} from '../PropertyMap.android';
import type {Listing} from '../listings';

const mockAnimateCamera = jest.fn();
jest.mock('react-native-maps', () => {
  const React = require('react');
  const {View, Pressable} = require('react-native');
  return {
    __esModule: true,
    default: React.forwardRef((props: object, ref: unknown) => {
      React.useImperativeHandle(ref, () => ({animateCamera: mockAnimateCamera}));
      return <View {...props} testID="property-map" />;
    }),
    Marker: ({accessibilityLabel, onPress}: {accessibilityLabel: string; onPress: () => void}) => (
      <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} />
    ),
    PROVIDER_GOOGLE: 'google',
  };
});

const danielle: Listing = {
  id: 'danielle', name: 'Danielle Luxe', area: 'Bibirao, Daet', location: 'Bibirao',
  type: 'House & Lot', market: 'For Sale', price: 2_900_000, amenities: [],
  photo: 1, photoCount: 1, coordinates: {latitude: 14.0933, longitude: 122.9221},
};
const belle: Listing = {
  ...danielle, id: 'belle', name: 'Belle Luxe', price: 2_000_000,
  coordinates: {latitude: 14.0945, longitude: 122.9234},
};

async function renderMap(listings: readonly Listing[], onOpenListing?: (id: string) => void) {
  const result = await render(<PropertyMap listings={listings} onOpenListing={onOpenListing} />);
  await fireEvent(screen.getByTestId('property-map'), 'regionChangeComplete', {
    latitude: 14.094, longitude: 122.9227, latitudeDelta: 0.065, longitudeDelta: 0.05,
  });
  return result;
}

test('a numbered cluster expands smoothly, then reveals selectable property pins', async () => {
  await renderMap([danielle, belle]);
  await fireEvent.press(screen.getByRole('button', {name: 'Show 2 properties'}));
  expect(mockAnimateCamera).toHaveBeenCalledWith(
    {center: expect.any(Object), zoom: expect.any(Number)}, {duration: 420},
  );
  await fireEvent(screen.getByTestId('property-map'), 'regionChangeComplete', {
    latitude: 14.094, longitude: 122.9227, latitudeDelta: 0.004, longitudeDelta: 0.002,
  });
  expect(screen.queryByRole('button', {name: 'Show 2 properties'})).toBeNull();
  await fireEvent.press(screen.getByRole('button', {name: 'Preview Belle Luxe'}));
  expect(screen.getByText('Belle Luxe')).toBeTruthy();
  expect(screen.getByText('₱2,000,000')).toBeTruthy();
  expect(screen.getByRole('button', {name: 'Close property preview'})).toBeTruthy();
});

test('co-located properties open choices and selecting a row opens the existing preview', async () => {
  await renderMap([danielle, {...belle, coordinates: danielle.coordinates}]);
  await fireEvent.press(screen.getByRole('button', {name: 'Show 2 properties'}));
  expect(screen.getByText('Choose a property')).toBeTruthy();
  expect(screen.getByText('2 properties in this area')).toBeTruthy();
  expect(mockAnimateCamera).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', {name: 'Preview Danielle Luxe'}));
  expect(screen.queryByText('Choose a property')).toBeNull();
  expect(screen.getByText('Danielle Luxe')).toBeTruthy();
  expect(screen.getByRole('button', {name: 'Close property preview'})).toBeTruthy();
});

test('the choices sheet dismisses through its backdrop and Android Back', async () => {
  await renderMap([danielle, {...belle, coordinates: danielle.coordinates}]);
  await fireEvent.press(screen.getByRole('button', {name: 'Show 2 properties'}));
  await fireEvent.press(screen.getByRole('button', {name: 'Dismiss property choices'}));
  expect(screen.queryByText('Choose a property')).toBeNull();
  await fireEvent.press(screen.getByRole('button', {name: 'Show 2 properties'}));
  await fireEvent(screen.getByTestId('property-cluster-sheet'), 'requestClose');
  expect(screen.queryByText('Choose a property')).toBeNull();
});

test('very close distinct locations offer choices when further zoom cannot separate them', async () => {
  await renderMap([danielle, {
    ...belle, coordinates: {latitude: 14.0933, longitude: 122.92210001},
  }]);
  await fireEvent.press(screen.getByRole('button', {name: 'Show 2 properties'}));
  expect(screen.getByText('Choose a property')).toBeTruthy();
  expect(mockAnimateCamera).not.toHaveBeenCalled();
});

test('filtered listings update cluster counts and remove excluded choices and previews', async () => {
  const {rerender} = await renderMap([danielle, belle]);
  expect(screen.getByRole('button', {name: 'Show 2 properties'})).toBeTruthy();
  await rerender(<PropertyMap listings={[belle]} />);
  expect(screen.queryByRole('button', {name: 'Show 2 properties'})).toBeNull();
  await fireEvent.press(screen.getByRole('button', {name: 'Preview Belle Luxe'}));
  await rerender(<PropertyMap listings={[]} />);
  expect(screen.queryByText('Belle Luxe')).toBeNull();
  expect(screen.getByText('No properties found')).toBeTruthy();
});

test('removed choices do not reopen when their listings return', async () => {
  const listings = [danielle, {...belle, coordinates: danielle.coordinates}];
  const {rerender} = await renderMap(listings);
  await fireEvent.press(screen.getByRole('button', {name: 'Show 2 properties'}));
  await rerender(<PropertyMap listings={[]} />);
  expect(screen.queryByText('Choose a property')).toBeNull();
  await rerender(<PropertyMap listings={listings} />);
  expect(screen.queryByText('Choose a property')).toBeNull();
});

test('preview content opens details while Close only dismisses the card', async () => {
  const open = jest.fn();
  await renderMap([danielle], open);
  await fireEvent.press(screen.getByRole('button', {name: 'Preview Danielle Luxe'}));
  await fireEvent.press(screen.getByRole('button', {name: 'Close property preview'}));
  expect(open).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', {name: 'Preview Danielle Luxe'}));
  await fireEvent.press(screen.getByRole('button', {name: 'Open Danielle Luxe'}));
  expect(open).toHaveBeenCalledWith('danielle');
});
