import {
  Box,
  Drawer,
  IconButton,
  Paper,
  Stack,
  Typography,
  Chip,
  Divider,
  Button,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useEffect, useMemo, useState } from 'react'
import { limitToLast, onValue, orderByChild, query, ref } from 'firebase/database'
import { db } from '../config/firebase.js'
import { generatePlainEnglishRiskExplanation } from '../config/gemini.js'
import { MapContainer, TileLayer, Polygon, Rectangle, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useAuth } from '../auth/useAuth.js'

// Core feature: Google Maps + OverlayView NxN grid.
// Data source: Firebase RTDB at /cpde/demo/grid/cells
// Cell record example:
// { level: 'green'|'yellow'|'red', signal: '...', suggestedAction: '...' }

const LEVEL_TO_COLOR = {
  green: '#2E7D32',
  yellow: '#F9A825',
  red: '#C62828',
}

export default function GridMap({ gridSize = 8 }) {
  const [cells, setCells] = useState({})
  const [selected, setSelected] = useState(null)
  const [explain, setExplain] = useState('')
  const [fieldPolygon, setFieldPolygon] = useState(() => DEMO_FIELD)
  const { user } = useAuth()

  const tileUrl = useMemo(() => {
    return import.meta.env.VITE_OSM_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  }, [])

  // Subscribe to Firebase stream
  useEffect(() => {
    if (!db || !user?.uid) {
      const t = setTimeout(() => {
        setCells({})
        setFieldPolygon(DEMO_FIELD)
      }, 0)
      return () => clearTimeout(t)
    }

    const offCells = onValue(ref(db, `users/${user.uid}/grid/cells`), (snap) => setCells(snap.val() || {}))

    // Load the most recently updated field geometry.
    const latestFieldQuery = query(
      ref(db, `users/${user.uid}/fields`),
      orderByChild('updatedAt'),
      limitToLast(1),
    )

    const offField = onValue(latestFieldQuery, (snap) => {
      const obj = snap.val() || {}
      const last = Object.values(obj)[0]
      const poly = last?.geometry
      if (Array.isArray(poly) && poly.length >= 3) setFieldPolygon(poly)
    })

    return () => {
      offCells()
      offField()
    }
  }, [user?.uid])

  const fieldAverages = useMemo(() => {
    const arr = Object.values(cells || {}).filter(Boolean)
    const ndvi = arr.map((c) => c.ndvi).filter((v) => typeof v === 'number')
    const moisture = arr.map((c) => c.moisture).filter((v) => typeof v === 'number')
    const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
    return {
      ndvi: avg(ndvi),
      moisture: avg(moisture),
    }
  }, [cells])

  async function onCellSelected(zoneId) {
    const cell = cells?.[zoneId] || makeDefaultCell(zoneId)
    setSelected({ zoneId, ...cell })

    if (cell.level === 'red') {
      try {
        const text = await generatePlainEnglishRiskExplanation({
          zoneId,
          level: 'High',
          signal: cell.signal,
          suggestedAction: cell.suggestedAction,
        })
        setExplain(text)
      } catch {
        setExplain('')
      }
    } else {
      setExplain('')
    }
  }

  const selectedLevelLabel = useMemo(() => {
    if (!selected) return ''
    return selected.level === 'red' ? 'High' : selected.level === 'yellow' ? 'Medium' : 'Low'
  }, [selected])

  return (
    <Box sx={{ height: '100%', position: 'relative' }}>
      <Box
        sx={{
          height: '100%',
          width: '100%',
          borderRadius: '14px',
          overflow: 'hidden',
          boxSizing: 'border-box',
          bgcolor: 'grey.100',
        }}
      >
        <MapContainer
          center={centerFromPolygon(fieldPolygon)}
          zoom={16}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer url={tileUrl} attribution='&copy; OpenStreetMap contributors' />

          <FitToPolygon polygon={fieldPolygon} />
          <Polygon
            positions={fieldPolygon.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: '#FFFFFF', weight: 2, fillColor: '#1B5E20', fillOpacity: 0.06 }}
          />

          <GridRectangles
            gridSize={gridSize}
            polygon={fieldPolygon}
            cells={cells}
            onSelect={onCellSelected}
          />
        </MapContainer>
      </Box>

      <Drawer
        anchor="bottom"
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            overflow: 'hidden',
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ p: { xs: 2.5, md: 3 }, boxSizing: 'border-box' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography sx={{ fontWeight: 900, flex: 1 }}>
              {selected ? `Zone ${selected.zoneId} Risk: ${selectedLevelLabel}` : 'Zone'}
            </Typography>
            <IconButton aria-label="Close" onClick={() => setSelected(null)}>
              <CloseIcon />
            </IconButton>
          </Stack>

          {selected && (
            <Stack spacing={1.25} sx={{ mt: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={selected.level?.toUpperCase()}
                  color={selected.level === 'red' ? 'error' : selected.level === 'yellow' ? 'warning' : 'success'}
                  sx={{ fontWeight: 900 }}
                />
                <Typography sx={{ fontWeight: 800, color: 'text.secondary' }}>{selected.signal}</Typography>
              </Stack>

              {(typeof selected.ndvi === 'number' || typeof selected.moisture === 'number') && (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {typeof selected.ndvi === 'number' && (
                    <Chip
                      label={`NDVI ${selected.ndvi}${typeof fieldAverages.ndvi === 'number' ? ` (Field ${fieldAverages.ndvi.toFixed(2)})` : ''}`}
                      variant="outlined"
                      sx={{ fontWeight: 800 }}
                    />
                  )}
                  {typeof selected.moisture === 'number' && (
                    <Chip
                      label={`Moisture ${selected.moisture}${typeof fieldAverages.moisture === 'number' ? ` (Field ${fieldAverages.moisture.toFixed(2)})` : ''}`}
                      variant="outlined"
                      sx={{ fontWeight: 800 }}
                    />
                  )}
                </Stack>
              )}

              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Typography sx={{ fontWeight: 900 }}>Suggested Action</Typography>
                <Typography sx={{ fontWeight: 650, color: 'text.secondary', mt: 0.5 }}>
                  {selected.suggestedAction}
                </Typography>
              </Paper>

              {selected.level === 'red' && (
                <>
                  <Divider />
                  <Paper variant="outlined" sx={{ p: 1.5 }}>
                    <Typography sx={{ fontWeight: 900 }}>Plain English explanation</Typography>
                    <Typography sx={{ fontWeight: 650, color: 'text.secondary', mt: 0.5 }}>
                      {explain || 'Generating…'}
                    </Typography>
                  </Paper>
                </>
              )}

              <Button onClick={() => setSelected(null)} variant="contained" color="primary">
                Got it
              </Button>
            </Stack>
          )}
        </Box>
      </Drawer>
    </Box>
  )
}

function GridRectangles({ gridSize, polygon, cells, onSelect }) {
  const bounds = useMemo(() => bboxFromPolygon(polygon), [polygon])
  const rects = useMemo(() => {
    const { minLat, maxLat, minLng, maxLng } = bounds
    const latStep = (maxLat - minLat) / gridSize
    const lngStep = (maxLng - minLng) / gridSize
    const out = []

    for (let r = 0; r < gridSize; r += 1) {
      for (let c = 0; c < gridSize; c += 1) {
        const zoneId = toZoneId(r, c)
        const level = cells?.[zoneId]?.level || 'green'

        const south = minLat + r * latStep
        const north = minLat + (r + 1) * latStep
        const west = minLng + c * lngStep
        const east = minLng + (c + 1) * lngStep

        out.push({
          zoneId,
          level,
          // Leaflet bounds are [[southWest],[northEast]]
          bounds: [
            [south, west],
            [north, east],
          ],
        })
      }
    }
    return out
  }, [bounds, gridSize, cells])

  return (
    <>
      {rects.map((r) => (
        <Rectangle
          key={r.zoneId}
          bounds={r.bounds}
          pathOptions={{
            color: 'rgba(255,255,255,0.55)',
            weight: 1,
            fillColor: LEVEL_TO_COLOR[r.level] || LEVEL_TO_COLOR.green,
            fillOpacity: r.level === 'red' ? 0.4 : 0.28,
          }}
          eventHandlers={{
            click: () => onSelect?.(r.zoneId),
          }}
        />
      ))}
    </>
  )
}

function FitToPolygon({ polygon }) {
  const map = useMap()
  useEffect(() => {
    if (!polygon?.length) return
    const b = polygon.reduce(
      (acc, p) => {
        acc.minLat = Math.min(acc.minLat, p.lat)
        acc.maxLat = Math.max(acc.maxLat, p.lat)
        acc.minLng = Math.min(acc.minLng, p.lng)
        acc.maxLng = Math.max(acc.maxLng, p.lng)
        return acc
      },
      { minLat: Infinity, maxLat: -Infinity, minLng: Infinity, maxLng: -Infinity },
    )
    map.fitBounds(
      [
        [b.minLat, b.minLng],
        [b.maxLat, b.maxLng],
      ],
      { padding: [18, 18] },
    )
  }, [map, polygon])
  return null
}

function bboxFromPolygon(polygon) {
  return polygon.reduce(
    (acc, p) => {
      acc.minLat = Math.min(acc.minLat, p.lat)
      acc.maxLat = Math.max(acc.maxLat, p.lat)
      acc.minLng = Math.min(acc.minLng, p.lng)
      acc.maxLng = Math.max(acc.maxLng, p.lng)
      return acc
    },
    { minLat: Infinity, maxLat: -Infinity, minLng: Infinity, maxLng: -Infinity },
  )
}

function centerFromPolygon(polygon) {
  const b = bboxFromPolygon(polygon)
  if (!Number.isFinite(b.minLat)) return [20.5937, 78.9629]
  return [(b.minLat + b.maxLat) / 2, (b.minLng + b.maxLng) / 2]
}

function toZoneId(row, col) {
  const letter = String.fromCharCode('A'.charCodeAt(0) + row)
  return `${letter}${col + 1}`
}

function makeDefaultCell(zoneId) {
  return {
    level: 'green',
    signal: `Zone ${zoneId} looks stable.`,
    suggestedAction: 'No action needed. Keep monitoring.',
  }
}

const DEMO_FIELD = [
  { lat: 20.5939, lng: 78.9624 },
  { lat: 20.5939, lng: 78.9637 },
  { lat: 20.5931, lng: 78.9637 },
  { lat: 20.5931, lng: 78.9624 },
]
