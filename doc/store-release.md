# Store Packaging Checklist (Android + Windows)

Use this checklist before producing store packages.

## Play Store screenshots

Whenever the UI changes enough to make existing store screenshots stale, regenerate
them instead of retaking manually:

```bash
node scripts/store-screenshots/capture.mjs            # all devices/themes/screens
node scripts/store-screenshots/capture.mjs --list      # preview targets, no capture
node scripts/store-screenshots/capture.mjs --only phone,dark   # filter by device/theme/screen name
```

Edit `scripts/store-screenshots/definitions.mjs` to add/change screens, devices, or
the sample profile (a near-SPA example seeded directly into localStorage so the
calendar is pre-generated — no manual form-filling). Output lands in
`artifacts/play-store/screenshots/<device>/<theme>/<screen>.png` (gitignored) at
the exact pixel dimensions Play Console expects for phone / 7-inch tablet /
10-inch tablet / Chromebook, ready to upload as-is.

Requires a local Chrome install (script defaults to `/usr/bin/google-chrome-stable`;
override with `CHROME_PATH` if yours lives elsewhere) since Playwright's own
browser download isn't available on every OS.

## Play Store feature graphic

Regenerate the same way whenever the app's name/branding/copy changes:

```bash
node scripts/feature-graphic/render.mjs
```

Edit `scripts/feature-graphic/feature-graphic.html` directly (a standalone,
self-contained page — inlined fonts, canvas-drawn background grid, no build
step or dev server needed) then rerun. Output:
`artifacts/play-store/feature-graphic-1024x500.png` (gitignored) — exactly
1024x500, 24-bit PNG with no alpha channel, ready to upload as-is. Same
Chrome/`CHROME_PATH` requirement as the screenshot script above.

## Baseline PWA checks

1. Deploy latest `main` to production.
2. Confirm `https://ukspcal.vercel.app/manifest.webmanifest` loads and includes:
   - `id`, `scope`, `start_url`
   - PNG `any` and `maskable` icons
   - screenshots and shortcuts
3. Confirm service worker is active in production (DevTools Application tab).
4. Confirm install works from:
   - Desktop Chrome/Edge
   - Android Chrome
   - iOS Safari (Add to Home Screen flow)

## Android (Play Store via TWA)

This project does not generate Android packages with PWABuilder. The Android wrapper already lives in-repo under `app/` and is built with Gradle. Bubblewrap was used to create the wrapper and still provides the local JDK/SDK used for builds.

### Inputs and locations

- Bubblewrap manifest: `twa-manifest.json`
- Android project: `app/`
- Signing keystore referenced by Bubblewrap: `android.keystore`
- Bubblewrap JDK used for successful local builds: `/home/paul/.bubblewrap/jdk/jdk-17.0.11+9`
- Bubblewrap Android SDK used for successful local builds: `/home/paul/.bubblewrap/android_sdk`
- Release bundle output: `app/build/outputs/bundle/release/app-release.aab`

### Release flow

1. Deploy latest `main` to production.
2. Confirm `https://ukspcal.vercel.app/manifest.webmanifest` is valid and matches current branding, colors, scope, and icons.
3. Confirm `https://ukspcal.vercel.app/.well-known/assetlinks.json` matches the Play signing certificate fingerprint and package ID.
4. Update Android version metadata:
   - `app/build.gradle` -> `versionCode`, `versionName`
   - `twa-manifest.json` -> `appVersionCode`, `appVersionName`, `appVersion`
5. Ensure local Android SDK configuration exists. Preferred local file:
   - `local.properties` with `sdk.dir=/home/paul/.bubblewrap/android_sdk`
6. Build the release AAB with the Bubblewrap JDK:

```bash
export JAVA_HOME=/home/paul/.bubblewrap/jdk/jdk-17.0.11+9
export PATH="$JAVA_HOME/bin:$PATH"
./gradlew bundleRelease
```

7. Verify the bundle exists at:

```bash
app/build/outputs/bundle/release/app-release.aab
```

8. Smoke test the generated app on Android before upload.
9. Upload the new `.aab` to Play Console.

### Testing the AAB

An Android App Bundle (`.aab`) is not installed directly on a device. Use one of these approaches:

1. Play Console internal testing.
   - Upload `app/build/outputs/bundle/release/app-release.aab` to an Internal testing track.
   - Add tester accounts.
   - Install the build from the Play test link.
   - This is the closest match to the production delivery path.

2. Local device testing with `bundletool`.
   - Build a device-specific `.apks` archive from the `.aab`.
   - Install the generated APK set onto a connected test device.

Example:

```bash
java -jar bundletool.jar build-apks \
  --bundle=app/build/outputs/bundle/release/app-release.aab \
  --output=app-release.apks \
  --ks=android.keystore \
  --ks-key-alias=android
```

```bash
java -jar bundletool.jar install-apks --apks=app-release.apks
```

Recommended smoke tests:

- launch from the Android home screen
- deep links open into the TWA correctly
- top and bottom safe-area spacing on Android 15+
- splash screen appearance
- update/install flow from Play internal testing
- notifications, if notification delegation is enabled

### When to use Bubblewrap again

Do not rerun Bubblewrap for ordinary code changes or Android wrapper edits. Rebuild the existing Gradle project instead.

Use Bubblewrap regeneration only when you intentionally want to recreate the wrapper from `twa-manifest.json`, for example after major manifest/package/signing changes.

## Windows (Microsoft Store via MSIX/PWABuilder)

1. Generate package with PWABuilder.
2. Validate app launches offline/startup cleanly.
3. Verify icons, app name, and screenshots in Store listing.
4. Confirm privacy/disclaimer text is present and clear.
5. Submit package to Microsoft Partner Center.

## Notes

- Keep `vite.config.ts` and `static/manifest.webmanifest` aligned.
- If icon clipping is visible in masked shapes, replace with dedicated safe-zone maskable PNG assets.
- `local.properties` is machine-local configuration and should not be relied on as shared project state.
