import { render, screen, fireEvent } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import { Button } from "../Button";
test("shared button provides a 48-point target and preserves disabled behavior", async () => {
  const onPress = jest.fn();
  const view = await render(
    <PaperProvider>
      <Button onPress={onPress}>Continue</Button>
    </PaperProvider>,
  );
  expect(screen.getByText("Continue").parent).toHaveStyle({ minHeight: 48 });
  await fireEvent.press(screen.getByRole("button", { name: "Continue" }));
  expect(onPress).toHaveBeenCalledTimes(1);
  await view.rerender(
    <PaperProvider>
      <Button disabled onPress={onPress}>
        Continue
      </Button>
    </PaperProvider>,
  );
  expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  await fireEvent.press(screen.getByRole("button", { name: "Continue" }));
  expect(onPress).toHaveBeenCalledTimes(1);
});
