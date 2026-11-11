import {useMemo, useState, type ReactNode} from 'react';
import {
  Alert, Animated, KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet,
  Text, TextInput, View,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import type {Listing} from './listings';
import {PropertyPriceSlider} from './PropertyPriceSlider';
import {
  amenities, defaultFilters, defaultMarket, filterListings, locations, markets, propertyTypes,
  type Filters, type FilterSection,
} from './property-filters';
import {propertyTheme} from './styles';

const {colors, fonts} = propertyTheme;
const AnimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);
const sectionTitles = {
  all: 'Filter',
  market: 'Listing Type',
  type: 'Property Type',
  price: 'Price',
  amenities: 'Amenities',
  location: 'Location',
} satisfies Record<SheetProps['section'], string>;

const sectionDefaults: Record<FilterSection, Partial<Filters>> = {
  market: {market: defaultFilters.market},
  type: {type: defaultFilters.type},
  price: {minimum: defaultFilters.minimum, maximum: defaultFilters.maximum},
  amenities: {amenities: defaultFilters.amenities},
  location: {location: defaultFilters.location},
};

function Option({label, selected, onPress}: {label: string; selected: boolean; onPress: () => void}) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{selected}} onPress={onPress}
      style={[styles.option, selected && styles.selected]}>
      <Text style={[styles.optionText, selected && styles.selectedText]}>{label}</Text>
    </Pressable>
  );
}

type SheetProps = {
  listings: readonly Listing[];
  filters: Filters;
  section: FilterSection | 'all';
  search: string;
  onClose: () => void;
  onApply: (filters: Filters) => void;
};

