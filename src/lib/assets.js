// Helper path aset yang menghormati Vite `base` 
// page di https://<user>.github.io/<repo>/ — base bukan root "/").
export function assetUrl(path) {
  const base = import.meta.env.BASE_URL || '/'
  return base.replace(/\/$/, '') + '/' + path.replace(/^\//, '')
}

export function itemIconUrl(itemId) {
  return itemId != null ? assetUrl(`images/items/${itemId}.webp`) : null
}

export function arcanistIconUrl(arcId) {
  return assetUrl(`images/arcanists/${arcId}.webp`)
}

export function frequencyIconUrl(type, id) {
  return assetUrl(`images/frequency/${type}_${id}.webp`)
}
