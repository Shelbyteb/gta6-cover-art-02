# Neon Vice Cover Studio

[![gta6-cover-art-02](https://make.fun/badge/gta6-cover-art-02.svg)](https://make.fun/bounty/gta6-cover-art-02)
[![rank](https://make.fun/badge/gta6-cover-art-02/Shelbyteb/gta6-cover-art-02/rank.svg)](https://make.fun/bounty/gta6-cover-art-02)
[![reward](https://make.fun/badge/gta6-cover-art-02/Shelbyteb/gta6-cover-art-02/reward.svg)](https://make.fun/bounty/gta6-cover-art-02)

An offline web app that turns your photo and a caption into GTA 6 poster-style
cover art — the multi-panel poster look, bold caption lettering, and a Vice City
sunset or neon colour grade — and exports it as a PNG to share. Built for the
[make.fun](https://make.fun/bounty/gta6-cover-art-02) bounty
**gta6-cover-art-02** ("Make GTA 6 Cover Art and Post It on X").

## What it does

- **Any photo, any panel.** Load your own photos from your machine (nothing is
  ever uploaded) into each panel. Click a panel to select it, drag the photo to
  reposition it, zoom and pan with the sliders.
- **Five poster layouts.** Full Bleed, Hero + Three, Four Panel grid, Nine Panel
  grid with the title in the middle, and tilted Polaroid-style Snapshots.
- **Six colour grades.** Vice Sunset, Neon Night, Golden Hour, Teal Dusk, Noir,
  and Candy Pop — each with its own sky, wash, and title gradient.
- **Poster lettering.** A big Anton title with a sunset gradient fill, a neon
  Pacifico script subtitle, a letter-spaced tag line, a striped retro sun, palm
  silhouettes, halftone dots, film grain, and a poster frame — all drawn in
  code, all original art.
- **One step to a PNG.** Export in the common post sizes: 1080 × 1080,
  1080 × 1350, and 1920 × 1080.
- **Fully offline.** Static files under `app/` — open `app/index.html` in desktop
  Chrome and it works with no network request. Every font is bundled under
  `app/fonts/` under the SIL Open Font License.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

Pick a layout, load a photo into each panel (or try a sample photo), write your
caption, and hit **Export PNG**.

## Layout of the repo

- `app/index.html`, `app/style.css` — the editor page
- `app/src/cover.js` — the cover renderer (layouts, grades, sun, palms, lettering)
- `app/src/main.js` — editor wiring: photos, panels, sliders, export
- `app/src/shots.js` — fixed `?shot=` scenes used for the screenshots
- `app/fonts/` — Anton and Pacifico (SIL OFL), with their licence texts
- `app/samples/` — two sample photos made with an image model for make.fun,
  free to use
- `screenshots/` — the cover and the editor at work
- `main.ts` — the entry program: copies `app/` and `screenshots/` to `/output`
  and writes `dossier.json` with `vendor/makefun-app.ts`
- `POST.json` — the address of the public X post about this app (filled in once
  the post is up)

## Originality

Everything in the cover art is drawn by this app's own code. No Rockstar Games
logo, wordmark, official artwork, character, or font is used. The fonts are
Anton and Pacifico, both under the SIL Open Font License (texts in
`app/fonts/`). The sample photos were made with an image model for make.fun.

## License

MIT — see [LICENSE](LICENSE).
