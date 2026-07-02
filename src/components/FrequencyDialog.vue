<script setup>
import { reactive, ref, watch } from 'vue'
import { frequencyIconUrl } from '../lib/assets.js'
import { FREQUENCY_MODULATION_NAMES } from '../lib/constants.js'

const props = defineProps({
  open: { type: Boolean, default: false },
  arcanist: { type: Object, default: null },
  modelValue: { type: Array, required: true } // [{Type, Id}, ...]
})
const emit = defineEmits(['update:modelValue', 'close'])

const draft = reactive(new Set())

function keyOf(f) {
  return `${f.Type}__${f.Id}`
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      draft.clear()
      for (const sel of props.modelValue) draft.add(keyOf(sel))
    }
  }
)

function toggle(f) {
  const k = keyOf(f)
  if (draft.has(k)) draft.delete(k)
  else draft.add(k)
}

function resetAll() {
  draft.clear()
}

function save() {
  const list = (props.arcanist?.Frequency || []).filter((f) => draft.has(keyOf(f)))
  emit(
    'update:modelValue',
    list.map((f) => ({ Type: f.Type, Id: f.Id }))
  )
  emit('close')
}

function nodeName(f) {
  return FREQUENCY_MODULATION_NAMES[f.Id] ?? `${f.Type} #${f.Id}`
}

function onImgError(e) {
  e.target.style.visibility = 'hidden'
}
</script>

<template>
  <div v-if="open" class="overlay">
    <div class="dialog" role="dialog" aria-modal="true" aria-label="Frequency">
      <header class="dialog__header">
        <h3>Frequency (skill grid) — {{ arcanist?.Name }}</h3>
        <button type="button" class="icon-btn" @click="emit('close')" aria-label="Tutup">✕</button>
      </header>

      <div class="dialog__body">
        <p v-if="!arcanist?.Frequency?.length" class="fq-empty">
          Tidak ada data Frequency untuk arcanist ini.
        </p>
        <label
          v-for="f in arcanist?.Frequency || []"
          :key="keyOf(f)"
          class="fq-node"
          :class="{ 'fq-node--checked': draft.has(keyOf(f)) }"
        >
          <input
            type="checkbox"
            :checked="draft.has(keyOf(f))"
            @change="toggle(f)"
          />
          <img
            class="fq-node__shape"
            :src="frequencyIconUrl(f.Type, f.Id)"
            :alt="f.Type"
            loading="lazy"
            @error="onImgError"
          />
          <div class="fq-node__body">
            <span class="fq-node__name">{{ nodeName(f) }}</span>
            <div class="fq-node__mats">
              <span v-for="(mat, idx) in f.Material" :key="mat" class="fq-mat">
                {{ mat }} ×{{ f.Quantity[idx] }}
              </span>
            </div>
          </div>
        </label>
      </div>

      <footer class="dialog__footer">
        <button type="button" class="btn btn--ghost" @click="resetAll">Reset</button>
        <button type="button" class="btn btn--primary" @click="save">Simpan & tutup</button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(8, 12, 16, 0.72);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
  padding: 24px;
}

.dialog {
  background: var(--ink-900);
  border: 1px solid var(--ink-700);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  width: min(760px, 100%);
  max-height: min(760px, 92vh);
  display: flex;
  flex-direction: column;
}

.dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--ink-700);
}
.dialog__header h3 {
  font-size: 19px;
  color: var(--brass-bright);
}

.icon-btn {
  background: transparent;
  border: 1px solid var(--ink-600);
  color: var(--paper-dim);
  border-radius: var(--radius-sm);
  width: 30px;
  height: 30px;
  cursor: pointer;
}
.icon-btn:hover {
  color: var(--paper);
  border-color: var(--brass);
}

.dialog__body {
  overflow-y: auto;
  padding: 14px 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fq-empty {
  color: var(--paper-faint);
  text-align: center;
  padding: 20px 0;
}

.fq-node {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--ink-800);
  border: 1px solid var(--ink-700);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  cursor: pointer;
  transition: border-color 0.12s ease;
}
.fq-node--checked {
  border-color: var(--brass);
  background: var(--ink-700);
}

.fq-node__shape {
  width: 34px;
  height: 34px;
  object-fit: contain;
  flex-shrink: 0;
}

.fq-node__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.fq-node__name {
  font-weight: 600;
  font-size: 14px;
}

.fq-node__mats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.fq-mat {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--paper-faint);
}

.dialog__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-top: 1px solid var(--ink-700);
}
</style>
