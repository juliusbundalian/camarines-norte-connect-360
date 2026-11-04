import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text } from "react-native-paper";
import { Image } from "expo-image";
import { tokens } from "../../theme";
import { APP_NAME } from "../../constants/app";
import { useOnboarding } from "./OnboardingProvider";
import { onboardingPages } from "./content";
export default function OnboardingScreen() {
  const { complete, saving, error } = useOnboarding();
  const { width: windowWidth } = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);
  const width = measuredWidth ?? windowWidth;
  const [page, setPage] = useState(0);
  const current = useRef(0);
  const list = useRef<FlatList>(null);
  useEffect(() => {
    list.current?.scrollToOffset({
      offset: current.current * width,
      animated: false,
    });
  }, [width]);
  const move = (next: number) => {
    current.current = next;
    setPage(next);
    list.current?.scrollToOffset({ offset: next * width, animated: true });
  };
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text variant="titleSmall" style={styles.name}>
          {APP_NAME}
        </Text>
        <Button disabled={saving} onPress={() => void complete()}>
          Skip
        </Button>
      </View>
      <FlatList
        ref={list}
        testID="onboarding-pages"
        horizontal
        onLayout={(event) => {
          const value = event.nativeEvent.layout.width;
          if (value > 0) setMeasuredWidth(value);
        }}
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        data={onboardingPages}
        extraData={width}
        keyExtractor={(item) => item.title}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onMomentumScrollEnd={(event) => {
          const next = Math.max(
            0,
            Math.min(2, Math.round(event.nativeEvent.contentOffset.x / width)),
          );
          current.current = next;
          setPage(next);
        }}
        renderItem={({ item, index }) => (
          <ScrollView
            style={{ width }}
            contentContainerStyle={styles.page}
            accessibilityElementsHidden={index !== page}
            importantForAccessibility={
              index === page ? "auto" : "no-hide-descendants"
            }
          >
            <Image
              source={require("../../assets/brand.png")}
              accessibilityLabel="Temporary 360 branding"
              style={styles.image}
              contentFit="contain"
            />
            <View style={styles.copy}>
              <Text accessibilityRole="header" variant="headlineMedium">
                {item.title}
              </Text>
              <Text variant="bodyLarge" style={styles.description}>
                {item.description}
              </Text>
            </View>
          </ScrollView>
        )}
      />
      <View style={styles.footer}>
        <View style={styles.indicators}>
          {onboardingPages.map((item, index) => (
            <View
              key={item.title}
              accessible
              accessibilityRole="text"
              accessibilityLabel={`Page ${index + 1} of 3`}
              accessibilityState={{ selected: page === index }}
              style={[styles.dot, page === index && styles.activeDot]}
            />
          ))}
        </View>
        <Text
          accessibilityLiveRegion="polite"
          style={styles.progress}
        >{`Page ${page + 1} of 3`}</Text>
        {error && (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        )}
        <View style={styles.actions}>
          {page > 0 && (
            <Button disabled={saving} onPress={() => move(page - 1)}>
              Back
            </Button>
          )}
          {page === 2 ? (
            <Button
              mode="contained"
              loading={saving}
              disabled={saving}
              onPress={() => void complete()}
            >
              Get Started
            </Button>
          ) : (
            <Button
              mode="contained"
              disabled={saving}
              onPress={() => move(page + 1)}
            >
              Next
            </Button>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.background },
  header: {
    padding: tokens.space.md,
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space.sm,
  },
  name: { flex: 1 },
  page: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: tokens.space.lg,
    gap: tokens.space.lg,
  },
  copy: { width: "100%", maxWidth: tokens.size.content, gap: tokens.space.md },
  image: { width: tokens.size.brand, height: tokens.size.brand },
  description: { color: tokens.colors.muted },
  footer: { padding: tokens.space.lg, gap: tokens.space.md },
  indicators: {
    flexDirection: "row",
    justifyContent: "center",
    gap: tokens.space.sm,
  },
  dot: {
    width: tokens.size.dot,
    height: tokens.size.dot,
    borderRadius: tokens.size.dot,
    backgroundColor: tokens.colors.indicator,
  },
  activeDot: {
    width: tokens.size.activeDot,
    backgroundColor: tokens.colors.primary,
  },
  progress: { textAlign: "center", color: tokens.colors.muted },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: tokens.space.md,
  },
  error: { color: tokens.colors.error },
});
