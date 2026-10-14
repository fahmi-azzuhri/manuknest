<img width="2752" height="1536" alt="Gemini_Generated_Image_f3rnu0f3rnu0f3rn" src="https://github.com/user-attachments/assets/a7f5e9b2-bae6-4391-8e4c-7395322546f2" />

# Manuknest

Manuknest is a personal archive for saving links and finding them again. This folder contains the React web app and its Capacitor Android project. The Go API and database setup are documented in the [project README](../README.md).

## What the app does

- Register or sign in, then save and organize links in a private archive.
- Search saved links and filter them by category. Add notes, collections, and a reading status.
- Share selected links in Explore, where signed-in users can like them and visit the sharer's profile.
- View a profile with the account's shared-link and like counts, username, and optional YouTube Music player.
- Use the same frontend in a browser or as the Manuknest Android app.
- Click or tap Tiko, the mascot in the nest, to make it fly.

New link contents are encrypted in the browser before they are sent to the API. The app derives its encryption keys from the account password and server-provided salt. Link URLs, titles, notes, categories, collections, and reading status are encrypted. A keyed URL hash lets the server find duplicate links without storing the URL in plaintext. Links a user explicitly shares expose their selected URL and title to signed-in users; private fields remain encrypted. Read more about the design and its limitations in the root [README](../README.md#archive-encryption-and-migration).

## Stack

- React 18, TypeScript, and Vite
- Tailwind CSS for styles
- Web Crypto API for browser-side archive encryption
- Capacitor 8 for the Android app
- Go API for accounts, encrypted link records, and explicitly shared links

## Run the web app locally

Install Node.js and npm. Start the backend and MySQL database first; see [backend setup](../README.md#run-locally).

```powershell
npm install
npm run dev
```

Vite serves the frontend at `http://localhost:5173`. If `VITE_API_URL` is unset, Vite forwards `/api` requests to the local backend at `http://localhost:8080`. To use a different API, set `VITE_API_URL` in a local `.env.local` file:

```dotenv
VITE_API_URL=https://api.example.com
```

Build and preview the production web app:

```powershell
npm run build
npm run preview
```

The build reads `VITE_API_URL` from `.env.production`. Set it to the API origin you want the deployed frontend or APK to use.

## Build the Android app

Install Android Studio, an Android SDK, and a compatible JDK. The app name is Manuknest. Its launcher icon is generated from `public/tiko/nest-idle.webp`.

```powershell
npm install
npm run assets:android
npm run build:apk
```

The debug APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`.

To build a signed release APK, first create a release keystore from `frontend/android`:

```powershell
keytool -genkeypair -v -keystore app/release-key.p12 -storetype PKCS12 -alias manuknest -keyalg RSA -keysize 2048 -validity 10000
```

Add the keystore details to the ignored file `android/keystore.properties`:

```properties
storeFile=app/release-key.p12
storePassword=your-keystore-password
keyAlias=manuknest
keyPassword=your-key-password
```

Then build the APK:

```powershell
npm run build:apk:release
```

The signed APK is written to `android/app/build/outputs/apk/release/app-release.apk`. Back up `android/app/release-key.p12` and `android/keystore.properties` somewhere secure. They are excluded from Git. The keystore is needed to sign future updates with the same app identity.

Other Android commands:

```powershell
npm run cap:sync
npm run cap:open
```

## Project layout

- `src/App.tsx` manages application state, API actions, and page composition.
- `src/components/app/` contains the authentication, dashboard, collection,
  profile, navigation, and link-dialog components used by `App.tsx`.
- `src/components/` contains shared interface components such as the mascot,
  shared profile, and link-card stack.
- `src/lib/api.ts` defines frontend API requests and response types.
- `src/lib/vault.ts` handles link encryption, decryption, and URL lookup hashes.
- `public/tiko/` contains the Manuknest mascot assets.
- `android/` contains the native Android project managed by Capacitor.


