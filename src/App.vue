<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useGameData } from './lib/useGameData.js'
import { runPlanner } from './lib/planner.js'
import { arcanistIconUrl } from './lib/assets.js'
import ArcanistPicker from './components/ArcanistPicker.vue'
import TargetForm from './components/TargetForm.vue'
import WarehouseDialog from './components/WarehouseDialog.vue'
import FrequencyDialog from './components/FrequencyDialog.vue'
import StageTable from './components/StageTable.vue'

const { arcanists, items, formulas, stages, levelUpResources, loading, error, load } = useGameData()
load()

const nameToItemId = computed(() => {
  const map = {}
  for (const it of items.value) map[it.Name] = it.Id
  return map
})

// Untuk uji coba awal: default ke Aleph (Id 10100) begitu data siap.
const selectedArcId = ref(null)
watch(loading, (isLoading) => {
  if (!isLoading && selectedArcId.value === null) {
    const aleph = arcanists.value.find((a) => a.Name === 'Aleph')
    selectedArcId.value = aleph ? aleph.Id : arcanists.value.find((a) => a.IsReleased)?.Id ?? null
  }
})

const selectedArc = computed(() => arcanists.value.find((a) => a.Id === selectedArcId.value) || null)

const form = reactive({
  currentLevel: 0,
  goalLevel: 60,
  currentInsight: 0,
  goalInsight: 3,
  currentResonance: 0,
  goalResonance: 0,
  wildernessDailyDust: 0,
  wildernessDailySharpodonty: 0
})

watch(selectedArc, (arc) => {
  if (!arc) return
  const maxInsight = Math.max(0, ...(arc.Insight || []).map((i) => i.Id))
  form.goalInsight = maxInsight
  form.currentInsight = 0
  form.currentResonance = 0
  form.goalResonance = 0
  warehouse.value = {}
  frequencySelected.value = []
  result.value = null
})

const maxInsightForSelected = computed(() =>
  Math.max(0, ...((selectedArc.value?.Insight || []).map((i) => i.Id)))
)

const warehouse = ref({})
const frequencySelected = ref([])
const warehouseOpen = ref(false)
const frequencyOpen = ref(false)

const warehouseFilledCount = computed(
  () => Object.values(warehouse.value).filter((q) => q > 0).length
)
const frequencyFilledCount = computed(() => frequencySelected.value.length)

const result = ref(null)
const computeError = ref(null)
const computing = ref(false)
const activeTab = ref('resource')

// CATATAN: runPlanner() dipanggil langsung di main thread (bukan dibungkus Worker
// kita sendiri). glpk.js SUDAH bikin Worker sendiri secara internal untuk proses
// solve LP yang berat, jadi UI tetap responsif tanpa perlu wrapper tambahan.
// Sempat dicoba bungkus dengan Worker sendiri, tapi itu berarti Worker di dalam
// Worker (nested) yang dukungannya gak konsisten di semua browser dan malah bikin
// prosesnya menggantung tanpa pernah selesai/error.
async function compute() {
  computeError.value = null
  if (!selectedArc.value || computing.value) return
  computing.value = true
  result.value = null

  try {
    const { output } = await runPlanner({
      arcId: selectedArc.value.Id,
      currentLevel: form.currentLevel,
      goalLevel: form.goalLevel,
      currentInsight: form.currentInsight,
      goalInsight: form.goalInsight,
      currentResonance: form.currentResonance,
      goalResonance: form.goalResonance,
      warehouse: warehouse.value,
      wildernessDailyDust: form.wildernessDailyDust,
      wildernessDailySharpodonty: form.wildernessDailySharpodonty,
      arcanists: arcanists.value,
      formulas: formulas.value,
      stages: stages.value,
      levelUpResources: levelUpResources.value,
      frequencySelected: frequencySelected.value
    })
    result.value = output
    activeTab.value = 'resource'
  } catch (e) {
    computeError.value = e?.message || String(e)
  } finally {
    computing.value = false
  }
}

