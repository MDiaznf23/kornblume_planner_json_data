<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { itemIconUrl } from '../lib/assets.js'

const props = defineProps({
  open: { type: Boolean, default: false },
  items: { type: Array, required: true },
  modelValue: { type: Object, required: true } // { [itemName]: qty }
})
const emit = defineEmits(['update:modelValue', 'close'])

const search = ref('')
const draft = reactive({})

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      search.value = ''
      Object.keys(draft).forEach((k) => delete draft[k])
      Object.assign(draft, props.modelValue)
    }
  }
)

const itemsSorted = computed(() =>
  [...props.items].sort((a, b) => {
    if (a.Category !== b.Category) return a.Category.localeCompare(b.Category)
    return a.Name.localeCompare(b.Name)
  })
)

const grouped = computed(() => {
  const kw = search.value.trim().toLowerCase()
  const groups = []
  let current = null
  for (const it of itemsSorted.value) {
    if (kw && !it.Name.toLowerCase().includes(kw)) continue
    if (!current || current.category !== it.Category) {
      current = { category: it.Category, items: [] }
      groups.push(current)
    }
    current.items.push(it)
  }
  return groups
})

const filledCount = computed(
  () => Object.values(props.modelValue).filter((q) => q > 0).length
)

function reset() {
  Object.keys(draft).forEach((k) => (draft[k] = 0))
}

function save() {
  const cleaned = {}
  for (const [name, qty] of Object.entries(draft)) {
    if (qty > 0) cleaned[name] = qty
  }
  emit('update:modelValue', cleaned)
  emit('close')
}

function onImgError(e) {
  e.target.style.visibility = 'hidden'
}
</script>

<template>
  <div v-if="open" class="overlay" @keydown.esc="emit('close')">
    <div class="dialog" role="dialog" aria-modal="true" aria-label="Warehouse">
      <header class="dialog__header">
        <h3>Warehouse — item yang sudah kamu punya</h3>
        <button type="button" class="icon-btn" @click="emit('close')" aria-label="Tutup">✕</button>
      </header>

      <div class="dialog__toolbar">
        <input v-model="search" type="text" placeholder="Cari item…" class="dialog__search" />
        <button type="button" class="btn btn--ghost" @click="reset">Reset</button>
      </div>

      <div class="dialog__body">
        <div v-for="group in grouped" :key="group.category" class="wh-group">
          <h4 class="wh-group__title">{{ group.category }}</h4>
          <div class="wh-grid">
            <div v-for="it in group.items" :key="it.Id" class="wh-cell">
              <img
                class="wh-cell__icon"
                :src="itemIconUrl(it.Id)"
                :alt="it.Name"
                loading="lazy"
                @error="onImgError"
              />
              <span class="wh-cell__name">{{ it.Name }}</span>
              <input
                v-model.number="draft[it.Name]"
                type="number"
                min="0"
                class="wh-cell__qty"
                :placeholder="'0'"
              />
            </div>
          </div>
        </div>
        <p v-if="!grouped.length" class="wh-empty">Tidak ada item cocok.</p>
      </div>

      <footer class="dialog__footer">
        <span class="dialog__hint">{{ filledCount }} item terisi saat ini</span>
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
  width: min(920px, 100%);
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
  font-size: 20px;
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

.dialog__toolbar {
  display: flex;
  gap: 10px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--ink-800);
}

.dialog__search {
  flex: 1;
  background: var(--ink-950);
  border: 1px solid var(--ink-600);
  border-radius: var(--radius-sm);
  color: var(--paper);
  padding: 8px 10px;
  font-size: 13.5px;
}

.dialog__body {
  overflow-y: auto;
  padding: 14px 20px 6px;
  flex: 1;
}

.wh-group__title {
  font-family: var(--font-mono);
  font-size: 11.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--storm-bright);
  margin: 14px 0 8px;
}

.wh-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  gap: 8px;
}

.wh-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: var(--ink-800);
  border: 1px solid var(--ink-700);
  border-radius: var(--radius-sm);
  padding: 8px 6px 9px;
}

.wh-cell__icon {
  width: 34px;
  height: 34px;
  object-fit: contain;
}

.wh-cell__name {
  font-size: 10.5px;
  text-align: center;
  color: var(--paper-dim);
  line-height: 1.25;
  min-height: 26px;
}

.wh-cell__qty {
  width: 100%;
  background: var(--ink-950);
  border: 1px solid var(--ink-600);
  border-radius: 3px;
  color: var(--paper);
  text-align: center;
  padding: 4px;
  font-family: var(--font-mono);
  font-size: 12.5px;
}

.wh-empty {
  color: var(--paper-faint);
  padding: 20px 0;
  text-align: center;
}

.dialog__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-top: 1px solid var(--ink-700);
}

.dialog__hint {
  color: var(--paper-faint);
  font-size: 12.5px;
  font-family: var(--font-mono);
}
</style>
