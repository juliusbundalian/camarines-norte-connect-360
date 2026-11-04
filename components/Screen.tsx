import type { PropsWithChildren } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native-paper";
import { tokens } from "../theme";
import { APP_NAME } from "../constants/app";
export function Screen({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.content}>
            <Text variant="titleSmall">{APP_NAME}</Text>
            <Text variant="headlineMedium" accessibilityRole="header">
              {title}
            </Text>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.background },
  scroll: { flexGrow: 1, justifyContent: "center", padding: tokens.space.lg },
  content: {
    width: "100%",
    maxWidth: tokens.size.content,
    alignSelf: "center",
    gap: tokens.space.lg,
  },
});
