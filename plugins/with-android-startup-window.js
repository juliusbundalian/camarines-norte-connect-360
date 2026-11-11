const {mkdir, writeFile} = require("node:fs/promises");
const path = require("node:path");
const {withDangerousMod, withMainActivity} = require("expo/config-plugins");

const startupDrawable = `<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
  <item android:drawable="@color/splashscreen_background" />
  <item><bitmap android:src="@drawable/splashscreen_logo" android:gravity="center" /></item>
</layer-list>
`;

module.exports = function withAndroidStartupWindow(config) {
  config = withDangerousMod(config, ["android", async (mod) => {
    const directory = path.join(mod.modRequest.platformProjectRoot, "app/src/main/res/drawable");
    await mkdir(directory, {recursive: true});
    await writeFile(path.join(directory, "startup_window.xml"), startupDrawable);
    return mod;
  }]);

  return withMainActivity(config, (mod) => {
    const anchor = "    super.onCreate(null)";
    const handoff = [
      "    // Draw a branded window while React loads, even if Android removes its starting window.",
      "    window.setBackgroundDrawableResource(R.drawable.startup_window)",
      "    SplashScreenManager.hide()",
    ].join("\n");
    const {contents} = mod.modResults;
    if (contents.includes(handoff)) return mod;
    if (!contents.includes(anchor)) throw new Error("Cannot locate the Android startup window handoff.");
    mod.modResults.contents = contents.replace(anchor, `${anchor}\n${handoff}`);
    return mod;
  });
};
