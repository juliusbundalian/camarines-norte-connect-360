import {useState} from 'react';
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import Constants from 'expo-constants';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import {SafeAreaView} from 'react-native-safe-area-context';
import House from 'lucide-react-native/icons/house';
import MapPinned from 'lucide-react-native/icons/map-pinned';
import X from 'lucide-react-native/icons/x';
import type {PropertyDetailsLocationProps} from './PropertyDetailsLocation';
import {propertyTheme} from './styles';

const {colors, fonts} = propertyTheme;
const mapStyle = [
  {featureType: 'poi', elementType: 'labels', stylers: [{visibility: 'off'}]},
  {featureType: 'transit.station', elementType: 'labels', stylers: [{visibility: 'off'}]},
];

export function PropertyDetailsLocation({listing, reduceMotion}: PropertyDetailsLocationProps) {
  const [expanded, setExpanded] = useState(false);
  if (!listing.coordinates || Constants.expoConfig?.extra?.propertyMapEnabled !== true) {
    return <Text style={styles.address}>{listing.area}</Text>;
  }
  const coordinate = listing.coordinates;
  const region = {...coordinate, latitudeDelta: 0.005, longitudeDelta: 0.005};
  const marker = (
    <Marker coordinate={coordinate} anchor={{x: 0.5, y: 0.5}}>
      <View style={styles.pin}><House size={20} color={colors.card} /></View>
    </Marker>
  );
  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel="Expand property location"
        onPress={() => setExpanded(true)} style={styles.preview}>
        <MapView pointerEvents="none" provider={PROVIDER_GOOGLE} initialRegion={region}
          style={StyleSheet.absoluteFill} scrollEnabled={false} zoomEnabled={false}
          rotateEnabled={false} pitchEnabled={false} toolbarEnabled={false} customMapStyle={mapStyle}
          importantForAccessibility="no-hide-descendants">
          {marker}
        </MapView>
        <View style={styles.expand}><MapPinned size={22} color={colors.text} /></View>
      </Pressable>
      {expanded && (
        <Modal visible animationType={reduceMotion ? 'none' : 'slide'} onRequestClose={() => setExpanded(false)}>
          <SafeAreaView style={styles.fullscreen}>
            <View style={styles.heading}>
              <Text style={styles.name}>{listing.name}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close property location"
                onPress={() => setExpanded(false)} style={styles.close}>
                <X size={24} color={colors.text} />
              </Pressable>
            </View>
            <MapView provider={PROVIDER_GOOGLE} initialRegion={region} style={styles.map}
              toolbarEnabled={false} customMapStyle={mapStyle}>{marker}</MapView>
          </SafeAreaView>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  address: {fontFamily: fonts.regular, color: colors.secondary, fontSize: 14, lineHeight: 20},
  preview: {height: 200, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.chip},
  pin: {width: 36, height: 36, borderRadius: 10, borderWidth: 2, borderColor: colors.card,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center'},
  expand: {position: 'absolute', right: 8, bottom: 8, width: 44, height: 44, borderRadius: 12,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', elevation: 2},
  fullscreen: {flex: 1, backgroundColor: colors.card},
  heading: {paddingLeft: 16, paddingRight: 8, flexDirection: 'row', alignItems: 'center', minHeight: 64},
  name: {flex: 1, fontFamily: fonts.medium, color: colors.text, fontSize: 18},
  close: {width: 48, height: 48, alignItems: 'center', justifyContent: 'center'},
  map: {flex: 1},
});
