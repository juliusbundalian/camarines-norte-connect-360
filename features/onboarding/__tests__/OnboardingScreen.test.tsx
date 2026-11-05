import {
  render,
  screen,
  fireEvent,
  within,
} from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import { FlatList, useWindowDimensions } from "react-native";
import OnboardingScreen from "../OnboardingScreen";
import { useOnboarding } from "../OnboardingProvider";
jest.mock("../OnboardingProvider", () => ({ useOnboarding: jest.fn() }));
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: jest.fn(() => ({ width: 390, height: 844, scale: 1, fontScale: 1 })),
}));
const complete = jest.fn().mockResolvedValue(undefined);
beforeEach(() => {
  jest
    .mocked(useWindowDimensions)
    .mockReturnValue({ width: 390, height: 844, scale: 1, fontScale: 1 });
  jest.mocked(useOnboarding).mockReturnValue({
    completed: false,
    ready: true,
    initializationError: null,
    error: null,
    saving: false,
    complete,
    retry: jest.fn(),
  });
});
const show = () =>
  render(
    <PaperProvider>
      <OnboardingScreen />
    </PaperProvider>,
  );
test("Next, Back, and final Get Started follow the three-page flow", async () => {
  await show();
  expect(screen.getByText("Discover Camarines Norte")).toBeTruthy();
  await fireEvent.press(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByLabelText("Page 2 of 3")).toBeSelected();
  await fireEvent.press(screen.getByRole("button", { name: "Back" }));
  expect(screen.getByLabelText("Page 1 of 3")).toBeSelected();
  await fireEvent.press(screen.getByRole("button", { name: "Next" }));
  await fireEvent.press(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByText("Connect with the Community")).toBeTruthy();
  await fireEvent.press(screen.getByRole("button", { name: "Get Started" }));
  expect(complete).toHaveBeenCalledTimes(1);
});
test("Skip completes onboarding", async () => {
  await show();
  await fireEvent.press(screen.getByRole("button", { name: "Skip" }));
  expect(complete).toHaveBeenCalledTimes(1);
});
test("rotation realigns the measured pager to the active page", async () => {
  const scroll = jest.spyOn(FlatList.prototype, "scrollToOffset");
  try {
    await show();
    await fireEvent(screen.getByTestId("onboarding-pages"), "layout", {
      nativeEvent: { layout: { width: 360, height: 600, x: 0, y: 0 } },
    });
    await fireEvent(
      screen.getByTestId("onboarding-pages"),
      "momentumScrollEnd",
      {
        nativeEvent: { contentOffset: { x: 360 } },
      },
    );
    expect(screen.getByLabelText("Page 2 of 3")).toBeSelected();
    scroll.mockClear();
    await fireEvent(screen.getByTestId("onboarding-pages"), "layout", {
      nativeEvent: { layout: { width: 640, height: 300, x: 0, y: 0 } },
    });
    expect(scroll).toHaveBeenLastCalledWith({ offset: 640, animated: false });
    scroll.mockClear();
    await fireEvent(
      screen.getByTestId("onboarding-pages"),
      "contentSizeChange",
      1920,
      300,
    );
    expect(scroll).toHaveBeenLastCalledWith({ offset: 640, animated: false });
    expect(screen.getByLabelText("Page 2 of 3")).toBeSelected();
  } finally {
    scroll.mockRestore();
  }
});

test("shows a retryable save error and disables completion while saving", async () => {
  jest.mocked(useOnboarding).mockReturnValue({
    completed: false,
    ready: true,
    initializationError: null,
    error: "Could not save. Try again.",
    saving: true,
    complete,
    retry: jest.fn(),
  });
  await show();
  expect(screen.getByRole("alert")).toHaveTextContent(/Could not save/);
  expect(screen.getByRole("button", { name: "Skip" })).toBeDisabled();
});

test("Next uses the measured pager width inside safe areas", async () => {
  const scroll = jest.spyOn(FlatList.prototype, "scrollToOffset");
  await show();
  await fireEvent(screen.getByTestId("onboarding-pages"), "layout", {
    nativeEvent: { layout: { width: 300, height: 500, x: 0, y: 0 } },
  });
  await fireEvent.press(screen.getByRole("button", { name: "Next" }));
  expect(scroll).toHaveBeenLastCalledWith({ offset: 300, animated: true });
  scroll.mockRestore();
});

test("only the active page is exposed to assistive technology", async () => {
  await show();
  expect(screen.queryByText("Explore Real Estate Opportunities")).toBeNull();
  await fireEvent.press(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByText("Explore Real Estate Opportunities")).toBeTruthy();
  expect(screen.queryByText("Discover Camarines Norte")).toBeNull();
});

test("narrow enlarged-text navigation gives each action its own row", async () => {
  jest
    .mocked(useWindowDimensions)
    .mockReturnValue({ width: 320, height: 568, scale: 1, fontScale: 2 });
  await show();
  await fireEvent.press(screen.getByRole("button", { name: "Next" }));
  await fireEvent.press(screen.getByRole("button", { name: "Next" }));
  let actions = screen.getByRole("button", { name: "Back" }).parent;
  while (
    actions &&
    !within(actions).queryByRole("button", { name: "Get Started" })
  )
    actions = actions.parent;
  expect(actions).toHaveStyle({ flexDirection: "column" });
  await fireEvent.press(screen.getByRole("button", { name: "Get Started" }));
  expect(complete).toHaveBeenCalledTimes(1);
});

test("short screens can scroll the entire onboarding layout without collapsing the pager", async () => {
  await show();
  expect(screen.getByTestId("onboarding-layout")).toHaveProp(
    "nestedScrollEnabled",
    true,
  );
  expect(screen.getByTestId("onboarding-pages")).toHaveStyle({
    minHeight: 240,
  });
});
