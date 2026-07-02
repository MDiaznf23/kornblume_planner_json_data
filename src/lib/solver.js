// Translasi 1:1 dari kornblume 
// Sumber algoritma asli: src/composables/glpkSolver.ts (proyek Kornblume).
//
// `javascript-lp-solver` (pure JS, branch & bound untuk variabel integer) sebagai pengganti, secara matematis model LP/MIP-nya sama persis (constraint & objective disusun dengan logika yang identik ke glpkSolver.ts), hanya mesin solver-nya beda.

import solverLib from 'javascript-lp-solver'
import { DAILY_ACTIVITY, RESONANCE_MATERIALS } from './constants.js'
import { pythonRound1 } from './utils.js'

/**
 * @param {Record<string, number>} materialNeeds
 * @param {Array} formulas
 * @param {Record<string, {name:string, category:string, cost:number, count:number, drops:Record<string,number>, id:number}>} stages
 * @param {Record<string, number>} warehouse
 * @param {number} dailyActivity
 */
export function solveFarmingPlan(materialNeeds, formulas, stages, warehouse = {}, dailyActivity = DAILY_ACTIVITY) {
  const stageNames = Object.keys(stages)
  const stageVarName = (name) => `stage__${name}`
  const craftFormulas = formulas.filter((f) => f.Material && f.Material.length)
  const craftVarName = (name) => `craft__${name}`

  const variables = {}
  const ints = {}

  for (const name of stageNames) {
    variables[stageVarName(name)] = { objective: stages[name].cost }
  }
  for (const f of craftFormulas) {
    variables[craftVarName(f.Name)] = { objective: 0 }
    ints[craftVarName(f.Name)] = 1
  }

  const allMaterials = new Set(Object.keys(materialNeeds))
  for (const f of formulas) {
    for (const m of f.Material) allMaterials.add(m)
    allMaterials.add(f.Name)
  }
  for (const info of Object.values(stages)) {
    for (const m of Object.keys(info.drops)) allMaterials.add(m)
  }

  const constraints = {}

  for (const mat of allMaterials) {
    if (RESONANCE_MATERIALS.has(mat)) continue

    let hasProduced = false
    let hasConsumed = false

    for (const name of stageNames) {
      const info = stages[name]
      const count = info.count || 0
      const rate = mat in info.drops && count ? info.drops[mat] / count : 0
      if (rate) {
        hasProduced = true
        const v = variables[stageVarName(name)]
        v[`need__${mat}`] = (v[`need__${mat}`] || 0) + rate
      }
    }

    for (const f of formulas) {
      const cv = variables[craftVarName(f.Name)]
      if (!cv) continue
      if (f.Name === mat) {
        hasProduced = true
        cv[`need__${mat}`] = (cv[`need__${mat}`] || 0) + 1
      }
      const idx = f.Material.indexOf(mat)
      if (idx !== -1) {
        hasConsumed = true
        cv[`need__${mat}`] = (cv[`need__${mat}`] || 0) - f.Quantity[idx]
      }
    }

    const needed = (materialNeeds[mat] || 0) - (warehouse[mat] || 0)
    if (hasProduced || hasConsumed || needed > 0) {
      constraints[`need__${mat}`] = { min: needed }
    }
  }

  const model = {
    optimize: 'objective',
    opType: 'min',
    constraints,
    variables,
    ints
  }

  const result = solverLib.Solve(model)

  const plan = {}
  for (const name of stageNames) {
    const rawVal = result[stageVarName(name)] || 0
    if (rawVal > 0.0001) {
      const info = stages[name]
      const runs = Math.ceil(rawVal)
      const activity = Math.ceil(runs * info.cost)
      const days = pythonRound1(activity / dailyActivity)

      const materials = {}
      const count = info.count || 0
      for (const [mat, dropCount] of Object.entries(info.drops)) {
        const qtyFloat = count ? (dropCount / count) * runs : dropCount * runs
        const frac = qtyFloat % 1
        const qty = frac >= 0.9 ? Math.ceil(qtyFloat) : Math.floor(qtyFloat)
        if (qty > 0) materials[mat] = qty
      }

      if (Object.keys(materials).length === 0) continue

      plan[name] = { runs, activity, days, materials }
    }
  }

  const crafting = {}
  for (const f of craftFormulas) {
    const val = result[craftVarName(f.Name)] || 0
    if (val > 0.001) crafting[f.Name] = Math.round(val)
  }

  return { plan, crafting, objective: result.result }
}

