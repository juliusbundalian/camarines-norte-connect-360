import { Text } from "react-native";
import { router } from "expo-router";
import { AuthScaffold, authStyles as s } from "./AuthScaffold";
export default function TermsScreen() {
  return (
    <AuthScaffold
      title="Terms & conditions"
      onBack={() =>
        router.canGoBack() ? router.back() : router.replace("/menu")
      }
    >
      <Text accessibilityRole="header" style={s.label}>
        Content pending
      </Text>
      <Text style={s.body}>
        The approved Terms & conditions will be published here. This page does
        not yet contain terms for you to accept.
      </Text>
    </AuthScaffold>
  );
}
