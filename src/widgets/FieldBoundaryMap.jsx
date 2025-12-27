import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import 'leaflet-draw'

const DEFAULT_CENTER = [20.5937, 78.9629]
const MIN_POINTS = 3
const MAX_POINTS = 6

export default function FieldBoundaryMap({ onPolygonChanged }) {
  const fgRef = useRef(null)
  const [status, setStatus] = useState('Tap the polygon tool, then draw your field.')

  const tileUrl = useMemo(
    () => import.meta.env.VITE_OSM_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    []
  )

  function clearPolygon() {
    fgRef.current?.clearLayers()
    onPolygonChanged?.(null)
    setStatus('Cleared. Draw again.')
  }

  function emitPolygon(layer) {
    try {
      const latLngs = layer.getLatLngs()?.[0] || []

      // Clamp to MAX_POINTS
      if (latLngs.length > MAX_POINTS) {
        layer.setLatLngs([latLngs.slice(0, MAX_POINTS)])
      }

      const final = (layer.getLatLngs()?.[0] || []).map(p => ({
        lat: p.lat,
        lng: p.lng,
      }))

      if (final.length < MIN_POINTS) {
        setStatus(`Add at least ${MIN_POINTS} points.`)
        onPolygonChanged?.(null)
        return
      }

      setStatus(`Field captured (${final.length} points).`)
      onPolygonChanged?.(final)
    } catch {
      setStatus('Could not read polygon.')
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 3 }}>
      <Stack spacing={1}>
        <Box
          sx={{
            height: { xs: 320, md: 380 },
            width: '100%',
            borderRadius: 2.5,
            overflow: 'hidden',
            bgcolor: 'grey.100',
          }}
        >
          <MapContainer center={DEFAULT_CENTER} zoom={5} style={{ height: '100%', width: '100%' }}>
            <TileLayer url={tileUrl} attribution="&copy; OpenStreetMap contributors" />

            <LeafletDrawController
              fgRef={fgRef}
              onCreated={emitPolygon}
              onEdited={emitPolygon}
              onStatus={setStatus}
            />
          </MapContainer>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
          <Typography sx={{ fontWeight: 700, color: 'text.secondary', flex: 1 }}>
            {status}
          </Typography>
          <Button variant="outlined" color="secondary" onClick={clearPolygon}>
            Clear
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}

/* ===========================
   Leaflet Draw Controller
=========================== */
function LeafletDrawController({ fgRef, onCreated, onEdited, onStatus }) {
  const map = useMap()

  useEffect(() => {
    const featureGroup = new L.FeatureGroup()
    fgRef.current = featureGroup
    map.addLayer(featureGroup)

    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polyline: false,
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false,
        polygon: {
          allowIntersection: false,
          showArea: true,
          maxPoints: MAX_POINTS,
          shapeOptions: {
            color: '#1B5E20',
            weight: 2,
            fillOpacity: 0.18,
          },
        },
      },
      edit: {
        featureGroup,
        remove: false,
      },
    })

    map.addControl(drawControl)
    onStatus?.('Tap polygon tool and draw 3 points.and click finish to capture field boundary.')

    // ───────── CREATED ─────────
    const onDrawCreated = (e) => {
      featureGroup.clearLayers()

      const layer = e.layer
      const points = layer.getLatLngs()?.[0] || []

      if (points.length < MIN_POINTS) {
        onStatus?.(`Minimum ${MIN_POINTS} points required.`)
        return
      }

      if (points.length > MAX_POINTS) {
        layer.setLatLngs([points.slice(0, MAX_POINTS)])
      }

      featureGroup.addLayer(layer)
      onCreated?.(layer)

      onStatus?.(`Field captured (${Math.min(points.length, MAX_POINTS)} points).`)
    }

    // ───────── EDITED ─────────
    const onDrawEdited = (e) => {
      e.layers.eachLayer((layer) => {
        let ring = layer.getLatLngs()?.[0] || []

        if (ring.length > MAX_POINTS) {
          ring = ring.slice(0, MAX_POINTS)
          layer.setLatLngs([ring])
        }

        if (ring.length < MIN_POINTS) {
          onStatus?.(`At least ${MIN_POINTS} points required.`)
          return
        }

        onEdited?.(layer)
        onStatus?.(`Field updated (${ring.length} points).`)
      })
    }

    map.on(L.Draw.Event.CREATED, onDrawCreated)
    map.on(L.Draw.Event.EDITED, onDrawEdited)

    return () => {
      map.off(L.Draw.Event.CREATED, onDrawCreated)
      map.off(L.Draw.Event.EDITED, onDrawEdited)
      map.removeControl(drawControl)
      map.removeLayer(featureGroup)
      fgRef.current = null
    }
  }, [map, fgRef, onCreated, onEdited, onStatus])

  return null
}
