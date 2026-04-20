# Finvesto

A React Native (Expo) app built with TypeScript — dark mode by default, OTA auto-updates, push notifications, bottom tab navigation.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [EAS CLI](https://docs.expo.dev/eas/) — `npm install -g eas-cli`

### Install dependencies

```bash
npm install
```

---

## 💻 Run Locally (Development)

| Platform     | Command                    | Opens in                           |
| ------------ | -------------------------- | ---------------------------------- |
| **Web**      | `npx expo start --web`     | Browser at `http://localhost:8081` |
| **Android**  | `npx expo start --android` | Android emulator or Expo Go app    |
| **iOS**      | `npx expo start --ios`     | iOS simulator (macOS only)         |
| **All (QR)** | `npx expo start`           | Expo Go app on device via QR code  |

---

## 📱 Install on Your Android Phone (APK)

### Step 1 — Build an installable APK

Run this command (uses the `preview` profile which outputs `.apk`):

```bash
eas build -p android --profile preview
```

> ⚠️ **Do NOT use `--profile production`** for direct installs — that outputs `.aab` (Android App Bundle) which is only accepted by the Play Store, **not installable directly on a phone**.

| Profile       | Output | Use for                               |
| ------------- | ------ | ------------------------------------- |
| `development` | `.apk` | Dev/debug builds with dev menu        |
| `preview`     | `.apk` | Direct install on any Android phone ✅ |
| `production`  | `.aab` | Google Play Store upload only         |

### Step 2 — Download the APK

Once the build finishes (~10 min):

1. Go to **https://expo.dev/accounts/mayurpatil60/projects/finvesto/builds**
2. Click the latest **preview** build
3. Either:
   - Scan the **QR code** with your phone camera — opens direct download on device
   - Click **Download** on your PC, then transfer to phone via USB / WhatsApp / Drive

### Step 3 — Install on phone

1. Open the downloaded `.apk` file on your phone
2. If prompted, enable **Install from unknown sources** → Settings → Security → Unknown apps
3. Tap Install

---

## 🔨 Build Commands

### Build installable APK (preview)
```bash
eas build -p android --profile preview
```

### Build development APK (with dev menu)
```bash
eas build -p android --profile development
```

### Build for Play Store (AAB — not directly installable)
```bash
eas build -p android --profile production
```

---

## ⚡ OTA (Over-the-Air) Updates

Push JS/UI changes to all installed apps **without a new APK**:

```bash
eas update --channel preview --message "describe your change"
```

- The app checks for updates on every launch and auto-applies them silently
- Takes effect within ~30 seconds of opening the app
- Works for: screen changes, styles, logic, new components — anything JS

> ⚠️ OTA updates do **not** work for native code changes (new native packages, permissions, etc.) — those require a new build.

---

## 📁 Folder Structure

```
finvesto/
├── App.tsx                          # Root entry — ThemeProvider + PushNotifications + Navigator
├── app.json                         # Expo config (OTA updates URL, project ID, package name)
├── eas.json                         # EAS build profiles (development / preview / production)
├── src/
│   ├── screens/
│   │   ├── home/                    # Home tab (dashboard)
│   │   ├── analysis/                # Analysis tab
│   │   ├── markets/                 # Markets tab
│   │   ├── tools/                   # Tools tab
│   │   └── settings/                # Settings tab (dark/light mode toggle)
│   ├── components/
│   │   ├── common/                  # LoadingSpinner, etc.
│   │   ├── layout/                  # AppHeader
│   │   ├── notifications/           # PushNotificationHandler (context + hook)
│   │   └── theme/                   # ThemeProvider (context + useTheme hook)
│   ├── navigation/
│   │   ├── AppNavigator.tsx         # Root navigator
│   │   └── BottomTabNavigator.tsx   # 5-tab bottom bar
│   ├── services/
│   │   ├── BaseService.ts
│   │   ├── UserService.ts
│   │   └── PushNotificationService.ts  # Singleton — register, send, cancel notifications
│   ├── hooks/
│   │   └── useAppUpdater.ts         # Auto OTA update check on app launch
│   ├── types/                       # All TypeScript definitions
│   │   ├── constants/               # COLORS, SPACING, APP_NAME, DARK_THEME, LIGHT_THEME
│   │   ├── enums/                   # NotificationType, AuthStatus, ApiStatus, TabRoute, etc.
│   │   ├── interfaces/              # IUser, INotification, IPushNotificationService, etc.
│   │   ├── types/                   # Nullable<T>, Optional<T>, UserState, etc.
│   │   └── models/                  # UserModel (class with fromJson/toJson)
│   ├── store/
│   │   ├── actions/
│   │   └── reducers/
│   └── utils/
└── assets/                          # Icons, splash screen, images
```

---

## 🎨 Theme

- **Dark mode by default**
- Toggle in **Settings** tab
- All colors come from `DARK_THEME` / `LIGHT_THEME` in `src/types/constants/theme.ts`
- Use `useTheme()` hook in any component

---

## 🔔 Push Notifications

- Wrap root with `<PushNotificationHandler>` (already done in `App.tsx`)
- Use `usePushNotification()` hook anywhere to send/cancel notifications
- Service: `pushNotificationService` singleton in `src/services/PushNotificationService.ts`

---

## 🏗️ Roadmap

- [ ] Authentication (Login / Register screens)
- [ ] Portfolio / Dashboard
- [ ] API integration
- [ ] Redux state management
- [ ] iOS App Store build


---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — installed automatically via `npx`

### Install dependencies

```bash
npm install
```

### Run the app

| Platform     | Command                    | Opens in                           |
| ------------ | -------------------------- | ---------------------------------- |
| **Web**      | `npx expo start --web`     | Browser at `http://localhost:8081` |
| **Android**  | `npx expo start --android` | Android emulator or Expo Go app    |
| **iOS**      | `npx expo start --ios`     | iOS simulator (macOS only)         |
| **All (QR)** | `npx expo start`           | Expo Go app on device via QR code  |

> **Web is the fastest way to start** — no emulator needed. Just run `npx expo start --web` and it opens automatically in your browser.

---

## 📁 Folder Structure

```
finvesto/
├── App.tsx                    # Root entry point (thin — just mounts navigator)
├── app.json                   # Expo configuration
├── src/
│   ├── screens/               # One folder per screen/feature
│   │   ├── home/
│   │   │   └── HomeScreen.tsx
│   │   └── auth/              # (reserved for login/register)
│   ├── components/
│   │   ├── common/            # Reusable UI atoms (buttons, spinners, etc.)
│   │   │   └── LoadingSpinner.tsx
│   │   └── layout/            # Structural components (header, footer, etc.)
│   │       └── AppHeader.tsx
│   ├── navigation/
│   │   └── AppNavigator.tsx   # All routes defined here
│   ├── services/              # API / business logic (singleton pattern)
│   │   ├── BaseService.ts     # Abstract HTTP base — extend for each service
│   │   └── UserService.ts
│   ├── models/                # Data models with fromJson / toJson helpers
│   │   └── UserModel.ts
│   ├── store/                 # State management (Redux / Context — add later)
│   │   ├── actions/
│   │   └── reducers/
│   ├── hooks/                 # Custom React hooks
│   ├── utils/                 # Pure helper functions (formatting, validation)
│   │   └── index.ts
│   ├── constants/             # Colors, spacing, app-wide magic values
│   │   └── index.ts
│   └── types/                 # Shared TypeScript interfaces & types
│       └── index.ts
└── assets/                    # Images, icons, splash screen
```

### Conventions (Angular-inspired)

| Concept               | How it maps in this app                         |
| --------------------- | ----------------------------------------------- |
| `@Component`          | Class extending `React.Component<Props, State>` |
| `@Injectable` service | Class with `static getInstance()` singleton     |
| Module                | Screen folder (e.g. `src/screens/home/`)        |
| Interface / DTO       | `src/models/` & `src/types/`                    |
| Constants / env       | `src/constants/index.ts`                        |

---

## 🏗️ Roadmap

- [ ] Authentication (Login / Register screens)
- [ ] Portfolio / Dashboard
- [ ] API integration
- [ ] Redux / Context state management
- [ ] Push notifications
- [ ] Android APK build
- [ ] iOS App Store build

---

## 📦 Build for Production

### Android APK

```bash
npx expo build:android   # classic build (EAS recommended)
# or with EAS:
npx eas build -p android
```

### iOS

```bash
npx eas build -p ios
```

> Install EAS CLI first: `npm install -g eas-cli` then `eas login`

---

## 📊 DynamicTable Component

`src/components/dynamic-table/`

A full-featured React Native table with auto-generated columns, sorting, filtering, pagination, CSV export and smart cell formatting.

### Cell formatting rules

| Cell value                                 | Alignment | Color       | Example                        |
| ------------------------------------------ | --------- | ----------- | ------------------------------ |
| Pure number / float                        | Right     | None        | `1234`, `12.5`                 |
| Number with `%` suffix                     | Right     | Green / Red | `"12.5%"`, `"-3%"`             |
| Percentage column (by name) + plain number | Right     | Green / Red | column `gain_per`, value `4.2` |
| Everything else                            | Left      | None        | `"360ONE 840 PE"`, `"NIFTY"`   |

- Floats are rounded to **1 decimal place**; integers show **no decimal** (e.g. `4.0` → `4`)
- Negative values → **red** (`#ef4444`), positive → **green** (`#22c55e`), zero → default

### Percentage column naming convention

Columns are **automatically detected as percentage columns** when the field name ends with one of these suffixes (case-insensitive):

| Suffix        | Example field name                     |
| ------------- | -------------------------------------- |
| `_per`        | `gain_per`, `change_per`               |
| `_percentage` | `return_percentage`                    |
| `%`           | `profit%`                              |
| trailing `P`  | `day_changeP`, `underline_day_changeP` |

You can also explicitly set `isPercentage: true` in any `DynamicColumn` schema entry.

### Usage

```tsx
// Auto-schema from data
<DynamicTable data={rows} />

// Custom schema with explicit percentage flag
<DynamicTable
  data={rows}
  schema={[
    { field: 'symbol', header: 'Symbol' },
    { field: 'gain_per', header: 'Gain %', isPercentage: true },
    { field: 'price', header: 'Price' },
  ]}
/>
```
