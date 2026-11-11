import {useCallback, useEffect, useRef, useState} from 'react';
import {
  AccessibilityInfo, ActivityIndicator, Alert, Animated, BackHandler, Easing, Pressable, Share,
  StyleSheet, Text, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance,
} from 'react-native';
import {useFocusEffect, useRouter} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MapPin from 'lucide-react-native/icons/map-pin';
import {loadPublishedListing} from '../../services/firebase/property-listings-service';
import {PropertyDetailsGallery} from './PropertyDetailsGallery';
import {PropertyDetailsHeader, PropertySectionTabs} from './PropertyDetailsHeader';
import {PropertyDetailsSections} from './PropertyDetailsSections';
import {
  getActivePropertySection, getPropertySectionTarget, type PropertySection, type PropertySectionPositions,
} from './property-details-navigation';
import {formatPrice} from './property-filters';
import type {Listing} from './listings';
import {clearMapListing} from './map-listing-handoff';
import {propertyTheme} from './styles';

const {colors, fonts} = propertyTheme;
type DetailState = {status: 'loading' | 'error'} | {status: 'ready'; listing: Listing | null};

export function PropertyDetailsScreen({id, mapCardTop, initialListing}: {
  id: string; mapCardTop?: number; initialListing?: Listing;
}) {
  const router = useRouter();
  const {top, bottom, left, right} = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const heroHeight = Math.max(280, width * 320 / 412);
  const headerHeight = top + 64;
  const initial = useRef(initialListing);
  const [state, setState] = useState<DetailState>(() => initialListing?.id === id
    ? {status: 'ready', listing: initialListing} : {status: 'loading'});
  const [attempt, setAttempt] = useState(0);
  const [scrollY] = useState(() => new Animated.Value(0));
  const [expansion] = useState(() => new Animated.Value(mapCardTop === undefined ? 1 : 0));
  const closing = useRef(false);
  const [tabY, setTabY] = useState(0);
  const [tabHeight, setTabHeight] = useState(52);
  const [footerHeight, setFooterHeight] = useState(88 + bottom);
  const [active, setActive] = useState<PropertySection>('details');
  const [headerSolid, setHeaderSolid] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);
  const positions = useRef<PropertySectionPositions>({});
  const viewportHeight = useRef(0);
  const contentHeight = useRef(0);
  const offset = useRef(0);
  const requestedSection = useRef<PropertySection | null>(null);
  const listing = state.status === 'ready' ? state.listing : null;
  const dismiss = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.dismissTo('/properties');
  }, [router]);
  const loading = state.status === 'loading';
  const readyToExpand = !loading;
  const goBack = useCallback(() => {
    if (closing.current) return;
    if (mapCardTop === undefined || !readyToExpand || reduceMotion) {
      dismiss();
      return;
    }
    closing.current = true;
    Animated.timing(expansion, {toValue: 0, duration: 220, easing: Easing.in(Easing.cubic),
      useNativeDriver: true}).start(({finished}) => {
      if (finished) dismiss();
      else closing.current = false;
    });
  }, [dismiss, expansion, mapCardTop, readyToExpand, reduceMotion]);

  useEffect(() => {
    if (mapCardTop === undefined || !readyToExpand || closing.current) return;
    Animated.timing(expansion, {toValue: 1, duration: reduceMotion ? 0 : 360,
      easing: Easing.out(Easing.quad), useNativeDriver: true}).start();
  }, [expansion, mapCardTop, readyToExpand, reduceMotion]);
  useEffect(() => () => expansion.stopAnimation(), [expansion]);

  useFocusEffect(useCallback(() => {
    setFocused(true);
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => {setFocused(false); subscription.remove();};
  }, [goBack]));

  useEffect(() => {
    let current = true;
    const preview = attempt === 0 && initial.current?.id === id ? initial.current : undefined;
    if (preview) clearMapListing(preview);
    else setState({status: 'loading'});
    positions.current = {};
    requestedSection.current = null;
    offset.current = 0;
    scrollY.setValue(0);
    setTabY(0);
    setActive('details');
    loadPublishedListing(id).then(
      value => {if (current) setState({status: 'ready', listing: value});},
      () => {if (current && !preview) setState({status: 'error'});},
    );
    return () => {current = false;};
  }, [id, attempt, scrollY]);

  useEffect(() => {
    let current = true;
    Promise.resolve(AccessibilityInfo.isReduceMotionEnabled()).then(value => {
      if (current) setReduceMotion(Boolean(value));
    }).catch(() => {if (current) setReduceMotion(false);});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {current = false; subscription.remove();};
  }, []);

  const updateActive = () => {
    setActive(requestedSection.current ?? getActivePropertySection(
      offset.current, positions.current, headerHeight + tabHeight,
      Math.max(0, contentHeight.current - viewportHeight.current),
    ));
  };
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current = Math.max(0, event.nativeEvent.contentOffset.y);
    setHeaderSolid(offset.current >= heroHeight - headerHeight - 20);
    updateActive();
  };
  const selectSection = (section: PropertySection) => {
    const y = positions.current[section];
    if (y === undefined) return;
    const target = getPropertySectionTarget(y, headerHeight + tabHeight,
      contentHeight.current, viewportHeight.current);
    requestedSection.current = section;
    setActive(section);
    scroll.current?.scrollTo({y: target, animated: !reduceMotion});
  };
  const share = async () => {
    if (!listing) return;
    try {
      await Share.share({message: `${listing.name}\n${listing.area}\n${formatPrice(listing.price)}\nCamNorte 360`});
    } catch {
      Alert.alert('Could not share property', 'Please try again.');
    }
  };

  return (
    <Animated.View style={[styles.screen, {paddingLeft: left, paddingRight: right}, mapCardTop !== undefined && {
      opacity: expansion.interpolate({inputRange: [0, 0.18, 1], outputRange: [0, 1, 1]}),
      borderRadius: expansion.interpolate({inputRange: [0, 1], outputRange: [16, 0]}),
      transform: [
        {translateY: expansion.interpolate({inputRange: [0, 1],
          outputRange: [Math.max(0, Math.min(mapCardTop, height)), 0]})},
        {scaleX: expansion.interpolate({inputRange: [0, 1], outputRange: [Math.max(0.8, 1 - 32 / width), 1]})},
      ],
    }]}>
      {focused && <StatusBar style={listing && !headerSolid ? 'light' : 'dark'} />}
      {listing ? (
        <>
          <Animated.ScrollView ref={scroll} testID="property-details-scroll" scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{paddingBottom: footerHeight + 16}}
            onLayout={event => {viewportHeight.current = event.nativeEvent.layout.height; updateActive();}}
            onContentSizeChange={(_, height) => {contentHeight.current = height; updateActive();}}
            onScroll={Animated.event([{nativeEvent: {contentOffset: {y: scrollY}}}],
              {useNativeDriver: true, listener: onScroll})}
            onScrollBeginDrag={() => {requestedSection.current = null;}}
            onMomentumScrollEnd={updateActive}>
            <PropertyDetailsGallery listing={listing} height={heroHeight} reduceMotion={reduceMotion} />
            <View style={styles.summary}>
              <View style={styles.handle} />
              <View style={styles.badges}>
                <Text style={styles.typeBadge}>{listing.type}</Text>
                <Text style={styles.marketBadge}>{listing.market}</Text>
              </View>
              <View style={styles.titleRow}>
                <View style={styles.nameBlock}>
                  <Text accessibilityRole="header" style={styles.name}>{listing.name}</Text>
                  <View style={styles.address}>
                    <MapPin size={16} color={colors.primary} />
                    <Text style={styles.addressText}>{listing.area}</Text>
                  </View>
                </View>
                <View style={styles.priceBlock}>
                  <Text style={styles.price}>{formatPrice(listing.price)}</Text>
                  {listing.monthlyAmount !== undefined && (
                    <Text style={styles.addressText}>{formatPrice(listing.monthlyAmount)}/month</Text>
                  )}
                </View>
              </View>
            </View>
            <View testID="property-tabs-anchor" style={{height: tabHeight}} onLayout={event => setTabY(event.nativeEvent.layout.y)} />
            <PropertyDetailsSections listing={listing} reduceMotion={reduceMotion} onSectionLayout={(section, y) => {
              positions.current[section] = y;
              updateActive();
            }} />
          </Animated.ScrollView>
          <PropertySectionTabs scrollY={scrollY} anchorY={tabY} headerHeight={headerHeight}
            active={active} onSelect={selectSection} onHeight={setTabHeight} reduceMotion={reduceMotion} />
          <View style={[styles.footer, {paddingBottom: Math.max(bottom, 12)}]}
            onLayout={event => setFooterHeight(event.nativeEvent.layout.height)}>
            <Pressable disabled accessibilityRole="button" accessibilityLabel="Send Inquiry"
              style={[styles.deferredAction, styles.inquiry]}>
              <Text style={styles.inquiryText}>Send Inquiry</Text>
            </Pressable>
            <Pressable disabled accessibilityRole="button" accessibilityLabel="Book Viewing"
              style={[styles.deferredAction, styles.viewing]}>
              <Text style={styles.viewingText}>Book Viewing</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <View style={[styles.feedback, {paddingTop: headerHeight}]}>
          {state.status === 'loading' ? <ActivityIndicator color={colors.primary} accessibilityLabel="Loading property" /> : (
            <>
              <Text style={styles.feedbackTitle}>{state.status === 'error' ? 'Could not load property' : 'Property unavailable'}</Text>
              <Text style={styles.addressText}>{state.status === 'error'
                ? 'Check your connection and try again.' : 'This listing may no longer be available.'}</Text>
              {state.status === 'error' && (
                <Pressable accessibilityRole="button" onPress={() => setAttempt(value => value + 1)} style={styles.retry}>
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              )}
            </>
          )}
        </View>
      )}
      <PropertyDetailsHeader scrollY={scrollY} top={top} heroHeight={listing ? heroHeight : 0}
        onBack={goBack} onShare={listing ? share : undefined} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background, overflow: 'hidden'},
  summary: {backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    marginTop: -12, paddingHorizontal: 16, paddingBottom: 16, gap: 8},
  handle: {width: 32, height: 4, borderRadius: 2, backgroundColor: colors.chip, alignSelf: 'center', marginTop: 12, marginBottom: 16},
  badges: {flexDirection: 'row', gap: 8, flexWrap: 'wrap'},
  typeBadge: {fontFamily: fonts.regular, fontSize: 11, lineHeight: 16, color: colors.primary,
    backgroundColor: colors.tile, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, overflow: 'hidden'},
  marketBadge: {fontFamily: fonts.regular, fontSize: 11, lineHeight: 16, color: colors.yellow,
    backgroundColor: colors.lightYellow, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, overflow: 'hidden'},
  titleRow: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8},
  nameBlock: {flexShrink: 1, gap: 2},
  name: {fontFamily: fonts.medium, fontSize: 22, lineHeight: 30, color: colors.text, flexShrink: 1},
  priceBlock: {alignItems: 'flex-end'},
  price: {fontFamily: fonts.medium, fontSize: 24, lineHeight: 32, color: colors.primary},
  address: {flexDirection: 'row', gap: 4, alignItems: 'center'},
  addressText: {fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.secondary, flexShrink: 1},
  footer: {position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: 12, paddingHorizontal: 16,
    flexDirection: 'row', gap: 12, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.chip, zIndex: 4},
  deferredAction: {flex: 1, minHeight: 48, paddingHorizontal: 8, paddingVertical: 12, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', opacity: 0.4},
  inquiry: {backgroundColor: colors.lightYellow},
  viewing: {backgroundColor: colors.yellow},
  inquiryText: {fontFamily: fonts.medium, fontSize: 14, color: colors.yellow, textAlign: 'center'},
  viewingText: {fontFamily: fonts.medium, fontSize: 14, color: colors.text, textAlign: 'center'},
  feedback: {flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, gap: 12},
  feedbackTitle: {fontFamily: fonts.medium, fontSize: 20, color: colors.text},
  retry: {minHeight: 48, paddingHorizontal: 24, justifyContent: 'center', borderRadius: 12, backgroundColor: colors.primary},
  retryText: {fontFamily: fonts.medium, color: colors.card, fontSize: 14},
});
