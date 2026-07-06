<script setup>
import { computed, ref } from 'vue'
import { itemIconUrl } from '../lib/assets.js'

const props = defineProps({
  cards: { type: Array, required: true },
  nameToItemId: { type: Object, default: () => ({}) },
  emptyLabel: { type: String, default: 'Tidak ada stage di kategori ini.' }
})

const sortedCards = computed(() => [...props.cards].sort((a, b) => b.activity - a.activity))

const activeIdx = ref(null)

function toggle(idx) {
  activeIdx.value = activeIdx.value === idx ? null : idx
}

// Ringkas daftar material di baris 
const MATS_PREVIEW_COUNT = 3

function matsSummary(materials) {
  if (!materials.length) return '—'
  const label = (m) => `${m.Material}:${m.Quantity}`
  if (materials.length <= MATS_PREVIEW_COUNT) {
    return materials.map(label).join(', ')
  }
  const shown = materials.slice(0, MATS_PREVIEW_COUNT).map(label).join(', ')
  return `${shown} +${materials.length - MATS_PREVIEW_COUNT} lainnya`
}

function onImgError(e) {
  e.target.style.visibility = 'hidden'
}
</script>

<template>
  <div class="stage-table">
    <table v-if="sortedCards.length">
      <thead>
        <tr>
          <th>Stage</th>
          <th>Runs</th>
          <th>Activity</th>
          <th>Hari</th>
          <th>Material</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="(c, idx) in sortedCards" :key="c.stage">
          <tr
            class="stage-row"
            :class="{ 'stage-row--active': activeIdx === idx }"
            @click="toggle(idx)"
          >
            <td class="stage-row__name">{{ c.stage }}</td>
            <td class="mono">×{{ c.runs }}</td>
            <td class="mono">{{ c.activity }}</td>
            <td class="mono">{{ c.days }}</td>
            <td class="stage-row__mats">
              <span class="stage-row__mats-text">{{ matsSummary(c.materials) }}</span>
              <span class="stage-row__mats-hint">{{ activeIdx === idx ? '▲ tutup' : '▼ detail' }}</span>
            </td>
          </tr>
          <tr v-if="activeIdx === idx" class="preview-row">
            <td colspan="5">
              <div class="preview">
                <div v-for="m in c.materials" :key="m.Material" class="preview__item">
                  <img
                    class="preview__icon"
                    :src="itemIconUrl(nameToItemId[m.Material])"
                    :alt="m.Material"
                    loading="lazy"
                    @error="onImgError"
                  />
                  <span>{{ m.Material }}<br />×{{ m.Quantity }}</span>
                </div>
              </div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
    <p v-else class="stage-table__empty">{{ emptyLabel }}</p>
  </div>
</template>

<style scoped>
.stage-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
}

thead th {
  text-align: left;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--paper-faint);
  padding: 8px 10px;
  border-bottom: 1px solid var(--ink-600);
}

.stage-row {
  cursor: pointer;
  transition: background-color 0.12s ease;
}
.stage-row:hover {
  background: var(--ink-800);
}
.stage-row--active {
  background: var(--ink-700);
}

.stage-row td {
  padding: 9px 10px;
  border-bottom: 1px solid var(--ink-800);
  vertical-align: top;
}

.stage-row__name {
  font-weight: 600;
  color: var(--brass-bright);
  white-space: nowrap;
}

.stage-row__mats {
  color: var(--paper-dim);
  max-width: 320px;
}

.stage-row__mats-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.stage-row__mats-hint {
  display: block;
  margin-top: 3px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.04em;
  color: var(--brass);
}

.mono {
  font-family: var(--font-mono);
  white-space: nowrap;
}

.preview-row td {
  padding: 0;
  border-bottom: 1px solid var(--ink-800);
}

.preview {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 14px 14px;
  background: var(--ink-950);
}

.preview__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 10.5px;
  text-align: center;
  color: var(--paper-dim);
  width: 60px;
}

.preview__icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.stage-table__empty {
  color: var(--paper-faint);
  padding: 20px 4px;
  font-size: 13.5px;
}

@media (max-width: 760px) {
  .stage-row__mats {
    max-width: 220px;
  }
}
</style>
