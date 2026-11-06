import { test } from "node:test";
import assert from "node:assert/strict";
import { createDemoAndroidConfig } from "./firebase-android-demo.mjs";
test("native QA config cannot target a real Firebase project or production app", () => {
  assert.throws(
    () =>
      createDemoAndroidConfig(
        "camarines-norte-connect-360",
        "ph.cn360connect.app.phoneqa",
      ),
    /demo-/,
  );
  assert.throws(
    () => createDemoAndroidConfig("demo-cn360-connect", "ph.cn360connect.app"),
    /phoneqa/,
  );
  const config = createDemoAndroidConfig(
    "demo-cn360-connect",
    "ph.cn360connect.app.phoneqa",
  );
  assert.equal(config.project_info.project_id, "demo-cn360-connect");
  assert.equal(
    config.client[0].client_info.android_client_info.package_name,
    "ph.cn360connect.app.phoneqa",
  );
});
