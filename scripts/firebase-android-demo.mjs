import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
/** Synthetic client identifiers for isolated emulator QA only. Never a live config. */
export function createDemoAndroidConfig(projectId, packageName) {
  if (!/^demo-[a-z0-9-]+$/.test(projectId))
    throw new Error("Only demo- Firebase projects are allowed.");
  if (!/^ph\.cn360connect\.app\.phoneqa$/.test(packageName))
    throw new Error("Use the isolated ph.cn360connect.app.phoneqa package.");
  return {
    project_info: {
      project_number: "123456789012",
      project_id: projectId,
      storage_bucket: `${projectId}.appspot.com`,
    },
    client: [
      {
        client_info: {
          mobilesdk_app_id: "1:123456789012:android:0123456789abcdef012345",
          android_client_info: { package_name: packageName },
        },
        oauth_client: [],
        api_key: [
          { current_key: "AIzaSyDemoOnlyNotARealFirebaseKey123456789" },
        ],
        services: { appinvite_service: { other_platform_oauth_client: [] } },
      },
    ],
    configuration_version: "1",
  };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const output = process.argv[2];
  if (!output)
    throw new Error(
      "Usage: node scripts/firebase-android-demo.mjs /tmp/demo-google-services.json",
    );
  writeFileSync(
    output,
    JSON.stringify(
      createDemoAndroidConfig(
        "demo-cn360-connect",
        "ph.cn360connect.app.phoneqa",
      ),
      null,
      2,
    ),
    { flag: "wx" },
  );
}
