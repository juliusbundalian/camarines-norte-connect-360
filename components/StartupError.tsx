import { Button, Text } from "react-native-paper";
import { Screen } from "./Screen";
export function StartupError({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
  return (
    <Screen title="Unable to start">
      <Text accessibilityRole="alert">{message}</Text>
      <Button mode="contained" onPress={retry}>
        Retry
      </Button>
    </Screen>
  );
}
