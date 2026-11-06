import { act, renderHook } from "@testing-library/react-native";
import {
  PhoneVerificationProvider,
  usePhoneVerification,
} from "../PhoneVerificationProvider";
import { getPhoneAuthService } from "../../../services/firebase/auth-service";
jest.mock("../../../services/firebase/auth-service", () => ({
  getPhoneAuthService: jest.fn(),
}));
const requestCode = jest.fn(),
  cancel = jest.fn(),
  confirm = jest.fn();
const show = () =>
  renderHook(usePhoneVerification, { wrapper: PhoneVerificationProvider });
beforeEach(() => {
  confirm.mockReset().mockResolvedValue(undefined);
  requestCode.mockReset().mockResolvedValue({ confirm });
  jest.mocked(getPhoneAuthService).mockReturnValue({ requestCode, cancel });
});
test("normalizes phone, keeps code in memory and guards duplicate sends", async () => {
  let resolve!: (v: any) => void;
  requestCode.mockReturnValue(
    new Promise((r) => {
      resolve = r;
    }),
  );
  const { result } = await show();
  let first!: Promise<boolean>;
  await act(() => {
    first = result.current.start("09171234567", "login");
  });
  expect(result.current.sending).toBe(true);
  await act(async () => {
    expect(await result.current.start("09171234567", "login")).toBe(false);
  });
  expect(requestCode).toHaveBeenCalledTimes(1);
  await act(async () => {
    resolve({ confirm });
    await first;
  });
  expect(result.current.phone).toBe("+639171234567");
  expect(result.current.ready).toBe(true);
});
test("cancel invalidates a late response", async () => {
  let resolve!: (v: any) => void;
  requestCode.mockReturnValue(
    new Promise((r) => {
      resolve = r;
    }),
  );
  const { result } = await show();
  let p!: Promise<boolean>;
  await act(() => {
    p = result.current.start("09171234567", "register");
  });
  await act(() => result.current.cancel());
  await act(async () => {
    resolve({ confirm });
    expect(await p).toBe(false);
  });
  expect(result.current.phone).toBeNull();
  expect(result.current.ready).toBe(false);
  expect(cancel).toHaveBeenCalled();
});
test("wrong code stays retryable and duplicate confirms do not reach SDK", async () => {
  const { result } = await show();
  await act(() => result.current.start("09171234567", "login"));
  await act(() => result.current.confirm("12"));
  expect(confirm).not.toHaveBeenCalled();
  confirm.mockRejectedValueOnce({ code: "auth/invalid-verification-code" });
  await act(() => result.current.confirm("123456"));
  expect(result.current.error).toMatch(/incorrect/i);
  expect(result.current.ready).toBe(true);
  let resolve!: () => void;
  confirm.mockReturnValue(
    new Promise<void>((r) => {
      resolve = r;
    }),
  );
  let p!: Promise<boolean>;
  await act(() => {
    p = result.current.confirm("123456");
  });
  await act(async () => {
    expect(await result.current.confirm("123456")).toBe(false);
  });
  expect(confirm).toHaveBeenCalledTimes(2);
  await act(async () => {
    resolve();
    await p;
  });
});
test("resend respects60sec cooldown and failed resend leaves number for retry", async () => {
  const clock = jest.spyOn(Date, "now").mockReturnValue(1000);
  try {
    const { result } = await show();
    await act(() => result.current.start("09171234567", "login"));
    await act(async () => {
      expect(await result.current.resend()).toBe(false);
    });
    clock.mockReturnValue(61001);
    requestCode.mockRejectedValueOnce({ code: "auth/network-request-failed" });
    await act(() => result.current.resend());
    expect(result.current.phone).toBe("+639171234567");
    expect(result.current.error).toMatch(/connection/i);
    await act(() => result.current.resend());
    expect(requestCode).toHaveBeenLastCalledWith("+639171234567", true);
    expect(result.current.ready).toBe(true);
  } finally {
    clock.mockRestore();
  }
});
test("missing session cannot confirm or initialize a native service", async () => {
  const { result, unmount } = await show();
  await act(async () =>
    expect(await result.current.confirm("123456")).toBe(false),
  );
  expect(confirm).not.toHaveBeenCalled();
  await unmount();
  expect(getPhoneAuthService).not.toHaveBeenCalled();
});
