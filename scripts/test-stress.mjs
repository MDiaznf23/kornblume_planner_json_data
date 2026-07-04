import fs from 'fs'
import { runPlanner } from '../src/lib/planner.js'

const dataDir = new URL('../public/data/', import.meta.url)
const arcanists = JSON.parse(fs.readFileSync(new URL('arcanists.json', dataDir)))
const items = JSON.parse(fs.readFileSync(new URL('items.json', dataDir)))
const formulas = JSON.parse(fs.readFileSync(new URL('formulas.json', dataDir)))
const stages = JSON.parse(fs.readFileSync(new URL('stages3_3_greedy.json', dataDir)))
const levelUpResources = JSON.parse(fs.readFileSync(new URL('level_up_resources.json', dataDir)))

const t0 = Date.now()
const { output } = await runPlanner({
  arcId: 10100,
  currentLevel: 0,
  goalLevel: 60,
  currentInsight: 0,
  goalInsight: 3,
  currentResonance: 0,
  goalResonance: 15, // full resonance, bypass UI cap directly at algorithm level
  warehouse: {},
  wildernessDailyDust: 0,
  wildernessDailySharpodonty: 0,
  arcanists,
  formulas,
  stages,
  levelUpResources,
  frequencySelected: (arcanists.find(a=>a.Name==='Aleph').Frequency || []).map(f=>({Type:f.Type, Id:f.Id})) // select ALL frequency nodes too, max stress test
})
console.log('solve time (ms):', Date.now() - t0)
console.log('total_activity:', output.total_activity, 'total_days:', output.total_days)
