# Camarines Norte 360 Connect

Expo mobile foundation for onboarding and Firebase email authentication only.
Official Figma layouts and feature modules are deferred.

Requires Node 24.12+ (Node 24 LTS recommended), npm, and Expo Go or a development build.

```sh
npm ci
cp .env.example .env.local
npm start
```

The example uses a demo project and requires the local Auth Emulator. Firebase setup and verification details will be documented in `docs/` alongside implementation.

```sh
npm run typecheck
npm test -- --runInBand
```
