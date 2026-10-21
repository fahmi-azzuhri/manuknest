<img width="2752" height="1536" alt="Gemini_Generated_Image_7alrkr7alrkr7alr" src="https://github.com/user-attachments/assets/331b65cc-f37c-4226-8c69-10ba3e652c46" />

# Manuknest

Manuknest is a personal archive for saving links and finding them again. This folder contains the React web app and its Capacitor Android project.

## What the app does

- Register or sign in, then save and organize links in a private archive.
- Search saved links and filter them by the first selected tag. Add notes, collections, reading status, and smart tag suggestions that auto-categorize new links.
- Show page-provided Open Graph thumbnails, favicons, and domains on saved links. YouTube titles and thumbnails use oEmbed when page metadata is incomplete.
- Set private 1-, 7-, or 30-day reading reminders, snooze them by one day, and mark links unread or done. Marking a link done removes its reminder.
- Switch between Indonesian and English, and choose light or dark themes with a full-screen sun/moon transition. The transition respects reduced-motion preferences.
- Export saved bookmarks to a JSON file and import them later. In the Android app, export opens the system "Save to" dialog so you can choose where to store the file. In a browser, export downloads the file directly. Duplicate URLs in imported data are skipped.
- Share selected links and their selected tags in Explore, where signed-in users can like them and visit the sharer's profile. Content-safety checks use the link URL and page or entered title to keep detected content private.
- View a profile with the account's shared-link and like counts, username, and optional YouTube Music player.
- Use the same frontend in a browser or as the Manuknest Android app.
- Click or tap Tiko, the mascot in the nest, to make it fly.

Saved link records are sent to the API without browser-side encryption. Fetching page metadata and suggesting smart tags are separate requests: the browser sends the URL to the metadata API and sends the URL, title, and note to the tag API in plaintext. The tag API forwards them to Gemini when configured. Links a user explicitly shares expose their selected URL, title, and tags to signed-in users; notes and reading status remain private.

The profile page includes bookmark export and import. Export creates a JSON file containing saved bookmark data. On Android, choose a destination in the system "Save to" dialog. Import skips duplicate URLs and keeps existing bookmarks unchanged.

Before sharing, the app checks the URL and available page or entered title for known content-safety terms and domains. Detected links can still be saved privately, but the app disables Explore sharing and the API prevents matching links from being published. This is a keyword and domain heuristic, not a complete content classifier, so it can miss links. Links already shared before this check was added are not changed automatically.

## Stack

- React 18, TypeScript, and Vite
- Tailwind CSS for styles
- Capacitor 8 for the Android app
- Go API for accounts, encrypted link records, and explicitly shared links

## Run the web app locally

Install Node.js and npm. Start the backend and MySQL database first; 

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

Install Android Studio, an Android SDK, and a compatible JDK. The app name is Manuknest. Its launcher icon is generated from `public/tiko/nest-idle.webp`. If `ANDROID_HOME` is not configured, set it in PowerShell to Android Studio's default Windows SDK path:

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
```

```powershell
npm install
npm run assets:android
npm run build
npx cap sync android
Set-Location android
.\gradlew.bat assembleDebug
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
npm run build
npx cap sync android
Set-Location android
.\gradlew.bat assembleRelease
```

The signed APK is written to `android/app/build/outputs/apk/release/app-release.apk`. Back up `android/app/release-key.p12` and `android/keystore.properties` somewhere secure. They are excluded from Git. The keystore is needed to sign future updates with the same app identity.

Run the build commands from the `frontend` directory before changing into `android`. Calling `.\gradlew.bat` from the Android project directory avoids shell-specific failures to locate the Gradle wrapper.

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
- `src/lib/vault.ts` handles saved link data and URL lookup hashes.
- `android/app/src/main/java/` contains native Android integrations, including the bookmark save dialog.
- `public/tiko/` contains the Manuknest mascot assets.
- `android/` contains the native Android project managed by Capacitor.
