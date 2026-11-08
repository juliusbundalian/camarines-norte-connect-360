import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../AuthProvider";
import LoginScreen from "../LoginScreen";
import RegisterScreen from "../RegisterScreen";
import ForgotPasswordScreen from "../ForgotPasswordScreen";
import WelcomeScreen from "../WelcomeScreen";
import type { User } from "firebase/auth";
import { checkPasswordPolicy } from "../../../services/firebase/password-policy";
import { authTokens } from "../../../theme/auth";
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
  useLocalSearchParams: jest.fn(() => ({})),
  useFocusEffect: (cb: () => void) => require("react").useEffect(cb, [cb]),
}));
const login = jest.fn(),
  register = jest.fn(),
  reset = jest.fn(),
  logout = jest.fn();
beforeEach(() => {
  jest.mocked(useLocalSearchParams).mockReturnValue({});
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
  if (signup) {
    await fill("Confirm Password", "Example123!");
    await fireEvent.press(screen.getByRole("checkbox"));
  }
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
  expect(router.push).toHaveBeenCalledWith({pathname:"/forgot-password",params:{returnTo:"/menu"}});
  await fireEvent.press(screen.getByRole("button", { name: "Sign up" }));
  expect(router.push).toHaveBeenCalledWith({pathname:"/register",params:{returnTo:"/menu"}});
});
test("login validates required fields and email without rejecting existing short passwords", async () => {
  await show(<LoginScreen />);
  expect(screen.getByRole("button", { name: "Login" })).toBeDisabled();
  expect(screen.queryByText("Enter your email address.")).toBeNull();
  await fireEvent(screen.getByLabelText("Email"), "blur");
  await fireEvent(screen.getByLabelText("Password"), "blur");
  expect(screen.queryByText("Enter your email address.")).toBeNull();
  expect(screen.queryByText("Enter your password.")).toBeNull();
  await fill("Email", "bad");
  await fireEvent(screen.getByLabelText("Password"), "submitEditing");
  expect(await screen.findByRole("alert")).toHaveTextContent("Enter a valid email address.");
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
  expect(screen.getByRole("button", { name: "Register" })).toBeDisabled();
  await fireEvent(screen.getByLabelText("Password"), "blur");
  expect(screen.queryByText("Use at least 8 characters.")).toBeNull();
  expect(screen.getByLabelText("Password").props.accessibilityHint).toBeUndefined();
  expect(screen.getByText("Password Requirements:")).toBeTruthy();
  await fill("Password", "Example123!");
  await fireEvent(screen.getByLabelText("Confirm Password"), "blur");
  expect(screen.queryByText("Passwords must match.")).toBeNull();
  await fireEvent(screen.getByLabelText("Confirm Password"), "submitEditing");
  expect(await screen.findByRole("alert")).toHaveTextContent("Passwords must match.");
  expect(register).not.toHaveBeenCalled();
});
test("policy rejection and lookup failure are retryable and do not create an account", async () => {
  await show(<RegisterScreen />);
  await credentials(true);
  const previous = await checkPasswordPolicy("Example123!");
  jest.mocked(checkPasswordPolicy).mockResolvedValueOnce({
    ...previous,
    isValid: false,
    passwordPolicy: {
      ...previous.passwordPolicy,
      customStrengthOptions: {
        ...previous.passwordPolicy.customStrengthOptions,
        minPasswordLength: 12,
      },
    },
  });
  await fireEvent.press(screen.getByRole("button", { name: "Register" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    /password.*requirements/i,
  );
  expect(register).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Register" })).toBeDisabled();
  await fill("Password", "Example123!xx");
  await fill("Confirm Password", "Example123!xx");
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
  jest
    .mocked(checkPasswordPolicy)
    .mockRejectedValueOnce({ code: "auth/network-request-failed" });
  await show(<RegisterScreen />);
  expect(await screen.findByRole("alert")).toHaveTextContent(/connection/);
  await credentials(true);
  expect(screen.getByRole("button", { name: "Register" })).toBeDisabled();
  await fireEvent(screen.getByLabelText("Confirm Password"), "submitEditing");
  expect(register).not.toHaveBeenCalled();
  await fireEvent.press(
    screen.getByRole("button", { name: "Retry password requirements" }),
  );
  expect(await screen.findByLabelText("Must include at least one uppercase letter (A–Z): met")).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByRole("button", { name: "Register" })).toBeEnabled();
});
test.each([
  { Screen: LoginScreen, label: "Login" },
  { Screen: RegisterScreen, label: "Register" },
  { Screen: ForgotPasswordScreen, label: "Send Reset Link" },
] as const)(
  "$label is initially disabled at 40 percent opacity with original colors",
  async ({ Screen, label }) => {
    await show(<Screen />);
    expect(screen.getByRole("button", { name: label })).toBeDisabled();
    expect(
      screen.getByTestId("auth-primary-action-container-outer-layer"),
    ).toHaveStyle({ opacity: 0.4 });
    expect(screen.getByTestId("auth-primary-action-container")).toHaveStyle({
      backgroundColor: authTokens.colors.action,
    });
    expect(screen.getByTestId("auth-primary-action-text")).toHaveStyle({
      color: authTokens.colors.text,
    });
  },
);
test("login disables immediately on invalid edits and keyboard cannot bypass validation", async () => {
  await show(<LoginScreen />);
  await credentials();
  expect(screen.getByRole("button", { name: "Login" })).toBeEnabled();
  expect(
    screen.getByTestId("auth-primary-action-container-outer-layer"),
  ).toHaveStyle({ opacity: 1 });
  expect(checkPasswordPolicy).not.toHaveBeenCalled();
  await fill("Email", "   ");
  expect(screen.getByRole("button", { name: "Login" })).toBeDisabled();
  await fireEvent(screen.getByLabelText("Password"), "submitEditing");
  expect(login).not.toHaveBeenCalled();
  await fill("Email", "person@example.com");
  await fill("Password", "");
  expect(screen.getByRole("button", { name: "Login" })).toBeDisabled();
  await fill("Password", "short");
  expect(screen.getByRole("button", { name: "Login" })).toBeEnabled();
});
test.each([
  "abcdefgh1!",
  "ABCDEFGH1!",
  "Abcdefghi!",
  "Abcdefgh12",
  "Abcdefgh1?",
])("registration gates an unmet policy for %s", async (password) => {
  await show(<RegisterScreen />);
  await fill("Email", "person@example.com");
  await fill("Password", password);
  await fill("Confirm Password", password);
  expect(screen.getByRole("button", { name: "Register" })).toBeDisabled();
  await fireEvent(screen.getByLabelText("Confirm Password"), "submitEditing");
  expect(register).not.toHaveBeenCalled();
});
test("changing a compliant password invalidates confirmation immediately", async () => {
  await show(<RegisterScreen />);
  await credentials(true);
  expect(screen.getByRole("button", { name: "Register" })).toBeEnabled();
  await fill("Password", "OtherExample123!");
  expect(screen.getByRole("button", { name: "Register" })).toBeDisabled();
  await fill("Confirm Password", "OtherExample123!");
  expect(screen.getByRole("button", { name: "Register" })).toBeEnabled();
});
test("policy loading blocks registration without locking navigation or visibility", async () => {
  jest.mocked(checkPasswordPolicy).mockReturnValueOnce(new Promise(() => {}));
  await show(<RegisterScreen />);
  await credentials(true);
  expect(screen.getByText("Loading password requirements...")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Register" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Log in" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "Show password" })).toBeEnabled();
  await fireEvent(screen.getByLabelText("Confirm Password"), "submitEditing");
  expect(register).not.toHaveBeenCalled();
});
test("a server password-policy rejection refreshes requirements and gates the old candidate", async () => {
  await show(<RegisterScreen />);
  await credentials(true);
  const previous = await checkPasswordPolicy("Example123!");
  jest
    .mocked(checkPasswordPolicy)
    .mockResolvedValueOnce(previous)
    .mockResolvedValueOnce({
      ...previous,
      isValid: false,
      passwordPolicy: {
        ...previous.passwordPolicy,
        customStrengthOptions: { minPasswordLength: 12 },
      },
    });
  register.mockRejectedValueOnce({
    code: "auth/password-does-not-meet-requirements",
  });
  await fireEvent.press(screen.getByRole("button", { name: "Register" }));
  expect(
    await screen.findByLabelText("Must be at least 12 characters long: not met"),
  ).toBeTruthy();
  expect(screen.getByRole("button", { name: "Register" })).toBeDisabled();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    /password.*requirements/i,
  );
});
test("reset gate follows email edits and pending or failed requests", async () => {
  let reject!: (error: unknown) => void;
  reset.mockReturnValueOnce(
    new Promise((_, fail) => {
      reject = fail;
    }),
  );
  await show(<ForgotPasswordScreen />);
  await fill("Email", "a@example.com");
  expect(screen.getByRole("button", { name: "Send Reset Link" })).toBeEnabled();
  await fill("Email", "bad");
  expect(
    screen.getByRole("button", { name: "Send Reset Link" }),
  ).toBeDisabled();
  await fireEvent(screen.getByLabelText("Email"), "submitEditing");
  expect(reset).not.toHaveBeenCalled();
  await fill("Email", " a@example.com ");
  const button = screen.getByRole("button", { name: "Send Reset Link" });
  await fireEvent.press(button);
  await fireEvent.press(button);
  expect(reset).toHaveBeenCalledTimes(1);
  expect(button).toBeDisabled();
  await act(() => reject({ code: "auth/network-request-failed" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/connection/);
  expect(screen.getByRole("button", { name: "Send Reset Link" })).toBeEnabled();
  expect(screen.getByLabelText("Email").props.value).toBe(" a@example.com ");
});
test("registration blocks repeated taps while Firebase policy is pending and checklist reacts to input", async () => {
  await show(<RegisterScreen />);
  expect(
    await screen.findByLabelText("Must include at least one uppercase letter (A–Z): not met"),
  ).toBeTruthy();
  await credentials(true);
  expect(screen.getByLabelText("Must include at least one uppercase letter (A–Z): met")).toBeTruthy();
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
  expect(router.replace).toHaveBeenCalledWith({pathname:"/login",params:{returnTo:"/menu"}});
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

test("confirmation mismatch is reported in an alert only after submission", async () => {
  await show(<RegisterScreen />);
  await credentials(true);
  await fireEvent(screen.getByLabelText("Confirm Password"), "blur");
  await fill("Password", "OtherExample123!");
  expect(screen.getByRole("button", { name: "Register" })).toBeDisabled();
  expect(screen.queryByText("Passwords must match.")).toBeNull();
  await fireEvent(screen.getByLabelText("Confirm Password"), "submitEditing");
  expect(await screen.findByRole("alert")).toHaveTextContent("Passwords must match.");
});

test("correcting password to match clears the validation alert", async () => {
  await show(<RegisterScreen />);
  await credentials(true);
  await fill("Confirm Password", "OtherExample123!");
  await fireEvent(screen.getByLabelText("Confirm Password"), "blur");
  expect(screen.queryByText("Passwords must match.")).toBeNull();
  await fireEvent(screen.getByLabelText("Confirm Password"), "submitEditing");
  expect(await screen.findByRole("alert")).toHaveTextContent("Passwords must match.");
  await fill("Password", "OtherExample123!");
  expect(screen.getByRole("button", { name: "Register" })).toBeEnabled();
  expect(screen.queryByText("Passwords must match.")).toBeNull();
});


test.each([
  ["Login", LoginScreen, ["Email", "Password"]],
  ["Register", RegisterScreen, ["Email", "Password", "Confirm Password"]],
  ["Send Reset Link", ForgotPasswordScreen, ["Email"]],
] as const)("%s keeps empty fields neutral after blur and clearing", async (button, Component, labels) => {
  await show(<Component />);
  for (const label of labels) {
    await fireEvent(screen.getByLabelText(label), "blur");
    expect(screen.getByLabelText(label).props.accessibilityHint).toBeUndefined();
    await fill(label, "invalid");
    await fill(label, "");
    expect(screen.getByLabelText(label).props.accessibilityHint).toBeUndefined();
  }
  expect(screen.getByRole("button", { name: button })).toBeDisabled();
  expect(login).not.toHaveBeenCalled();
  expect(register).not.toHaveBeenCalled();
  expect(reset).not.toHaveBeenCalled();
});

test.each([LoginScreen, RegisterScreen, ForgotPasswordScreen])(
  "%p uses an alert after submission without inline email feedback",
  async (Component) => {
    await show(<Component />);
    const email = () => screen.getByLabelText("Email");
    await fireEvent(email(), "focus");
    await fill("Email", "unfinished");
    expect(screen.queryByText("Enter a valid email address.")).toBeNull();
    await fireEvent(email(), "blur");
    expect(screen.queryByText("Enter a valid email address.")).toBeNull();
    await fireEvent(email(), "focus");
    await fill("Email", "unfinished@");
    expect(screen.queryByText("Enter a valid email address.")).toBeNull();
    expect(email().props.accessibilityHint).toBeUndefined();
    const submitLabel = Component === LoginScreen ? "Password" : Component === RegisterScreen ? "Confirm Password" : "Email";
    await fireEvent(screen.getByLabelText(submitLabel), "submitEditing");
    expect(await screen.findByRole("alert")).toHaveTextContent("Enter a valid email address.");
    expect(email().props.accessibilityHint).toBeUndefined();
    await fill("Email", "person@example.com");
    await fireEvent(email(), "blur");
    expect(screen.queryByText("Enter a valid email address.")).toBeNull();
  },
);


test("registration requires the terms checkbox and keeps the Terms link independent", async () => {
  await show(<RegisterScreen />);
  await fill("Email", "person@example.com");
  await fill("Password", "Example123!");
  await fill("Confirm Password", "Example123!");
  expect(screen.getByRole("checkbox")).not.toBeChecked();
  expect(screen.getByRole("button", { name: "Register" })).toBeDisabled();
  await fireEvent(screen.getByLabelText("Confirm Password"), "submitEditing");
  expect(await screen.findByRole("alert")).toHaveTextContent("Please agree to the Terms & conditions to register.");
  expect(register).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole("button", { name: "Terms & conditions" }));
  expect(router.push).toHaveBeenCalledWith("/terms");
  expect(screen.getByRole("checkbox")).not.toBeChecked();
  await fireEvent.press(screen.getByRole("checkbox"));
  expect(screen.getByRole("button", { name: "Register" })).toBeEnabled();
  await fireEvent.press(screen.getByRole("checkbox"));
  expect(screen.getByRole("button", { name: "Register" })).toBeDisabled();
});


test("auth navigation preserves its safe source and cold Back returns to that source", async () => {
  jest.mocked(useLocalSearchParams).mockReturnValue({returnTo:'/account'});
  await show(<LoginScreen/>);
  await fireEvent.press(screen.getByRole('button',{name:'Back'}));
  expect(router.replace).toHaveBeenCalledWith('/account');
  await fireEvent.press(screen.getByRole('button',{name:'Sign up'}));
  expect(router.push).toHaveBeenCalledWith({pathname:'/register',params:{returnTo:'/account'}});
  await fireEvent.press(screen.getByRole('button',{name:'Forgot Password?'}));
  expect(router.push).toHaveBeenCalledWith({pathname:'/forgot-password',params:{returnTo:'/account'}});
});
test("password recovery Back preserves the safe auth return path", async () => {
  jest.mocked(useLocalSearchParams).mockReturnValue({returnTo:'/wishlist'});
  await show(<ForgotPasswordScreen/>);
  await fireEvent.press(screen.getByRole('button',{name:'Back to Login'}));
  expect(router.replace).toHaveBeenCalledWith({pathname:'/login',params:{returnTo:'/wishlist'}});
});
