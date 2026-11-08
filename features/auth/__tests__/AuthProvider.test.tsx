import { act, renderHook } from "@testing-library/react-native";
import type { AuthUser as User } from "../../../services/firebase/auth-types";
import { AuthProvider, useAuth } from "../AuthProvider";
import { getAuthService } from "../../../services/firebase/auth-service";
jest.mock("../../../services/firebase/auth-service", () => ({
  getAuthService: jest.fn(),
}));
function setup() {
  const next: ((user: User | null) => void)[] = [];
  const errors: ((e: unknown) => void)[] = [];
  const unsub = jest.fn();
  const login = jest.fn().mockResolvedValue(undefined);
  jest.mocked(getAuthService).mockReturnValue({
    login,
    register: login,
    logout: login,
    requestPasswordReset: login,
    observe: (cb, err) => {
      next.push(cb);
      errors.push(err);
      return unsub;
    },
  });
  return { next, errors, unsub, login };
}
test("waits for observed state and never grants access from an action alone", async () => {
  const { next, unsub } = setup();
  const { result, unmount } = await renderHook(useAuth, {
    wrapper: AuthProvider,
  });
  expect(result.current.ready).toBe(false);
  await act(async () => {
    await result.current.login("a@example.com", "password");
  });
  expect(result.current.user).toBeNull();
  expect(result.current.ready).toBe(false);
  await act(() => next[0]!(null));
  expect(result.current.ready).toBe(true);
  await unmount();
  expect(unsub).toHaveBeenCalledTimes(1);
});
test("retry ignores stale callbacks and recovers an observation failure", async () => {
  const { next, errors, unsub } = setup();
  const { result } = await renderHook(useAuth, { wrapper: AuthProvider });
  await act(() => errors[0]!(new Error("offline")));
  expect(result.current.ready).toBe(true);
  expect(result.current.error).toBeTruthy();
  await act(() => result.current.retry());
  expect(unsub).toHaveBeenCalledTimes(1);
  await act(() => next[0]!({ email: "stale@example.com" } as User));
  expect(result.current.user).toBeNull();
  await act(() => next[1]!(null));
  expect(result.current.error).toBeNull();
  expect(result.current.ready).toBe(true);
});
test("configuration failure settles instead of leaving the splash pending", async () => {
  jest.mocked(getAuthService).mockImplementation(() => {
    throw new Error("Set EXPO_PUBLIC_FIREBASE_API_KEY");
  });
  const { result } = await renderHook(useAuth, { wrapper: AuthProvider });
  expect(result.current.ready).toBe(true);
  expect(result.current.error).toMatch(/EXPO_PUBLIC_FIREBASE_API_KEY/);
});

test("retry immediately invalidates callbacks before effect cleanup runs", async () => {
  const { next } = setup();
  const { result } = await renderHook(useAuth, { wrapper: AuthProvider });
  await act(() => {
    result.current.retry();
    next[0]!({ email: "stale@example.com" } as User);
  });
  expect(result.current.user).toBeNull();
  expect(result.current.ready).toBe(false);
});
