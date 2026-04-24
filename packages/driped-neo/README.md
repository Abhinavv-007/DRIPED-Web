# @driped/neo

Shared design tokens for the Driped **Playful Neo-Brutal + Dark** language. Consumed by:

- `apps/web` (Next.js) — via `tokens.css` + Tailwind `@theme`
- `apps/android` (Flutter) — via Dart port in `packages/driped_neo_dart/` (keeps the same semantic names)

## Philosophy

**Playful Neo-Brutal + Dark.** Dark-first, cream accents, thick 2px borders, hard offset shadows. Interactions feel physical: elements lift on hover and slam on press. Gold is the accent.

## Usage

### Web (Tailwind v4)
```css
@import "@driped/neo/tokens.css";
```

Tokens exposed as CSS custom properties (`--neo-bg`, `--neo-ink`, `--neo-gold`, ...) and Tailwind theme extensions (`bg-neo-bg`, `shadow-brutal-md`, ...).

### Flutter
```dart
import 'package:driped_neo/driped_neo.dart';

MaterialApp(
  theme: DripedNeoTheme.dark,
  darkTheme: DripedNeoTheme.dark,
  ...
);
```

## Tokens at a glance

| Group | Dark | Light |
|---|---|---|
| Background | `#0E0B08` | `#FFF8F0` |
| Surface | `#1A1612` | `#FFFFFF` |
| Ink (primary text) | `#F7F1E4` | `#1A1612` |
| Gold (accent) | `#E8B168` | `#C4894B` |
| Border | `#F7F1E4` | `#1A1612` |

See `tokens.json` for the full machine-readable list.

## Rules

1. **Always 2px borders** on raised surfaces.
2. **Hard offset shadows** — never soft / blurred. Shadow color = ink, never black.
3. **Hover lifts** by `-1px -1px` with shadow growing one step. Press translates `+2px +2px`, shadow collapses.
4. **Radii cap at 16px** on cards, 12px on buttons. Never fully rounded on primary surfaces.
5. **Accent colors pop** — mint, coral, sky, lilac, lemon are for semantic tiles only.
