import {useCallback} from 'react';
import {Alert, BackHandler, Linking, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {router, useFocusEffect, useNavigation} from 'expo-router';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import {menuTokens} from '../../theme/menu';
import type {LegalDocument, LegalLink} from './legal-documents';

const {colors, fonts} = menuTokens;

function openLink({url}: LegalLink) {
  if (url === '/privacy-policy') {
    router.push('/privacy-policy');
    return;
  }
  void Linking.openURL(url).catch(() => {
    Alert.alert('Could not open link', 'Please try again.');
  });
}

export function LegalDocumentScreen({document}: {document: LegalDocument}) {
  const {bottom} = useSafeAreaInsets();
  const navigation = useNavigation();
  const goBack = useCallback(() => {
    const state = navigation.getState();
    // A cold link can seed the stack with the startup redirect rather than a visited page.
    const fromStartup = state?.routes[state.index - 1]?.name === 'index' && state.routeNames.includes('(main)');
    if (router.canGoBack() && !fromStartup) router.back();
    else router.dismissTo('/menu');
  }, [navigation]);

  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => subscription.remove();
  }, [goBack]));

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={goBack} style={styles.back}>
          <ArrowLeft color={colors.text} size={24} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.appBarTitle}>{document.title}</Text>
      </View>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, {paddingBottom: 16 + bottom}]}>
        <View style={styles.metadata}>
          <Text accessibilityRole="header" style={styles.title}>{document.documentTitle}</Text>
          <Text style={styles.body}>Draft for review</Text>
          <Text style={styles.body}>Publication date · {document.publicationDate ?? 'To be confirmed'}</Text>
          <Text style={styles.body}>Effective date · {document.effectiveDate ?? 'To be confirmed'}</Text>
        </View>
        {document.sections.map(section => (
          <View key={section.heading} style={styles.section}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>{section.heading}</Text>
            {section.paragraphs.map(paragraph => (
              <View key={paragraph.text} style={styles.paragraph}>
                <Text style={styles.body}>{paragraph.text}</Text>
                {paragraph.links?.map(link => (
                  <Pressable key={link.url} accessibilityRole="link" accessibilityLabel={link.label}
                    onPress={() => openLink(link)} style={styles.linkTarget}>
                    <Text style={styles.link}>{link.label}</Text>
                  </Pressable>
                ))}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.card},
  header: {minHeight: 64, paddingHorizontal: 8, paddingVertical: 8, flexDirection: 'row',
    alignItems: 'center', gap: 12, backgroundColor: colors.card},
  back: {width: 48, height: 48, alignItems: 'center', justifyContent: 'center'},
  appBarTitle: {flex: 1, paddingRight: 8, fontFamily: fonts.medium, color: colors.text, fontSize: 22, lineHeight: 28},
  scroll: {flex: 1, backgroundColor: colors.background},
  content: {padding: 16, gap: 20},
  metadata: {gap: 4},
  title: {fontFamily: fonts.medium, fontSize: 24, lineHeight: 32, color: colors.text},
  section: {gap: 8},
  sectionTitle: {fontFamily: fonts.medium, fontSize: 16, lineHeight: 24, color: colors.text},
  paragraph: {gap: 4},
  body: {fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.secondary},
  linkTarget: {minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center', paddingVertical: 8},
  link: {fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: '#237A33', textDecorationLine: 'underline'},
});
