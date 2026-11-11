import {useRef, useState} from 'react';
import {PanResponder, StyleSheet, Text, View} from 'react-native';
import {formatPrice, priceBound, type Filters} from './property-filters';
import {propertyTheme} from './styles';

type Bound = 'minimum' | 'maximum';
type Props = Pick<Filters, Bound> & {onChange: (bound: Bound, value: string) => void};

const {colors, fonts} = propertyTheme;
const step = 50_000;
const baseCeiling = 5_000_000;
// Decorative profile based on the price-slider reference.
const barHeights = [
  4, 7, 4, 9, 6, 12, 8, 11, 18, 13, 9, 7, 12, 8, 16, 11,
  6, 12, 8, 16, 7, 6, 18, 20, 16, 19, 12, 12, 15, 10, 13, 8,
  15, 17, 5, 18, 11, 14, 11, 19, 10, 16, 11, 10, 18, 7, 15, 12,
  35, 24, 17, 29, 7, 13, 32, 22, 25, 30, 17, 35, 25, 15, 25, 27,
];
const thumbInset = 24;
const labelWidth = 106;
const compactPeso = new Intl.NumberFormat('en-PH', {notation: 'compact', maximumFractionDigits: 2});
const labelPrice = (value: number) => value < 1_000_000 ? formatPrice(value) : `₱${compactPeso.format(value)}`;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function PropertyPriceSlider({minimum, maximum, onChange}: Props) {
  const [width, setWidth] = useState(0);
  const [dragCeiling, setDragCeiling] = useState<number | null>(null);
  const typedMinimum = priceBound(minimum, 0);
  const typedMaximum = priceBound(maximum, baseCeiling);
  const ceiling = dragCeiling ?? Math.max(baseCeiling, typedMinimum || 0, typedMaximum || 0);
  const lower = clamp(typedMinimum || 0, 0, ceiling);
  const maximumValue = priceBound(maximum, ceiling);
  const upper = Number.isNaN(maximumValue) ? ceiling : clamp(maximumValue, 0, ceiling);
  const trackWidth = Math.max(1, width - thumbInset * 2);
  const position = (amount: number) => thumbInset + amount / ceiling * trackWidth;
  const lowerX = position(lower);
  const upperX = position(upper);

  const live = useRef({lower, upper, ceiling, trackWidth, lowerX, upperX, onChange});
  live.current = {lower, upper, ceiling, trackWidth, lowerX, upperX, onChange};
  const gesture = useRef<{startX: number; bound: Bound; tied: boolean} | null>(null);
  const [pan] = useState(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: event => {
      const {locationX} = event.nativeEvent;
      const range = live.current;
      const bound = Math.abs(locationX - range.lowerX) <= Math.abs(locationX - range.upperX) ? 'minimum' : 'maximum';
      gesture.current = {startX: locationX, bound, tied: Math.abs(range.lowerX - range.upperX) < 1};
      setDragCeiling(range.ceiling);
    },
    onPanResponderMove: (_, {dx}) => {
      const movement = gesture.current;
      if (!movement || Math.abs(dx) < 2) return;
      const range = live.current;
      if (movement.tied) {
        movement.bound = dx < 0 ? 'minimum' : 'maximum';
        movement.tied = false;
      }
      const raw = clamp((movement.startX + dx - thumbInset) / range.trackWidth, 0, 1) * range.ceiling;
      const snapped = raw === range.ceiling ? raw : Math.round(raw / step) * step;
      const value = movement.bound === 'minimum'
        ? clamp(snapped, 0, range.upper)
        : clamp(snapped, range.lower, range.ceiling);
      range.onChange(movement.bound, String(value));
    },
    onPanResponderRelease: () => {
      gesture.current = null;
      setDragCeiling(null);
    },
    onPanResponderTerminate: () => {
      gesture.current = null;
      setDragCeiling(null);
    },
  }));

  const labelsFit = upperX - lowerX >= labelWidth;
  const leftLabel = labelsFit ? clamp(lowerX - labelWidth / 2, 0, Math.max(0, width - labelWidth)) : 0;
  const rightLabel = labelsFit ? clamp(upperX - labelWidth / 2, 0, Math.max(0, width - labelWidth)) : Math.max(0, width - labelWidth);

  return (
    <View style={styles.slider} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
      <View style={styles.labels} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {width > 0 && ([[lower, leftLabel], [upper, rightLabel]] as const).map(([value, left], index) => {
          const atLeftEdge = left === 0;
          const atRightEdge = left === width - labelWidth;
          const alignItems = atLeftEdge ? 'flex-start' : atRightEdge ? 'flex-end' : 'center';
          return (
            <View key={index} style={[styles.label, {left, alignItems}]}>
              <Text numberOfLines={1} style={styles.labelText}>{labelPrice(value)}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.chart} pointerEvents="none" importantForAccessibility="no-hide-descendants">
        {barHeights.map((height, index) => {
          const price = (index + 0.5) / barHeights.length * ceiling;
          const inRange = price >= lower && price <= upper;
          return <View key={index} style={[styles.bar, {height, opacity: inRange ? 0.42 : 0.12}]} />;
        })}
      </View>
      <View style={styles.trackArea}>
        <View pointerEvents="none" style={styles.track}>
          <View style={[styles.activeTrack, {left: lowerX - thumbInset, width: Math.max(0, upperX - lowerX)}]} />
        </View>
        {(['minimum', 'maximum'] as const).map(bound => {
          const isMinimum = bound === 'minimum';
          const value = isMinimum ? lower : upper;
          const min = isMinimum ? 0 : lower;
          const max = isMinimum ? upper : ceiling;
          return (
            <View key={bound} accessible accessibilityRole="adjustable"
              accessibilityLabel={isMinimum ? 'Minimum price slider' : 'Maximum price slider'}
              accessibilityValue={{text: formatPrice(value)}}
              accessibilityActions={[{name: 'increment'}, {name: 'decrement'}]}
              onAccessibilityAction={event => {
                const direction = event.nativeEvent.actionName === 'increment' ? 1 : -1;
                onChange(bound, String(clamp(value + direction * step, min, max)));
              }}
              style={[styles.thumbTarget, {left: position(value) - 22}]}>
              <View style={styles.thumb} />
            </View>
          );
        })}
        <View collapsable={false} style={StyleSheet.absoluteFill} importantForAccessibility="no" {...pan.panHandlers} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slider: {marginBottom: 2},
  labels: {minHeight: 30, justifyContent: 'center'},
  label: {position: 'absolute', width: labelWidth},
  labelText: {
    backgroundColor: '#205B50', color: colors.card, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6, fontFamily: fonts.medium, fontSize: 12,
  },
  chart: {height: 35, paddingHorizontal: thumbInset, flexDirection: 'row', alignItems: 'flex-end', gap: 2},
  bar: {flex: 1, backgroundColor: colors.primary},
  trackArea: {height: 44, marginTop: -20, justifyContent: 'center'},
  track: {height: 4, marginHorizontal: thumbInset, borderRadius: 2, backgroundColor: colors.chip},
  activeTrack: {position: 'absolute', height: 4, borderRadius: 2, backgroundColor: colors.primary},
  thumbTarget: {position: 'absolute', width: 44, height: 44, justifyContent: 'center', alignItems: 'center'},
  thumb: {width: 20, height: 20, borderRadius: 10, borderWidth: 3, borderColor: colors.primary, backgroundColor: colors.card},
});