/**
 * STEP 4: Poussiere VI / Mintage Aesthetics VI override.
 * Meniru processSharpoAndDust() di glpkSolver.ts.
 */
export function processDustSharpo(
  plan,
  crafting,
  formulas,
  materialNeeds,
  warehouse = {},
  wildernessDailyDust,
  wildernessDailyGold,
  dailyActivity = DAILY_ACTIVITY
) {
  const formulaLastQty = {}
  for (const f of formulas) {
    formulaLastQty[f.Name] = f.Quantity && f.Quantity.length ? f.Quantity[f.Quantity.length - 1] : 0
  }

  let sharpoForCrafting = 0
  for (const [name, qty] of Object.entries(crafting)) {
    sharpoForCrafting += (formulaLastQty[name] || 0) * qty
  }

  const sharpoForGoal = (materialNeeds.Sharpodonty || 0) + sharpoForCrafting
  const dustForGoal = materialNeeds.Dust || 0

  const otherStageCards = {}
  for (const [k, v] of Object.entries(plan)) {
    if (k !== 'The Poussiere VI' && k !== 'Mintage Aesthetics VI') otherStageCards[k] = v
  }
  const activityForOthers = Object.values(otherStageCards).reduce((s, c) => s + c.activity, 0)
  const daysForOthers = pythonRound1(activityForOthers / DAILY_ACTIVITY)

  const warehouseSharpo = warehouse.Sharpodonty || 0
  const warehouseDust = warehouse.Dust || 0

  const remainingSharpo = Math.max(
    sharpoForGoal - wildernessDailyGold * daysForOthers - warehouseSharpo,
    0
  )
  const remainingDust = Math.max(
    dustForGoal - wildernessDailyDust * daysForOthers - warehouseDust,
    0
  )

  if (remainingSharpo <= 0 && remainingDust <= 0) {
    return { otherStageCards, specialCards: {} }
  }

  const round1 = pythonRound1
  const poussiereDust = 12500 + round1((wildernessDailyDust * 25) / DAILY_ACTIVITY)
  const poussiereSharpo = 250 + round1((wildernessDailyGold * 25) / DAILY_ACTIVITY)
  const mintageDust = 0 + round1((wildernessDailyDust * 25) / DAILY_ACTIVITY)
  const mintageSharpo = 9000 + round1((wildernessDailyGold * 25) / DAILY_ACTIVITY)

  const model = {
    optimize: 'objective',
    opType: 'min',
    constraints: {
      sharpo: { min: remainingSharpo },
      dust: { min: remainingDust }
    },
    variables: {
      poussiere: { objective: 25, sharpo: poussiereSharpo, dust: poussiereDust },
      mintage: { objective: 25, sharpo: mintageSharpo, dust: mintageDust }
    },
    ints: { poussiere: 1, mintage: 1 }
  }

  const result = solverLib.Solve(model)
  const dustRuns = Math.round(result.poussiere || 0)
  const sharpoRuns = Math.round(result.mintage || 0)

  const specialCards = {}
  if (dustRuns > 0) {
    specialCards['The Poussiere VI'] = {
      runs: dustRuns,
      activity: 25 * dustRuns,
      days: pythonRound1((25 * dustRuns) / DAILY_ACTIVITY),
      materials: { Dust: 12500 * dustRuns, Sharpodonty: 250 * dustRuns }
    }
  }
  if (sharpoRuns > 0) {
    specialCards['Mintage Aesthetics VI'] = {
      runs: sharpoRuns,
      activity: 25 * sharpoRuns,
      days: pythonRound1((25 * sharpoRuns) / DAILY_ACTIVITY),
      materials: { Sharpodonty: 9000 * sharpoRuns }
    }
  }

  return { otherStageCards, specialCards }
}
