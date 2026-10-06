import appPackage from "./package.json";
import type { ExpoConfig } from "expo/config";
import identity from "./src/core/theme/identity.json";
const config: ExpoConfig = {
  name: identity.name,
  slug: identity.slug,
  version: appPackage.version,
  scheme: identity.slug,
  orientation: "portrait",
  userInterfaceStyle: "light",
  plugins: [
    "expo-router",
    "expo-sqlite",
    "expo-font",
    "expo-status-bar",
    "expo-secure-store",
  ],
  ios: { supportsTablet: true },
  android: { predictiveBackGestureEnabled: true },
};
export default config;
