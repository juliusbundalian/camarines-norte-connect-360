import {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Easing, StyleSheet, Text, View, type ScrollViewInstance} from 'react-native';
import Constants from 'expo-constants';
import MapView, {Marker, PROVIDER_GOOGLE, type LatLng, type Region} from 'react-native-maps';
import Svg, {Path} from 'react-native-svg';
import Building from 'lucide-react-native/icons/building';
import House from 'lucide-react-native/icons/house';
import {PropertyCard} from './PropertyCard';
import {PropertyClusterSheet} from './PropertyClusterSheet';
import {
  buildPropertyClusters, getPropertyClusters, propertyClusterMaxZoom, type PropertyMapPoint,
} from './property-map-clusters';
import type {Listing} from './listings';
import type {PropertyMapProps} from './PropertyMap';
import {propertyTheme} from './styles';

const {colors, fonts} = propertyTheme;
export const propertyMapEnabled = Constants.expoConfig?.extra?.propertyMapEnabled === true;

const daetRegion = {
  latitude: 14.1132,
  longitude: 122.9559,
  latitudeDelta: 0.065,
  longitudeDelta: 0.05,
};

const propertyMapStyle = [
  {featureType: 'poi', elementType: 'labels', stylers: [{visibility: 'off'}]},
  {featureType: 'transit.station', elementType: 'labels', stylers: [{visibility: 'off'}]},
];

const pinShape = 'M10 1H26Q35 1 35 10V26Q35 35 26 35H23L19.5 38.5Q18 40 16.5 38.5L13 35H10Q1 35 1 26V10Q1 1 10 1Z';
const buildingTypes = new Set(['Apartment', 'Hotel', 'Whole Building', 'Penthouse']);
const previewInset = 16;
const previewDuration = 320;
const dismissDuration = 240;

