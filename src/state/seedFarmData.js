import { ref, serverTimestamp, update } from 'firebase/database'
import { db } from '../config/firebase.js'

function clamp01(x) {
  return Math.max(0, Math.min(1, x))
}

function lcg(seed) {
  // Deterministic PRNG (0..1)
  let s = seed >>> 0
  return function next() {
    s = (1664525 * s + 1013904223) >>> 0
    return s / 4294967296
  }
}

function seedFromId(id) {
  let seed = 2166136261
  for (let i = 0; i < id.length; i += 1) {
    seed ^= id.charCodeAt(i)
    seed = Math.imul(seed, 16777619)
  }
  return seed >>> 0
}

function toZoneId(row, col) {
  const letter = String.fromCharCode('A'.charCodeAt(0) + row)
  return `${letter}${col + 1}`
}

export async function seedFarmData(uid, { gridSize = 8 } = {}) {
  if (!db) return
  if (!uid) return

  const rand = lcg(seedFromId(uid))

  // Base field conditions
  const baseNdvi = 0.55 + (rand() - 0.5) * 0.08
  const baseMoisture = 0.45 + (rand() - 0.5) * 0.12

  // Simulate one "bad strip" (irrigation inequality) + one "nutrient lock-in" patch
  const dryRow = Math.floor(rand() * gridSize)
  const dryColStart = Math.floor(rand() * (gridSize - 2))
  const weakRow = Math.floor(rand() * gridSize)
  const weakCol = Math.floor(rand() * gridSize)

  const cells = {}
  const ndviVals = []
  const moistureVals = []

  for (let r = 0; r < gridSize; r += 1) {
    for (let c = 0; c < gridSize; c += 1) {
      const zoneId = toZoneId(r, c)

      let ndvi = baseNdvi + (rand() - 0.5) * 0.18
      let moisture = baseMoisture + (rand() - 0.5) * 0.22

      // Dry strip
      if (r === dryRow && c >= dryColStart && c <= dryColStart + 2) {
        moisture -= 0.22 + rand() * 0.08
      }

      // Weak patch
      if (r === weakRow && c === weakCol) {
        ndvi -= 0.25 + rand() * 0.08
      }

      ndvi = clamp01(ndvi)
      moisture = clamp01(moisture)

      ndviVals.push(ndvi)
      moistureVals.push(moisture)

      const level = moisture < 0.25 || ndvi < 0.33 ? 'red' : moisture < 0.35 || ndvi < 0.45 ? 'yellow' : 'green'

      let signal = 'Zone looks stable.'
      let suggestedAction = 'No action needed. Keep monitoring.'

      if (level === 'yellow') {
        if (moisture < 0.35) {
          signal = 'Moisture is dropping.'
          suggestedAction = 'Check irrigation flow and water this zone lightly today.'
        } else {
          signal = 'Plant health is uneven.'
          suggestedAction = 'Walk this zone and check for pests, nutrient issues, or early disease.'
        }
      }

      if (level === 'red') {
        if (moisture < 0.25) {
          signal = 'Severe dryness detected.'
          suggestedAction = 'Irrigate this zone now. Check pipes/emitters for blockage.'
        } else {
          signal = 'Critical plant stress detected.'
          suggestedAction = 'Inspect leaves and soil; consider targeted nutrient correction and pest check.'
        }
      }

      cells[zoneId] = {
        level,
        signal,
        suggestedAction,
        ndvi: Number(ndvi.toFixed(2)),
        moisture: Number(moisture.toFixed(2)),
        updatedAt: serverTimestamp(),
      }
    }
  }

  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length)
  const fieldAverages = {
    ndvi: Number(avg(ndviVals).toFixed(2)),
    moisture: Number(avg(moistureVals).toFixed(2)),
  }

  // Simple 30-day variance score series (0..100)
  const last30 = []
  let drift = 0
  for (let i = 0; i < 30; i += 1) {
    drift += (rand() - 0.5) * 4
    const noise = (rand() - 0.5) * 10
    const score = Math.round(Math.max(0, Math.min(100, 32 + i * 0.7 + drift + noise)))
    last30.push(score)
  }

  await update(ref(db, `users/${uid}`), {
    'grid/size': gridSize,
    'grid/cells': cells,
    'grid/fieldAverages': fieldAverages,
    'grid/updatedAt': serverTimestamp(),
    'variance/last30': last30,
    'variance/updatedAt': serverTimestamp(),
  })
}
