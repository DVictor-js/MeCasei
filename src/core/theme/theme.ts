import { Platform, type TextStyle } from "react-native";
export const colors = {
  background: "#F8F7F3",
  surface: "#FFFFFF",
  primary: "#73806C",
  primarySoft: "#E8ECE5",
  text: "#292B27",
  textSecondary: "#74776F",
  border: "#E6E3DC",
  accent: "#BEA37A",
  danger: "#B66560",
  success: "#668266",
  warning: "#B88A45",
};
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const radius = { sm: 8, md: 16, lg: 24 };
const serif = Platform.select({ ios: "Georgia", default: "serif" });
export const typography = {
  display: { fontSize: 38, lineHeight: 46, fontFamily: serif },
  headingLarge: { fontSize: 28, lineHeight: 36, fontWeight: "600" },
  heading: { fontSize: 20, lineHeight: 28, fontWeight: "600" },
  body: { fontSize: 16, lineHeight: 24 },
  bodySmall: { fontSize: 14, lineHeight: 21 },
  caption: { fontSize: 12, lineHeight: 18 },
  label: { fontSize: 13, lineHeight: 20, fontWeight: "600" },
} satisfies Record<string, TextStyle>;
