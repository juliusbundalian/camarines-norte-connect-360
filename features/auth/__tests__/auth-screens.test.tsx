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
import { checkPasswordPolicy } from "../../../services/firebase/password-policy";
jest.mock(
  "../../../services/firebase/password-policy",
  () => ({ checkPasswordPolicy: jest.fn() }),
  { virtual: true },
);
jest.mock("../AuthProvider", () => ({ useAuth: jest.fn() }));
jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: () => false,
  },
  useFocusEffect: (cb: () => void) => require("react").useEffect(cb, [cb]),
}));
const login = jest.fn(),
  register = jest.fn(),
  reset = jest.fn(),
  logout = jest.fn();
beforeEach(() => {
  jest
    .mocked(checkPasswordPolicy)
    .mockReset()
    .mockResolvedValue({
      isValid: true,
      passwordPolicy: {
        customStrengthOptions: {
          minPasswordLength: 8,
          containsUppercaseLetter: true,
          containsLowercaseLetter: true,
          containsNumericCharacter: true,
          containsNonAlphanumericCharacter: true,
        },
        allowedNonAlphanumericCharacters: "!@#$%^&*",
        enforcementState: "ENFORCE",
        forceUpgradeOnSignin: false,
      },
    });
  for (const fn of [login, register, reset, logout])
    fn.mockReset().mockResolvedValue(undefined);
  jest.mocked(useAuth).mockReturnValue({
    user: { email: "a@example.com" } as User,
    ready: true,
    error: null,
    logoutError: null,
    logoutPending: false,
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
async function credentials(signup = false) {
  await fill("Email", " person@example.com ");
  await fill("Password", "Example123!");
  if (signup) await fill("Confirm Password", "Example123!");
}
test("login uses email and password without SMS and supports visibility and navigation", async () => {
  await show(<LoginScreen />);
  expect(screen.queryByLabelText("Mobile number")).toBeNull();
  await credentials();
  expect(screen.getByLabelText("Password").props.secureTextEntry).toBe(true);
  await fireEvent.press(screen.getByRole("button", { name: "Show password" }));
  expect(screen.getByLabelText("Password").props.secureTextEntry).toBe(false);
  await fireEvent.press(screen.getByRole("button", { name: "Login" }));
  await waitFor(() =>
    expect(login).toHaveBeenCalledWith("person@example.com", "Example123!"),
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Forgot Password?" }),
  );
  expect(router.push).toHaveBeenCalledWith("/forgot-password");
  await fireEvent.press(screen.getByRole("button", { name: "Sign up" }));
  expect(router.push).toHaveBeenCalledWith("/register");
});
test("login validates required fields and email without rejecting existing short passwords", async () => {
  await show(<LoginScreen />);
  await fireEvent.press(screen.getByRole("button", { name: "Login" }));
  expect(await screen.findByText("Enter your email address.")).toBeTruthy();
  expect(screen.getByText("Enter your password.")).toBeTruthy();
  await fill("Email", "bad");
  await fireEvent.press(screen.getByRole("button", { name: "Login" }));
  expect(await screen.findByText("Enter a valid email address.")).toBeTruthy();
  expect(login).not.toHaveBeenCalled();
  await fill("Email", "person@example.com");
  await fill("Password", "short");
  await fireEvent.press(screen.getByRole("button", { name: "Login" }));
  await waitFor(() =>
    expect(login).toHaveBeenCalledWith("person@example.com", "short"),
  );
});
test("pending login blocks duplicates and failures retain fields for retry", async () => {
  let reject!: (error: unknown) => void;
  login.mockReturnValueOnce(
    new Promise((_, fail) => {
      reject = fail;
    }),
  );
  await show(<LoginScreen />);
  await credentials();
  const button = screen.getByRole("button", { name: "Login" });
  await fireEvent.press(button);
  await fireEvent.press(button);
  expect(login).toHaveBeenCalledTimes(1);
  await act(() =>
    reject({ code: "auth/invalid-credential", message: "private" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    /Email or password is incorrect/,
  );
  expect(screen.getByLabelText("Email").props.value).toBe(
    " person@example.com ",
  );
  await fireEvent.press(screen.getByRole("button", { name: "Login" }));
  await waitFor(() => expect(login).toHaveBeenCalledTimes(2));
});
test("registration checks Firebase policy and signs in without an email verification step", async () => {
  await show(<RegisterScreen />);
  await credentials(true);
  await fireEvent.press(screen.getByRole("button", { name: "Register" }));
  await waitFor(() =>
    expect(register).toHaveBeenCalledWith("person@example.com", "Example123!"),
  );
  expect(checkPasswordPolicy).toHaveBeenCalledWith("Example123!");
  expect(router.push).not.toHaveBeenCalledWith("/verify-phone");
  expect(screen.queryByText(/verify your email/i)).toBeNull();
  await fireEvent.press(
    screen.getByRole("button", { name: "Show confirm password" }),
  );
  expect(screen.getByLabelText("Confirm Password").props.secureTextEntry).toBe(
    false,
  );
});
test("registration rejects short or mismatched passwords before creating an account", async () => {
  await show(<RegisterScreen />);
  await credentials(true);
  await fill("Password", "short");
  await fill("Confirm Password", "short");
  await fireEvent.press(screen.getByRole("button", { name: "Register" }));
  expect(await screen.findByText("Use at least 8 characters.")).toBeTruthy();
  await fill("Password", "Example123!");
  await fireEvent.press(screen.getByRole("button", { name: "Register" }));
  expect(await screen.findByText("Passwords must match.")).toBeTruthy();
  expect(register).not.toHaveBeenCalled();
});
test("policy rejection and lookup failure are retryable and do not create an account", async () => {
  await show(<RegisterScreen />);
  await credentials(true);
  jest
    .mocked(checkPasswordPolicy)
    .mockResolvedValueOnce({ isValid: false } as never);
  await fireEvent.press(screen.getByRole("button", { name: "Register" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    /password.*requirements/i,
  );
  expect(register).not.toHaveBeenCalled();
  jest
    .mocked(checkPasswordPolicy)
    .mockRejectedValueOnce({ code: "auth/network-request-failed" });
  await fireEvent.press(screen.getByRole("button", { name: "Register" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/connection/);
  expect(register).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole("button", { name: "Register" }));
  await waitFor(() => expect(register).toHaveBeenCalledTimes(1));
});
test("registration exposes recoverable existing-account errors", async () => {
  register.mockRejectedValueOnce({ code: "auth/email-already-in-use" });
  await show(<RegisterScreen />);
  await credentials(true);
  await fireEvent.press(screen.getByRole("button", { name: "Register" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    /already registered/,
  );
  expect(screen.getByRole("button", { name: "Register" })).toBeEnabled();
});
test("registration reports unavailable requirements and offers an independent retry", async () => {
  jest.mocked(checkPasswordPolicy).mockRejectedValueOnce({ code: "auth/network-request-failed" });
  await show(<RegisterScreen />);
  expect(await screen.findByRole("alert")).toHaveTextContent(/connection/);
  await fireEvent.press(screen.getByRole("button", { name: "Retry password requirements" }));
  expect(await screen.findByLabelText("An uppercase letter: not met")).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull();
});
test("registration blocks repeated taps while Firebase policy is pending and checklist reacts to input", async () => {
  await show(<RegisterScreen />);
  expect(
    await screen.findByLabelText("An uppercase letter: not met"),
  ).toBeTruthy();
  await credentials(true);
  expect(screen.getByLabelText("An uppercase letter: met")).toBeTruthy();
  let resolve!: (
    value: Awaited<ReturnType<typeof checkPasswordPolicy>>,
  ) => void;
  const valid = await checkPasswordPolicy("Example123!");
  jest.mocked(checkPasswordPolicy).mockReturnValueOnce(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const button = screen.getByRole("button", { name: "Register" });
  await fireEvent.press(button);
  await fireEvent.press(button);
  expect(register).not.toHaveBeenCalled();
  await act(() => resolve(valid));
  await waitFor(() => expect(register).toHaveBeenCalledTimes(1));
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
