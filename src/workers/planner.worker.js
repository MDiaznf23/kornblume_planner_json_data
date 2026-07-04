// Worker ini menjalankan runPlanner() di thread terpisah supaya tab browser
// TIDAK freeze/unresponsive saat solver LP (glpk.js / GLPK WASM) bekerja.
// runPlanner() sekarang async karena glpk.js di-load & di-solve secara asynchronous.

import { runPlanner } from '../lib/planner.js'

self.onmessage = async (e) => {
  try {
    const { output } = await runPlanner(e.data)
    self.postMessage({ ok: true, output })
  } catch (err) {
    self.postMessage({ ok: false, error: err?.message || String(err) })
  }
}
