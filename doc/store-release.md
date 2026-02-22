# Store Packaging Checklist (Android + Windows)

Use this checklist before generating packages from PWABuilder.

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

1. Decide Android package ID (for example `app.ukspcal`).
2. Create app in Play Console.
3. Get Play App Signing certificate SHA-256 fingerprint.
4. Update `static/.well-known/assetlinks.json`:
   - `package_name`
   - `sha256_cert_fingerprints`
5. Deploy and verify:
   - `https://ukspcal.vercel.app/.well-known/assetlinks.json`
6. Run PWABuilder Android package generation.
7. Install and smoke test from generated `.aab`/`.apk`.

## Windows (Microsoft Store via MSIX/PWABuilder)

1. Generate package with PWABuilder.
2. Validate app launches offline/startup cleanly.
3. Verify icons, app name, and screenshots in Store listing.
4. Confirm privacy/disclaimer text is present and clear.
5. Submit package to Microsoft Partner Center.

## Notes

- Keep `vite.config.ts` and `static/manifest.webmanifest` aligned.
- If icon clipping is visible in masked shapes, replace with dedicated safe-zone maskable PNG assets.
