import { Text } from "react-native";
import {
  renderRouter,
  screen,
  act,
  waitFor,
  fireEvent,
} from "expo-router/testing-library";
import { router } from "expo-router";
import type { User } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Splash from "expo-splash-screen";
import { getAuthService } from "../../../services/firebase/auth-service";
import * as RootLayout from "../../../app/_layout";
import Index from "../../../app/index";
import * as AuthLayout from "../../../app/(auth)/_layout";
import * as AppLayout from "../../../app/(app)/_layout";
import * as MainLayout from "../../../app/(main)/_layout";
import * as TabsLayout from "../../../app/(main)/(tabs)/_layout";
import Home from "../../../app/(main)/(tabs)/home";
import Explore from "../../../app/(main)/(tabs)/explore";
import Properties from "../../../app/(main)/(tabs)/properties";
import Community from "../../../app/(main)/(tabs)/community";
import Menu from "../../../app/(main)/(tabs)/menu";
import Account from "../../../app/(main)/account";
import Wishlist from "../../../app/(main)/wishlist";
import Notifications from "../../../app/(main)/notifications";
import Privacy from "../../../app/(main)/privacy-policy";
import Terms from "../../../app/terms";
import WelcomeRedirect from "../../../app/(app)/welcome";
import RetiredVerification from "../../../app/(auth)/verify-phone";
import { useAuth } from "../AuthProvider";
import { useOnboarding } from "../../onboarding/OnboardingProvider";
import { Button } from "react-native-paper";
jest.mock("../../../services/firebase/auth-service", () => ({
  getAuthService: jest.fn(),
}));
jest.mock("expo-font", () => ({ useFonts: () => [true, null] }));
jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(undefined),
  hideAsync: jest.fn().mockResolvedValue(undefined),
}));
let next: (user: User | null) => void;
let fail: (error: unknown) => void;
const user = { email: "a@example.com", uid: "local-user" } as User;
function OnboardingProbe() {
  const { complete } = useOnboarding();
  return <Button onPress={() => void complete()}>Complete onboarding</Button>;
}
const routes = {
  _layout: RootLayout,
  index: Index,
  onboarding: OnboardingProbe,
  "(app)/_layout": AppLayout,
  "(auth)/_layout": AuthLayout,
  "(auth)/login": () => <Text>Login destination</Text>,
  "(auth)/register": () => <Text>Registration destination</Text>,
  "(auth)/forgot-password": () => <Text>Reset destination</Text>,
  "(auth)/verify-phone": RetiredVerification,
  "(main)/_layout": MainLayout,
  "(main)/(tabs)/_layout": TabsLayout,
  "(main)/(tabs)/home": Home,
  "(main)/(tabs)/explore": Explore,
  "(main)/(tabs)/properties": Properties,
  "(main)/(tabs)/community": Community,
  "(main)/(tabs)/menu": Menu,
  "(main)/account": Account,
  "(main)/wishlist": Wishlist,
  "(main)/notifications": Notifications,
  "(main)/privacy-policy": Privacy,
  terms: Terms,
  "(app)/welcome": WelcomeRedirect,
};
beforeEach(() => {
  jest.mocked(AsyncStorage.getItem).mockResolvedValue("complete");
  const action = jest.fn().mockResolvedValue(undefined);
  jest.mocked(getAuthService).mockReturnValue({
    login: action,
    register: action,
    logout: action,
    requestPasswordReset: action,
    observe: (cb, error) => {
      next = cb;
      fail = error;
      return jest.fn();
    },
  });
});
afterEach(() => jest.useRealTimers());
test("retired SMS deep link returns to email Login without initializing verification", async () => {
  await renderRouter(routes, { initialUrl: "/verify-phone" });
  await act(() => next(null));
  await waitFor(() => expect(screen).toHavePathname("/login"));
  expect(screen.getByText("Login destination")).toBeTruthy();
});
test("an email user without verification returns to Menu", async () => {
  await renderRouter(routes, { initialUrl: "/register" });
  await act(() => next({ ...user, emailVerified: false } as User));
  await waitFor(() => expect(screen).toHavePathname("/menu"));
});
test("does not expose a route or hide splash before auth restoration", async () => {
  await renderRouter(routes);
  expect(screen.queryByText(/destination/)).toBeNull();
  expect(Splash.hideAsync).not.toHaveBeenCalled();
  await act(() => next(null));
  await waitFor(() => expect(screen).toHavePathname("/home"));
  expect(Splash.hideAsync).toHaveBeenCalled();
});
test("waits for onboarding even when auth resolves first", async () => {
  let resolve!: (value: string | null) => void;
  jest.mocked(AsyncStorage.getItem).mockReturnValueOnce(
    new Promise((r) => {
      resolve = r;
    }),
  );
  await renderRouter(routes);
  await act(() => next(user));
  expect(screen.queryByText("Home is coming soon to CamNorte 360.")).toBeNull();
  expect(Splash.hideAsync).not.toHaveBeenCalled();
  await act(() => resolve(null));
  await waitFor(() => expect(screen).toHavePathname("/home"));
});
test("first launch redirects a legacy welcome deep link to onboarding", async () => {
  jest.mocked(AsyncStorage.getItem).mockResolvedValue(null);
  await renderRouter(routes, { initialUrl: "/welcome" });
  await act(() => next(null));
  await waitFor(() => expect(screen).toHavePathname("/onboarding"));
  expect(screen.queryByText("Home is coming soon to CamNorte 360.")).toBeNull();
});
test("restored user takes precedence over absent onboarding and public deep links", async () => {
  jest.mocked(AsyncStorage.getItem).mockResolvedValue(null);
  await renderRouter(routes, { initialUrl: "/login" });
  await act(() => next(user));
  await waitFor(() => expect(screen).toHavePathname("/menu"));
  expect(screen.queryByText("Login destination")).toBeNull();
});
test("auth observer returns to the allowlisted source and signing out keeps guests in the shell", async () => {
  await renderRouter(routes, { initialUrl: "/login?returnTo=%2Faccount" });
  await act(() => next(null));
  expect(await screen.findByText("Login destination")).toBeTruthy();
  await act(() => next(user));
  await waitFor(() => expect(screen).toHavePathname("/account"));
  expect(screen.queryByText("Login destination")).toBeNull();
  await act(() => next(null));
  expect(screen).toHavePathname("/account");
  expect(screen.getByText("Account is coming soon to CamNorte 360.")).toBeTruthy();
});
test("an observer failure shows recovery and hides splash", async () => {
  await renderRouter(routes);
  await act(() => fail({ code: "auth/network-request-failed" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/connection/i);
  expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
  expect(Splash.hideAsync).toHaveBeenCalled();
});
test("unreadable onboarding storage offers retry without exposing login", async () => {
  jest
    .mocked(AsyncStorage.getItem)
    .mockRejectedValueOnce(new Error("storage unavailable"));
  await renderRouter(routes);
  await act(() => next(null));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    /read onboarding/i,
  );
  expect(screen.queryByText("Login destination")).toBeNull();
});

test("persisted onboarding completion opens the guest Home placeholder", async () => {
  jest.mocked(AsyncStorage.getItem).mockResolvedValue(null);
  await renderRouter(routes);
  await act(() => next(null));
  await fireEvent.press(
    await screen.findByRole("button", { name: "Complete onboarding" }),
  );
  await waitFor(() => expect(screen).toHavePathname("/home"));
});
test("configuration errors settle and retry restores navigation", async () => {
  jest.mocked(getAuthService).mockImplementationOnce(() => {
    throw new Error("Set EXPO_PUBLIC_FIREBASE_API_KEY");
  });
  await renderRouter(routes);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    /EXPO_PUBLIC_FIREBASE_API_KEY/,
  );
  await fireEvent.press(screen.getByRole("button", { name: "Retry" }));
  await act(() => next(null));
  await waitFor(() => expect(screen).toHavePathname("/home"));
});

