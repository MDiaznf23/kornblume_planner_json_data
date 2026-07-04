<script setup>
import { computed, watch } from 'vue'

const props = defineProps({
  form: { type: Object, required: true },
  maxInsight: { type: Number, default: 3 }
})

// ---------- LEVEL ----------
// Rule game: level mentok di 30 + (insight * 10), dan gak pernah lebih dari 60.
function maxLevelForInsight(insight) {
  return Math.min(60, 30 + insight * 10)
}

const maxLevelCurrent = computed(() => maxLevelForInsight(props.form.currentInsight))
const maxLevelGoal = computed(() => maxLevelForInsight(props.form.goalInsight))

watch(
  () => props.form.currentInsight,
  () => {
    if (props.form.currentLevel > maxLevelCurrent.value) {
      props.form.currentLevel = maxLevelCurrent.value
    }
  }
)
watch(
  () => props.form.goalInsight,
  () => {
    if (props.form.goalLevel > maxLevelGoal.value) {
      props.form.goalLevel = maxLevelGoal.value
    }
  }
)
watch(
  () => props.form.currentLevel,
  (val) => {
    if (val > maxLevelCurrent.value) props.form.currentLevel = maxLevelCurrent.value
    if (val < 0) props.form.currentLevel = 0
  }
)
watch(
  () => props.form.goalLevel,
  (val) => {
    if (val > maxLevelGoal.value) props.form.goalLevel = maxLevelGoal.value
    if (val < 0) props.form.goalLevel = 0
  }
)

// ---------- INSIGHT ----------
// Batas atas beda-beda per arcanist (2-4 bintang mentok di 2, 5-6 bintang bisa sampai 3) —
watch(
  () => props.form.currentInsight,
  (val) => {
    if (val > props.maxInsight) props.form.currentInsight = props.maxInsight
    if (val < 0) props.form.currentInsight = 0
  }
)
watch(
  () => props.form.goalInsight,
  (val) => {
    if (val > props.maxInsight) props.form.goalInsight = props.maxInsight
    if (val < 0) props.form.goalInsight = 0
  }
)

// ---------- RESONANCE ----------
// Rule asli: resonance maksimal 15 untuk arcanist 5-6 bintang (maxInsight 3), dan 10 untuk arcanist di bawahnya (maxInsight 2)
const RESONANCE_CAP = computed(() => (props.maxInsight >= 3 ? 15 : 10))

watch(
  () => props.form.currentInsight,
  (val) => {
    if (val === 0) props.form.currentResonance = 0
  }
)
watch(
  () => props.form.goalInsight,
  (val) => {
    if (val === 0) props.form.goalResonance = 0
  }
)
watch(
  () => props.form.currentResonance,
  (val) => {
    if (val > RESONANCE_CAP.value) props.form.currentResonance = RESONANCE_CAP.value
    if (val < 0) props.form.currentResonance = 0
    if (props.form.goalResonance < props.form.currentResonance) {
      props.form.goalResonance = props.form.currentResonance
    }
  }
)
watch(
  () => props.form.goalResonance,
  (val) => {
    if (val > RESONANCE_CAP.value) props.form.goalResonance = RESONANCE_CAP.value
    if (val < 0) props.form.goalResonance = 0
  }
)
// maxInsight bisa berubah kalau arcanist yang dipilih ganti (mis. 5★ -> 4★), jadi cap resonance harus di-recheck juga saat itu terjadi supaya value lama yang > cap baru ikut ke-clamp.
watch(
  () => props.maxInsight,
  () => {
    if (props.form.currentResonance > RESONANCE_CAP.value) {
      props.form.currentResonance = RESONANCE_CAP.value
    }
    if (props.form.goalResonance > RESONANCE_CAP.value) {
      props.form.goalResonance = RESONANCE_CAP.value
    }
  }
)
</script>

