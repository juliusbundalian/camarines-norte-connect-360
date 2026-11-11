import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Image} from 'expo-image';
import Bath from 'lucide-react-native/icons/bath';
import BedDouble from 'lucide-react-native/icons/bed-double';
import CarFront from 'lucide-react-native/icons/car-front';
import Heart from 'lucide-react-native/icons/heart';
import Images from 'lucide-react-native/icons/images';
import MapPin from 'lucide-react-native/icons/map-pin';
import X from 'lucide-react-native/icons/x';
import type {Listing} from './listings';
import {formatPrice} from './property-filters';
import {propertyTheme} from './styles';

const {colors, fonts} = propertyTheme;

export function PropertyCard({listing, onClose, onOpen}: {
  listing: Listing; onClose?: () => void; onOpen?: () => void;
}) {
  const features = [
    listing.bedrooms && {label: `${listing.bedrooms} Bedrooms`, Icon: BedDouble},
    listing.bathrooms && {label: `${listing.bathrooms} Bathroom`, Icon: Bath},
    listing.amenities.includes('Car Port') && {label: '1 Car Port', Icon: CarFront},
  ];

  return (
    <View style={[styles.card, onClose && styles.mapCard]} testID={listing.id}>
      <View style={[styles.photoFrame, onClose && styles.mapPhotoFrame]}>
        <Pressable accessibilityRole={onOpen ? 'button' : undefined}
          accessibilityLabel={onOpen ? `Open ${listing.name}` : undefined}
          disabled={!onOpen} onPress={onOpen} style={StyleSheet.absoluteFill}>
          <Image source={listing.photo} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" />
          <View style={styles.typeBadge}>
            <Text style={styles.typeLabel}>{listing.type}</Text>
          </View>
          <View style={styles.photoCount}>
            <Images color={colors.card} size={13} />
            <Text style={styles.photoCountText}>{listing.photoCount} photos</Text>
          </View>
        </Pressable>
        <View pointerEvents="none" style={[styles.photoAction, onClose && styles.mapHeart]}
          importantForAccessibility="no-hide-descendants">
          <Heart color={colors.card} size={22} />
        </View>
        {onClose && (
          <Pressable accessibilityRole="button" accessibilityLabel="Close property preview"
            hitSlop={2} onPress={onClose} style={styles.photoAction}>
            <X color={colors.card} size={22} />
          </Pressable>
        )}
      </View>
      <Pressable accessibilityRole={onOpen ? 'button' : undefined}
        accessibilityLabel={onOpen ? `View ${listing.name} details` : undefined}
        disabled={!onOpen} onPress={onOpen} style={onClose ? styles.mapDetails : undefined}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{listing.name}</Text>
          <Text style={styles.price}>{formatPrice(listing.price)}</Text>
        </View>
        <View style={styles.detailRow}>
          <MapPin color={colors.secondary} size={16} />
          <Text style={styles.location}>{listing.area}</Text>
        </View>
        {onClose && listing.locationApproximate && (
          <Text style={styles.approximate}>Approximate location</Text>
        )}
        {features.some(Boolean) && (
          <View style={styles.features}>
            {features.map(feature => feature ? (
              <View key={feature.label} style={styles.feature}>
                <feature.Icon color={colors.chipText} size={14} />
                <Text style={styles.featureLabel}>{feature.label}</Text>
              </View>
            ) : null)}
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {padding: 12, borderRadius: 16, backgroundColor: colors.card, elevation: 1},
  mapCard: {padding: 0, elevation: 2},
  photoFrame: {aspectRatio: 356 / 200, borderRadius: 12, overflow: 'hidden'},
  mapPhotoFrame: {aspectRatio: 380 / 200, maxHeight: 200, borderRadius: 0, borderTopLeftRadius: 16, borderTopRightRadius: 16},
  mapDetails: {paddingHorizontal: 12, paddingBottom: 12},
  typeBadge: {position: 'absolute', top: 8, left: 8, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 8, backgroundColor: colors.primary},
  typeLabel: {color: colors.card, fontFamily: fonts.medium, fontSize: 11, lineHeight: 16, letterSpacing: 0.5, includeFontPadding: false},
  photoAction: {position: 'absolute', right: 8, top: 8, width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.overlay},
  mapHeart: {right: 56},
  photoCount: {position: 'absolute', right: 6, bottom: 6, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', gap: 4, alignItems: 'center', backgroundColor: colors.overlay},
  photoCountText: {color: colors.card, fontFamily: fonts.medium, fontSize: 10},
  titleRow: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', columnGap: 8, marginTop: 8},
  name: {color: colors.text, fontFamily: fonts.medium, fontSize: 16, lineHeight: 22},
  price: {color: colors.primary, fontFamily: fonts.medium, fontSize: 20, lineHeight: 26},
  detailRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  location: {flexShrink: 1, color: colors.secondary, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20},
  approximate: {color: colors.secondary, fontFamily: fonts.regular, fontSize: 11, marginTop: 2},
  features: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8},
  feature: {flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, backgroundColor: colors.chip},
  featureLabel: {color: colors.chipText, fontFamily: fonts.regular, fontSize: 11},
});
