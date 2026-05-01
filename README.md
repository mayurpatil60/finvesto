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
- Session persists using `expo-secure-store` (JWT tokens stored securely)
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
  ├── Notifications   ← new: notification history
  └── Settings
       ├── Config
       └── Cleanup
```

## New Screens

| Screen | Path | Description |
|--------|------|-------------|
| LoginScreen | `screens/auth/LoginScreen.tsx` | Email + password login |
| RegisterScreen | `screens/auth/RegisterScreen.tsx` | Create account |
| PendingApprovalScreen | `screens/auth/PendingApprovalScreen.tsx` | Awaiting admin |
| NotificationHistoryScreen | `screens/notifications/NotificationHistoryScreen.tsx` | Push notification history |

## Services

- `services/auth/auth.service.ts` — login, register, logout, token refresh, authenticated fetch
- `services/notification/notification.service.ts` — fetch history, register push token

## Components

- `components/auth/AuthProvider.tsx` — auth context (user, setUser, logout, isLoading)

## Expo Project

- Slug: `finvesto`
- EAS Project ID: `778634ef-de86-45f4-8c7e-3102f66cd9f8`
- Owner: `mayurpatil60`
