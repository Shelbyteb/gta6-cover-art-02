// Neon Vice Cover Studio — the entry program (Node 22, standard library only).
// It hands the app in: copies this repository's app/ and screenshots/ into the
// output directory and writes /output/dossier.json with the vendored make.fun
// library, exactly as the kit's starter does. POST.json is not copied: the house
// reads the X post's address from the repository itself when the entry is made.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// and serve the app while building with `node serve.ts` (http://localhost:8080).

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps (kit reference/gate.json): only text_max_bytes shapes the
// dossier's bytes; the rest refuse an entry the scorer would refuse anyway — more
// than 4 screenshots or one over 256 KiB, more than 993 files in app/ or 48 MiB
// of app files in all, or a path under app/ over 1000 bytes. app/ counts beside
// /output's own 1000-entry cap, together with screenshots/ and dossier.json.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
