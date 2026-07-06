<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
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

// ---------- Mobile: navigasi halaman dengan tombol kiri/kanan ----------
const MOBILE_PAGE_SIZE = 4
const MOBILE_BREAKPOINT = '(max-width: 760px)'

const isMobile = ref(false)
let mql
if (typeof window !== 'undefined' && window.matchMedia) {
  mql = window.matchMedia(MOBILE_BREAKPOINT)
  isMobile.value = mql.matches
  const onChange = (e) => {
    isMobile.value = e.matches
  }
  if (mql.addEventListener) mql.addEventListener('change', onChange)
  else mql.addListener(onChange)
  onBeforeUnmount(() => {
    if (mql.removeEventListener) mql.removeEventListener('change', onChange)
    else mql.removeListener(onChange)
  })
}

const page = ref(0)

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filtered.value.length / MOBILE_PAGE_SIZE))
)

// Reset ke halaman pertama tiap kali pencarian berubah
watch(search, () => {
  page.value = 0
})

watch(totalPages, (tp) => {
  if (page.value > tp - 1) page.value = tp - 1
})

const visible = computed(() => {
  if (!isMobile.value) return filtered.value
  const start = page.value * MOBILE_PAGE_SIZE
  return filtered.value.slice(start, start + MOBILE_PAGE_SIZE)
})

function prevPage() {
  if (page.value > 0) page.value -= 1
}

function nextPage() {
  if (page.value < totalPages.value - 1) page.value += 1
}

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
    <div class="picker__row">
      <button
        v-if="isMobile"
        type="button"
        class="picker__nav picker__nav--prev"
        aria-label="Arcanist sebelumnya"
        :disabled="page === 0"
        @click="prevPage"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>

      <ul class="picker__list" role="listbox">
        <li v-for="a in visible" :key="a.Id">
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
        <li v-if="!visible.length" class="picker__empty">Tidak ada arcanist cocok.</li>
      </ul>

      <button
        v-if="isMobile"
        type="button"
        class="picker__nav picker__nav--next"
        aria-label="Arcanist berikutnya"
        :disabled="page >= totalPages - 1"
        @click="nextPage"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>

    <div v-if="isMobile && filtered.length" class="picker__pageinfo">
      Halaman {{ page + 1 }} / {{ totalPages }}
    </div>
  </aside>
</template>

<style scoped>
.picker {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  min-width: 0;
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

.picker__row {
  display: flex;
  align-items: stretch;
  min-width: 0;
  min-height: 0;
  flex: 1;
}

.picker__nav {
  display: none;
}

.picker__pageinfo {
  display: none;
}

/* ---------- Mobile: jadi strip horizontal dengan navigasi kiri/kanan ---------- */
@media (max-width: 760px) {
  .picker__search {
    padding: 2px 6px 8px;
  }

  .picker__row {
    align-items: center;
    gap: 4px;
  }

  .picker__nav {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    padding: 0;
    background: var(--ink-800);
    border: 1px solid var(--ink-600);
    border-radius: 50%;
    color: var(--paper);
    cursor: pointer;
  }

  .picker__nav svg {
    width: 18px;
    height: 18px;
  }

  .picker__nav:disabled {
    opacity: 0.35;
    cursor: default;
  }

  .picker__nav:active:not(:disabled) {
    background: var(--ink-700);
    border-color: var(--brass);
  }

  .picker__pageinfo {
    display: block;
    text-align: center;
    font-family: var(--font-mono);
    font-size: 10.5px;
    letter-spacing: 0.06em;
    color: var(--paper-faint);
    padding: 2px 6px 6px;
  }

  .picker__list {
    flex-direction: row;
    overflow-x: hidden;
    overflow-y: visible;
    padding: 2px 2px 8px;
    gap: 8px;
    min-width: 0;
    flex: 1;
    justify-content: center;
  }

  .picker__list li {
    flex-shrink: 0;
  }

  .picker__item {
    flex-direction: column;
    width: 66px;
    padding: 6px 4px 7px;
    gap: 5px;
    text-align: center;
  }

  .picker__icon {
    width: 44px;
    height: 44px;
  }

  .picker__name {
    flex: none;
    width: 100%;
    font-size: 10.5px;
    line-height: 1.2;
    white-space: normal;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .picker__rarity {
    font-size: 9px;
    padding: 0 4px;
  }

  .picker__empty {
    white-space: nowrap;
  }
}
</style>
