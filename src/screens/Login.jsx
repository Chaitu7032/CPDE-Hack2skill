import { Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../config/firebase.js'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = useMemo(() => email.trim() && password, [email, password])

  async function onSubmit() {
    setError('')
    setSubmitting(true)
    try {
      if (!auth) throw new Error('Firebase is not configured.')
      await signInWithEmailAndPassword(auth, email.trim(), password)
      const from = location.state?.from
      navigate(typeof from === 'string' ? from : '/dashboard', { replace: true })
    } catch (e) {
      const code = e?.code
      if (code === 'auth/invalid-email') setError('Invalid email format.')
      else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Login failed. Check your email and password.')
      } else {
        setError(e?.message || 'Login failed. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Stack spacing={2.5}>
      <Typography variant="h4" sx={{ fontWeight: 900 }}>
        Farmer Login
      </Typography>
      <Typography sx={{ color: 'text.secondary', fontWeight: 600 }}>
        Sign in to load your saved fields and satellite grid.
      </Typography>

      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
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
            autoComplete="current-password"
          />

          <Button variant="contained" color="primary" disabled={!canSubmit || submitting} onClick={onSubmit}>
            {submitting ? 'Signing in…' : 'Login'}
          </Button>

          <Button
            variant="outlined"
            color="secondary"
            onClick={() => navigate('/')}
            sx={{ textTransform: 'none', fontWeight: 800 }}
          >
            Home
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
