// Translasi 1:1 dari kornblume — WRAPPER

import { DAILY_ACTIVITY } from './constants.js'
import { pythonRound1 } from './utils.js'
import { getTotalMaterialNeeds } from './calculations.js'
import { solveFarmingPlan, processDustSharpo } from './solver.js'

function toCardList(stageDict) {
  return Object.entries(stageDict).map(([stage, info]) => ({
    stage,
    runs: info.runs,
    activity: info.activity,
    days: info.days,
    materials: Object.entries(info.materials).map(([Material, Quantity]) => ({ Material, Quantity }))
  }))
}

export function runPlanner({
  arcId,
  currentLevel,
  goalLevel,
  currentInsight,
  goalInsight,
  currentResonance,
  goalResonance,
  warehouse,
  wildernessDailyDust,
  wildernessDailySharpodonty,
  arcanists,
  formulas,
  stages,
  levelUpResources,
  frequencySelected = null
}) {
  const arcInput = {
    Id: arcId,
    currentLevel,
    goalLevel,
    currentInsight,
    goalInsight,
    currentResonance,
    goalResonance
  }

  const { needs, arcInfo } = getTotalMaterialNeeds(arcInput, arcanists, levelUpResources, frequencySelected)

  const { plan, crafting } = solveFarmingPlan(needs, formulas, stages, warehouse)

  const { otherStageCards, specialCards } = processDustSharpo(
    plan,
    crafting,
    formulas,
    needs,
    warehouse,
    wildernessDailyDust,
    wildernessDailySharpodonty
  )

  const specialStagesList = toCardList(specialCards)
  const farmingPlanAllList = toCardList(otherStageCards)
  const endsWithAny = (s, suffixes) => suffixes.some((suf) => s.endsWith(suf))
  const insightStagesList = farmingPlanAllList.filter((c) => endsWithAny(c.stage, ['II', 'IV', 'VI']))
  const farmingStagesList = farmingPlanAllList.filter((c) => !endsWithAny(c.stage, ['II', 'IV', 'VI']))

  const totalActivity = [...specialStagesList, ...farmingPlanAllList].reduce((s, c) => s + c.activity, 0)
  const totalDays = pythonRound1(totalActivity / DAILY_ACTIVITY)

  const output = {
    arcanist: arcInfo.Name,
    rarity: arcInfo.Rarity,
    goal: arcInput,
    warehouse_used: warehouse,
    wilderness: {
      daily_dust: wildernessDailyDust,
      daily_sharpodonty: wildernessDailySharpodonty,
      note:
        'Produksi dihitung 1x per hari (akumulasi per jam x 24 jam, atau x20 jam ' +
        'kalau Lazy Modo aktif). Default Kornblume kalau semua slot bangunan level 6 ' +
        '& vigor 0%: dust 19440/hari, sharpodonty 8640/hari.'
    },
    total_material_needed: needs,
    crafting,
    total_activity: Math.round(totalActivity),
    total_days: totalDays,
    character: arcInfo.Name,
    resource_stages: specialStagesList,
    insight_stages: insightStagesList,
    farming_stages: farmingStagesList
  }

  return { output, arcInfo }
}