export function PropertyMap({listings, onOpenListing}: PropertyMapProps) {
  const map = useRef<MapView>(null);
  const previewScroll = useRef<ScrollViewInstance>(null);
  const lastFit = useRef('');
  const [ready, setReady] = useState(false);
  const [laidOut, setLaidOut] = useState(false);
  const [preview, setPreview] = useState<{id: string; closing: boolean} | null>(null);
  const [previewHeight, setPreviewHeight] = useState(0);
  const [slide] = useState(() => new Animated.Value(0));
  const [region, setRegion] = useState<Region>(daetRegion);
  const [mapWidth, setMapWidth] = useState(360);
  const [pickerIds, setPickerIds] = useState<string[] | null>(null);
  const pins = useMemo(() => listings.flatMap(listing => listing.coordinates
    ? [{listing, coordinate: listing.coordinates}]
    : []), [listings]);
  const currentPin = pins.find(({listing}) => listing.id === preview?.id);
  const selected = preview?.closing ? undefined : currentPin;
  const latitude = selected?.coordinate.latitude;
  const longitude = selected?.coordinate.longitude;
  const measured = previewHeight > 0;
  const previewPadding = currentPin && previewHeight > 0 ? previewHeight + previewInset : 0;
  const closePreview = () => setPreview(value => value && !value.closing ? {...value, closing: true} : value);
  const selectedId = selected?.listing.id;
  const index = useMemo(() => buildPropertyClusters(listings.filter(listing => listing.id !== selectedId)),
    [listings, selectedId]);
  const points = useMemo(() => getPropertyClusters(index, region, mapWidth), [index, region, mapWidth]);
  const listingsById = useMemo(() => new Map(listings.map(listing => [listing.id, listing])), [listings]);
  const choices = useMemo(() => {
    const ids = new Set(pickerIds);
    return listings.filter(listing => ids.has(listing.id));
  }, [listings, pickerIds]);
  const notice = pins.length
    ? null
    : listings.length ? 'Locations aren’t available for these properties yet' : 'No properties found';

  useEffect(() => {
    if (pickerIds && choices.length === 0) setPickerIds(null);
  }, [pickerIds, choices.length]);

  useEffect(() => {
    if (!ready || !laidOut || !map.current) return;
    const coordinates = new Map(pins.map(({coordinate}) => [
      `${coordinate.latitude},${coordinate.longitude}`, coordinate,
    ]));
    const fit = [...coordinates.keys()].sort().join(';');
    if (lastFit.current === fit) return;
    lastFit.current = fit;
    const positions = [...coordinates.values()];
    if (positions.length > 1) {
      map.current.fitToCoordinates(positions, {
        edgePadding: {top: 72, right: 72, bottom: 72, left: 72},
        animated: true,
      });
    } else if (positions[0]) {
      map.current.animateCamera({center: positions[0], zoom: 16}, {duration: 250});
    }
  }, [pins, ready, laidOut]);

  useEffect(() => {
    if (preview && !currentPin) {
      slide.setValue(0);
      setPreview(null);
      setPreviewHeight(0);
    }
  }, [preview, currentPin, slide]);

  useEffect(() => {
    if (!preview || (!preview.closing && !measured)) return;
    const animation = Animated.timing(slide, {
      toValue: preview.closing ? 0 : 1,
      duration: preview.closing ? dismissDuration : previewDuration,
      easing: preview.closing ? Easing.in(Easing.cubic) : Easing.out(Easing.cubic),
      useNativeDriver: true,
      isInteraction: false,
    });
    animation.start(({finished}) => {
      if (finished && preview.closing) {
        setPreview(null);
        setPreviewHeight(0);
      }
    });
    return () => animation.stop();
  }, [preview, measured, slide]);

  useEffect(() => {
    if (!ready || latitude === undefined || longitude === undefined || !previewPadding) return;
    let cancelled = false;
    const mapView = map.current;
    if (!mapView) return;
    const coordinate = {latitude, longitude};
    const centerSelectedPin = async () => {
      let center = coordinate;
      try {
        const point = await mapView.pointForCoordinate(coordinate);
        // Offset the camera target so the pin sits above the preview without resizing the map.
        center = await mapView.coordinateForPoint({x: point.x, y: point.y + previewPadding / 2});
      } catch {
        // If native projection is unavailable, keep the selected location in view.
      }
      if (!cancelled) mapView.animateCamera({center}, {duration: 420});
    };
    void centerSelectedPin();
    return () => {cancelled = true;};
  }, [ready, latitude, longitude, previewPadding]);

  const selectListing = (id: string) => {
    setPickerIds(null);
    setPreview(value => value?.id === id && !value.closing ? value : {id, closing: false});
  };

  const openGroup = (point: PropertyMapPoint) => {
    closePreview();
    const properties = point.properties;
    if ('cluster_id' in properties) {
      const zoom = index.getClusterExpansionZoom(properties.cluster_id);
      if (zoom <= propertyClusterMaxZoom) {
        const [longitude, latitude] = point.geometry.coordinates;
        map.current?.animateCamera({center: {latitude: latitude!, longitude: longitude!}, zoom}, {duration: 420});
        return;
      }
      setPickerIds(index.getLeaves(properties.cluster_id, Infinity).flatMap(leaf => leaf.properties.listingIds));
    } else {
      setPickerIds(properties.listingIds);
    }
  };

  const renderPropertyPin = (listing: Listing, coordinate: LatLng, active: boolean) => {
    const Icon = buildingTypes.has(listing.type) ? Building : House;
    // Android snapshots marker artwork, so remount it when selection changes.
    return (
      <Marker key={`${listing.id}:${active ? 'selected' : 'default'}`} identifier={listing.id}
        coordinate={coordinate} accessibilityLabel={`Preview ${listing.name}`}
        onPress={() => selectListing(listing.id)} zIndex={active ? 2 : 0}
        anchor={{x: 0.5, y: 0.92}}>
        <View style={styles.marker}>
          <Svg width={40} height={44} viewBox="-2 -1 40 44" style={StyleSheet.absoluteFill}>
            <Path d={pinShape} fill="#000000" opacity={0.12} transform="translate(0 2)" />
            <Path d={pinShape} fill={active ? colors.primary : colors.card}
              stroke={active ? colors.primary : '#E1E3E6'} />
          </Svg>
          <Icon size={21} color={active ? colors.card : colors.text} strokeWidth={2.5} />
        </View>
      </Marker>
    );
  };

  return (
    <View style={styles.viewport}>
      <MapView
        ref={map}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={daetRegion}
        customMapStyle={propertyMapStyle}
        toolbarEnabled={false}
        moveOnMarkerPress={false}
        maxZoomLevel={propertyClusterMaxZoom}
        onPress={event => {
          if (event.nativeEvent.action !== 'marker-press') closePreview();
        }}
        onMapReady={() => setReady(true)}
        onLayout={event => {
          setLaidOut(true);
          setMapWidth(event.nativeEvent.layout.width);
        }}
        onRegionChangeComplete={setRegion}
      >
        {points.map(point => {
          const properties = point.properties;
          const coordinate = {
            latitude: point.geometry.coordinates[1]!, longitude: point.geometry.coordinates[0]!,
          };
          if ('listingIds' in properties && properties.count === 1) {
            const listing = listingsById.get(properties.listingIds[0]!);
            return listing ? renderPropertyPin(listing, coordinate, false) : null;
          }
          const key = 'cluster_id' in properties
            ? `cluster:${properties.cluster_id}` : `location:${properties.listingIds[0]}`;
          return (
            <Marker key={`${key}:${properties.count}`} identifier={key} coordinate={coordinate}
              accessibilityLabel={`Show ${properties.count} properties`}
              onPress={() => openGroup(point)} anchor={{x: 0.5, y: 0.5}} zIndex={1}>
              <View style={styles.cluster}>
                <Text style={styles.clusterCount} numberOfLines={1} adjustsFontSizeToFit>
                  {properties.count}
                </Text>
              </View>
            </Marker>
          );
        })}
        {selected && renderPropertyPin(selected.listing, selected.coordinate, true)}
      </MapView>
      {pickerIds && choices.length > 0 && (
        <PropertyClusterSheet listings={choices} onSelect={selectListing} onClose={() => setPickerIds(null)} />
      )}
      {currentPin && (
        <Animated.ScrollView ref={previewScroll} style={[styles.preview, {
          opacity: previewHeight ? 1 : 0,
          transform: [{translateY: slide.interpolate({
            inputRange: [0, 1], outputRange: [previewHeight + previewInset, 0],
          })}],
        }]} showsVerticalScrollIndicator={false}
          pointerEvents={preview?.closing ? 'none' : 'auto'}
          importantForAccessibility={preview?.closing ? 'no-hide-descendants' : 'auto'}
          onLayout={event => setPreviewHeight(event.nativeEvent.layout.height)}>
          <PropertyCard listing={currentPin.listing} onClose={closePreview}
            onOpen={onOpenListing ? () => {
              const nativeView = previewScroll.current?.getNativeScrollRef?.();
              if (nativeView) {
                nativeView.measureInWindow((_, y) => onOpenListing(currentPin.listing.id, y));
              } else {
                onOpenListing(currentPin.listing.id);
              }
            } : undefined} />
        </Animated.ScrollView>
      )}
      {!currentPin && notice && (
        <View pointerEvents="none" style={styles.notice}>
          <Text accessibilityLiveRegion="polite" style={styles.noticeText}>
            {notice}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {flex: 1, backgroundColor: colors.chip, overflow: 'hidden'},
  marker: {width: 40, height: 44, alignItems: 'center', paddingTop: 9},
  cluster: {width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primary,
    borderWidth: 4, borderColor: colors.card, alignItems: 'center', justifyContent: 'center', elevation: 3},
  clusterCount: {fontFamily: fonts.medium, fontSize: 16, lineHeight: 22, color: colors.card,
    includeFontPadding: false, textAlign: 'center', paddingHorizontal: 2},
  preview: {position: 'absolute', left: 16, right: 16, bottom: previewInset, maxHeight: '76%', borderRadius: 16, elevation: 2},
  notice: {
    position: 'absolute', left: 16, right: 16, bottom: 30, padding: 12,
    borderRadius: 12, backgroundColor: colors.card, elevation: 2,
  },
  noticeText: {textAlign: 'center', color: colors.text, fontFamily: fonts.regular, fontSize: 14},
});
