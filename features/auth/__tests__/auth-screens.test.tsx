import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import { router } from "expo-router";
import { useAuth } from "../AuthProvider";
import LoginScreen from "../LoginScreen";
import RegisterScreen from "../RegisterScreen";
import ForgotPasswordScreen from "../ForgotPasswordScreen";
import WelcomeScreen from "../WelcomeScreen";
import type { User } from "firebase/auth";
jest.mock("../AuthProvider", () => ({ useAuth: jest.fn() }));
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn() },
}));
const login = jest.fn(),
  register = jest.fn(),
  reset = jest.fn(),
  logout = jest.fn();
beforeEach(() => {
  for (const fn of [login, register, reset, logout])
    fn.mockReset().mockResolvedValue(undefined);
  jest
    .mocked(useAuth)
    .mockReturnValue({
      user: { email: "a@example.com" } as User,
      ready: true,
      error: null,
      retry: jest.fn(),
      login,
      register,
      requestPasswordReset: reset,
      logout,
    });
});
const show = (node: React.ReactNode) =>
  render(<PaperProvider>{node}</PaperProvider>);
const fill = async (label: string, value: string) =>
  fireEvent.changeText(screen.getByLabelText(label), value);
test("reset validates email and shows generic confirmation", async () => {
  await show(<ForgotPasswordScreen />);
  await fill("Email", "bad");
  await fireEvent.press(
    screen.getByRole("button", { name: "Send Reset Link" }),
  );
  expect(reset).not.toHaveBeenCalled();
  await fill("Email", "a@example.com");
  await fireEvent.press(
    screen.getByRole("button", { name: "Send Reset Link" }),
  );
  expect(
    await screen.findByText(
      "If an account exists for this email address, you will receive a password reset link.",
    ),
  ).toBeTruthy();
  await fireEvent.press(screen.getByRole("button", { name: "Back to Login" }));
  expect(router.replace).toHaveBeenCalledWith("/login");
});
test("reset request failures remain retryable without showing confirmation", async () => {
  reset.mockRejectedValueOnce({ code: "auth/network-request-failed" });
  await show(<ForgotPasswordScreen />);
  await fill("Email", "a@example.com");
  await fireEvent.press(
    screen.getByRole("button", { name: "Send Reset Link" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(/connection/i);
  expect(screen.getByRole("button", { name: "Send Reset Link" })).toBeEnabled();
});
test("placeholder displays authenticated email and logout failures remain retryable", async () => {
  logout.mockRejectedValueOnce({ code: "auth/network-request-failed" });
  await show(<WelcomeScreen />);
  expect(screen.getByText("a@example.com")).toBeTruthy();
  expect(
    screen.getByText(
      "The main application is awaiting its official Figma designs.",
    ),
  ).toBeTruthy();
  await fireEvent.press(screen.getByRole("button", { name: "Logout" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/connection/i);
  await fireEvent.press(screen.getByRole("button", { name: "Logout" }));
  expect(logout).toHaveBeenCalledTimes(2);
});
