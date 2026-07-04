// Sumber asli: src/constants/resources.ts (proyek Kornblume, windbow27)

export const DAILY_ACTIVITY = 240 // default dari src/stores/activityStore.ts

export const RESONANCE_MATERIALS = new Set([
  'Sinuous Howl', 'Interlaced Shudder', 'Hypocritical Murmur', 'Hoarse Echo',
  'Sonorous Knell', 'Brief Cacophony', 'Moment of Dissonance', 'Crystal Casket',
  'Key of Reverie', 'Sprout of Reverie', 'Seed of Insight',
  'Key of New Sprout', 'Key of Spark'
])

// Nama tiap node Frequency (skill grid) berdasarkan Id, GLOBAL untuk semua arcanist
// (di-embed dari lang/static/arcanists/en-US.json key "frequency-modulation-{Id}")
export const FREQUENCY_MODULATION_NAMES = {
  0: 'Placidity',
  1: 'Hyper',
  2: 'Aspirational',
  3: 'Inspire',
  4: 'Genuinity',
  5: 'Elucidation',
  6: 'Hyperphrenia',
  7: 'Delirament',
  8: 'Overindulgence',
  9: 'Quiescence',
  10: 'Prudentiality',
  11: 'Mercy',
  12: 'Equanimity',
  13: 'Equibalance',
  14: 'Stupefaction'
}
