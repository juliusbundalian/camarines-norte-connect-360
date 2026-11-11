import {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, BackHandler, FlatList, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {router, useFocusEffect} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import ArrowUpDown from 'lucide-react-native/icons/arrow-up-down';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
import List from 'lucide-react-native/icons/list';
import MapPinned from 'lucide-react-native/icons/map-pinned';
import Search from 'lucide-react-native/icons/search';
import SlidersHorizontal from 'lucide-react-native/icons/sliders-horizontal';
import {PropertyCard} from './PropertyCard';
import {stageMapListing} from './map-listing-handoff';
import {PropertyFilterSheet} from './PropertyFilterSheet';
import {PropertyMap, propertyMapEnabled} from './PropertyMap';
import {loadPublishedListings} from '../../services/firebase/property-listings-service';
import type {Listing} from './listings';
import {activeSections, defaultFilters, defaultMarket, filterListings, type FilterSection, type Filters} from './property-filters';
import {propertyTheme} from './styles';

const {colors, fonts} = propertyTheme;
const searchLabel = 'Search by area or building';

type Catalog =
  | {status: 'loading' | 'error'}
  | {status: 'ready'; listings: Listing[]};

export function PropertiesScreen() {
  const [catalog, setCatalog] = useState<Catalog>({status: 'loading'});
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    loadPublishedListings().then(
      listings => {
        if (current) setCatalog({status: 'ready', listings});
      },
      () => {
        if (current) setCatalog({status: 'error'});
      },
    );
    return () => {current = false;};
  }, [attempt]);

  const ready = catalog.status === 'ready';
  const listings = ready ? catalog.listings : [];
  const retry = () => {
    setCatalog({status: 'loading'});
    setAttempt(value => value + 1);
  };

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [sheet, setSheet] = useState<FilterSection | 'all' | null>(null);
  const [showMap, setShowMap] = useState(false);
  const list = useRef<FlatList<Listing>>(null);

  useFocusEffect(useCallback(() => {
    if (!showMap) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setShowMap(false);
      return true;
    });
    return () => subscription.remove();
  }, [showMap]));

  const results = filterListings(listings, filters, search) ?? [];
  const openListing = (id: string, cardTop?: number) => {
    const listing = cardTop === undefined ? undefined : results.find(item => item.id === id);
    if (listing) stageMapListing(listing);
    router.push({
      pathname: '/property/[id]',
      params: cardTop === undefined ? {id} : {id, mapCardTop: String(cardTop)},
    });
  };
  const active = activeSections(filters);
  const hasFilters = Object.values(active).some(Boolean);
  const chips: readonly [FilterSection, string][] = [
    ['market', filters.market ?? defaultMarket], ['type', 'Property Type'], ['price', 'Price'],
    ['amenities', 'Amenities'], ['location', 'Location'],
  ];
  const openSheet = (section: FilterSection | 'all') => {
    Keyboard.dismiss();
    setSheet(section);
  };
  const updateFilters = (next: Filters) => {
    list.current?.scrollToOffset({offset: 0, animated: false});
    setFilters(next);
    setSheet(null);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <View style={styles.search}>
            <Search size={20} color={colors.secondary} />
            <TextInput accessibilityLabel={searchLabel} placeholder="Search properties in Daet..." placeholderTextColor={colors.muted}
              value={search} onChangeText={value => {
                list.current?.scrollToOffset({offset: 0, animated: false});
                setSearch(value);
              }} returnKeyType="search" style={styles.searchInput} />
          </View>
          {propertyMapEnabled ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showMap ? 'Show property list' : 'Show property map'}
              disabled={!ready}
              onPress={() => {
                Keyboard.dismiss();
                setShowMap(value => !value);
              }}
              style={styles.map}
            >
              {showMap ? <List size={22} color={colors.yellow} /> : <MapPinned size={22} color={colors.yellow} />}
            </Pressable>
          ) : (
            <View style={styles.map} importantForAccessibility="no-hide-descendants">
              <MapPinned size={22} color={colors.yellow} />
            </View>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled"
          style={styles.chipStrip} contentContainerStyle={styles.chips} testID="property-filter-chips">
          <Pressable disabled={!ready} accessibilityRole="button" accessibilityLabel="Filter properties" accessibilityState={{selected: hasFilters}}
            style={[styles.chip, hasFilters && styles.activeChip]} onPress={() => openSheet('all')}>
            <SlidersHorizontal size={16} color={hasFilters ? colors.primary : colors.chipText} />
            {hasFilters && <View style={styles.dot} />}
          </Pressable>
          {chips.map(([section, label]) => {
            const selected = active[section];
            return (
              <Pressable key={section} disabled={!ready} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{selected}}
                accessibilityValue={section === 'amenities' && selected ? {text: `${filters.amenities.length} selected`} : undefined}
                style={[styles.chip, selected && styles.activeChip]} onPress={() => openSheet(section)}>
                <Text style={[styles.chipText, selected && styles.activeText]}>{label}</Text>
                <ChevronDown size={14} color={selected ? colors.primary : colors.chipText} />
                {section === 'amenities' && selected && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{filters.amenities.length}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
          {hasFilters && (
            <Pressable accessibilityRole="button" style={styles.clear} onPress={() => updateFilters(defaultFilters)}>
              <Text style={styles.clearText}>Clear All</Text>
            </Pressable>
          )}
        </ScrollView>
      </View>
      {showMap ? (
        <PropertyMap listings={results} onOpenListing={openListing} />
      ) : (
        <>
          <View style={styles.toolbar}>
            <Text style={styles.toolbarText} accessibilityLiveRegion="polite">{ready ? `${results.length} ${results.length === 1 ? 'property' : 'properties'}` : ''}</Text>
            <View style={styles.recommended}>
              <ArrowUpDown size={16} color={colors.secondary} />
              <Text style={styles.toolbarText}>Recommended</Text>
            </View>
          </View>
          <FlatList ref={list} data={results} keyExtractor={item => item.id} style={styles.list}
            contentContainerStyle={styles.cards} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled"
            testID="property-list" renderItem={({item}) => <PropertyCard listing={item} onOpen={() => openListing(item.id)} />}
            ListEmptyComponent={
              catalog.status === 'loading' ? (
                <View style={styles.catalogMessage}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.messageText} accessibilityLiveRegion="polite">Loading properties…</Text>
                </View>
              ) : catalog.status === 'error' ? (
                <View style={styles.catalogMessage}>
                  <Text style={styles.messageText} accessibilityLiveRegion="polite">Could not load properties</Text>
                  <Pressable accessibilityRole="button" style={styles.retry} onPress={retry}>
                    <Text style={styles.activeText}>Retry</Text>
                  </Pressable>
                </View>
              ) : <Text style={styles.empty}>No properties found</Text>
            } />
        </>
      )}
      {sheet && <PropertyFilterSheet listings={listings} filters={filters} section={sheet} search={search} onClose={() => setSheet(null)} onApply={updateFilters} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.card},
  header: {backgroundColor: colors.card},
  searchRow: {flexDirection: 'row', gap: 4, paddingHorizontal: 16, paddingTop: 8},
  search: {flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, borderRadius: 24, backgroundColor: colors.background},
  searchInput: {flex: 1, minWidth: 0, paddingVertical: 8, color: colors.text, fontFamily: fonts.regular, fontSize: 14},
  map: {width: 48, minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lightYellow},
  chipStrip: {flexGrow: 0},
  chips: {paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16, gap: 12, alignItems: 'center'},
  chip: {minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 5, paddingHorizontal: 12, borderRadius: 12, backgroundColor: colors.chip},
  chipText: {fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.chipText},
  activeChip: {backgroundColor: colors.tile},
  activeText: {color: '#278035'},
  dot: {width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary},
  badge: {
    minWidth: 20, minHeight: 20, paddingHorizontal: 5, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary,
  },
  badgeText: {color: colors.card, fontFamily: fonts.medium, fontSize: 12, includeFontPadding: false},
  clear: {minHeight: 32, justifyContent: 'center'},
  clearText: {fontFamily: fonts.medium, fontSize: 14, color: colors.text},
  toolbar: {
    paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', flexWrap: 'wrap', columnGap: 16, rowGap: 8, backgroundColor: colors.background,
  },
  toolbarText: {fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, letterSpacing: 0.4, includeFontPadding: false, color: colors.secondary},
  recommended: {flexDirection: 'row', alignItems: 'center', gap: 8},
  list: {flex: 1, backgroundColor: colors.background},
  cards: {gap: 16, paddingHorizontal: 16, paddingBottom: 16},
  catalogMessage: {alignItems: 'center', gap: 8, paddingVertical: 32},
  messageText: {color: colors.secondary, fontFamily: fonts.regular, fontSize: 16},
  retry: {minHeight: 44, paddingHorizontal: 16, justifyContent: 'center'},
  empty: {textAlign: 'center', marginVertical: 32, color: colors.secondary, fontFamily: fonts.regular, fontSize: 16},
});
