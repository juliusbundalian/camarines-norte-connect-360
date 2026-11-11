import {FlatList, Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import {Image} from 'expo-image';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import X from 'lucide-react-native/icons/x';
import type {Listing} from './listings';
import {formatPrice} from './property-filters';
import {propertyTheme} from './styles';

const {colors, fonts} = propertyTheme;

type Props = {
  listings: readonly Listing[];
  onSelect: (id: string) => void;
  onClose: () => void;
};

export function PropertyClusterSheet({listings, onSelect, onClose}: Props) {
  const {top} = useSafeAreaInsets();
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}
      testID="property-cluster-sheet">
      <View style={[styles.overlay, {paddingTop: top}]} accessibilityViewIsModal
        onAccessibilityEscape={onClose}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button"
          accessibilityLabel="Dismiss property choices" onPress={onClose} />
        <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.sheet}>
          <View style={styles.heading}>
            <View style={styles.headingText}>
              <Text accessibilityRole="header" style={styles.title}>Choose a property</Text>
              <Text style={styles.subtitle}>{listings.length} properties in this area</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close property choices"
              onPress={onClose} style={styles.close}>
              <X size={22} color={colors.text} />
            </Pressable>
          </View>
          <FlatList data={listings} keyExtractor={listing => listing.id}
            style={styles.list} contentContainerStyle={styles.content}
            renderItem={({item}) => (
              <Pressable accessibilityRole="button" accessibilityLabel={`Preview ${item.name}`}
                onPress={() => onSelect(item.id)} style={styles.row}>
                <Image source={item.photo} style={styles.photo} contentFit="cover" />
                <View style={styles.details}>
                  <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.price}>{formatPrice(item.price)}</Text>
                  <Text style={styles.subtitle} numberOfLines={2}>{item.area}</Text>
                </View>
              </Pressable>
            )} />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay},
  sheet: {maxHeight: '75%', backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24},
  heading: {flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12},
  headingText: {flex: 1},
  title: {fontFamily: fonts.medium, fontSize: 18, lineHeight: 26, color: colors.text},
  subtitle: {fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.secondary},
  close: {width: 48, height: 48, alignItems: 'center', justifyContent: 'center'},
  list: {flexGrow: 0},
  content: {paddingHorizontal: 16, paddingBottom: 16},
  row: {flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border},
  photo: {width: 72, height: 80, borderRadius: 10},
  details: {flex: 1, gap: 2},
  name: {fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.text},
  price: {fontFamily: fonts.medium, fontSize: 16, lineHeight: 22, color: colors.primary},
});
