# Otto — Desktop

Windows app of **Otto**, the personal voice assistant. It starts with
Windows, lives in the notification area and (in the next phases) listens
for "Otto", sends what was said to the [backend](https://github.com/StanleyBack-dev/backend-otto)
and speaks the answer.

## Stack

Electron + React + Vite (electron-vite) + Tailwind, all in TypeScript.

```
src/
├── main/       Node side: window, tray, start with Windows, API calls and
│               secrets (client key, session tokens) — never the screens
├── preload/    the narrow typed bridge exposed as window.otto
├── shared/     contract between both sides (IPC channels, types)
└── renderer/   React screens
    └── src/
        ├── design-system/   generic components (Card, Switch…)
        └── features/<area>/{api,components,model}
```

- The screens are sandboxed (`contextIsolation`, `sandbox`, strict CSP) and
  only talk to `window.otto`; lint blocks Node and main-process imports in
  the renderer.
- Closing the window hides it; "Sair" in the tray menu quits.
- The installed app turns on "Iniciar com o Windows" on its first run (it
  starts with `--hidden`, straight to the notification area); the switch is
  in the window and in the tray menu.

## Running locally

```bash
npm install
npm run dev            # hot reload
npm run dist           # Windows installer in dist/
```

The first `npm run dev` downloads the Electron binary (~100 MB).

## Checks

`npx prettier --check .` · `npm run lint:check` · `npm run typecheck` ·
`npm test` · `npm run build`
