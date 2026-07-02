<script setup>
import { computed, ref } from 'vue'
import { arcanistIconUrl } from '../lib/assets.js'

const props = defineProps({
  arcanists: { type: Array, required: true },
  modelValue: { type: Number, default: null }
})
const emit = defineEmits(['update:modelValue'])

const search = ref('')

const released = computed(() =>
  [...props.arcanists]
    .filter((a) => a.IsReleased)
    .sort((a, b) => a.Name.localeCompare(b.Name))
)

const filtered = computed(() => {
  const kw = search.value.trim().toLowerCase()
  if (!kw) return released.value
  return released.value.filter((a) => a.Name.toLowerCase().includes(kw))
})

function pick(id) {
  emit('update:modelValue', id)
}

function onImgError(e) {
  e.target.style.visibility = 'hidden'
}
</script>

<template>
  <aside class="picker">
    <div class="picker__search">
      <label class="picker__label" for="arc-search">Cari arcanist</label>
      <input
        id="arc-search"
        v-model="search"
        type="text"
        placeholder="Ketik nama…"
        class="picker__input"
      />
    </div>
    <ul class="picker__list" role="listbox">
      <li v-for="a in filtered" :key="a.Id">
        <button
          type="button"
          class="picker__item"
          :class="{ 'picker__item--active': a.Id === modelValue }"
          role="option"
          :aria-selected="a.Id === modelValue"
          @click="pick(a.Id)"
        >
          <img
            class="picker__icon"
            :src="arcanistIconUrl(a.Id)"
            :alt="a.Name"
            loading="lazy"
            @error="onImgError"
          />
          <span class="picker__name">{{ a.Name }}</span>
          <span class="picker__rarity">R{{ a.Rarity }}</span>
        </button>
      </li>
      <li v-if="!filtered.length" class="picker__empty">Tidak ada arcanist cocok.</li>
    </ul>
  </aside>
</template>

<style scoped>
.picker {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.picker__search {
  padding: 4px 4px 12px;
}

.picker__label {
  display: block;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--paper-faint);
  margin-bottom: 6px;
}

.picker__input {
  width: 100%;
  background: var(--ink-950);
  border: 1px solid var(--ink-600);
  border-radius: var(--radius-sm);
  color: var(--paper);
  padding: 9px 10px;
  font-size: 14px;
  font-family: var(--font-body);
}

.picker__input:focus-visible {
  border-color: var(--brass);
}

.picker__list {
  list-style: none;
  margin: 0;
  padding: 0 4px 12px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.picker__item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  padding: 6px 8px;
  color: var(--paper-dim);
  cursor: pointer;
  text-align: left;
  transition: background-color 0.12s ease, border-color 0.12s ease, color 0.12s ease;
}

.picker__item:hover {
  background: var(--ink-800);
  color: var(--paper);
}

.picker__item--active {
  background: var(--ink-700);
  border-color: var(--brass);
  color: var(--paper);
}

.picker__icon {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--ink-950);
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid var(--ink-600);
}

.picker__name {
  flex: 1;
  font-size: 13.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.picker__rarity {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--brass);
  border: 1px solid var(--ink-600);
  border-radius: 3px;
  padding: 1px 5px;
  flex-shrink: 0;
}

.picker__empty {
  padding: 12px 8px;
  color: var(--paper-faint);
  font-size: 13px;
}
</style>
