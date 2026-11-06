import { getAuth, connectAuthEmulator } from "@react-native-firebase/auth";
import { getFirebaseConfiguration } from "../config";
jest.mock("@react-native-firebase/auth", () => ({
  getAuth: jest.fn(),
  connectAuthEmulator: jest.fn(),
}));
jest.mock("../config", () => ({ getFirebaseConfiguration: jest.fn() }));
beforeEach(() => {
  jest
    .mocked(getAuth)
    .mockReturnValue({
      app: { options: { projectId: "demo-cn360-connect" } },
    } as any);
  jest
    .mocked(getFirebaseConfiguration)
    .mockReturnValue({
      options: { projectId: "demo-cn360-connect" },
      emulatorUrl: "http://10.0.2.2:9098",
    });
});
function load() {
  let result: any;
  jest.isolateModules(() => {
    result = require("../native-auth");
  });
  return result;
}
test("native emulator connects once before exposing the shared auth instance", () => {
  const module = load();
  expect(module.getNativeAuth()).toBe(module.getNativeAuth());
  expect(connectAuthEmulator).toHaveBeenCalledTimes(1);
});
test("mismatched Android and JavaScript project configs fail before observation", () => {
  jest
    .mocked(getFirebaseConfiguration)
    .mockReturnValue({ options: { projectId: "other-project" } });
  expect(() => load().getNativeAuth()).toThrow(/does not match/);
  expect(connectAuthEmulator).not.toHaveBeenCalled();
});
test("native emulator never connects to a non-demo project", () => {
  jest
    .mocked(getAuth)
    .mockReturnValue({
      app: { options: { projectId: "real-project" } },
    } as any);
  jest
    .mocked(getFirebaseConfiguration)
    .mockReturnValue({
      options: { projectId: "real-project" },
      emulatorUrl: "http://10.0.2.2:9098",
    });
  expect(() => load().getNativeAuth()).toThrow(/demo-/);
  expect(connectAuthEmulator).not.toHaveBeenCalled();
});
