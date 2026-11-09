# kotilo.dev

Source of the Kotilo website, served by GitHub Pages at https://kotilo.dev. One page per public product repository in [kotilo-dev](https://github.com/kotilo-dev):

| Path | Product | Repository |
|---|---|---|
| `/` | Brand home with all products | |
| `/desktop/` | Kotilo Desktop | [kotilo](https://github.com/kotilo-dev/kotilo) |
| `/kit/` | Kotilo Kit | [kotilo-kit](https://github.com/kotilo-dev/kotilo-kit) |
| `/deck/` | Kotilo Deck | [kotilo-deck](https://github.com/kotilo-dev/kotilo-deck) |
| `/newtab/`, `/newtab/privacy/` | Kotilo New Tab | [kotilo-newtab](https://github.com/kotilo-dev/kotilo-newtab) |

Plain HTML and CSS, no build step; links use root-relative paths (`/assets/…`), so preview with a local server from the repository root (`python -m http.server`). Colors and type follow the desktop app's `DESIGN_SYSTEM.md`; each product page sets its own accent with a `p-<product>` class on `<body>`. Screenshots come from each product's repository (`assets/img/<product>/`; the desktop ones sit directly in `assets/img/`). `/newtab/privacy/` is a rendered copy of `PRIVACY.md` in the extension repository, which stays the source of truth. Fonts: Geist and Geist Mono, SIL Open Font License (`assets/fonts/OFL.txt`).

Content is licensed under the Apache License 2.0.
