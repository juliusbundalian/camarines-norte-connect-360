import {createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut} from 'firebase/auth';
import {getAuthService} from '../auth-service';
jest.mock('../client', () => ({getFirebaseAuth: () => ({name:'test-auth'})}));
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn().mockResolvedValue({}), createUserWithEmailAndPassword: jest.fn().mockResolvedValue({}),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined), signOut: jest.fn().mockResolvedValue(undefined), onAuthStateChanged: jest.fn(),
}));
test('normalizes emails but preserves passwords at the Firebase boundary', async () => {
  await getAuthService().login(' a@example.com ', ' pässword ');
  await getAuthService().register(' a@example.com ', ' pässword ');
  expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(),'a@example.com',' pässword ');
  expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(),'a@example.com',' pässword ');
  await getAuthService().logout(); expect(signOut).toHaveBeenCalledTimes(1);
});
test('masks missing reset accounts while preserving actionable failures', async () => {
  jest.mocked(sendPasswordResetEmail).mockRejectedValueOnce({code:'auth/user-not-found'});
  await expect(getAuthService().requestPasswordReset(' a@example.com ')).resolves.toBeUndefined();
  expect(sendPasswordResetEmail).toHaveBeenCalledWith(expect.anything(),'a@example.com');
  for (const code of ['auth/network-request-failed','auth/too-many-requests']) {
    jest.mocked(sendPasswordResetEmail).mockRejectedValueOnce({code});
    await expect(getAuthService().requestPasswordReset('a@example.com')).rejects.toEqual({code});
  }
});
