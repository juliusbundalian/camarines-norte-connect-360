import { getAuthService, getPhoneAuthService } from "../auth-service.native";
import {
  onAuthStateChanged,
  verifyPhoneNumber,
  signInWithCredential,
  signOut,
  PhoneAuthProvider,
} from "@react-native-firebase/auth";
import { getAuthService as legacy } from "../auth-service.web";
jest.mock("../native-auth", () => ({
  getNativeAuth: () => ({ native: true }),
}));
jest.mock("@react-native-firebase/auth", () => ({
  onAuthStateChanged: jest.fn(),
  verifyPhoneNumber: jest.fn(),
  signInWithCredential: jest.fn(),
  PhoneAuthProvider: { credential: jest.fn((id, code) => ({ id, code })) },
  signOut: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../auth-service.web", () => ({ getAuthService: jest.fn() }));
const user = { uid: "old", email: "old@example.invalid", phoneNumber: null };
let nativeNext: (u: any) => void, legacyNext: (u: any) => void;
const removeNative = jest.fn(),
  removeLegacy = jest.fn(),
  logout = jest.fn();
beforeEach(() => {
  jest.mocked(onAuthStateChanged).mockImplementation((_a, next) => {
    nativeNext = next as any;
    return removeNative;
  });
  jest.mocked(legacy).mockReturnValue({
    login: jest.fn(),
    register: jest.fn(),
    requestPasswordReset: jest.fn(),
    logout,
    observe: (next) => {
      legacyNext = next;
      return removeLegacy;
    },
  });
  logout.mockResolvedValue(undefined);
});
test("waits for both stores and prefers native identity without dropping a legacy session", () => {
  const next = jest.fn();
  const stop = getAuthService().observe(next, jest.fn());
  nativeNext(null);
  expect(next).not.toHaveBeenCalled();
  legacyNext(user);
  expect(next).toHaveBeenLastCalledWith(user);
  nativeNext({ uid: "new", email: null, phoneNumber: "+639171234567" });
  expect(next).toHaveBeenLastCalledWith({
    uid: "new",
    email: null,
    phoneNumber: "+639171234567",
  });
  stop();
  expect(removeNative).toHaveBeenCalled();
  expect(removeLegacy).toHaveBeenCalled();
});
test("cleans first observer when second setup throws", () => {
  jest.mocked(legacy).mockReturnValue({
    ...legacy(),
    observe: () => {
      throw new Error("setup");
    },
  });
  expect(() => getAuthService().observe(jest.fn(), jest.fn())).toThrow("setup");
  expect(removeNative).toHaveBeenCalled();
});
test("requests verification without signing in until code confirmation", async () => {
  jest.mocked(verifyPhoneNumber).mockReturnValue({
    on: (_event: any, next: any) => {
      next({ state: "sent", verificationId: "session" });
    },
  } as any);
  jest.mocked(signInWithCredential).mockResolvedValue({
    user: { uid: "x", email: null, phoneNumber: "+639171234567" },
  } as any);
  const pending = await getPhoneAuthService().requestCode(
    "+639171234567",
    true,
  );
  expect(signInWithCredential).not.toHaveBeenCalled();
  await pending.confirm("123456");
  expect(verifyPhoneNumber).toHaveBeenCalledWith(
    expect.anything(),
    "+639171234567",
    60,
    true,
  );
  expect(PhoneAuthProvider.credential).toHaveBeenCalledWith(
    "session",
    "123456",
  );
});
test("logout attempts both stores even on failure", async () => {
  jest.mocked(signOut).mockRejectedValueOnce(new Error("native logout"));
  await expect(getAuthService().logout()).rejects.toThrow("native logout");
  expect(logout).toHaveBeenCalled();
});
test("email-only logout succeeds when native Auth already has no user", async () => {
  jest.mocked(signOut).mockRejectedValueOnce({ code: "auth/no-current-user" });
  await expect(getAuthService().logout()).resolves.toBeUndefined();
  expect(logout).toHaveBeenCalled();
});

test("cancelling a session prevents an old code from signing in", async () => {
  jest.mocked(verifyPhoneNumber).mockReturnValue({
    on: (_e: any, next: any) => next({ state: "sent", verificationId: "old" }),
  } as any);
  const pending = await getPhoneAuthService().requestCode("+639171234567");
  getPhoneAuthService().cancel();
  await expect(pending.confirm("123456")).rejects.toMatchObject({
    code: "auth/session-expired",
  });
  expect(signInWithCredential).not.toHaveBeenCalled();
});
test("a credential for a different number is never published", async () => {
  const next = jest.fn();
  const stop = getAuthService().observe(next, jest.fn());
  nativeNext(null);
  legacyNext(null);
  next.mockClear();
  jest.mocked(verifyPhoneNumber).mockReturnValue({
    on: (_e: any, cb: any) => cb({ state: "sent", verificationId: "s" }),
  } as any);
  jest.mocked(signInWithCredential).mockResolvedValue({
    user: { uid: "wrong", email: null, phoneNumber: "+639189999999" },
  } as any);
  const pending = await getPhoneAuthService().requestCode("+639171234567");
  await expect(pending.confirm("123456")).rejects.toMatchObject({
    code: "auth/session-expired",
  });
  expect(next.mock.calls.every(([u]) => !u)).toBe(true);
  stop();
});
test("automatic native verification still waits for explicit confirmation", async () => {
  jest.mocked(verifyPhoneNumber).mockReturnValue({
    on: (_e: any, cb: any) =>
      cb({ state: "verified", verificationId: null, code: null }),
  } as any);
  jest.mocked(signInWithCredential).mockResolvedValue({
    user: { uid: "auto", email: null, phoneNumber: "+639171234567" },
  } as any);
  const handle = await getPhoneAuthService().requestCode("+639171234567");
  expect(handle.automatic).toBe(true);
  expect(signInWithCredential).not.toHaveBeenCalled();
  await handle.confirm("");
  expect(PhoneAuthProvider.credential).toHaveBeenCalledWith(null, "");
});
test("a cancelled in-flight credential cannot publish a user to protected navigation", async () => {
  const next = jest.fn();
  const stop = getAuthService().observe(next, jest.fn());
  nativeNext(null);
  legacyNext(null);
  next.mockClear();
  jest.mocked(verifyPhoneNumber).mockReturnValue({
    on: (_e: any, cb: any) => cb({ state: "sent", verificationId: "late" }),
  } as any);
  let resolve!: (value: any) => void;
  jest
    .mocked(signInWithCredential)
    .mockReturnValue(new Promise((r) => (resolve = r)));
  const handle = await getPhoneAuthService().requestCode("+639171234567");
  const pending = handle.confirm("123456");
  const late = { uid: "late", email: null, phoneNumber: "+639171234567" };
  nativeNext(late);
  expect(next).not.toHaveBeenCalled();
  getPhoneAuthService().cancel();
  resolve({ user: late });
  await expect(pending).rejects.toMatchObject({ code: "auth/session-expired" });
  nativeNext(late);
  expect(next.mock.calls.every(([u]) => !u)).toBe(true);
  stop();
});
