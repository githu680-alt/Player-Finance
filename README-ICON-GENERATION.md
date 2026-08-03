Icon generation instructions

This project includes `src/assets/player-finance-logo.png` (master logo). Use the included Node script to generate native icons for Android and iOS.

Prerequisites

- Node.js environment
- Install `sharp` (native dependency)

Install:

```bash
npm install sharp
```

Generate icons:

```bash
npm run generate:icons
```

This will produce Android mipmap resources under `android/app/src/main/res/mipmap-*` and an iOS AppIcon set under `ios/App/App/Assets.xcassets/AppIcon.appiconset`.

Alternative: use `cordova-res`:

```bash
npm i -g cordova-res
mkdir resources
cp src/assets/player-finance-logo.png resources/icon.png
cordova-res android --skip-config --copy
cordova-res ios --skip-config --copy
```

After generating icons, rebuild the web project and native wrappers as needed.
