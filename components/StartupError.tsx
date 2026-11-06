import { Button } from "./Button";
import { Text } from "react-native-paper";
import { Screen } from "./Screen";
export function StartupError({
  title = "Unable to start",
  message,
  retry,
}: {
  title?: string;
  message: string;
  retry: () => void;
}) {
  return (
    <Screen title={title}>
      <Text accessibilityRole="alert">{message}</Text>
      <Button mode="contained" onPress={retry}>
        Retry
      </Button>
    </Screen>
  );
}
