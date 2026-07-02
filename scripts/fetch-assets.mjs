#!/usr/bin/env node
// scripts/fetch-assets.mjs
//
// Pemakaian:
//   node scripts/fetch-assets.mjs data              -> update arcanists/items/formulas/stages
//   node scripts/fetch-assets.mjs images:arcanists   -> download semua icon arcanist yang belum ada
//   node scripts/fetch-assets.mjs images:items       -> download semua icon item yang belum ada
//   node scripts/fetch-assets.mjs images:frequency   -> download semua icon shape frequency yang belum ada
//   node scripts/fetch-assets.mjs all                -> semua di atas berurutan
//
// Catatan: level_up_resources.json TIDAK ada sebagai file di repo Kornblume asli
// (di-embed langsung di source), jadi tidak di-refresh otomatis oleh script ini —

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DATA_DIR = path.join(ROOT, 'public', 'data')
const IMG_DIR = path.join(ROOT, 'public', 'images')

const RAW_BASE = 'https://raw.githubusercontent.com/windbow27/kornblume/main/public/data'
const RAW_IMG_BASE = 'https://raw.githubusercontent.com/windbow27/kornblume/main/public/images'

async function download(url, destPath) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  fs.mkdirSync(path.dirname(destPath), { recursive: true })
  fs.writeFileSync(destPath, buf)
}

async function refreshDataFiles() {
  const files = ['arcanists.json', 'items.json', 'formulas.json', 'stages3_3_greedy.json']
  for (const f of files) {
    const dest = path.join(DATA_DIR, f)
    console.log(`[data] downloading ${f} ...`)
    await download(`${RAW_BASE}/${f}`, dest)
  }
  console.log('[data] done. Data arcanist/item/stage sudah diperbarui ke versi terbaru.')
}

async function refreshImages(category, idExtractor, listSource) {
  const items = JSON.parse(fs.readFileSync(path.join(DATA_DIR, listSource), 'utf-8'))
  const ids = idExtractor(items)
  let downloaded = 0
  let skipped = 0
  for (const id of ids) {
    const dest = path.join(IMG_DIR, category, `${id}.webp`)
    if (fs.existsSync(dest)) {
      skipped++
      continue
    }
    try {
      await download(`${RAW_IMG_BASE}/${category}/icon/${id}.webp`, dest)
      downloaded++
      console.log(`[images:${category}] downloaded ${id}.webp`)
    } catch (e) {
      console.warn(`[images:${category}] gagal ${id}: ${e.message}`)
    }
  }
  console.log(`[images:${category}] selesai. downloaded=${downloaded} skipped(existing)=${skipped}`)
}

async function refreshFrequencyImages() {
  const arcanists = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'arcanists.json'), 'utf-8'))
  const seen = new Set()
  let downloaded = 0
  let skipped = 0
  for (const a of arcanists) {
    for (const f of a.Frequency || []) {
      const key = `${f.Type}_${f.Id}`
      if (seen.has(key)) continue
      seen.add(key)
      const dest = path.join(IMG_DIR, 'frequency', `${key}.webp`)
      if (fs.existsSync(dest)) {
        skipped++
        continue
      }
      try {
        await download(`${RAW_IMG_BASE}/arcanists/misc/frequency/${key}.webp`, dest)
        downloaded++
        console.log(`[images:frequency] downloaded ${key}.webp`)
      } catch (e) {
        console.warn(`[images:frequency] gagal ${key}: ${e.message}`)
      }
    }
  }
  console.log(`[images:frequency] selesai. downloaded=${downloaded} skipped(existing)=${skipped}`)
}

async function main() {
  const cmd = process.argv[2] || 'all'

  if (cmd === 'data' || cmd === 'all') {
    await refreshDataFiles()
  }
  if (cmd === 'images:arcanists' || cmd === 'all') {
    await refreshImages('arcanists', (list) => list.map((a) => a.Id), 'arcanists.json')
  }
  if (cmd === 'images:items' || cmd === 'all') {
    await refreshImages('items', (list) => list.map((i) => i.Id), 'items.json')
  }
  if (cmd === 'images:frequency' || cmd === 'all') {
    await refreshFrequencyImages()
  }
  if (!['data', 'images:arcanists', 'images:items', 'images:frequency', 'all'].includes(cmd)) {
    console.error(`Command tidak dikenal: ${cmd}`)
    console.error('Pakai salah satu: data | images:arcanists | images:items | images:frequency | all')
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