export function PropertyFilterSheet({listings, filters, section, search, onClose, onApply}: SheetProps) {
  const {top} = useSafeAreaInsets();
  const [draft, setDraft] = useState(filters);
  const [showLocations, setShowLocations] = useState(filters.location === 'Bibirao');
  const matches = filterListings(listings, draft, search);
  const selectedMarket = draft.market ?? defaultMarket;
  const [dragOffset] = useState(() => new Animated.Value(0));
  const drag = useMemo(() => {
    const reset = () => {
      Animated.timing(dragOffset, {toValue: 0, duration: 150, useNativeDriver: true}).start();
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => dragOffset.stopAnimation(),
      onPanResponderMove: (_, {dy}) => dragOffset.setValue(Math.max(0, dy)),
      onPanResponderRelease: (_, {dx, dy, vy}) => {
        const movedDown = dy > Math.abs(dx);
        if (movedDown && (dy >= 72 || (dy >= 24 && vy > 0.8))) onClose();
        else reset();
      },
      onPanResponderTerminate: reset,
    });
  }, [dragOffset, onClose]);

  const update = <Key extends keyof Filters,>(key: Key, value: Filters[Key]) => {
    setDraft(current => ({...current, [key]: value}));
  };

  const apply = () => {
    if (!matches) {
      Alert.alert('Check the price range', 'Enter valid amounts in pesos and make sure the maximum is at least the minimum.');
      return;
    }
    onApply(draft);
  };

  const showSection = (key: FilterSection) => section === 'all' || section === key;
  const reset = () => setDraft(current => section === 'all' ? defaultFilters : {...current, ...sectionDefaults[section]});
  const renderSection = (key: Exclude<FilterSection, 'market'>, children: ReactNode) => showSection(key) && (
    <View style={styles.section}>
      {section === 'all' && (
        <Text accessibilityRole="header" style={styles.sectionTitle}>{sectionTitles[key]}</Text>
      )}
      {children}
    </View>
  );

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}
      testID="property-filter-sheet">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.overlay, {paddingTop: top}]} accessibilityViewIsModal onAccessibilityEscape={onClose}>
        <Pressable style={styles.backdrop} onPress={onClose}
          accessibilityRole="button" accessibilityLabel="Dismiss filters" />
        <AnimatedSafeAreaView edges={['bottom', 'left', 'right']}
          style={[styles.sheet, {transform: [{translateY: dragOffset}]}]}>
          <View collapsable={false} style={styles.heading} {...drag.panHandlers}>
            <View style={styles.handle} />
            <Text accessibilityRole="header" style={styles.sectionTitle}>{sectionTitles[section]}</Text>
          </View>
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled" testID="property-filter-body">
            {showSection('market') && <View style={styles.market}>
              {markets.map(market => (
                <Pressable key={market} accessibilityRole="button" accessibilityState={{selected: selectedMarket === market}}
                  style={[styles.marketOption, selectedMarket === market && styles.selected]} onPress={() => update('market', market)}>
                  <Text style={[styles.marketText, selectedMarket === market && styles.selectedText]}>{market}</Text>
                </Pressable>
              ))}
            </View>}
            {renderSection('type',
              <View style={styles.options}>
                {propertyTypes.map(type => <Option key={type} label={type} selected={draft.type === type} onPress={() => update('type', type)} />)}
              </View>,
            )}
            {renderSection('price',
              <>
                <PropertyPriceSlider minimum={draft.minimum} maximum={draft.maximum} onChange={update} />
                <View style={styles.priceRow}>
                  {(['minimum', 'maximum'] as const).map((key, index) => {
                    const label = index === 0 ? 'Minimum' : 'Maximum';
                    return (
                      <View key={key} style={styles.priceField}>
                        <Text style={styles.priceLabel}>{label}</Text>
                        <View style={styles.priceInput}>
                          <TextInput accessibilityLabel={label} value={draft[key]} onChangeText={value => update(key, value)}
                            placeholder={index === 0 ? 'No minimum' : 'No maximum'} placeholderTextColor={colors.chipText}
                            inputMode="numeric" maxLength={20} style={styles.input} />
                          <Text style={styles.currency} importantForAccessibility="no">₱</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>,
            )}
            {renderSection('amenities',
              <View style={styles.options}>
                {amenities.map(amenity => {
                  const selected = draft.amenities.includes(amenity);
                  return <Option key={amenity} label={amenity} selected={selected} onPress={() => update(
                    'amenities', selected ? draft.amenities.filter(value => value !== amenity) : [...draft.amenities, amenity],
                  )} />;
                })}
              </View>,
            )}
            {renderSection('location',
              <>
                <View style={styles.options}>
                  {(showLocations ? locations : locations.slice(0, -1)).map(location => (
                    <Option key={location} label={location} selected={draft.location === location}
                      onPress={() => update('location', location)} />
                  ))}
                </View>
                {!showLocations && (
                  <Pressable accessibilityRole="button" onPress={() => setShowLocations(true)} style={styles.more}>
                    <Text style={styles.moreText}>See more</Text>
                  </Pressable>
                )}
              </>,
            )}
          </ScrollView>
          <View style={styles.footer}>
            <Pressable accessibilityRole="button" onPress={reset}
              style={[styles.action, styles.reset]}>
              <Text style={[styles.actionText, styles.optionText]}>Reset</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={apply} style={[styles.action, styles.apply]}>
              <Text style={styles.actionText}>{matches ? `Show ${matches.length} ${matches.length === 1 ? 'result' : 'results'}` : 'Show results'}</Text>
            </Pressable>
          </View>
        </AnimatedSafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay},
  backdrop: {flex: 1},
  sheet: {maxHeight: '92%', backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24},
  heading: {alignItems: 'center', gap: 12, paddingTop: 16, paddingBottom: 16},
  handle: {width: 32, height: 4, borderRadius: 2, backgroundColor: colors.chip},
  body: {flexShrink: 1},
  bodyContent: {paddingHorizontal: 16, paddingBottom: 24, gap: 22},
  section: {gap: 10},
  sectionTitle: {fontFamily: fonts.medium, fontSize: 20, lineHeight: 28, color: colors.text},
  market: {flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 4},
  marketOption: {flex: 1, minHeight: 40, padding: 6, borderRadius: 12, justifyContent: 'center', alignItems: 'center'},
  marketText: {fontFamily: fonts.regular, fontSize: 14, color: colors.text, textAlign: 'center'},
  options: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  option: {minHeight: 32, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, backgroundColor: colors.chip, justifyContent: 'center'},
  optionText: {fontFamily: fonts.regular, fontSize: 12, color: colors.chipText},
  selected: {backgroundColor: colors.tile},
  selectedText: {color: '#278035'},
  priceRow: {flexDirection: 'row', gap: 16},
  priceField: {flex: 1, minWidth: 0, gap: 4},
  priceLabel: {fontFamily: fonts.regular, fontSize: 14, color: colors.text},
  priceInput: {minHeight: 54, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 4},
  input: {flex: 1, minWidth: 0, fontFamily: fonts.regular, fontSize: 14, color: colors.text},
  currency: {borderLeftWidth: StyleSheet.hairlineWidth, borderColor: colors.border, paddingLeft: 8, fontFamily: fonts.regular, fontSize: 14, color: colors.chipText},
  more: {alignSelf: 'flex-start', paddingVertical: 4},
  moreText: {fontFamily: fonts.regular, fontSize: 12, color: colors.secondary, textDecorationLine: 'underline'},
  footer: {flexDirection: 'row', gap: 16, padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border},
  action: {flex: 1, minHeight: 48, padding: 8, borderRadius: 12, justifyContent: 'center', alignItems: 'center'},
  reset: {backgroundColor: colors.chip},
  apply: {backgroundColor: colors.yellow},
  actionText: {fontFamily: fonts.regular, fontSize: 14, color: colors.text, textAlign: 'center'},
});
