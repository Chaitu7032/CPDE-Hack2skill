import { useEffect, useMemo, useState } from 'react'
import { onValue, ref } from 'firebase/database'
import { db } from '../config/firebase.js'
import { useAuth } from '../auth/useAuth.js'

// Minimal state hook for demo.
// Expected DB shape (example):
// /cpde/demo/grid
//   size: 8
//   cells:
//     A1: { level: 'green'|'yellow'|'red', signal: '...', suggestedAction: '...' }
// /cpde/demo/variance/last30: [number...]
export function useGridSummary() {
  const [grid, setGrid] = useState(null)
  const [variance, setVariance] = useState(null)
  const { user, profile } = useAuth()

  useEffect(() => {
    if (!db || !user?.uid) return undefined

    const offGrid = onValue(ref(db, `users/${user.uid}/grid`), (snap) => setGrid(snap.val()))
    const offVar = onValue(ref(db, `users/${user.uid}/variance/last30`), (snap) => setVariance(snap.val()))

    return () => {
      offGrid()
      offVar()
    }
  }, [user?.uid])

  return useMemo(() => {
    const cells = grid?.cells || {}
    const levels = Object.values(cells).map((c) => c?.level)
    const redZones = levels.filter((l) => l === 'red').length
    const yellowZones = levels.filter((l) => l === 'yellow').length

    const gridSize = Number(grid?.size) || null
    const totalZones = levels.length || (gridSize ? gridSize * gridSize : 64)

    const riskLevel = redZones > 0 ? 'High' : yellowZones > 0 ? 'Medium' : 'Low'

    const points = Array.isArray(variance) ? variance : makeDemoVariance()
    const riskScore = clamp01((Number(points[points.length - 1]) || 0) / 100) * 100
    const trendDirection = computeTrendDirection(points)

    return {
      farmerName: profile?.farmerName || 'Farmer',
      riskLevel,
      redZones,
      yellowZones,
      totalZones,
      riskScore,
      trendDirection,
      last30VarianceScores: points,
    }
  }, [grid, variance, profile?.farmerName])
}

function clamp01(n) {
  if (Number.isNaN(n)) return 0
  return Math.max(0, Math.min(1, n))
}

function computeTrendDirection(points) {
  if (!Array.isArray(points) || points.length < 8) return 'Stable'

  const last = Number(points[points.length - 1]) || 0
  const prev = Number(points[points.length - 2]) || 0

  // Small threshold to avoid noisy flip-flops.
  const delta = last - prev
  if (delta >= 3) return 'Rising'
  if (delta <= -3) return 'Improving'
  return 'Stable'
}

function makeDemoVariance() {
  // calm synthetic data so UI looks alive before wiring TF.js stream
  const out = []
  for (let i = 0; i < 30; i += 1) {
    out.push(Math.round(35 + 10 * Math.sin(i / 4) + (i > 20 ? 8 : 0)))
  }
  return out
}
