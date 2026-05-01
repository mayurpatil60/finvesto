# Finvesto

React Native (Expo) app built with TypeScript. Features dark/light theme, OTA auto-updates, and a 5-tab bottom navigation covering Home (dashboard), Options, Markets, Tools, and Settings.

## Requirements

- Node.js v18+
- EAS CLI — `npm install -g eas-cli`

## Getting Started

```bash
npm install
```

| Platform     | Command                    | Opens in                           |
| ------------ | -------------------------- | ---------------------------------- |
| **Web**      | `npx expo start --web`     | Browser at `http://localhost:8081` |
| **Android**  | `npx expo start --android` | Android emulator or Expo Go app    |
| **iOS**      | `npx expo start --ios`     | iOS simulator (macOS only)         |
| **All (QR)** | `npx expo start`           | Expo Go app on device via QR code  |

Web is the fastest way to start — no emulator needed.

## Install on Android (APK)

**Step 1 — Build APK**

```bash
eas build -p android --profile preview
```

| Profile       | Output | Use for                               |
| ------------- | ------ | ------------------------------------- |
| `development` | `.apk` | Dev/debug builds with dev menu        |
| `preview`     | `.apk` | Direct install on any Android phone ✅ |
| `production`  | `.aab` | Google Play Store upload only         |

> Do NOT use `--profile production` for direct installs — it outputs `.aab` which is Play Store only.

**Step 2 — Download**

Go to [expo.dev/accounts/mayurpatil60/projects/finvesto/builds](https://expo.dev/accounts/mayurpatil60/projects/finvesto/builds) → latest preview build → scan QR or download.

**Step 3 — Install**

Open the `.apk` on your phone. If prompted, enable **Install from unknown sources** in Settings → Security.

## OTA Updates

Push JS/UI changes to all installed apps without a new APK:

```bash
eas update --channel preview --message "describe your change"
```

The app checks for updates on every launch and auto-applies them silently. Works for screen changes, styles, logic, new components — anything JS. Does **not** work for native code changes (new native packages, permissions) — those require a new build.

## Folder Structure

```
finvesto/
├── App.tsx                          # Root entry — ThemeProvider + PushNotifications + Navigator
├── app.json                         # Expo config (OTA updates URL, project ID, package name)
├── eas.json                         # EAS build profiles (development / preview / production)
└── src/
    ├── screens/
    │   ├── home/                    # Home tab — Dashboard (investment summary + open IPO cards)
    │   ├── auth/                    # Auth screens (login/register)
    │   ├── markets/                 # Markets tab — Fundamentals, Investments, IPO, Market Signal
    │   ├── options/                 # Options tab
    │   ├── components/              # OptionTrack, OptionJourney (Default/Monthly), OptionSelection, OptionSentiment
    │   │   └── services/            # Per-feature API services
    │   ├── tools/                   # Tools tab
    │   └── settings/                # Settings tab (theme toggle)
    ├── components/
    │   ├── common/                  # LoadingSpinner, CollapsibleCard, FilterSheet
    │   ├── layout/                  # AppHeader
    │   ├── notifications/           # PushNotificationHandler (context + hook)
    │   └── theme/                   # ThemeProvider (context + useTheme hook)
    ├── navigation/
    │   ├── AppNavigator.tsx         # Root navigator
    │   ├── BottomTabNavigator.tsx   # 5-tab bottom bar (Home, Markets, Options, Tools, Settings)
    │   └── SettingsNavigator.tsx    # Settings stack navigator
    ├── services/
    │   ├── BaseService.ts           # Abstract HTTP base
    │   ├── FinvestoService.ts       # Main API service
    │   ├── UserService.ts
    │   └── PushNotificationService.ts  # Singleton — register, send, cancel notifications
    ├── hooks/
    │   └── useAppUpdater.ts         # Auto OTA update check on app launch
    ├── types/                       # All TypeScript definitions
    │   ├── constants/               # COLORS, SPACING, APP_NAME, DARK_THEME, LIGHT_THEME
    │   ├── enums/                   # NotificationType, AuthStatus, ApiStatus, TabRoute, etc.
    │   ├── interfaces/              # IUser, INotification, IPushNotificationService, etc.
    │   ├── types/                   # Nullable<T>, Optional<T>, UserState, etc.
    │   └── models/                  # UserModel (class with fromJson/toJson)
    ├── store/
    │   ├── actions/
    │   └── reducers/
    └── utils/
```

## Theme

Dark mode by default. Toggle in the Settings tab. All colors come from `DARK_THEME` / `LIGHT_THEME` in `src/types/constants/theme.ts`. Use `useTheme()` hook in any component.

## Key Dependencies

| Package                        | Purpose                             |
| ------------------------------ | ----------------------------------- |
| `expo`                         | React Native framework              |
| `react-native-gifted-charts`   | Bar chart for Option Sentiment      |
| `react-native-linear-gradient` | Required peer dep for gifted-charts |
| `@react-navigation/*`          | Tab and stack navigation            |
| `@expo/vector-icons`           | Ionicons icon set                   |

## Push Notifications

Wrap root with `<PushNotificationHandler>` (already done in `App.tsx`). Use `usePushNotification()` hook anywhere to send/cancel notifications. Service: `pushNotificationService` singleton in `src/services/PushNotificationService.ts`.

## DynamicTable Component

`src/components/dynamic-table/`

A full-featured React Native table with auto-generated columns, sorting, filtering, pagination, and smart cell formatting.

### Cell formatting rules

| Cell value                                 | Alignment | Color       | Example                        |
| ------------------------------------------ | --------- | ----------- | ------------------------------ |
| Pure number / float                        | Right     | None        | `1234`, `12.5`                 |
| Number with `%` suffix                     | Right     | Green / Red | `"12.5%"`, `"-3%"`             |
| Percentage column (by name) + plain number | Right     | Green / Red | column `gain_per`, value `4.2` |
| Everything else                            | Left      | None        | `"360ONE 840 PE"`, `"NIFTY"`   |

- Floats rounded to 1 decimal place; integers show no decimal (`4.0` → `4`)
- Negative → red (`#ef4444`), positive → green (`#22c55e`), zero → default

Percentage columns are auto-detected when the field name ends with `_per`, `_percentage`, `%`, or trailing `P` (e.g. `day_changeP`). You can also explicitly set `isPercentage: true` in a `DynamicColumn` schema entry.

```tsx
// Auto-schema from data
<DynamicTable data={rows} />

// Custom schema
<DynamicTable
  data={rows}
  schema={[
    { field: 'symbol', header: 'Symbol' },
    { field: 'gain_per', header: 'Gain %', isPercentage: true },
    { field: 'price', header: 'Price' },
  ]}
/>
```
