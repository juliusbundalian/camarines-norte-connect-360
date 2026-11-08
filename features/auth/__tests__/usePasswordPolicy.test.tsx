import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { PasswordPolicy, PasswordValidationStatus } from "firebase/auth";
import { checkPasswordPolicy } from "../../../services/firebase/password-policy";
import { usePasswordPolicy } from "../usePasswordPolicy";
jest.mock("../../../services/firebase/password-policy", () => ({
  checkPasswordPolicy: jest.fn(),
}));
const policy: PasswordPolicy = {
  customStrengthOptions: { minPasswordLength: 8 },
  allowedNonAlphanumericCharacters: "!",
  enforcementState: "ENFORCE",
  forceUpgradeOnSignin: false,
};
const status = { isValid: false, passwordPolicy: policy };
beforeEach(() =>
  jest.mocked(checkPasswordPolicy).mockReset().mockResolvedValue(status),
);
test("loads policy only for registration and recovers after a failed lookup", async () => {
  jest
    .mocked(checkPasswordPolicy)
    .mockRejectedValueOnce({ code: "auth/network-request-failed" });
  const { result } = await renderHook(() => usePasswordPolicy(true));
  await waitFor(() => expect(result.current.error).toMatch(/connection/));
  expect(result.current.policy).toBeNull();
  await act(() => {
    result.current.retry();
    result.current.retry();
  });
  await waitFor(() => expect(result.current.policy).toEqual(policy));
  expect(checkPasswordPolicy).toHaveBeenCalledTimes(2);
});
test("does not fetch requirements for login", async () => {
  const { result } = await renderHook(() => usePasswordPolicy(false));
  expect(result.current.loading).toBe(false);
  expect(checkPasswordPolicy).not.toHaveBeenCalled();
});
test("an older lookup cannot overwrite a newer policy from submission", async () => {
  let resolve!: (value: PasswordValidationStatus) => void;
  jest.mocked(checkPasswordPolicy).mockReturnValueOnce(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const { result } = await renderHook(() => usePasswordPolicy(true));
  const newer = { ...policy, customStrengthOptions: { minPasswordLength: 12 } };
  await act(() => result.current.accept(newer));
  await act(() => resolve(status));
  expect(result.current.policy).toEqual(newer);
});
test("a response from an abandoned registration does not populate the next screen", async () => {
  let resolve!: (value: PasswordValidationStatus) => void;
  jest.mocked(checkPasswordPolicy).mockReturnValueOnce(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const { result, rerender, unmount } = await renderHook(
    (enabled: boolean) => usePasswordPolicy(enabled),
    { initialProps: true },
  );
  await rerender(false);
  await act(() => resolve(status));
  expect(result.current.policy).toBeNull();
  expect(result.current.loading).toBe(false);
  await unmount();
});
