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
test("login validates then submits normalized email with untouched password", async () => {
  await show(<LoginScreen />);
  await fireEvent.press(screen.getByRole("button", { name: "Log In" }));
  expect(login).not.toHaveBeenCalled();
  expect(await screen.findByText("Enter your email address.")).toBeTruthy();
  await fill("Email", " a@example.com ");
  await fill("Password", " pässword ");
  await fireEvent.press(screen.getByRole("button", { name: "Log In" }));
  await waitFor(() =>
    expect(login).toHaveBeenCalledWith("a@example.com", " pässword "),
  );
});
test("pending login prevents duplicate taps and can settle after leaving the screen", async () => {
  let resolve!: () => void;
  login.mockImplementation(
    () =>
      new Promise<void>((r) => {
        resolve = r;
      }),
  );
  const view = await show(<LoginScreen />);
  await fill("Email", "a@example.com");
  await fill("Password", "password");
  await fireEvent.press(screen.getByRole("button", { name: "Log In" }));
  await fireEvent.press(screen.getByRole("button", { name: "Log In" }));
  expect(login).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "Log In" })).toBeDisabled();
  await view.unmount();
  await act(() => resolve());
});
test("recoverable login errors preserve inputs and allow retry", async () => {
  login.mockRejectedValueOnce({ code: "auth/network-request-failed" });
  await show(<LoginScreen />);
  await fill("Email", "a@example.com");
  await fill("Password", "password");
  await fireEvent.press(screen.getByRole("button", { name: "Log In" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/connection/i);
  expect(screen.getByLabelText("Email")).toHaveDisplayValue("a@example.com");
  await fireEvent.press(screen.getByRole("button", { name: "Log In" }));
  await waitFor(() => expect(login).toHaveBeenCalledTimes(2));
});
test("registration validates matching passwords and provides independent visibility toggles", async () => {
  await show(<RegisterScreen />);
  await fill("Email", "a@example.com");
  await fill("Password", "password");
  await fill("Confirm Password", "different");
  await fireEvent.press(screen.getByRole("button", { name: "Register" }));
  expect(await screen.findByText("Passwords must match.")).toBeTruthy();
  expect(register).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole("button", { name: "Show Password" }));
  expect(screen.getByLabelText("Password").props.secureTextEntry).toBe(false);
  expect(screen.getByLabelText("Confirm Password").props.secureTextEntry).toBe(
    true,
  );
  await fill("Confirm Password", "password");
  await fireEvent.press(screen.getByRole("button", { name: "Register" }));
  await waitFor(() =>
    expect(register).toHaveBeenCalledWith("a@example.com", "password"),
  );
});
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
test("auth navigation links target only approved auth screens", async () => {
  const view = await show(<LoginScreen />);
  await fireEvent.press(
    screen.getByRole("button", { name: "Forgot Password?" }),
  );
  expect(router.push).toHaveBeenCalledWith("/forgot-password");
  await fireEvent.press(screen.getByRole("button", { name: "Register" }));
  expect(router.push).toHaveBeenCalledWith("/register");
  await view.rerender(
    <PaperProvider>
      <RegisterScreen />
    </PaperProvider>,
  );
  await fireEvent.press(screen.getByRole("button", { name: "Back to Login" }));
  expect(router.replace).toHaveBeenCalledWith("/login");
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
