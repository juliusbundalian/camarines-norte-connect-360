import {useState} from 'react';
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import {Image} from 'expo-image';
import {SafeAreaView} from 'react-native-safe-area-context';
import {StatusBar} from 'expo-status-bar';
import Images from 'lucide-react-native/icons/images';
import X from 'lucide-react-native/icons/x';
import type {Listing} from './listings';
import {propertyTheme} from './styles';

const {colors, fonts} = propertyTheme;

export function PropertyDetailsGallery({listing, height, reduceMotion}: {
  listing: Listing; height: number; reduceMotion: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel="View property photo"
        onPress={() => setExpanded(true)} style={[styles.hero, {height}]}>
        <Image source={listing.photo} contentFit="cover" cachePolicy="memory-disk"
          style={StyleSheet.absoluteFill} onError={() => setFailed(true)} />
        {failed && <Text style={styles.error}>Photo unavailable</Text>}
        <View style={styles.counter}>
          <Images size={16} color={colors.card} />
          <Text style={styles.count}>1/1</Text>
        </View>
      </Pressable>
      {expanded && (
        <Modal visible animationType={reduceMotion ? 'none' : 'fade'} onRequestClose={() => setExpanded(false)}
          testID="property-photo-viewer">
          <SafeAreaView style={styles.viewer}>
            <StatusBar style="light" />
            <Pressable accessibilityRole="button" accessibilityLabel="Close property photo"
              onPress={() => setExpanded(false)} style={styles.close}>
              <X size={24} color={colors.card} />
            </Pressable>
            <Image source={listing.photo} contentFit="contain" style={styles.fullPhoto}
              accessibilityLabel={listing.name} />
          </SafeAreaView>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  hero: {backgroundColor: colors.chip, justifyContent: 'center', alignItems: 'center'},
  counter: {position: 'absolute', bottom: 24, right: 16, flexDirection: 'row', gap: 4,
    alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.overlay},
  count: {fontFamily: fonts.regular, fontSize: 12, color: colors.card},
  error: {fontFamily: fonts.regular, color: colors.secondary},
  viewer: {flex: 1, backgroundColor: '#15191D'},
  close: {width: 48, height: 48, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end', margin: 8},
  fullPhoto: {flex: 1, width: '100%'},
});
