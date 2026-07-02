// Translasi 1:1 dari kornblume — STEP 1: total material needed
// Sumber algoritma asli yang direplikasi: src/composables/calculations.js (proyek Kornblume)

export function calculateMaterials(currentId, goalId, typeList) {
  const materialsCount = {}
  if (currentId === goalId) return materialsCount
  for (let cur = currentId + 1; cur <= goalId; cur++) {
    const data = typeList.find((o) => o.Id === cur)
    if (data) {
      data.Material.forEach((mat, idx) => {
        const qty = data.Quantity[idx]
        materialsCount[mat] = (materialsCount[mat] || 0) + qty
      })
    }
  }
  return materialsCount
}

/**
 * Menghitung total Dust + Sharpodonty yang dibutuhkan untuk naik level/insight,
 * berdasarkan tabel level_up_resources (embedded, lihat data/level_up_resources.json).
 */
export function calculateExp(arcInput, levelUpResources, rarity) {
  const getLevelsInfo = (insight) =>
    levelUpResources.find(
      (c) => c.Rarity.includes(rarity) && c.Insight === insight
    ) || null

  const sumExp = (start, end, insight) => {
    const total = { Dust: 0, Sharpodonty: 0 }
    const calc = getLevelsInfo(insight)
    if (!calc) return total
    for (let level = start + 1; level <= end; level++) {
      const mat = calc.Levels[String(level)]
      if (mat) {
        total.Dust += mat.Dust || 0
        total.Sharpodonty += mat.Sharpodonty || 0
      }
    }
    return total
  }

  const total = { Dust: 0, Sharpodonty: 0 }
  const { currentInsight: curIns, goalInsight: goalIns, currentLevel: curLv, goalLevel: goalLv } = arcInput

  if (curIns === goalIns) {
    const r = sumExp(curLv, goalLv, curIns)
    total.Dust += r.Dust
    total.Sharpodonty += r.Sharpodonty
    return total
  }

  for (let insight = curIns; insight <= goalIns; insight++) {
    if (insight < goalIns) {
      const calc = getLevelsInfo(insight)
      if (calc) {
        const maxLevel = Math.max(...Object.keys(calc.Levels).map(Number))
        const r = sumExp(0, maxLevel, insight)
        total.Dust += r.Dust
        total.Sharpodonty += r.Sharpodonty
        if (insight === curIns) {
          const sub = sumExp(0, curLv, insight)
          total.Dust -= sub.Dust
          total.Sharpodonty -= sub.Sharpodonty
        }
      }
    } else {
      const r = sumExp(0, goalLv, insight)
      total.Dust += r.Dust
      total.Sharpodonty += r.Sharpodonty
    }
  }

  return total
}

/**
 * Frequency (skill grid) BUKAN range current->goal seperti Insight/Resonance,
 * tapi CHECKLIST: `selected` adalah daftar node {Type, Id} yang dipilih user.
 */
export function calculateFrequencyMaterials(selected, freqList) {
  const materialsCount = {}
  if (!selected || !freqList || !selected.length || !freqList.length) return materialsCount
  for (const sel of selected) {
    const data = freqList.find((f) => f.Type === sel.Type && f.Id === sel.Id)
    if (data && data.Material) {
      data.Material.forEach((mat, idx) => {
        const qty = data.Quantity[idx]
        materialsCount[mat] = (materialsCount[mat] || 0) + qty
      })
    }
  }
  return materialsCount
}

/**
 * Gabungan Insight + Resonance + EXP(Dust/Sharpodonty) + Frequency jadi satu peta
 * total material needs untuk satu target arcanist.
 */
export function getTotalMaterialNeeds(arcInput, arcanists, levelUpResources, frequencySelected = null) {
  const arcInfo = arcanists.find((a) => a.Id === arcInput.Id)
  if (!arcInfo) throw new Error(`Arcanist Id ${arcInput.Id} tidak ditemukan`)

  const insightNeeds = calculateMaterials(arcInput.currentInsight, arcInput.goalInsight, arcInfo.Insight)
  const resonanceNeeds = calculateMaterials(arcInput.currentResonance, arcInput.goalResonance, arcInfo.Resonance)
  const expNeeds = calculateExp(arcInput, levelUpResources, arcInfo.Rarity)
  const frequencyNeeds = calculateFrequencyMaterials(frequencySelected, arcInfo.Frequency)

  const merged = {}
  for (const d of [insightNeeds, resonanceNeeds, expNeeds, frequencyNeeds]) {
    for (const [mat, qty] of Object.entries(d)) {
      merged[mat] = (merged[mat] || 0) + qty
    }
  }
  return { needs: merged, arcInfo }
}
