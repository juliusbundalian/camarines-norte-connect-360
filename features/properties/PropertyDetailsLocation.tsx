import {StyleSheet, Text} from 'react-native';
import type {Listing} from './listings';
import {propertyTheme} from './styles';

export type PropertyDetailsLocationProps = {listing: Listing; reduceMotion?: boolean};

export function PropertyDetailsLocation({listing}: PropertyDetailsLocationProps) {
  return <Text style={styles.address}>{listing.area}</Text>;
}

const styles = StyleSheet.create({
  address: {fontFamily: propertyTheme.fonts.regular, color: propertyTheme.colors.secondary, fontSize: 14, lineHeight: 20},
});
