// Single source of truth for the displayed app version.
//
// Resolved at build time from `package.json` (works because
// `resolveJsonModule` is enabled in tsconfig.json) so we can never end up
// shipping a footer that lies about the running build. Bumping the version
// in package.json automatically updates everywhere it's rendered.
import pkg from "../../../package.json";

export const APP_VERSION: string = pkg.version;

/** Marketing-friendly label used in footers / about screens. */
export const APP_VERSION_LABEL = `Driped v${APP_VERSION}`;
