import {useEffect, useRef} from 'react';
import {Animated, Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance} from 'react-native';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import Share2 from 'lucide-react-native/icons/share-2';
import Heart from 'lucide-react-native/icons/heart';
import {propertySections, type PropertySection} from './property-details-navigation';
import {propertyTheme} from './styles';

const {colors, fonts} = propertyTheme;

export function PropertyDetailsHeader({scrollY, top, heroHeight, onBack, onShare}: {
  scrollY: Animated.Value; top: number; heroHeight: number;
  onBack: () => void; onShare?: () => void;
}) {
  const end = Math.max(1, heroHeight - top - 64);
  const opacity = heroHeight ? scrollY.interpolate({
    inputRange: [Math.max(0, end - 40), end], outputRange: [0, 1], extrapolate: 'clamp',
  }) : 1;
  return (
    <View pointerEvents="box-none" style={[styles.header, {paddingTop: top}]}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.headerBackground, {opacity}]} />
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={styles.action}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <View style={styles.spacer} />
        {onShare && (
          <>
            <Pressable accessibilityRole="button" accessibilityLabel="Share property" onPress={onShare} style={styles.action}>
              <Share2 size={22} color={colors.text} />
            </Pressable>
            <View style={styles.action} importantForAccessibility="no-hide-descendants">
              <Heart size={22} color={colors.text} />
            </View>
          </>
        )}
      </View>
    </View>
  );
}

export function PropertySectionTabs({scrollY, anchorY, headerHeight, active, onSelect, onHeight, reduceMotion}: {
  scrollY: Animated.Value; anchorY: number; headerHeight: number; active: PropertySection;
  onSelect: (id: PropertySection) => void; onHeight: (height: number) => void;
  reduceMotion: boolean;
}) {
  const strip = useRef<ScrollViewInstance>(null);
  const tabPositions = useRef<Partial<Record<PropertySection, number>>>({});
  useEffect(() => {
    strip.current?.scrollTo({x: Math.max(0, (tabPositions.current[active] ?? 0) - 16), animated: !reduceMotion});
  }, [active, reduceMotion]);
  const distance = Math.max(0, anchorY - headerHeight);
  const translateY = scrollY.interpolate({
    inputRange: [0, Math.max(1, distance)], outputRange: [distance, 0], extrapolate: 'clamp',
  });
  return (
    <Animated.View pointerEvents={anchorY ? 'auto' : 'none'}
      style={[styles.tabs, {top: headerHeight, opacity: anchorY ? 1 : 0, transform: [{translateY}]}]}
      onLayout={event => onHeight(event.nativeEvent.layout.height)}>
      <ScrollView ref={strip} horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabContent}>
        {propertySections.map(section => (
          <Pressable key={section.id} accessibilityRole="tab" accessibilityLabel={section.label}
            accessibilityState={{selected: active === section.id}} onPress={() => onSelect(section.id)}
            onLayout={event => {tabPositions.current[section.id] = event.nativeEvent.layout.x;}}
            style={[styles.tab, active === section.id && styles.activeTab]}>
            <Text style={[styles.tabText, active === section.id && styles.activeText]}>{section.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3},
  headerBackground: {backgroundColor: colors.card},
  actions: {height: 64, paddingHorizontal: 12, flexDirection: 'row', gap: 4, alignItems: 'center'},
  action: {width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.card},
  spacer: {flex: 1},
  tabs: {position: 'absolute', left: 0, right: 0, zIndex: 2, backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border},
  tabContent: {paddingHorizontal: 8},
  tab: {minHeight: 52, paddingHorizontal: 12, paddingVertical: 14, borderBottomWidth: 3,
    borderBottomColor: 'transparent', justifyContent: 'center'},
  activeTab: {borderBottomColor: colors.primary},
  tabText: {fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.secondary},
  activeText: {color: colors.primary},
});
