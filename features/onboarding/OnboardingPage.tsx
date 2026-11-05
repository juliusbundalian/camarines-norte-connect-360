import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { Image } from "expo-image";
import TreePalm from "lucide-react-native/icons/tree-palm";
import House from "lucide-react-native/icons/house";
import Users from "lucide-react-native/icons/users";
import { Button } from "../../components/Button";
import { FormError } from "../../components/FormError";
import { onboardingTokens as t } from "../../theme/onboarding";
import type { OnboardingContent } from "./content";

const icons = { palm: TreePalm, home: House, community: Users };
interface Props {
  content: OnboardingContent;
  index: number;
  width: number;
  height: number;
  bottomInset: number;
  fontScale: number;
  selected: boolean;
  saving: boolean;
  error: string | null;
  onNext(): void;
  onComplete(): void;
}
export function OnboardingPage({
  content,
  index,
  width,
  height,
  bottomInset,
  fontScale,
  selected,
  saving,
  error,
  onNext,
  onComplete,
}: Props) {
  const scale = width / t.referenceWidth;
  const waveHeight = t.waveHeight * scale;
  const heroHeight = Math.max(
    t.minHeroHeight,
    height - bottomInset - t.panel.minHeight - waveHeight,
  );
  const Icon = icons[content.icon];
  const enlarged = fontScale > 1.4;
  return (
    <ScrollView
      testID={`onboarding-page-${index}`}
      style={{ width }}
      contentContainerStyle={{ minHeight: height, paddingBottom: bottomInset }}
      nestedScrollEnabled
      accessibilityElementsHidden={!selected}
      importantForAccessibility={selected ? "auto" : "no-hide-descendants"}
    >
      <Image
        source={require("../../assets/onboarding/beach.png")}
        contentFit="cover"
        style={[
          styles.photo,
          {
            width,
            height: heroHeight + waveHeight - t.photoBottomInset * scale,
          },
        ]}
        accessible={false}
      />
      <View style={{ height: heroHeight }} />
      <Image
        source={require("../../assets/onboarding/wave.svg")}
        contentFit="fill"
        style={{ width, height: waveHeight }}
        accessible={false}
      />
      <View style={styles.panel}>
        <View style={styles.copy}>
          <Text accessibilityRole="header" style={styles.title}>
            {content.title}
          </Text>
          <Text style={styles.description}>{content.description}</Text>
        </View>
        <View style={[styles.actions, enlarged && styles.enlargedActions]}>
          {index < 2 ? (
            <Button
              textColor={t.colors.skip}
              disabled={saving}
              onPress={onComplete}
              style={[styles.action, enlarged && styles.enlargedAction]}
              labelStyle={styles.skipLabel}
              contentStyle={styles.actionContent}
            >
              Skip
            </Button>
          ) : (
            <View
              style={styles.action}
              importantForAccessibility="no-hide-descendants"
            />
          )}
          <View
            style={styles.steps}
            accessible
            accessibilityRole="text"
            accessibilityLabel={`Page ${index + 1} of 3`}
            accessibilityState={{ selected: true }}
          >
            <Image
              source={content.steps}
              contentFit="contain"
              style={{
                width: index === 0 ? t.steps.firstWidth : t.steps.otherWidth,
                height: t.steps.height,
              }}
              accessible={false}
            />
          </View>
          <Button
            textColor={t.colors.action}
            disabled={saving}
            loading={index === 2 && saving}
            onPress={index === 2 ? onComplete : onNext}
            style={[styles.action, enlarged && styles.enlargedAction]}
            labelStyle={styles.nextLabel}
            contentStyle={styles.actionContent}
          >
            {index === 2 ? "Finish" : "Next"}
          </Button>
        </View>
        {error && <FormError message={error} />}
      </View>
      <View
        pointerEvents="none"
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.badge,
          { top: heroHeight + waveHeight - t.badge.abovePanel },
        ]}
      >
        <Icon size={t.badge.icon} color={t.colors.background} strokeWidth={2} />
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  photo: { position: "absolute", top: 0, left: 0 },
  panel: {
    backgroundColor: t.colors.background,
    minHeight: t.panel.minHeight,
    paddingHorizontal: t.panel.inset,
    paddingTop: t.panel.top,
    paddingBottom: t.panel.bottom,
    gap: t.panel.actionGap,
  },
  copy: { minHeight: t.panel.copyHeight, gap: t.panel.copyGap },
  title: {
    ...t.heading,
    fontFamily: t.fonts.medium,
    color: t.colors.heading,
    includeFontPadding: false,
  },
  description: {
    ...t.body,
    fontFamily: t.fonts.regular,
    color: t.colors.body,
    includeFontPadding: false,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: t.touch,
  },
  enlargedActions: { flexDirection: "column", gap: t.panel.copyGap },
  action: { width: t.actionWidth, minHeight: t.touch },
  enlargedAction: { width: "100%" },
  actionContent: { minHeight: t.touch },
  skipLabel: {
    ...t.body,
    fontFamily: t.fonts.regular,
    marginHorizontal: 0,
    marginVertical: 0,
    includeFontPadding: false,
  },
  nextLabel: {
    ...t.body,
    fontFamily: t.fonts.medium,
    marginHorizontal: 0,
    marginVertical: 0,
    includeFontPadding: false,
  },
  steps: { flex: 1, alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute",
    left: t.panel.inset,
    width: t.badge.size,
    height: t.badge.size,
    borderWidth: t.badge.border,
    borderColor: t.colors.background,
    borderRadius: t.badge.radius,
    backgroundColor: t.colors.badge,
    padding: t.badge.padding,
    alignItems: "center",
    justifyContent: "center",
  },
});
