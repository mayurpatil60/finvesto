# Finvesto (React Native / Expo)

Expo 53 React Native app for Finvesto — options, markets, tools, and notifications.

## Setup

```bash
npm install
npx expo start          # dev server
npx expo start --android
eas build -p android --profile preview
```

## Auth

- Login / Register screens shown when not logged in
- After register → **Pending Approval** screen (admin must approve)
- After approval → Login works, bottom tabs unlock
- Session persists using `expo-secure-store` on native, `localStorage` on web
- Auto token refresh on 401 — stays logged in unless you sign out
- Sign Out in **Settings → Account**

## Navigation

```
AuthNavigator (when logged out)
  ├── Login
  ├── Register
  └── PendingApproval

BottomTabNavigator (when logged in)
  ├── Home
  ├── Options
  ├── Markets
  ├── Tools
  ├── Notifications   ← notification history
  └── Settings
       ├── Config
       └── Cleanup
```

## Screens

| Screen                    | Path                                                  | Description               |
| ------------------------- | ----------------------------------------------------- | ------------------------- |
| LoginScreen               | `screens/auth/LoginScreen.tsx`                        | Email + password login    |
| RegisterScreen            | `screens/auth/RegisterScreen.tsx`                     | Create account            |
| PendingApprovalScreen     | `screens/auth/PendingApprovalScreen.tsx`              | Awaiting admin approval   |
| NotificationHistoryScreen | `screens/notifications/NotificationHistoryScreen.tsx` | Push notification history |

## Services

- `services/auth/auth.service.ts` — login, register, logout, token refresh, authenticated fetch. Uses `expo-secure-store` on native and `localStorage` on web.
- `services/notification/notification.service.ts` — fetch history, register Expo push token with backend

## Components

- `components/auth/AuthProvider.tsx` — auth context (user, setUser, logout, isLoading). Restores session on mount via stored tokens.
- `components/common/ServerStatusBanner.tsx` — amber banner shown when backend is unreachable >6s (Render cold-start). Auto-dismisses with fade-out when server comes back.
- `components/notifications/PushNotificationHandler.tsx` — registers Expo push token and sends it to backend whenever `user` or `expoPushToken` changes (whichever arrives last).

## Push Notifications

- **Foreground**: shown via `setNotificationHandler` with `shouldShowAlert: true`
- **Background / Quit state**: handled by `expo-notifications` native plugin (configured in `app.json`)
- Token registration: on login (or session restore), the device Expo push token is sent to the backend via `POST /users/push-token` and stored in the user's `expoPushTokens[]` array
- Requires FCM credentials linked in EAS project for Android builds

## Expo Project

- Slug: `finvesto`
- EAS Project ID: `778634ef-de86-45f4-8c7e-3102f66cd9f8`
- Owner: `mayurpatil60`
- Runtime version policy: `appVersion`
