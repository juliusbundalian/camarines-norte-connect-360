import {useState, type ReactNode} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import House from 'lucide-react-native/icons/house';
import BedDouble from 'lucide-react-native/icons/bed-double';
import Bath from 'lucide-react-native/icons/bath';
import Ruler from 'lucide-react-native/icons/ruler';
import LandPlot from 'lucide-react-native/icons/land-plot';
import Sofa from 'lucide-react-native/icons/sofa';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import CarFront from 'lucide-react-native/icons/car-front';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import Sprout from 'lucide-react-native/icons/sprout';
import Archive from 'lucide-react-native/icons/archive';
import DoorOpen from 'lucide-react-native/icons/door-open';
import Waves from 'lucide-react-native/icons/waves-horizontal';
import Fence from 'lucide-react-native/icons/fence';
import UserRound from 'lucide-react-native/icons/user-round';
import Building2 from 'lucide-react-native/icons/building';
import Check from 'lucide-react-native/icons/check';
import {PropertyDetailsLocation} from './PropertyDetailsLocation';
import type {Listing} from './listings';
import type {PropertySection} from './property-details-navigation';
import {propertyTheme} from './styles';

const {colors, fonts} = propertyTheme;

const amenityIcons: Record<string, typeof Check> = {
  'car port': CarFront,
  security: ShieldCheck,
  garden: Sprout,
  'built in cabinets': Archive,
  'walk-in closet': DoorOpen,
  'private pool': Waves,
  balcony: Fence,
  'fully furnished': Sofa,
  'partly furnished': Sofa,
};

export function PropertyDetailsSections({listing, onSectionLayout, reduceMotion}: {
  listing: Listing; onSectionLayout: (id: PropertySection, y: number) => void;
  reduceMotion: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = (listing.description?.length ?? 0) > 180;
  const furnishing = listing.furnishing ?? listing.amenities.find(value => /^(fully|partly) furnished$/i.test(value));
  const facts = [
    ['Property Type', House, listing.type],
    ['Bedrooms', BedDouble, listing.bedrooms],
    ['Bathrooms', Bath, listing.bathrooms],
    ['Floor Area', Ruler, listing.floorAreaSqm === undefined ? undefined : `${listing.floorAreaSqm} sqm`],
    ['Lot Area', LandPlot, listing.lotAreaSqm === undefined ? undefined : `${listing.lotAreaSqm} sqm`],
    ['Furnishing', Sofa, furnishing],
    ['Availability', CircleCheck, listing.availability],
    ['Subdivision', Building2, listing.subdivision?.name],
  ] as const;
  const section = (id: PropertySection, title: string, children: ReactNode) => (
    <View key={id} testID={`property-section-${id}`} style={styles.section}
      onLayout={event => onSectionLayout(id, event.nativeEvent.layout.y)}>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      {children}
    </View>
  );
  const sellerName = listing.agent?.name ?? listing.inquiryContact?.agentName ?? listing.seller?.displayName;
  return (
    <>
      {section('details', 'Property Details', (
        <View style={styles.facts}>
          {facts.map(([label, Icon, value]) => value !== undefined ? (
            <View key={label} style={styles.fact}>
              <Icon size={17} color={colors.secondary} />
              <Text style={styles.factLabel}>{label}</Text>
              <Text style={styles.factValue}>{value}</Text>
            </View>
          ) : null)}
        </View>
      ))}
      {section('description', 'Property Description', (
        <>
          <Text style={styles.body} numberOfLines={canExpand && !expanded ? 5 : undefined}>
            {listing.description ?? 'No description provided.'}
          </Text>
          {canExpand && (
            <Pressable accessibilityRole="button" onPress={() => setExpanded(value => !value)}
              accessibilityState={{expanded}} style={styles.readMore}>
              <Text style={styles.link}>{expanded ? 'Read less' : 'Read more'}</Text>
            </Pressable>
          )}
        </>
      ))}
      {section('amenities', 'Amenities', listing.amenities.length ? (
        <View style={styles.amenities}>
          {listing.amenities.map(amenity => {
            const Icon = amenityIcons[amenity.toLowerCase()] ?? Check;
            return (
              <View key={amenity} style={styles.amenity}>
                <Icon size={16} color={colors.primary} />
                <Text style={styles.body}>{amenity}</Text>
              </View>
            );
          })}
        </View>
      ) : <Text style={styles.body}>No amenities listed.</Text>)}
      {section('location', 'Location', <PropertyDetailsLocation listing={listing} reduceMotion={reduceMotion} />)}
      {section('agent', 'Agent', (
        <>
          {sellerName ? (
            <View style={styles.identity}>
              <View style={styles.avatar}><UserRound size={26} color={colors.primary} /></View>
              <View style={styles.identityText}>
                <Text style={styles.name}>{sellerName}</Text>
                <Text style={styles.body}>{listing.agent?.role ?? (listing.agent || listing.inquiryContact?.agentName ? 'Property contact' : 'Seller')}</Text>
              </View>
            </View>
          ) : <Text style={styles.body}>Seller information is not available yet.</Text>}
          {listing.agency && (
            <>
              <Text accessibilityRole="header" style={[styles.title, styles.agencyTitle]}>Agency</Text>
              <View style={styles.identity}>
                <View style={styles.avatar}><Building2 size={26} color={colors.primary} /></View>
                <View style={styles.identityText}>
                  <Text style={styles.name}>{listing.agency.name}</Text>
                  {listing.agency.role && <Text style={styles.body}>{listing.agency.role}</Text>}
                </View>
              </View>
            </>
          )}
        </>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  section: {backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 16,
    borderBottomWidth: 8, borderBottomColor: colors.background, gap: 8},
  title: {fontFamily: fonts.medium, fontSize: 16, lineHeight: 24, color: colors.text},
  body: {fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.secondary, flexShrink: 1},
  facts: {gap: 6},
  fact: {flexDirection: 'row', alignItems: 'flex-start', gap: 6},
  factLabel: {flex: 1, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.secondary},
  factValue: {flex: 1, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.secondary},
  readMore: {alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center'},
  link: {fontFamily: fonts.regular, fontSize: 14, color: colors.primary},
  amenities: {flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 8},
  amenity: {flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: '45%', maxWidth: '100%'},
  identity: {flexDirection: 'row', alignItems: 'center', gap: 12},
  avatar: {width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.tile},
  identityText: {flex: 1},
  name: {fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.text},
  agencyTitle: {marginTop: 12},
});
