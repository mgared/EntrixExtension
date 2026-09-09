# Phrase Snippets

A Chrome extension that helps concierges write shift logs faster. Typing
`;;` in any text box opens a popup with role → reason dropdowns, one-click
chips (Begin shift, Site tour, Night lockup…), and shift task tracking.

## Two builds

This repo holds one build per building. They are separate extensions —
install whichever you need.

| Building | Folder | Extension name in Chrome |
| --- | --- | --- |
| ORA | repo root | Phrase Snippets — ORA |
| Benjamin | `benjamin/` | Phrase Snippets — Benjamin |

### Installing

1. `chrome://extensions` → turn on **Developer mode** (top right)
2. **Load unpacked** → pick the repo root for ORA, or the `benjamin/`
   folder for Benjamin
3. Reload the tab you write logs in

The `benjamin/` folder sits inside the ORA build. Chrome ignores it — only
files the manifest names get loaded — so it costs nothing but disk. If you
ever zip the root folder for the Chrome Web Store, delete `benjamin/` from
the zip first: a second `manifest.json` inside the package will be
rejected.

### Running both at once

Both builds trigger on `;;`, so if you install both in the same Chrome
profile, **two popups open on every trigger**. Pick one:

- Keep only the building you're working at enabled in `chrome://extensions`
  (the toggle is enough — no need to remove it), or
- Change one build's trigger: `src/config/triggers.js`, the
  `TRIGGER_SEQUENCE` line. `;;;` or `,,` both work.

Shift state — tasks, items out, the badge — is stored per extension, so
the two never mix.

## What's different between the builds

Only the config, the manifest and each build's own docs. Everything the
extension runs on is byte-identical:

- **`manifest.json`** — the name and description
- **`src/config/franklin-helper.js`** — the site profile
- **`docs/`** — the staff manual and its screenshots, one per building

Inside the config, the building-specific parts are:

| What | Where |
| --- | --- |
| Building name in the log header | `SITE_NAME`, top of the file |
| Site tour walk route | `SITE_TOUR_AREAS`, near the bottom |
| Which roles and reasons exist | the role list — see below |

The two builds share 12 roles and 59 reasons verbatim: generic front-desk
work that reads the same at either building. On top of that,

- **ORA** has a Pilgrim Parking role (4 reasons) — 13 roles, 63 reasons
- **Benjamin** has two loading-dock reasons, one under Resident (booking
  it) and one under Concierge (having it ready) — 12 roles, 61 reasons

Two more things worth checking when you set up a new building — they're
shared today but are written in ORA's words:

- **Night lockup** chip: "resident vestibule and inner vestibule"
- **Desk organized** chip: "dog treats and mints by the desk"

Also shared, so change them in both if a building differs: `SHIFTS`
(7am-3pm / 3pm-11pm / 11pm-7am) and `SHIFT_SECTIONS` (the six trailing log
headings).

## The staff manuals

Each build has its own, opened by the **Guide** button along the bottom of
the popup. The URL lives in `MANUAL_URL` at the top of that build's
`franklin-helper.js`; an empty string hides the button.

| Building | Manual |
| --- | --- |
| ORA | https://claude.ai/code/artifact/2cef9ea9-eefc-4c43-a608-fcd55c785218 |
| Benjamin | https://claude.ai/code/artifact/9048cc3e-0bc0-487e-bf3f-82b3c0ae27d9 |

`docs/manual.src.html` is the one to edit — it keeps `{{IMG:name}}` tokens
so it stays readable and diffable. `docs/manual.html` is the built copy
with the PNGs inlined as data URIs, and that is what gets published.
Screenshots in `docs/screenshots/` are captured from the running popup,
not mocked up, so they show each building's own areas and chips.

## Copying a fix from one building to the other

Because nothing outside the config, the manifest and `docs/` diverges,
any fix elsewhere can be copied straight across:

```sh
# from the repo root — copies every shared file into the Benjamin build
for f in $(git ls-files | grep -v '^benjamin/' | grep -v '^docs/' | grep -v -e '^manifest.json$' \
    -e '^src/config/franklin-helper.js$' -e '^SNIPPETS.md$' -e '^README.md$' -e '^.gitignore$'); do
  cp "$f" "benjamin/$f"
done
```

Then check nothing unexpected drifted:

```sh
for f in $(git ls-files | grep -v '^benjamin/'); do
  [ -f "benjamin/$f" ] && { cmp -s "$f" "benjamin/$f" || echo "DIFFERS: $f"; }
done
```

Only `manifest.json`, `src/config/franklin-helper.js`, `SNIPPETS.md`,
`README.md`, `.gitignore` and everything under `docs/` should show up.

If you changed a role or reason template, regenerate the reference doc for
that build:

```sh
node generate-snippets-doc.mjs             # ORA
cd benjamin && node generate-snippets-doc.mjs   # Benjamin
```

`SNIPPETS.md` lists every role and reason with a blank and a filled
example, so you can review the wording without opening the popup.

## Layout

```
manifest.json                     extension manifest
generate-snippets-doc.mjs         writes SNIPPETS.md from the config
SNIPPETS.md                       every sentence template, rendered
src/config/franklin-helper.js     roles, reasons, chips, site profile
src/config/form-schema.js         turns the config into popup form state
src/config/triggers.js            the ;; trigger sequence
src/background/service-worker.js  overdue-task badge and notifications
src/content/main.js               content-script entry
src/content/detector/             watches for the trigger being typed
src/content/popup/                the popup: view, controller, styles
src/content/inserter/             writes the sentence into the page
src/content/positioning/          finds the caret on screen
src/content/sentence-builder.js   templates → the final sentence
src/content/shift-state.js        shift, tasks, and items lent out
src/shared/editable.js            input / textarea / contenteditable
docs/manual.src.html              the staff manual, with {{IMG:…}} tokens
docs/manual.html                  built manual, images inlined — published
docs/screenshots/                 captured from the running popup
```
