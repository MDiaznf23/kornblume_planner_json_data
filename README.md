# Kornblume Planner — Web (Vue 3 + Vite)

Replika web dari `kornblume_planner.py` (versi Tkinter). Seluruh algoritma
(kebutuhan material Insight/Resonance/EXP/Frequency, solver LP untuk
farming plan, override Poussiere VI/Mintage Aesthetics VI) diporting **1:1**
dari Python ke JavaScript dan sudah diverifikasi cocok persis dengan output
`planner_aleph.json` — lihat `scripts/test-aleph.mjs`.

Seluruh algoritma, data game, dan aset gambar berasal dari proyek
[Kornblume](https://github.com/windbow27/kornblume) oleh windbow27 (dengan
kontribusi zero.day, fran, Door). Coba versi web resminya di
https://windbow27.github.io/kornblume/. Repo ini bukan pengganti Kornblume,
hanya alat pribadi untuk mengekspor hasil planner ke JSON custom.

## Struktur proyek

```
src/
  lib/
    constants.js       -> DAILY_ACTIVITY, RESONANCE_MATERIALS, FREQUENCY_MODULATION_NAMES
    calculations.js    -> hitung kebutuhan material (Step 1 di Python)
    solver.js          -> LP solver (Step 2/3 + Step 4 override Poussiere/Mintage)
    planner.js         -> wrapper runPlanner() -> bentuk output JSON final
    utils.js            -> pythonRound1() -- replikasi round() Python (banker's rounding)
    useGameData.js       -> load arcanists/items/formulas/stages/level_up_resources
    assets.js            -> helper URL icon (menghormati base path GitHub Pages)
  components/
    ArcanistPicker.vue, TargetForm.vue, WarehouseDialog.vue,
    FrequencyDialog.vue, StageTable.vue
  App.vue
public/
  data/     -> arcanists.json, items.json, formulas.json, stages3_3_greedy.json,
               level_up_resources.json (di-bundle statis, update manual)
  images/   -> icon arcanist/item/frequency (di-bundle statis, update manual)
scripts/
  fetch-assets.mjs   -> refresh data & icon dari repo Kornblume (dijalankan manual)
  test-aleph.mjs     -> verifikasi hasil algoritma vs planner_aleph.json
```

## Menjalankan secara lokal

```bash
npm install
npm run dev       # dev server (http://localhost:5173)
npm run build     # build production ke folder dist/
npm run preview   # preview hasil build
```

## Status data saat ini

Untuk uji coba awal, arcanist yang divalidasi penuh adalah **Aleph**
(`npm run test:aleph` membandingkan hasil planner dengan `planner_aleph.json`
bawaan dan harus menunjukkan `FULL MATCH`). Data JSON (`arcanists.json`,
`items.json`, dst) dan sebagian besar icon sudah ikut ter-bundle (hasil cache
dari script Python sebelumnya), jadi arcanist lain kemungkinan besar sudah
bisa langsung dicoba juga -- tapi baru Aleph yang sudah dicek angka-per-angka.

## Update data & icon setelah ada patch game baru

Data JSON & icon **tidak** di-fetch otomatis saat runtime (biar cepat & jalan
offline di GitHub Pages). Kalau ada patch baru di game:

```bash
npm run refresh-assets                       # semua (data + 3 kategori icon)
node scripts/fetch-assets.mjs data           # cuma arcanists/items/formulas/stages
node scripts/fetch-assets.mjs images:arcanists
node scripts/fetch-assets.mjs images:items
node scripts/fetch-assets.mjs images:frequency
```

Script ini mendownload dari `raw.githubusercontent.com/windbow27/kornblume`
(sama seperti `download_if_missing`/`download_image_if_missing` di
`kornblume_planner.py`), lalu menimpa file di `public/data` /
`public/images`. Icon yang sudah ada tidak didownload ulang (skip), persis
seperti cache Python. Setelah itu commit perubahannya.

> Catatan: `level_up_resources.json` di-embed langsung di kode (tidak ada
> sebagai file di repo Kornblume asli), jadi tidak ikut ter-refresh otomatis
> -- sama seperti keterangan di script Python aslinya. Kalau Kornblume
> mengubah tabel EXP, update manual di `public/data/level_up_resources.json`.

## Deploy ke GitHub Pages

1. Push repo ini ke GitHub (misal `username/kornblume-web`).
2. Buka **Settings -> Pages** di repo, set **Source** ke **GitHub Actions**.
3. Push ke branch `main` -- workflow di `.github/workflows/deploy.yml` akan
   build & deploy otomatis ke `https://username.github.io/kornblume-web/`.

`vite.config.js` sudah diset `base: './'` (path relatif) supaya build ini
langsung jalan di subpath project page GitHub Pages tanpa perlu hardcode
nama repo.

## Solver LP

Python asli pakai `pulp` + CBC (solver native, tidak jalan di browser).
Versi web ini pakai [`javascript-lp-solver`](https://github.com/JWally/jsLPSolver)
(pure JS, branch & bound untuk variabel integer) sebagai pengganti -- model
LP/MIP-nya (variabel, constraint, objective) disusun dengan logika yang
identik ke `src/composables/glpkSolver.ts` (Kornblume asli) dan
`kornblume_planner.py`, jadi hasilnya konsisten.
