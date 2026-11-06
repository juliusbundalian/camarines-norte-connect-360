import { Button } from "../../components/Button";
import { Text } from "react-native-paper";
import { Screen } from "../../components/Screen";
import { FormError } from "../../components/FormError";
import { useAuth } from "./AuthProvider";
import { useAsyncAction } from "./useAsyncAction";
export default function WelcomeScreen() {
  const { user, logout } = useAuth();
  const action = useAsyncAction();
  return (
    <Screen title="Welcome">
      <Text>You are signed in.</Text>
      <Text selectable>{user?.phoneNumber || user?.email}</Text>
      <Text>The main application is awaiting its official Figma designs.</Text>
      <FormError message={action.error} />
      <Button
        mode="contained"
        onPress={() => void action.run(logout)}
        loading={action.pending}
        disabled={action.pending}
      >
        Logout
      </Button>
    </Screen>
  );
}
