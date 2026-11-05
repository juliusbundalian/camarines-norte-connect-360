import { useCallback, useEffect, useRef, useState } from "react";
import {
  BackHandler,
  FlatList,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { StartupError } from "../../components/StartupError";
import { onboardingTokens as t } from "../../theme/onboarding";
import { useOnboarding } from "./OnboardingProvider";
import { onboardingPages } from "./content";
import { OnboardingPage } from "./OnboardingPage";

export default function OnboardingScreen() {
  const [attempt, setAttempt] = useState(0);
  return (
    <OnboardingFonts key={attempt} retry={() => setAttempt((n) => n + 1)} />
  );
}
function OnboardingFonts({ retry }: { retry(): void }) {
  const [loaded, error] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Medium": require("../../assets/fonts/Poppins-Medium.ttf"),
  });
  if (error)
    return (
      <StartupError
        message="Could not load onboarding fonts. Please retry."
        retry={retry}
      />
    );
  if (!loaded)
    return (
      <View style={styles.loading}>
        <ActivityIndicator accessibilityLabel="Loading onboarding fonts" />
      </View>
    );
  return <OnboardingPager />;
}
function OnboardingPager() {
  const { complete, saving, error } = useOnboarding();
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [measured, setMeasured] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const width = measured?.width ?? window.width;
  const height = measured?.height ?? window.height;
  const [page, setPage] = useState(0);
  const current = useRef(0);
  const list = useRef<FlatList>(null);
  const align = () =>
    list.current?.scrollToOffset({
      offset: current.current * width,
      animated: false,
    });
  useEffect(align, [width]);
  const move = useCallback(
    (next: number) => {
      current.current = next;
      setPage(next);
      list.current?.scrollToOffset({ offset: next * width, animated: true });
    },
    [width],
  );
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (saving) return true;
        if (current.current === 0) return false;
        move(current.current - 1);
        return true;
      },
    );
    return () => subscription.remove();
  }, [move, saving]);
  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <FlatList
        ref={list}
        testID="onboarding-pages"
        horizontal
        pagingEnabled
        scrollEnabled={!saving}
        showsHorizontalScrollIndicator={false}
        style={styles.pager}
        data={onboardingPages}
        extraData={{
          width,
          height,
          page,
          saving,
          error,
          fontScale: window.fontScale,
        }}
        keyExtractor={(item) => item.icon}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onLayout={(event) => {
          const { width: w, height: h } = event.nativeEvent.layout;
          if (w > 0 && h > 0) setMeasured({ width: w, height: h });
        }}
        onContentSizeChange={align}
        onMomentumScrollEnd={(event) => {
          const next = Math.max(
            0,
            Math.min(2, Math.round(event.nativeEvent.contentOffset.x / width)),
          );
          current.current = next;
          setPage(next);
        }}
        renderItem={({ item, index }) => (
          <OnboardingPage
            content={item}
            index={index}
            width={width}
            height={height}
            bottomInset={insets.bottom}
            fontScale={window.fontScale}
            selected={index === page}
            saving={saving}
            error={error}
            onNext={() => move(Math.min(2, index + 1))}
            onComplete={() => void complete()}
          />
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: t.colors.background },
  pager: { flex: 1 },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: t.colors.background,
  },
});
