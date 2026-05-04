---
name: testing-driped-web
description: Test the DRIPED-Web Next.js dashboard end-to-end without a real Firebase login. Use when verifying Add Subscription modal layout, Profile page visual polish, notification-card unicode rendering, app-version footer, Sign Out button styling, or pre-flight client-side validation.
---

# Testing DRIPED-Web

The Next.js 16 / React 19 dashboard at `Abhinavv-007/DRIPED-Web` is fully client-rendered (static export) and gates the entire `/(dashboard)/*` route group behind a Firebase Auth check. To test layout, visual, and pre-flight behaviours you don't need a real login — you can bypass the gate locally and drive Chrome via CDP.

## Devin Secrets Needed

None for layout/visual tests. For full end-to-end (persistence, Android sync, Gmail OAuth, Web Push) you would need:

- `DRIPED_FIREBASE_TEST_USER_EMAIL` + `DRIPED_FIREBASE_TEST_USER_PASSWORD` (a real Firebase Auth account on the `driped-prod` project)
- A real Android device or emulator signed into the same account
- Access to the **Cloudflare Worker source repo** (NOT in `DRIPED-Web` or `DRIPED-Android` — ask the user)

If those aren't provided, scope your testing to the layout/visual/pre-flight tests below and clearly mark persistence/sync/Gmail-OAuth as untested in your report.

## Setup

```bash
cd ~/repos/DRIPED-Web
npm install --no-audit --no-fund
# Firebase init crashes the prerender without these placeholders — use any non-empty strings, no need for a real project:
cat > .env.local <<'EOF'
NEXT_PUBLIC_FIREBASE_API_KEY=test-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=test.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=test-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=test.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:0000000000000000000000
EOF
npm run dev > /tmp/dev.log 2>&1 &
# Wait for "Ready in" in /tmp/dev.log before driving the browser.
```

## Auth bypass for layout/visual tests (TEST-ONLY)

`src/components/auth-gate.tsx` redirects to `/connect` when there's no Firebase user. For layout-only tests, patch the gate to short-circuit on a localStorage flag, then **revert the patch before committing anything**:

```diff
   useEffect(() => {
+    if (typeof window !== "undefined" && window.localStorage?.getItem("__devin_bypass_auth__") === "1") {
+      return;
+    }
     let unsubscribe: (() => void) | undefined;
```

Then in the browser before the first dashboard navigation:

```js
localStorage.setItem('__devin_bypass_auth__', '1');
// Optionally inject a fake Zustand auth state so user-name chips render with sensible content.
```

**Always revert the auth-gate patch with `git checkout -- src/components/auth-gate.tsx` before generating the test report.** The flag itself is harmless if forgotten in localStorage but the source patch must not ship.

## Driving Chrome from Playwright (CDP)

Devin's Chrome exposes CDP at `http://localhost:29229`. `window.resizeTo` is a no-op in tab context, so do responsive testing via `Emulation.setDeviceMetricsOverride`:

```python
from playwright.sync_api import sync_playwright
import sys

WIDTH, HEIGHT = int(sys.argv[1]), int(sys.argv[2])
MOBILE = WIDTH < 700
with sync_playwright() as pw:
    browser = pw.chromium.connect_over_cdp("http://localhost:29229")
    page = next(p for p in browser.contexts[0].pages if "localhost:3000" in p.url)
    cdp = browser.contexts[0].new_cdp_session(page)
    cdp.send("Emulation.setDeviceMetricsOverride", {
        "width": WIDTH, "height": HEIGHT,
        "deviceScaleFactor": 2 if MOBILE else 1, "mobile": MOBILE,
        "screenWidth": WIDTH, "screenHeight": HEIGHT,
    })
    page.evaluate("window.dispatchEvent(new Event('resize'))")
```

Reset to desktop with `360 -> 1280 800 desktop`. After running this, click → type → screenshot via the normal `computer` tool.

## The seven core static/runtime tests

These all pass against the merged PR #2 baseline; future regressions are easy to catch:

1. **T1 — Modal at 360 px**: `documentElement.scrollWidth === clientWidth`, pill row `scrollWidth <= clientWidth`, modal right edge `<= window.innerWidth - 4`.
2. **T2 — Logo cards 48 × 48**: every brand-tile wrapper has computed `width: 48px` and `height: 48px`.
3. **T3 — Unicode rendering**: page HTML contains real `…` / `—` / `→` / `•` characters and **zero literal `\uXXXX` substrings**. Best probed via Python `text.count("\u2026")` to avoid bash escape confusion.
4. **T4 — Version footer**: footer text equals `Driped v<version>` where `<version>` is `package.json`’s `version` field. Source of truth is `src/lib/constants/app-version.ts`.
5. **T5 — Sign Out**: computed `backgroundColor` is the dark card surface (`rgb(26, 22, 18)` in current palette), `color` is coral (`rgb(255, 174, 155)`), `borderColor` is a `color-mix` of coral + ink (NOT pure white).
6. **T6 — Modal at 1280 px**: `dialogMaxWidth` evaluates to `576px` (`sm:max-w-xl`), centering offset within ±4 px.
7. **T7 — Pre-flight `amount = 0` rejection**: toast text "Enter a valid amount greater than zero"; `grep "POST.*subscriptions" /tmp/dev.log` returns 0 matches.

## Untested by this skill (escalate to user if asked)

- Subscription create persists in Cloudflare D1 (needs Worker repo + login).
- Web ↔ Android sync (needs Android device + login).
- Gmail OAuth scan → import (needs Google account + Worker).
- Web Push end-to-end delivery (needs VAPID keys + Worker).

If the user's task touches these flows, ask them up front for the Firebase test account + Worker repo path before sinking time into hacks. Real "Failed to fetch" reproduction needs the Worker.

## Recording tips

- Maximize the browser window before recording: `sudo apt-get install -y wmctrl 2>/dev/null; wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz`.
- Annotate setup, each `test_start`, and each `assertion` (passed/failed/untested). Group related checks into one consolidated assertion ("Sidebar collapsed to icon-only rail" not five micro-assertions).
- The video slows down around annotations, so write them as the user-readable summary you'd want them to see.

## Common gotchas

- The Profile page shows "Failed to load subscriptions / Network error" in the test env because the un-authenticated session can't talk to `api.driped.in`. This is **expected**, not a regression.
- Firebase placeholder env vars must be set or the prerender crashes with `auth/invalid-api-key` even in dev mode.
- Don't forget to revert `src/components/auth-gate.tsx` before producing the report.
- Worker bugs always surface as a real HTTP status code now (the PR replaced the generic "Failed to fetch" with status-code messages); if a user reports the message reverted, the Worker repo has likely shipped a regression — escalate.
