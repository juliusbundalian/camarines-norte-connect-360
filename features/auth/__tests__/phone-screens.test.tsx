import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import { router } from "expo-router";
import LoginScreen from "../LoginScreen";
import RegisterScreen from "../RegisterScreen";
import VerifyPhoneScreen from "../VerifyPhoneScreen";
import TermsScreen from "../TermsScreen";
import {
  PhoneVerificationProvider,
  usePhoneVerification,
} from "../PhoneVerificationProvider";
import { getPhoneAuthService } from "../../../services/firebase/auth-service";
import { Button } from "react-native";
jest.mock("expo-font", () => ({ useFonts: () => [true, null] }));
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useFocusEffect: (cb: () => void) => require("react").useEffect(cb, [cb]),
}));
jest.mock("../../../services/firebase/auth-service", () => ({
  getPhoneAuthService: jest.fn(),
}));
const requestCode = jest.fn(),
  confirm = jest.fn(),
  cancel = jest.fn();
beforeEach(() => {
  requestCode.mockReset().mockResolvedValue({ confirm });
  confirm.mockReset().mockResolvedValue(undefined);
  jest.mocked(getPhoneAuthService).mockReturnValue({ requestCode, cancel });
});
const show = (child: React.ReactNode) =>
  render(
    <PaperProvider>
      <PhoneVerificationProvider>{child}</PhoneVerificationProvider>
    </PaperProvider>,
  );
async function numberAndConsent() {
  await fireEvent.changeText(
    screen.getByLabelText("Mobile number"),
    "09171234567",
  );
  await fireEvent.press(
    screen.getByRole("checkbox", { name: "Send me an SMS verification code" }),
  );
}
test("phone entry validates number and consent before requesting a normalized code", async () => {
  await show(<LoginScreen />);
  await fireEvent.press(screen.getByRole("button", { name: "Send code" }));
  expect(
    await screen.findByText("Enter a valid Philippine mobile number."),
  ).toBeTruthy();
  expect(requestCode).not.toHaveBeenCalled();
  await fireEvent.changeText(
    screen.getByLabelText("Mobile number"),
    "09171234567",
  );
  await fireEvent.press(screen.getByRole("button", { name: "Send code" }));
  expect(
    await screen.findByText("Please allow us to send your verification SMS."),
  ).toBeTruthy();
  expect(requestCode).not.toHaveBeenCalled();
  await fireEvent.press(
    screen.getByRole("checkbox", { name: "Send me an SMS verification code" }),
  );
  await fireEvent.press(screen.getByRole("button", { name: "Send code" }));
  await waitFor(() =>
    expect(router.push).toHaveBeenCalledWith("/verify-phone"),
  );
  expect(requestCode).toHaveBeenCalledWith("+639171234567", false);
  expect(screen.queryByLabelText("Password")).toBeNull();
});
test("send failures preserve the number and expose a retry", async () => {
  requestCode.mockRejectedValueOnce({ code: "auth/network-request-failed" });
  await show(<RegisterScreen />);
  await numberAndConsent();
  await fireEvent.press(screen.getByRole("button", { name: "Send code" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/connection/);
  expect(screen.getByLabelText("Mobile number")).toHaveDisplayValue(
    "09171234567",
  );
  await fireEvent.press(screen.getByRole("button", { name: "Send code" }));
  await waitFor(() =>
    expect(router.push).toHaveBeenCalledWith("/verify-phone"),
  );
});
test("pending send disables submission and navigation", async () => {
  let resolve!: (v: any) => void;
  requestCode.mockReturnValue(new Promise((r) => (resolve = r)));
  await show(<LoginScreen />);
  await numberAndConsent();
  await fireEvent.press(screen.getByRole("button", { name: "Send code" }));
  expect(screen.getByRole("button", { name: "Send code" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Sign up" })).toBeDisabled();
  await act(() => resolve({ confirm }));
});
test("signup links to informational Terms without accepting unpublished terms", async () => {
  await show(<RegisterScreen />);
  await fireEvent.press(
    screen.getByRole("button", { name: "Terms & conditions" }),
  );
  expect(router.push).toHaveBeenCalledWith("/terms");
  expect(screen.queryByText(/I agree/i)).toBeNull();
});
function Started() {
  const s = usePhoneVerification();
  return s.phone ? (
    <VerifyPhoneScreen />
  ) : (
    <Button
      title="Start"
      onPress={() => void s.start("09171234567", "register")}
    />
  );
}
test("OTP validates six digits, supports paste, and retains the session on an incorrect code", async () => {
  confirm.mockRejectedValueOnce({ code: "auth/invalid-verification-code" });
  await show(<Started />);
  await fireEvent.press(screen.getByRole("button", { name: "Start" }));
  await waitFor(() =>
    expect(screen.getByLabelText("Verification code")).toBeTruthy(),
  );
  await fireEvent.press(screen.getByRole("button", { name: "Verify number" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/6-digit/);
  await fireEvent.changeText(
    screen.getByLabelText("Verification code"),
    "123456",
  );
  await fireEvent.press(screen.getByRole("button", { name: "Verify number" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/incorrect/);
  expect(screen.getByRole("button", { name: /Resend code/ })).toBeDisabled();
  await fireEvent.press(screen.getByRole("button", { name: "Verify number" }));
  await waitFor(() => expect(confirm).toHaveBeenCalledTimes(2));
});
test("an OTP deep link without a session returns to phone entry", async () => {
  await show(<VerifyPhoneScreen />);
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/login"));
  expect(requestCode).not.toHaveBeenCalled();
});
test("Terms page explicitly shows pending content and has no agreement action", async () => {
  await show(<TermsScreen />);
  expect(screen.getByText("Content pending")).toBeTruthy();
  expect(screen.getByText(/will be published here/)).toBeTruthy();
  expect(screen.queryByRole("checkbox")).toBeNull();
});
