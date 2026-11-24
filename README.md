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

## Session

- Login with the owner account; each PC is a device of the account (named
  after the computer). The refresh token is saved encrypted with the
  Windows user's key (Electron `safeStorage`, DPAPI) in AppData; the
  access token lives only in memory and is renewed before it expires.
- All API calls go through `SessionService.call` in the main process; the
  screens only see `signed-in` / `signed-out` and the user's name.
- Offline at start-up keeps the saved session ("Sem conexão" until the API
  answers); a removed device signs out.

## Conversation

- The window is a chat with Otto: questions go to the API `ask` mutation
  through the main process and the conversation continues until "Nova
  conversa".
- Answers are spoken with the voices installed on Windows (offline): the
  best voice for the owner's language, at the owner's speed; `autoSpeak`
  decides whether every answer is read aloud ("Ouvir" reads one, "Parar"
  stops).
- Ajustes > **Voz do Otto** lists the installed Windows voices of the
  owner's language with a preview ("Ouvir esta voz"); the choice is saved on
  this PC and falls back to the automatic one when it is uninstalled.
- Ajustes > **Microfone** picks the input (with a live level meter); saved on
  this PC, falls back to the Windows default when unplugged.
- **Ctrl+Shift+Espaço** opens Otto with the question box focused from
  anywhere in Windows.

## Asking by voice

- The microphone button (or **Ctrl+Shift+O** from anywhere) records one
  question: it stops by itself after a 1.2 s pause (or on a second click),
  gives up after 6 s of silence and caps at 15 s.
- The audio becomes a 16 kHz mono WAV in the screen and goes to the API
  `askByVoice` through the main process; the transcript replaces the
  "🎤 …" placeholder in the chat.
- Only the app's own pages may use the microphone (audio only); every other
  permission is denied.

## Wake word ("Otto")

- With "Ouvir quando eu disser Otto" on (Ajustes; saved as
  `wakeWordEnabled` in the account), the screen streams the raw microphone
  (16 kHz) to a worker thread in the main process: Silero VAD finds phrases
  and Whisper tiny transcribes the short ones **on the PC** (sherpa-onnx,
  offline). Nothing leaves the PC until the name is heard.
- The name comes from the settings and is compared by sound (`soundsLike`:
  "Ótu", "Ópto", "auto"… for "Otto"; not "foto", "oito", "ato"). With a
  question after it ("Otto, que horas são?") that phrase goes to
  `askByVoice`; with the name alone Otto starts listening.
- The listener pauses while Otto records, thinks or speaks.
- Models (~105 MB, not in git): `npm run models` downloads them from the
  sherpa-onnx releases and checks their SHA-256 (`dev` and `dist` run it
  first). They ship in `resources/models`; the native addon is unpacked
  from the asar.

## Daily briefing

- Once per local date, from the owner's `briefingTime` on (which also covers
  turning the PC on later), Otto fetches `todayBriefing`, shows a Windows
  notification ("Seu resumo do dia está pronto") and posts it in the chat as
  "Resumo do dia", reading it aloud when `autoSpeak` is on. The presented
  date is kept in `briefing-presented.txt` (AppData), so a restart does not
  repeat it.
- "Resumo" in the header asks for it any time.

## Configuration

Copy `.env.example` to `.env`: `MAIN_VITE_API_URL` and
`MAIN_VITE_CLIENT_API_KEY` (the API's `CLIENT_API_KEY`). They are read at
build time by the main process only.

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
