import { render, screen, fireEvent, act } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import { BackHandler, FlatList, useWindowDimensions } from "react-native";
import { useFonts } from "expo-font";
import OnboardingScreen from "../OnboardingScreen";
import { useOnboarding } from "../OnboardingProvider";
jest.mock("../OnboardingProvider", () => ({ useOnboarding: jest.fn() }));
jest.mock("expo-font", () => ({ useFonts: jest.fn(() => [true, null]) }));
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: jest.fn(() => ({ width: 412, height: 892, scale: 1, fontScale: 1 })),
}));
const complete = jest.fn().mockResolvedValue(undefined);
beforeEach(() => {
  jest.mocked(useFonts).mockReturnValue([true, null]);
  jest
    .mocked(useWindowDimensions)
    .mockReturnValue({ width: 412, height: 892, scale: 1, fontScale: 1 });
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
const swipe = (x: number) =>
  fireEvent(screen.getByTestId("onboarding-pages"), "momentumScrollEnd", {
    nativeEvent: { contentOffset: { x } },
  });
test("Figma copy, Next, reverse swipe and Finish preserve completion", async () => {
  await show();
  expect(screen.getByRole("header")).toHaveTextContent(
    "Discover the\nCamarines Norte",
  );
  expect(
    screen.getByText(
      "Explore stunning beaches, heritage sites, & hidden gems across the province",
    ),
  ).toBeTruthy();
  await fireEvent.press(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByRole("header")).toHaveTextContent(
    "Explore Property Opportunities",
  );
  await swipe(0);
  expect(screen.getByLabelText("Page 1 of 3")).toBeSelected();
  await swipe(824);
  expect(screen.getByRole("header")).toHaveTextContent(/Stay Connected/);
  expect(screen.queryByRole("button", { name: "Skip" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
  await fireEvent.press(screen.getByRole("button", { name: "Finish" }));
  expect(complete).toHaveBeenCalledTimes(1);
});
test("Skip completes onboarding on the first two pages", async () => {
  await show();
  await fireEvent.press(screen.getByRole("button", { name: "Skip" }));
  await fireEvent.press(screen.getByRole("button", { name: "Next" }));
  await fireEvent.press(screen.getByRole("button", { name: "Skip" }));
  expect(complete).toHaveBeenCalledTimes(2);
});
test("Android Back returns to the preceding page before leaving onboarding", async () => {
  let back: Parameters<typeof BackHandler.addEventListener>[1] | undefined;
  const remove = jest.fn();
  const listener = jest
    .spyOn(BackHandler, "addEventListener")
    .mockImplementation((_, fn) => {
      back = fn;
      return { remove };
    });
  try {
    const view = await show();
    expect(back?.({ type: "hardwareBackPress", timeStamp: 0 })).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Next" }));
    await act(() => {
      expect(back?.({ type: "hardwareBackPress", timeStamp: 0 })).toBe(true);
    });
    expect(screen.getByLabelText("Page 1 of 3")).toBeSelected();
    await view.unmount();
    expect(remove).toHaveBeenCalled();
  } finally {
    listener.mockRestore();
  }
});
test("rotation realigns the measured pager after native content resizes", async () => {
  const scroll = jest.spyOn(FlatList.prototype, "scrollToOffset");
  try {
    await show();
    await fireEvent(screen.getByTestId("onboarding-pages"), "layout", {
      nativeEvent: { layout: { width: 360, height: 800, x: 0, y: 0 } },
    });
    await swipe(360);
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
test("save failure remains visible and completion can be retried", async () => {
  jest.mocked(useOnboarding).mockReturnValue({
    ...jest.mocked(useOnboarding)(),
    error: "Could not save. Try again.",
  });
  await show();
  await swipe(824);
  expect(screen.getByRole("alert")).toHaveTextContent(/Could not save/);
  await fireEvent.press(screen.getByRole("button", { name: "Finish" }));
  expect(complete).toHaveBeenCalledTimes(1);
});
test("pending completion disables Skip, Next, Finish and swiping", async () => {
  jest
    .mocked(useOnboarding)
    .mockReturnValue({ ...jest.mocked(useOnboarding)(), saving: true });
  await show();
  expect(screen.getByRole("button", { name: "Skip" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  expect(screen.getByTestId("onboarding-pages")).toHaveProp(
    "scrollEnabled",
    false,
  );
  await swipe(824);
  expect(screen.getByRole("button", { name: "Finish" })).toBeDisabled();
});
test("inactive pages are hidden from assistive technology", async () => {
  await show();
  expect(screen.queryByText("Explore Property Opportunities")).toBeNull();
  await fireEvent.press(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByText("Explore Property Opportunities")).toBeTruthy();
  expect(screen.queryByText("Discover the\nCamarines Norte")).toBeNull();
});
test("font loading prevents fallback typography and font failures provide Retry", async () => {
  jest.mocked(useFonts).mockReturnValue([false, null]);
  const view = await show();
  expect(screen.getByLabelText("Loading onboarding fonts")).toBeTruthy();
  expect(screen.queryByRole("header")).toBeNull();
  jest.mocked(useFonts).mockReturnValue([false, new Error("font unavailable")]);
  await view.rerender(
    <PaperProvider>
      <OnboardingScreen />
    </PaperProvider>,
  );
  expect(screen.getByRole("alert")).toHaveTextContent(/font/i);
  jest.mocked(useFonts).mockReturnValue([true, null]);
  await fireEvent.press(screen.getByRole("button", { name: "Retry" }));
  expect(screen.getByRole("header")).toHaveTextContent(/Discover the/);
});
test("at 320dp and enlarged text, copy and Finish remain in a scrollable page", async () => {
  jest
    .mocked(useWindowDimensions)
    .mockReturnValue({ width: 320, height: 568, scale: 1, fontScale: 2 });
  await show();
  await swipe(640);
  expect(screen.getByTestId("onboarding-page-2")).toHaveProp(
    "nestedScrollEnabled",
    true,
  );
  expect(screen.getByRole("button", { name: "Finish" })).toBeEnabled();
  await fireEvent.press(screen.getByRole("button", { name: "Finish" }));
  expect(complete).toHaveBeenCalledTimes(1);
});