<template>
  <section class="target">
    <h3 class="target__title">Target</h3>
    <div class="target__row">
      <div class="field-group">
        <label class="field">
          <span>Level sekarang</span>
          <input
            v-model.number="form.currentLevel"
            type="number"
            min="0"
            :max="maxLevelCurrent"
          />
          <small class="field__hint">maks {{ maxLevelCurrent }} di insight {{ form.currentInsight }}</small>
        </label>
        <label class="field">
          <span>Level tujuan</span>
          <input
            v-model.number="form.goalLevel"
            type="number"
            min="0"
            :max="maxLevelGoal"
          />
          <small class="field__hint">maks {{ maxLevelGoal }} di insight {{ form.goalInsight }}</small>
        </label>
      </div>
      <div class="field-group field-group--divider">
        <label class="field">
          <span>Insight sekarang</span>
          <input v-model.number="form.currentInsight" type="number" min="0" :max="maxInsight" />
        </label>
        <label class="field">
          <span>Insight tujuan</span>
          <input v-model.number="form.goalInsight" type="number" min="0" :max="maxInsight" />
        </label>
      </div>
      <div class="field-group field-group--divider">
        <label class="field">
          <span>Resonance sekarang</span>
          <input
            v-model.number="form.currentResonance"
            type="number"
            min="0"
            :max="RESONANCE_CAP"
            :disabled="form.currentInsight === 0"
          />
        </label>
        <label class="field">
          <span>Resonance tujuan</span>
          <input
            v-model.number="form.goalResonance"
            type="number"
            min="0"
            :max="RESONANCE_CAP"
            :disabled="form.goalInsight === 0"
          />
        </label>
      </div>
    </div>

    <div class="target__divider">
      <span>Wilderness · produksi harian</span>
    </div>
    <div class="target__grid target__grid--wild">
      <label class="field">
        <span>Dust / hari</span>
        <input v-model.number="form.wildernessDailyDust" type="number" min="0" />
      </label>
      <label class="field">
        <span>Sharpodonty / hari</span>
        <input v-model.number="form.wildernessDailySharpodonty" type="number" min="0" />
      </label>
    </div>
  </section>
</template>

<style scoped>
.target {
  background: var(--ink-900);
  border: 1px solid var(--ink-700);
  border-radius: var(--radius-md);
  padding: 16px 18px 18px;
}

.target__title {
  font-size: 19px;
  color: var(--brass-bright);
  margin-bottom: 12px;
}

.target__row {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
}

.field-group {
  display: grid;
  grid-template-columns: repeat(2, minmax(120px, 1fr));
  gap: 10px 14px;
  padding: 0 18px;
  flex: 1;
}

.field-group:first-child {
  padding-left: 0;
}

.field-group--divider {
  border-left: 1px dashed var(--ink-600);
}

.target__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field span {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.05em;
  color: var(--paper-faint);
}

.field input {
  background: var(--ink-950);
  border: 1px solid var(--ink-600);
  border-radius: var(--radius-sm);
  color: var(--paper);
  padding: 8px 9px;
  font-family: var(--font-mono);
  font-size: 14px;
  width: 100%;
}

.field input:focus-visible {
  border-color: var(--brass);
}

.field input:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.field__hint {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--paper-faint);
}

.target__note {
  margin: 12px 0 0;
  padding: 8px 10px;
  background: rgba(181, 83, 60, 0.12);
  border: 1px solid rgba(181, 83, 60, 0.4);
  border-radius: var(--radius-sm);
  color: var(--rust);
  font-size: 12px;
  line-height: 1.5;
}

.target__divider {
  margin: 16px 0 10px;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--storm-bright);
  border-top: 1px dashed var(--ink-600);
  padding-top: 12px;
}

@media (max-width: 640px) {
  .target__row {
    flex-direction: column;
  }
  .field-group {
    grid-template-columns: 1fr 1fr;
    padding: 10px 0;
    border-left: none !important;
    border-top: 1px dashed var(--ink-600);
  }
  .field-group:first-child {
    border-top: none;
    padding-top: 0;
  }
  .target__grid--wild {
    grid-template-columns: 1fr 1fr;
  }
  .field span {
    font-size: 10px;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }
}
</style>
