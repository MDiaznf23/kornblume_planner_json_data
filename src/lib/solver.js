import GLPK from '#glpk'
import { DAILY_ACTIVITY, RESONANCE_MATERIALS } from './constants.js'
import { pythonRound1 } from './utils.js'

let glpkPromise = null
function getGlpk() {
  if (!glpkPromise) glpkPromise = GLPK()
  return glpkPromise
}

/**
 * @param {Record<string, number>} materialNeeds
 * @param {Array} formulas
 * @param {Record<string, {name:string, category:string, cost:number, count:number, drops:Record<string,number>, id:number}>} stages
 * @param {Record<string, number>} warehouse
 * @param {number} dailyActivity
 */
export async function solveFarmingPlan(materialNeeds, formulas, stages, warehouse = {}, dailyActivity = DAILY_ACTIVITY) {
  const glpk = await getGlpk()

  const stageNames = Object.keys(stages)
  const stageVarName = (name) => `stage__${name}`
  const craftFormulas = formulas.filter((f) => f.Material && f.Material.length)
  const craftVarName = (name) => `craft__${name}`

  const objectiveCoefs = {} // varName -> coef
  const constraintCoefs = {} // constraintName -> { varName -> coef }
  const integerVars = new Set()

  function addCoef(constraintName, varName, coef) {
    if (!constraintCoefs[constraintName]) constraintCoefs[constraintName] = {}
    constraintCoefs[constraintName][varName] = (constraintCoefs[constraintName][varName] || 0) + coef
  }

  for (const name of stageNames) {
    objectiveCoefs[stageVarName(name)] = stages[name].cost
  }
  for (const f of craftFormulas) {
    integerVars.add(craftVarName(f.Name))
  }

  const allMaterials = new Set(Object.keys(materialNeeds))
  for (const f of formulas) {
    for (const m of f.Material) allMaterials.add(m)
    allMaterials.add(f.Name)
  }
  for (const info of Object.values(stages)) {
    for (const m of Object.keys(info.drops)) allMaterials.add(m)
  }

  const bounds = {} // constraintName -> needed (lower bound)

  for (const mat of allMaterials) {
    if (RESONANCE_MATERIALS.has(mat)) continue

    let hasProduced = false
    let hasConsumed = false
    const cname = `need__${mat}`

    for (const name of stageNames) {
      const info = stages[name]
      const count = info.count || 0
      const rate = mat in info.drops && count ? info.drops[mat] / count : 0
      if (rate) {
        hasProduced = true
        addCoef(cname, stageVarName(name), rate)
      }
    }

    for (const f of formulas) {
      const varName = craftVarName(f.Name)
      if (!integerVars.has(varName)) continue
      if (f.Name === mat) {
        hasProduced = true
        addCoef(cname, varName, 1)
      }
      const idx = f.Material.indexOf(mat)
      if (idx !== -1) {
        hasConsumed = true
        addCoef(cname, varName, -f.Quantity[idx])
      }
    }

    const needed = (materialNeeds[mat] || 0) - (warehouse[mat] || 0)
    if (hasProduced || hasConsumed || needed > 0) {
      bounds[cname] = needed
    }
  }

  const lp = {
    name: 'farming-plan',
    objective: {
      direction: glpk.GLP_MIN,
      name: 'obj',
      vars: Object.entries(objectiveCoefs).map(([name, coef]) => ({ name, coef }))
    },
    subjectTo: Object.entries(bounds).map(([cname, lb]) => ({
      name: cname,
      vars: Object.entries(constraintCoefs[cname] || {}).map(([name, coef]) => ({ name, coef })),
      bnds: { type: glpk.GLP_LO, ub: 0, lb }
    })),
    generals: [...integerVars]
  }

  const { result } = await glpk.solve(lp, {
    msglev: glpk.GLP_MSG_OFF,
    presol: true,
    tmlim: 20, // detik -- batas keras, sama semangatnya dengan timeout sebelumnya
    mipgap: 0.0
  })

  const vars = result.vars || {}

  // ---- bentuk kartu hasil, persis logika getPlan() di planner.ts ----
  const plan = {}
  for (const name of stageNames) {
    const rawVal = vars[stageVarName(name)] || 0
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

      // Kalau setelah pembulatan material-nya kosong, stage ini dibuang seluruhnya
      // (meniru filter `card.materials.length > 0` di planner.ts).
      if (Object.keys(materials).length === 0) continue

      plan[name] = { runs, activity, days, materials }
    }
  }

  const crafting = {}
  for (const f of craftFormulas) {
    const val = vars[craftVarName(f.Name)] || 0
    if (val > 0.001) crafting[f.Name] = Math.round(val)
  }

  return { plan, crafting, objective: result.z }
}

/**
 * STEP 4: Poussiere VI / Mintage Aesthetics VI override.
 * Meniru processSharpoAndDust() di glpkSolver.ts.
 */
export async function processDustSharpo(
  plan,
  crafting,
  formulas,
  materialNeeds,
  warehouse = {},
  wildernessDailyDust,
  wildernessDailyGold,
  dailyActivity = DAILY_ACTIVITY
) {
  const glpk = await getGlpk()

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

  const lp = {
    name: 'poussiere-mintage',
    objective: {
      direction: glpk.GLP_MIN,
      name: 'obj',
      vars: [
        { name: 'poussiere', coef: 25 },
        { name: 'mintage', coef: 25 }
      ]
    },
    subjectTo: [
      {
        name: 'sharpo',
        vars: [
          { name: 'poussiere', coef: poussiereSharpo },
          { name: 'mintage', coef: mintageSharpo }
        ],
        bnds: { type: glpk.GLP_LO, ub: 0, lb: remainingSharpo }
      },
      {
        name: 'dust',
        vars: [
          { name: 'poussiere', coef: poussiereDust },
          { name: 'mintage', coef: mintageDust }
        ],
        bnds: { type: glpk.GLP_LO, ub: 0, lb: remainingDust }
      }
    ],
    generals: ['poussiere', 'mintage']
  }

  const { result } = await glpk.solve(lp, { msglev: glpk.GLP_MSG_OFF, presol: true, tmlim: 5 })
  const vars = result.vars || {}
  const dustRuns = Math.round(vars.poussiere || 0)
  const sharpoRuns = Math.round(vars.mintage || 0)

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
