# Kornblume Planner — Web (Vue 3 + Vite)

Proyek ini adalah replika dari [Kornblume](https://github.com/windbow27/kornblume) oleh windbow27 (dengan kontribusi zero.day, fran, Door) — situs & algoritma aslinya ada di https://windbow27.github.io/kornblume/. Seluruh algoritma (kebutuhan material Insight/Resonance/EXP/Frequency, solver LP untuk farming plan, override Poussiere VI/Mintage Aesthetics VI), data game, dan aset gambar berpatokan langsung ke Kornblume.

Tujuan dibuatnya proyek ini **bukan** untuk jadi pengganti Kornblume, melainkan murni sebagai penyedia data JSON (hasil kalkulasi farming plan) untuk dikonsumsi oleh aplikasi Android pribadi saya. Hasil kalkulasinya sudah diverifikasi cocok persis dengan contoh output `planner_aleph.json` — lihat `scripts/test-aleph.mjs`.

## Struktur proyek

```
src/
  lib/
    constants.js        -> DAILY_ACTIVITY, RESONANCE_MATERIALS, FREQUENCY_MODULATION_NAMES
    calculations.js     -> hitung kebutuhan material
    solver.js            -> LP solver (farming plan + override Poussiere/Mintage)
    planner.js           -> wrapper runPlanner() -> bentuk output JSON final
    utils.js              -> pythonRound1() -- replikasi round() ala Python (banker's rounding)
    useGameData.js        -> load arcanists/items/formulas/stages/level_up_resources
    assets.js             -> helper URL icon (menghormati base path GitHub Pages)
  components/
    ArcanistPicker.vue, TargetForm.vue, WarehouseDialog.vue,
    FrequencyDialog.vue, StageTable.vue
  App.vue
public/
  data/                 -> arcanists.json, items.json, formulas.json, stages3_3_greedy.json,
                           level_up_resources.json (di-bundle statis, update manual)
  images/                -> icon arcanist/item/frequency (di-bundle statis, update manual)
scripts/
  fetch-assets.mjs       -> refresh data & icon dari repo Kornblume (dijalankan manual)
  test-aleph.mjs         -> verifikasi hasil algoritma vs planner_aleph.json
```

## Menjalankan secara lokal

```bash
npm install
npm run dev       # dev server (http://localhost:5173)
npm run build     # build production ke folder dist/
npm run preview   # preview hasil build
```

## Status data saat ini

Untuk uji coba awal, arcanist yang divalidasi penuh adalah **Aleph** (`npm run test:aleph` membandingkan hasil planner dengan `planner_aleph.json` bawaan dan harus menunjukkan `FULL MATCH`).

Data JSON (`arcanists.json`, `items.json`, dst) dan sebagian besar icon sudah ikut ter-bundle, jadi arcanist lain kemungkinan besar sudah bisa langsung dicoba juga — tapi baru Aleph yang sudah dicek angka-per-angka.

## Update data & icon setelah ada patch game baru

Data JSON & icon **tidak** di-fetch otomatis saat runtime (biar cepat & jalan offline di GitHub Pages). Kalau ada patch baru di game:

```bash
npm run refresh-assets                       # semua (data + 3 kategori icon)
node scripts/fetch-assets.mjs data           # cuma arcanists/items/formulas/stages
node scripts/fetch-assets.mjs images:arcanists
node scripts/fetch-assets.mjs images:items
node scripts/fetch-assets.mjs images:frequency
```

Script ini mendownload dari `raw.githubusercontent.com/windbow27/kornblume`, lalu menimpa file di `public/data` / `public/images`. Icon yang sudah ada tidak didownload ulang (skip). Setelah itu commit perubahannya.

> **Catatan:** `level_up_resources.json` di-embed langsung di kode (tidak ada sebagai file di repo Kornblume), jadi tidak ikut ter-refresh otomatis. Kalau Kornblume mengubah tabel EXP, update manual di `public/data/level_up_resources.json`.

## Solver LP

Versi web ini pakai [`javascript-lp-solver`](https://github.com/JWally/jsLPSolver) (pure JS, branch & bound untuk variabel integer) sebagai solver LP/MIP-nya, dengan model (variabel, constraint, objective) disusun mengikuti logika `src/composables/glpkSolver.ts` di Kornblume asli.
