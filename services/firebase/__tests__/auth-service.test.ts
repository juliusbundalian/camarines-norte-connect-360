import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { getAuthService } from "../auth-service.web";
jest.mock("../client", () => ({
  getFirebaseAuth: () => ({ name: "test-auth" }),
}));
jest.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: jest.fn().mockResolvedValue({}),
  createUserWithEmailAndPassword: jest.fn().mockResolvedValue({}),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  signOut: jest.fn().mockResolvedValue(undefined),
  onAuthStateChanged: jest.fn(),
}));
test("normalizes emails but preserves passwords at the Firebase boundary", async () => {
  await getAuthService().login(" a@example.com ", " pässword ");
  await getAuthService().register(" a@example.com ", " pässword ");
  expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
    expect.anything(),
    "a@example.com",
    " pässword ",
  );
  expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
    expect.anything(),
    "a@example.com",
    " pässword ",
  );
  await getAuthService().logout();
  expect(signOut).toHaveBeenCalledTimes(1);
});
test("masks missing reset accounts while preserving actionable failures", async () => {
  jest
    .mocked(sendPasswordResetEmail)
    .mockRejectedValueOnce({ code: "auth/user-not-found" });
  await expect(
    getAuthService().requestPasswordReset(" a@example.com "),
  ).resolves.toBeUndefined();
  expect(sendPasswordResetEmail).toHaveBeenCalledWith(
    expect.anything(),
    "a@example.com",
  );
  for (const code of [
    "auth/network-request-failed",
    "auth/too-many-requests",
  ]) {
    jest.mocked(sendPasswordResetEmail).mockRejectedValueOnce({ code });
    await expect(
      getAuthService().requestPasswordReset("a@example.com"),
    ).rejects.toEqual({ code });
  }
});

test("observed JS identities preserve creation metadata for the rollout gate",()=>{
 const next=jest.fn();getAuthService().observe(next,jest.fn());
 const publish=jest.mocked(onAuthStateChanged).mock.calls.at(-1)![1] as (u:any)=>void;
 publish({uid:'u',email:null,phoneNumber:null,metadata:{creationTime:'2026-01-01T00:00:00Z'}});
 expect(next).toHaveBeenLastCalledWith({uid:'u',email:null,phoneNumber:null,source:'js',creationTimeMs:1767225600000});
});
