# Visual Brain

A local-first design inspiration library, packaged as a desktop app. Drop in screenshots
of designs you like, or use the Chrome extension to right click on any photo and add it
to your library; Claude (vision) auto-titles, categorizes, tags, and writes design notes
for each one. Everything runs on your machine — no accounts, no cloud database.

## Setup

```bash
npm install
cp .env.example .env.local   # then paste your key into .env.local
npm run electron
```

`npm run electron` launches the desktop app in dev mode — it starts the Next.js server
for you in the background and opens it in an app window, no browser required.

Get an API key at [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
and put it in `.env.local` as `ANTHROPIC_API_KEY`. Without a key, uploads still work —
each screenshot just falls back to a minimal record (title = filename) instead of a
full Claude analysis.

Optionally set `ANALYSIS_MODEL` in `.env.local` to swap the vision model (defaults to
`claude-sonnet-5`).

### Building the desktop app

```bash
npm run dist:mac    # or dist:win / dist:linux
```

Builds a distributable (`.dmg` / `.nsis` / `.AppImage`) into `release/`. The packaged app
bundles Next's standalone server and runs it with Electron's own embedded Node runtime,
so end users don't need Node or npm installed at all.

### Using a local model instead (Ollama)

Set `ANALYSIS_PROVIDER=ollama` in `.env.local` to run auto-tagging entirely on your
machine instead of calling Claude — no API key, no upload leaves your machine.
Requires [Ollama](https://ollama.com) running locally with a vision-capable model
pulled:

```bash
ollama pull gemma3:4b
ollama serve
```

`OLLAMA_MODEL` defaults to `gemma3:4b` and `OLLAMA_HOST` defaults to
`http://localhost:11434` — override either in `.env.local` if needed. Local models
are noticeably weaker than Claude at this task (nuanced tags, naming aesthetic
movements, staying in valid JSON), so expect lower-quality results in exchange for
running fully offline.

Both the analysis provider and local UI preferences (font, accent color, header size)
live under **Settings** inside the app, in the "Settings" and "Developer" sections
respectively.

`.env.local` also comes with a `VISUAL_BRAIN_TOKEN` already generated (and mirrored as
`NEXT_PUBLIC_VISUAL_BRAIN_TOKEN` for the app's own UI). This is the secret the Chrome
extension authenticates with — see [Chrome extension](#chrome-extension-save-to-visual-brain)
below. It's specific to your machine and lives only in `.env.local` (gitignored) —
never commit it or paste it into this file.

Generate your own any time with:

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

and paste the value into both `VISUAL_BRAIN_TOKEN` and `NEXT_PUBLIC_VISUAL_BRAIN_TOKEN` in `.env.local`.

## Where data lives

- `data/visual-brain.db` — SQLite database (items, folders — metadata only, no image bytes)
- `data/uploads/` — the actual screenshot/image files, referenced by filename from the db

Both are gitignored except for three seed placeholder SVGs used to populate the library
on first run. Deleting `data/visual-brain.db` resets your library (images in `data/uploads`
are untouched but become orphaned).

## How it works

1. Drop screenshots onto the Library page (drag-and-drop anywhere, or the **+ Add**
   button), or right-click any image on the web and save it via the
   [Chrome extension](#chrome-extension-save-to-visual-brain).
2. Each image is saved to `data/uploads/`, sent to Claude with a design-librarian system
   prompt, and the returned JSON (title, category, tags, description, design notes,
   dominant colors, typography, layout) is stored as a row in SQLite.
3. Multiple files upload concurrently (limit of 3 at a time) so the grid fills in as
   each analysis finishes.
4. The Library page filters everything client-side — search matches title, description,
   design notes, and tags; folder, category, and tag filters all stack with search.
5. Click any card to open the detail view, edit any field, move it to a different
   folder, copy a color swatch's hex, or delete the item.

Library is the app's home view — the logo and title in the header always route back to
it, from anywhere including Settings. **Settings** (top right) is the only other nav
item, and covers both the analysis provider/API key and local UI/developer preferences.

### Folders

A **folder** is a manual bucket you file items into by hand — separate from the
category/tags Claude generates automatically. Every item lives in exactly one folder;
new items with nothing specified land in the default **Unsorted** folder. Manage
folders from the sidebar on the Library page (create, rename, delete — deleting a
folder moves its items to Unsorted rather than deleting them; Unsorted itself can't be
renamed or deleted).

## Chrome extension (Save to Visual Brain)

A Manifest V3 extension in `./extension/` lets you right-click any image on the web,
pick a folder, and have it saved and analyzed exactly like an upload.

**Load it:**

1. Make sure the app is running (`npm run electron`, or the installed desktop app) — the
   extension talks to `http://localhost:3000`, which the app serves internally.
2. Open `chrome://extensions`, enable **Developer mode** (top right).
3. Click **Load unpacked**, select the `extension/` folder.
4. Click the extension's icon in the toolbar to open its popup, paste your `VISUAL_BRAIN_TOKEN`
   (see above) into **Visual Brain Token**, and click **Test Connection** to confirm it can
   reach Visual Brain.

**Use it:** right-click any image on any page → **Save to Visual Brain** → pick a folder. A
notification confirms the save, and the image shows up in your Library within a few
seconds, auto-titled and tagged like everything else. Create new folders from the
popup — the right-click menu updates immediately, no reinstall needed.

**Tightening CORS to your extension ID:** by default `/api/ingest` and `/api/folders`
accept requests from any `chrome-extension://` origin. To lock it to just this
extension, copy its ID from `chrome://extensions` (shown under the extension's name
once loaded) and swap the `chrome-extension://` prefix check in `lib/cors.ts` for an
exact match against `chrome-extension://<your-extension-id>`.

## API routes the extension uses

- `GET /api/folders` — list folders (builds the right-click submenu)
- `POST /api/folders` — create `{ name }`
- `PATCH /api/folders/:id` / `DELETE /api/folders/:id` — rename / delete
- `POST /api/ingest` — save + analyze `{ imageBase64, mediaType, folderId, sourceUrl, pageUrl }`
  (or `{ sourceUrl, pageUrl }` alone — the server fetches the image itself)

All four require an `X-Visual-Brain-Token` header matching `VISUAL_BRAIN_TOKEN`.

## Stack

Next.js (App Router, TypeScript) · Tailwind CSS v4 · better-sqlite3 · @anthropic-ai/sdk ·
Electron (desktop packaging via electron-builder)