function exportJson() {
  if (!result.value) return
  const blob = new Blob([JSON.stringify(result.value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `planner_${result.value.character.replace(/\s+/g, '_').toLowerCase()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function onArcIconError(e) {
  e.target.style.visibility = 'hidden'
}

const tabs = [
  { key: 'resource', label: 'Resource Stages' },
  { key: 'insight', label: 'Insight Stages' },
  { key: 'farming', label: 'Farming Stages' },
  { key: 'crafting', label: 'Crafting' }
]
</script>

<template>
  <div class="layout">
    <header class="topbar">
      <div class="topbar__brand">
        <span class="topbar__mark">✦</span>
        <div>
          <h1 class="topbar__title">Kornblume Planner</h1>
          <p class="topbar__subtitle">Manifest farming — replika algoritma, data &amp; aset dari proyek Kornblume</p>
        </div>
      </div>
      <a
        class="topbar__credit"
        href="https://github.com/windbow27/kornblume"
        target="_blank"
        rel="noopener"
      >Sumber asli: windbow27/kornblume ↗</a>
    </header>

    <div v-if="loading" class="state state--loading">Memuat data game…</div>
    <div v-else-if="error" class="state state--error">Gagal memuat data: {{ error.message }}</div>

    <main v-else class="body">
      <ArcanistPicker
        v-model="selectedArcId"
        :arcanists="arcanists"
        class="body__picker"
      />

      <section class="body__main">
        <div v-if="selectedArc" class="arc-header">
          <img
            class="arc-header__icon"
            :src="arcanistIconUrl(selectedArc.Id)"
            :alt="selectedArc.Name"
            @error="onArcIconError"
          />
          <div>
            <h2 class="arc-header__name">{{ selectedArc.Name }}</h2>
            <p class="arc-header__meta">Rarity {{ selectedArc.Rarity }} · Afflatus {{ selectedArc.Afflatus }} · Insight max {{ maxInsightForSelected }}</p>
          </div>
        </div>

        <TargetForm :form="form" :max-insight="maxInsightForSelected" />

        <div class="toolbar">
          <button type="button" class="btn btn--outline" @click="frequencyOpen = true">
            Edit Frequency ({{ frequencyFilledCount }} node dipilih)
          </button>
          <button type="button" class="btn btn--outline" @click="warehouseOpen = true">
            Edit Warehouse ({{ warehouseFilledCount }} item terisi)
          </button>
          <span class="toolbar__spacer" />
          <button type="button" class="btn btn--primary" :disabled="computing" @click="compute">
            {{ computing ? 'Menghitung…' : 'Hitung' }}
          </button>
          <button type="button" class="btn btn--ghost" :disabled="!result" @click="exportJson">
            Simpan JSON…
          </button>
        </div>

        <p v-if="computeError" class="compute-error">Gagal menghitung: {{ computeError }}</p>

        <section v-if="result" class="results">
          <div class="summary">
            <span class="summary__label">Total activity</span>
            <span class="summary__value">{{ result.total_activity }}</span>
            <span class="summary__sep">·</span>
            <span class="summary__label">Total hari</span>
            <span class="summary__value">{{ result.total_days }}</span>
          </div>

          <nav class="tabs" role="tablist">
            <button
              v-for="t in tabs"
              :key="t.key"
              type="button"
              role="tab"
              class="tabs__btn"
              :class="{ 'tabs__btn--active': activeTab === t.key }"
              :aria-selected="activeTab === t.key"
              @click="activeTab = t.key"
            >
              {{ t.label }}
            </button>
          </nav>

          <StageTable
            v-if="activeTab === 'resource'"
            :cards="result.resource_stages"
            :name-to-item-id="nameToItemId"
            empty-label="Tidak ada resource stage (Poussiere VI / Mintage Aesthetics VI) yang dibutuhkan."
          />
          <StageTable
            v-else-if="activeTab === 'insight'"
            :cards="result.insight_stages"
            :name-to-item-id="nameToItemId"
            empty-label="Tidak ada insight stage yang dibutuhkan."
          />
          <StageTable
            v-else-if="activeTab === 'farming'"
            :cards="result.farming_stages"
            :name-to-item-id="nameToItemId"
            empty-label="Tidak ada farming stage yang dibutuhkan."
          />
          <div v-else class="crafting">
            <p v-if="!Object.keys(result.crafting).length" class="stage-table__empty">
              Tidak ada item crafting yang dibutuhkan.
            </p>
            <ul v-else class="crafting__list">
              <li v-for="(qty, name) in result.crafting" :key="name" class="crafting__item">
                <span>{{ name }}</span>
                <span class="mono">×{{ qty }}</span>
              </li>
            </ul>
          </div>
        </section>
      </section>
    </main>

    <WarehouseDialog
      :open="warehouseOpen"
      :items="items"
      v-model="warehouse"
      @close="warehouseOpen = false"
    />
    <FrequencyDialog
      :open="frequencyOpen"
      :arcanist="selectedArc"
      v-model="frequencySelected"
      @close="frequencyOpen = false"
    />
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--ink-700);
  gap: 16px;
  flex-wrap: wrap;
}

.topbar__brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.topbar__mark {
  color: var(--brass);
  font-size: 22px;
}

.topbar__title {
  font-size: 24px;
  color: var(--paper);
}

.topbar__subtitle {
  margin: 2px 0 0;
  font-size: 12.5px;
  color: var(--paper-faint);
}

.topbar__credit {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--storm-bright);
  text-decoration: none;
  white-space: nowrap;
}
.topbar__credit:hover {
  color: var(--brass-bright);
}

.state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--paper-faint);
  font-family: var(--font-mono);
  font-size: 14px;
}
.state--error {
  color: var(--rust);
}

.body {
  flex: 1;
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: 0;
}

.body__picker {
  border-right: 1px solid var(--ink-700);
  padding: 16px 10px;
  min-height: 0;
}

.body__main {
  padding: 20px 26px 40px;
  overflow-y: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.arc-header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.arc-header__icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 1px solid var(--ink-600);
  background: var(--ink-900);
  object-fit: cover;
}

.arc-header__name {
  font-size: 26px;
  color: var(--brass-bright);
}

.arc-header__meta {
  margin: 2px 0 0;
  font-size: 12.5px;
  color: var(--paper-faint);
  font-family: var(--font-mono);
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.toolbar__spacer {
  flex: 1;
}

.compute-error {
  color: var(--rust);
  font-size: 13.5px;
}

.results {
  background: var(--ink-900);
  border: 1px solid var(--ink-700);
  border-radius: var(--radius-md);
  padding: 16px 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.summary {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-family: var(--font-mono);
}

.summary__label {
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--paper-faint);
}

.summary__value {
  font-size: 20px;
  color: var(--brass-bright);
  font-weight: 600;
}

.summary__sep {
  color: var(--ink-600);
}

.tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--ink-700);
}

.tabs__btn {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--paper-faint);
  padding: 8px 4px;
  margin-right: 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.tabs__btn:hover {
  color: var(--paper);
}
.tabs__btn--active {
  color: var(--brass-bright);
  border-bottom-color: var(--brass);
}

.crafting__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.crafting__item {
  display: flex;
  justify-content: space-between;
  padding: 8px 10px;
  background: var(--ink-800);
  border-radius: var(--radius-sm);
  font-size: 13.5px;
}

.mono {
  font-family: var(--font-mono);
}

.stage-table__empty {
  color: var(--paper-faint);
  padding: 12px 4px;
}

@media (max-width: 760px) {
  .body {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
  .body__picker {
    border-right: none;
    border-bottom: 1px solid var(--ink-700);
    max-height: 240px;
  }
}
</style>
