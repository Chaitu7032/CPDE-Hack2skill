import { Box, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FieldBoundaryMap from '../widgets/FieldBoundaryMap.jsx'
import { seedFarmData } from '../state/seedFarmData.js'
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { push, ref, serverTimestamp, set } from 'firebase/database'
import { auth, db } from '../config/firebase.js'

const CROPS = ['Rice', 'Corn', 'Wheat', 'Soybean', 'Cotton', 'Vegetables']

export default function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [farmName, setFarmName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [cropType, setCropType] = useState('Rice')
  const [polygon, setPolygon] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = useMemo(() => {
    return (
      name.trim() &&
      farmName.trim() &&
      email.trim() &&
      password &&
      confirmPassword &&
      cropType &&
      polygon?.length >= 3 &&
      password === confirmPassword
    )
  }, [name, farmName, email, password, confirmPassword, cropType, polygon])

  async function onSubmit() {
    setError('')
    if (password !== confirmPassword) {
      setError('Password mismatch. Please confirm your password.')
      return
    }
    setSubmitting(true)
    try {
      if (!auth || !db) throw new Error('Firebase is not configured.')

      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
      const uid = cred.user.uid

      await set(ref(db, `users/${uid}/profile`), {
        farmerName: name.trim(),
        farmName: farmName.trim(),
        email: email.trim(),
        createdAt: serverTimestamp(),
      })

      const fieldsRef = ref(db, `users/${uid}/fields`)
      const newFieldRef = push(fieldsRef)
      await set(newFieldRef, {
        fieldName: farmName.trim(),
        cropType,
        geometry: polygon,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      // Hackathon-friendly: seed synthetic grid + variance so dashboard/analysis is immediately useful.
      await seedFarmData(uid, { gridSize: 8 })

      // Default behavior: do not keep the user logged in right after signup.
      await signOut(auth)
      navigate('/login', { replace: true })
    } catch (e) {
      setError(e?.message || 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Stack spacing={2.5}>
      <Typography variant="h4" sx={{ fontWeight: 900 }}>
        Farmer Registration
      </Typography>
      <Typography sx={{ color: 'text.secondary', fontWeight: 600 }}>
        Tell us your crop, then draw your field boundary. CPDE will analyze your exact land.
      </Typography>

      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          <TextField label="Your Name" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Farm Name" value={farmName} onChange={(e) => setFarmName(e.target.value)} />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <TextField
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={Boolean(confirmPassword) && password !== confirmPassword}
            helperText={Boolean(confirmPassword) && password !== confirmPassword ? 'Password mismatch.' : ' '}
            autoComplete="new-password"
          />
          <TextField
            select
            label="Crop Type"
            value={cropType}
            onChange={(e) => setCropType(e.target.value)}
          >
            {CROPS.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>

          <Box sx={{ mt: 1 }}>
            <Typography sx={{ fontWeight: 900, mb: 1 }}>Magic Step: Draw your field</Typography>
            <Typography sx={{ color: 'text.secondary', fontWeight: 600, mb: 1.5 }}>
              Tap points around your field boundary. When finished, press “Save Field”.
            </Typography>
            <FieldBoundaryMap onPolygonChanged={setPolygon} />
          </Box>

          <Button variant="contained" color="primary" disabled={!canSubmit || submitting} onClick={onSubmit}>
            {submitting ? 'Saving…' : 'Save & Start Analysis'}
          </Button>

          {error && (
            <Paper
              sx={{ p: 1.25, border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
              variant="outlined"
            >
              <Typography sx={{ fontWeight: 800, color: 'error.main' }}>{error}</Typography>
            </Paper>
          )}
        </Stack>
      </Paper>
    </Stack>
  )
}
