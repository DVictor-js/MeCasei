import appPackage from "../../../package.json";
import identity from "@/core/theme/identity.json";
export const APP_NAME = identity.name;
export const APP_SHORT_NAME = APP_NAME;
export const APP_TAGLINE = identity.tagline;
export const BRAND_VERSION = identity.brandVersion;
export const APP_SLUG = identity.slug;
// Stable storage key: do not rename when rebranding.
export const DATABASE_NAME = "mecasei.db";

export const APP_VERSION = appPackage.version;
