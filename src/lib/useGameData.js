import { ref } from 'vue'
import { assetUrl } from './assets.js'

export function useGameData() {
  const arcanists = ref([])
  const items = ref([])
  const formulas = ref([])
  const stages = ref({})
  const levelUpResources = ref([])
  const loading = ref(true)
  const error = ref(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      const [a, i, f, s, l] = await Promise.all([
        fetch(assetUrl('data/arcanists.json')).then((r) => r.json()),
        fetch(assetUrl('data/items.json')).then((r) => r.json()),
        fetch(assetUrl('data/formulas.json')).then((r) => r.json()),
        fetch(assetUrl('data/stages3_3_greedy.json')).then((r) => r.json()),
        fetch(assetUrl('data/level_up_resources.json')).then((r) => r.json())
      ])
      arcanists.value = a
      items.value = i
      formulas.value = f
      stages.value = s
      levelUpResources.value = l
    } catch (e) {
      error.value = e
    } finally {
      loading.value = false
    }
  }

  return { arcanists, items, formulas, stages, levelUpResources, loading, error, load }
}
