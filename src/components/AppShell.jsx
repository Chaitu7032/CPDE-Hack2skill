import { AppBar, Box, Button, Container, Divider, IconButton, Menu, MenuItem, Toolbar, Typography } from '@mui/material'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { signOut } from 'firebase/auth'

import cpdeLogo from '../assets/image-removebg-preview (4).png'
import { useAuth } from '../auth/AuthProvider.jsx'
import { auth } from '../config/firebase.js'

export default function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const isLanding = location.pathname === '/'
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'
  const isPublicTopBar = isLanding || isAuthPage
  const { user, profile } = useAuth()
  const [profileAnchor, setProfileAnchor] = useState(null)

  const homeRoute = isPublicTopBar ? '/' : '/dashboard'

  const handleLogout = () => {
    Promise.resolve()
      .then(async () => {
        try {
          localStorage.removeItem('cpde:farmId')
        } catch {
          // ignore
        }
        if (auth) await signOut(auth)
      })
      .finally(() => navigate('/login'))
  }

  const appBarSx = useMemo(
    () =>
      isPublicTopBar
        ? {
            bgcolor: '#4A3B32',
            color: 'common.white',
          }
        : {
            bgcolor: 'primary.main',
            color: 'common.white',
            borderBottom: '1px solid',
            borderColor: 'rgba(255,255,255,0.18)',
          },
    [isPublicTopBar]
  )

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position={isPublicTopBar ? 'fixed' : 'sticky'}
        color={isPublicTopBar ? 'transparent' : 'inherit'}
        elevation={isPublicTopBar ? 0 : 0}
        sx={appBarSx}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <Box
            component={RouterLink}
            to={homeRoute}
            aria-label="Go to home"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit',
              lineHeight: 0,
            }}
          >
            <Box
              component="img"
              src={cpdeLogo}
              alt="CPDE"
              sx={{
                height: { xs: 40, sm: 48 },
                width: 'auto',
                display: 'block',
              }}
            />
          </Box>

          {!isPublicTopBar && (
            <Typography sx={{ ml: 1, color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>
              Crop Failure Pre‑Cause Detection Engine
            </Typography>
          )}

          {!isPublicTopBar && (
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
              <IconButton
                size="small"
                onClick={(e) => setProfileAnchor(e.currentTarget)}
                sx={{ mr: 1, color: 'common.white' }}
                aria-label="Open profile"
              >
                <AccountCircleIcon />
              </IconButton>

              <Menu
                anchorEl={profileAnchor}
                open={Boolean(profileAnchor)}
                onClose={() => setProfileAnchor(null)}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem disabled sx={{ opacity: 1 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                      {profile?.farmerName || 'Farmer'}
                    </Typography>
                    <Typography sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 13 }}>
                      {profile?.farmName || ''}
                    </Typography>
                    <Typography sx={{ fontWeight: 600, color: 'text.secondary', fontSize: 13 }}>
                      {profile?.email || user?.email || ''}
                    </Typography>
                  </Box>
                </MenuItem>
                <Divider />
                <MenuItem
                  onClick={() => {
                    setProfileAnchor(null)
                    handleLogout()
                  }}
                >
                  Logout
                </MenuItem>
              </Menu>

              <Button
                onClick={handleLogout}
                variant="outlined"
                size="small"
                sx={{
                  textTransform: 'none',
                  fontWeight: 800,
                  color: 'common.white',
                  borderColor: 'rgba(255,255,255,0.55)',
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.85)',
                    bgcolor: 'rgba(255,255,255,0.12)',
                  },
                }}
              >
                Logout
              </Button>
            </Box>
          )}

          {isPublicTopBar && (
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Button
                component={RouterLink}
                to="/login"
                sx={{
                  textTransform: 'none',
                  fontWeight: 800,
                  color: 'common.white',
                  borderColor: 'rgba(255,255,255,0.45)',
                }}
                variant="outlined"
                size="small"
              >
                Login
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {isLanding ? (
        <Box sx={{ pt: { xs: 7, sm: 8 } }}>
          <Outlet />
        </Box>
      ) : isAuthPage ? (
        <Box sx={{ pt: { xs: 7, sm: 8 } }}>
          <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
            <Outlet />
          </Container>
        </Box>
      ) : (
        <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
          <Outlet />
        </Container>
      )}
    </Box>
  )
}
