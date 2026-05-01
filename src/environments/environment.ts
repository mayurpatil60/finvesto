// Environment configuration
// __DEV__ is set to true by Expo/Metro when running locally (web, emulator, Expo Go)
// and false in production builds.

const DEV_URL = "http://localhost:3000";
const PROD_URL = "https://finvesto-backend-y9ly.onrender.com";

export const environment = {
  production: !__DEV__,
  API_BASE: __DEV__ ? DEV_URL : PROD_URL,
  ENDPOINTS: {
    NODE: {
      BASE_URL: __DEV__ ? DEV_URL : PROD_URL,
    },
  },
};
