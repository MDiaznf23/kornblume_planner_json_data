<script setup>
defineProps({
  form: { type: Object, required: true },
  maxInsight: { type: Number, default: 3 }
})
</script>

<template>
  <section class="target">
    <h3 class="target__title">Target</h3>
    <div class="target__row">
      <div class="field-group">
        <label class="field">
          <span>Level sekarang</span>
          <input v-model.number="form.currentLevel" type="number" min="0" max="60" />
        </label>
        <label class="field">
          <span>Level tujuan</span>
          <input v-model.number="form.goalLevel" type="number" min="0" max="60" />
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
          <input v-model.number="form.currentResonance" type="number" min="0" max="10" />
        </label>
        <label class="field">
          <span>Resonance tujuan</span>
          <input v-model.number="form.goalResonance" type="number" min="0" max="10" />
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
}
</style>
