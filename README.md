# DCM & Co. — Fraud & Anomaly Detection Portal

Front-end demo for **DCM & Co. Certified Public Accountants** (thesis project).
Plain HTML, CSS and JavaScript. No build step and no dependencies.

## Run it

Open the folder in VS Code and start **Live Server** on `index.html`.
Use `http://` (not `file://`): the client and staff pages share data through the browser, and uploaded files are stored in IndexedDB.

## Structure

```
index.html          Landing page
loginpage.html      Log in / create a client account
clientside.html     Client portal
staffside.html      Staff portal
css/
  common.css        Design tokens (colors, light/dark), reset, theme toggle, utilities
  index.css  login.css  clientside.css  staffside.css     One stylesheet per page
js/
  theme.js          Light/dark mode (loaded in <head> so there is no flash)
  guard.js          Sends visitors without the right session back to the login page
  core.js           Shared helpers: DCM.esc, peso, plural, store, toast, debounce
  login.js  client.js  staff.js                            One script per page
```

Load order on portal pages: `theme.js` → `guard.js` → (page markup) → `core.js` → page script.

## How the two portals talk to each other

Everything is stored in the browser (`localStorage`, plus IndexedDB for files), so both pages must run in the same browser.

| Key | Written by | Read by | Holds |
| --- | --- | --- | --- |
| `dcm_accounts` | login page | staff | Client accounts (name, email) |
| `dcm_uploads::<email>` | client | staff | Documents a client sent |
| `dcm_findings::<email>` | staff | client | Fraud / anomaly results shown on the client's Fraud & Anomalies tab |
| `dcm_msgs::<email>` | both | both | Chat with the CPA team (`me` = client, `them` = staff) |
| `dcm_ai::<email>` | client | client | Ask AI chat history |
| `dcm_tx::<email>` | client | client | Spending tracker transactions |
| IndexedDB `dcm_shared_uploads` | client | staff | The uploaded files themselves |
| `dcm_theme` | theme.js | all | `light` or `dark` |

A finding looks like `{ id, uploadId, kind, title, verdict: 'clear'|'review'|'fake', score, signals[], rec, status }`.

## Conventions

- **Colors and spacing come from tokens** in `css/common.css`. Use `var(--muted)`, `var(--danger-strong)` etc. instead of hex values. Red text, or white text on red, uses `--danger-strong` so it keeps AA contrast.
- **Dark mode** is `html[data-theme="dark"]`. Token overrides live in `common.css`; page files only add what is specific to them.
- **Never put user text into `innerHTML` directly.** Wrap it in `DCM.esc()`.
- No inline `style` or `onclick`: use classes (see the spacing utilities in `common.css`) and delegated listeners.

## Ask AI

`js/client.js` has an `askAssistant()` function. Without a server it answers from the client's own data.
To use a real LLM, set `window.DCM_LLM_ENDPOINT` to a route on **your** server (never put an API key in front-end code). It receives `POST { question, history, context }` and must reply `{ "answer": "..." }`.

## Demo limits

- Log in accepts any valid email and password. There is no real authentication, and data is not encrypted.
- OCR (Tesseract.js) loads from a CDN, so it needs an internet connection the first time.
- For real use, accounts, messages, files and findings need a server and database.
