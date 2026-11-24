// Windows starts Otto at login with this flag: it opens straight to the
// notification area, without showing the window.
export const HIDDEN_FLAG = "--hidden";

export function wasStartedHidden(argv: readonly string[]): boolean {
  return argv.includes(HIDDEN_FLAG);
}
