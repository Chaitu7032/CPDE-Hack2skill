import { Box, Container, Divider, Stack, Typography, Link } from '@mui/material'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { alpha } from '@mui/material/styles'

export default function AppFooter() {
  const location = useLocation()

  const links = [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Satellite Grid', to: '/analysis' },
    { label: 'Alerts', to: '/alerts' },
    // Keep these within existing routes to avoid 404s.
    { label: 'Insights', to: '/dashboard#insight' },
    { label: 'Help', to: '/dashboard#help' },
  ]

  // Highlight active route (hash ignored for simplicity)
  const activePath = location.pathname

  return (
    <Box component="footer" sx={(theme) => ({ mt: 'auto', bgcolor: theme.palette.cpde.footerBg })}>
      <Divider />
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 2.5 } }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 1.5, md: 2 }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
        >
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 800, color: 'common.white' }}>
              © 2025 CPDE – Crop Failure Pre‑Cause Detection Engine
            </Typography>
            <Typography
              sx={(theme) => ({
                fontSize: 12,
                fontWeight: 700,
                color: alpha(theme.palette.cpde.footerSecondaryText, 0.82),
              })}
            >
              Academic / Research Prototype
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={1.75}
            useFlexGap
            flexWrap="wrap"
            sx={{ alignItems: 'center' }}
          >
            {links.map((l) => (
              <Link
                key={l.label}
                component={RouterLink}
                to={l.to}
                underline="none"
                sx={(theme) => ({
                  fontSize: 12.5,
                  fontWeight: 800,
                  color: activePath === l.to.split('#')[0] ? theme.palette.cpde.footerLink : alpha(theme.palette.cpde.footerLink, 0.9),
                  '&:hover': { color: theme.palette.cpde.footerLinkHover },
                })}
              >
                {l.label}
              </Link>
            ))}
          </Stack>

          <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: 'common.white' }}>
              System Status:{' '}
              <Box component="span" sx={(theme) => ({ color: theme.palette.cpde.footerStatusOnline })}>
                ●
              </Box>{' '}
              Online
            </Typography>
            <Typography
              sx={(theme) => ({
                fontSize: 12,
                fontWeight: 700,
                color: alpha(theme.palette.cpde.footerSecondaryText, 0.82),
              })}
            >
              Version: v1.0
            </Typography>
            <Typography
              sx={(theme) => ({
                fontSize: 12,
                fontWeight: 700,
                color: alpha(theme.palette.cpde.footerSecondaryText, 0.82),
              })}
            >
              Data: OpenStreetMap + Sensor Simulation
            </Typography>
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}
