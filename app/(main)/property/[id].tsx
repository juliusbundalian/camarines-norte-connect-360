import {useLocalSearchParams} from 'expo-router';
import {PropertyDetailsScreen} from '../../../features/properties/PropertyDetailsScreen';
import {readMapListing} from '../../../features/properties/map-listing-handoff';

export default function PropertyDetailsPage() {
  const {id, mapCardTop} = useLocalSearchParams<{id?: string | string[]; mapCardTop?: string}>();
  const listingId = typeof id === 'string' ? id : '';
  const top = typeof mapCardTop === 'string' && mapCardTop !== '' ? Number(mapCardTop) : NaN;
  const fromMap = Number.isFinite(top);
  return <PropertyDetailsScreen key={listingId} id={listingId} mapCardTop={fromMap ? top : undefined}
    initialListing={fromMap ? readMapListing(listingId) : undefined} />;
}
