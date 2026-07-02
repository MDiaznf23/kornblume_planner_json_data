import fs from 'fs'
import { runPlanner } from '../src/lib/planner.js'

const dataDir = new URL('../public/data/', import.meta.url)

const arcanists = JSON.parse(fs.readFileSync(new URL('arcanists.json', dataDir)))
const items = JSON.parse(fs.readFileSync(new URL('items.json', dataDir)))
const formulas = JSON.parse(fs.readFileSync(new URL('formulas.json', dataDir)))
const stages = JSON.parse(fs.readFileSync(new URL('stages3_3_greedy.json', dataDir)))
const levelUpResources = JSON.parse(fs.readFileSync(new URL('level_up_resources.json', dataDir)))

const { output } = runPlanner({
  arcId: 10100, // Aleph
  currentLevel: 0,
  goalLevel: 60,
  currentInsight: 0,
  goalInsight: 3,
  currentResonance: 0,
  goalResonance: 0,
  warehouse: {},
  wildernessDailyDust: 0,
  wildernessDailySharpodonty: 0,
  arcanists,
  formulas,
  stages,
  levelUpResources,
  frequencySelected: []
})

fs.writeFileSync(new URL('../test-output-aleph.json', import.meta.url), JSON.stringify(output, null, 2))
console.log('total_activity:', output.total_activity, 'total_days:', output.total_days)
console.log('crafting:', output.crafting)
console.log('resource_stages count:', output.resource_stages.length)
console.log('insight_stages count:', output.insight_stages.length)
console.log('farming_stages count:', output.farming_stages.length)