test("logout failure survives a partial sign-out and can retry", async () => {
  const logout = jest.mocked(getAuthService().logout);
  let reject!: (error: unknown) => void;
  logout.mockReturnValueOnce(new Promise<void>((_resolve, fail) => { reject = fail; }));
  function LogoutProbe() {
    const auth = useAuth();
    return <Button onPress={() => void auth.logout().catch(() => {})}>Logout probe</Button>;
  }
  await renderRouter({ ...routes, "(main)/(tabs)/menu": LogoutProbe }, { initialUrl: "/menu" });
  await act(() => next(user));
  await fireEvent.press(await screen.findByRole("button", {name:"Logout probe"}));
  await act(() => next(null));
  await act(() => reject({ code: "auth/network-request-failed" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/connection/i);
  expect(screen.getByRole("header", { name: "Sign-out incomplete" })).toBeTruthy();
  logout.mockResolvedValueOnce(undefined);
  await fireEvent.press(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  expect(logout).toHaveBeenCalledTimes(2);
});
test("guests can traverse all tabs with the selected state and open public Terms", async () => {
  await renderRouter(routes);
  await act(() => next(null));
  for (const label of ["Explore", "Properties", "Community", "Menu", "Home"]) {
    await fireEvent.press(await screen.findByRole("tab", {name:label}));
    await waitFor(() => expect(screen).toHavePathname('/'+label.toLowerCase()));
    expect(screen.getByRole("tab",{name:label})).toBeSelected();
  }
  await act(() => router.push('/terms'));
  expect(await screen.findByText('Content pending')).toBeTruthy();
  await act(() => next(user));
  expect(screen).toHavePathname('/terms');
});
test.each(['/account','/wishlist','/notifications','/privacy-policy'])("guest deep link %s opens a placeholder without login", async path => {
  await renderRouter(routes, {initialUrl:path});
  await act(() => next(null));
  await waitFor(() => expect(screen).toHavePathname(path));
  expect(screen.queryByText('Login destination')).toBeNull();
});

test('successful Logout preserves the selected Menu while its pending overlay is visible', async () => {
  const logout=jest.mocked(getAuthService().logout);
  let finish!:()=>void;
  logout.mockReturnValueOnce(new Promise<void>(resolve=>{finish=resolve;}));
  function LogoutProbe(){const auth=useAuth();return <Button onPress={()=>void auth.logout()}>Sign out probe</Button>;}
  await renderRouter({...routes,'(main)/(tabs)/menu':LogoutProbe},{initialUrl:'/menu'});
  await act(()=>next(user));
  await fireEvent.press(await screen.findByRole('button',{name:'Sign out probe'}));
  await act(()=>next(null));
  await act(()=>finish());
  await waitFor(()=>expect(screen).toHavePathname('/menu'));
  expect(await screen.findByRole('button',{name:'Sign out probe'})).toBeTruthy();
});
