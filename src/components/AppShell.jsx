import { AppBar, Box, Button, Container, Divider, IconButton, Menu, MenuItem, Stack, Toolbar, Typography } from '@mui/material'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { signOut } from 'firebase/auth'

import cpdeLogo from '../assets/image-removebg-preview (4).png'
import { useAuth } from '../auth/useAuth.js'
import { auth } from '../config/firebase.js'
import AppFooter from './AppFooter.jsx'

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
            bgcolor: (theme) => theme.palette.cpde.kellyGreen,
            color: 'common.white',
            borderBottom: '1px solid',
            borderColor: 'rgba(255,255,255,0.16)',
          }
        : {
            bgcolor: (theme) => theme.palette.cpde.kellyGreen,
            color: 'common.white',
            borderBottom: '1px solid',
            borderColor: 'rgba(255,255,255,0.16)',
          },
    [isPublicTopBar]
  )

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={appBarSx}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <Stack
            direction="row"
            spacing={1.25}
            alignItems="center"
            component={RouterLink}
            to={homeRoute}
            aria-label="Go to home"
            sx={{ textDecoration: 'none', color: 'inherit', minWidth: 0 }}
          >
            <Box
              component="img"
              src={cpdeLogo}
              alt="CPDE"
              sx={{
                height: { xs: 40, sm: 46 },
                width: 'auto',
                display: 'block',
                objectFit: 'contain',
                bgcolor: '#4A3B32',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: '14px',
                px: 0.85,
                py: 0.55,
                boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
              }}
            />

            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: 14, sm: 15 },
                  lineHeight: 1.15,
                  color: 'common.white',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                CPDE – Crop Failure Pre‑Cause Detection Engine
              </Typography>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.82)',
                  lineHeight: 1.2,
                  display: { xs: 'none', sm: 'block' },
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                AI-powered early risk intelligence for farms
              </Typography>
            </Box>
          </Stack>

          {!isPublicTopBar ? (
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
              <IconButton
                size="small"
                onClick={(e) => setProfileAnchor(e.currentTarget)}
                sx={{ color: 'common.white' }}
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
            </Box>
          ) : (
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Button
                component={RouterLink}
                to="/login"
                sx={{
                  textTransform: 'none',
                  fontWeight: 800,
                  color: 'common.white',
                  borderColor: 'rgba(255,255,255,0.45)',
                  '&:hover': { borderColor: 'rgba(255,255,255,0.8)', bgcolor: 'rgba(255,255,255,0.10)' },
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

      <Box component="main" sx={{ flex: 1 }}>
        {isLanding ? (
          <Outlet />
        ) : isAuthPage ? (
          <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
            <Outlet />
          </Container>
        ) : (
          <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
            <Outlet />
          </Container>
        )}
      </Box>

      <AppFooter />
    </Box>
  )
}
