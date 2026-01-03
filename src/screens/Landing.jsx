import { Box, Button, Card, CardContent, Container, Grid, Stack, Typography } from '@mui/material'
import { darken } from '@mui/material/styles'
import CloudQueueIcon from '@mui/icons-material/CloudQueue'
import GrassIcon from '@mui/icons-material/Grass'
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined'
import ScienceIcon from '@mui/icons-material/Science'
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import heroBg from '../assets/background.png'
import { useAuth } from '../auth/useAuth.js'

export default function Landing() {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  return (
    <Box sx={{ width: '100%' }}>
      {/* HERO */}
      <Box
        sx={{
          minHeight: '100vh',
          width: '100%',
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(90deg, rgba(0,0,0,0.25), rgba(0,0,0,0.08))',
          },
          display: 'flex',
          alignItems: 'center',
          py: { xs: 6, md: 8 },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              width: { xs: '100%', md: '55%' },
              maxWidth: 720,
              bgcolor: 'rgba(255,255,255,0.90)',
              border: '1px solid rgba(255,255,255,0.55)',
              borderRadius: '14px',
              overflow: 'hidden',
              boxSizing: 'border-box',
              backdropFilter: 'blur(10px)',
              p: { xs: 3, md: 4 },
              boxShadow: '0px 18px 50px rgba(0,0,0,0.25)',
            }}
          >
            <Typography
              sx={{
                fontFamily: 'Rozha One, serif',
                color: '#2D5A27',
                fontSize: { xs: '2.35rem', sm: '2.85rem', md: '3.5rem' },
                lineHeight: 1.05,
              }}
            >
              Detect the Invisible.
              <Box component="span" sx={{ display: 'block' }}>
                Save the Harvest.
              </Box>
            </Typography>

            <Typography
              sx={{
                mt: 1.75,
                fontFamily: 'Poppins, sans-serif',
                color: '#333',
                fontSize: { xs: 16, md: 18 },
                fontWeight: 500,
                maxWidth: 640,
              }}
            >
              Don&apos;t wait for yellow leaves. See nutrient lock-in and moisture stress 3 weeks early.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/login')}
                aria-label="Farmer login"
                sx={{
                  bgcolor: '#2D5A27',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 800,
                  textTransform: 'none',
                  px: 3,
                  py: 1.2,
                  '&:hover': { bgcolor: '#23471F' },
                }}
              >
                Farmer Login
              </Button>

              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/register')}
                aria-label="New registration"
                sx={(theme) => ({
                  bgcolor: theme.palette.cpde.registrationOrange,
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 800,
                  textTransform: 'none',
                  px: 3,
                  py: 1.2,
                  '&:hover': { bgcolor: darken(theme.palette.cpde.registrationOrange, 0.12) },
                })}
              >
                New Registration
              </Button>
            </Stack>

            <Typography
              sx={{
                mt: 1.25,
                fontFamily: 'Poppins, sans-serif',
                color: 'rgba(0,0,0,0.65)',
                fontSize: { xs: 13, md: 14 },
                fontWeight: 600,
              }}
            >
              Haven&apos;t registered yet ?  Register to create your login.
            </Typography>

            <Box
              sx={{
                mt: 3,
                pt: 2,
                borderTop: '1px solid rgba(0,0,0,0.08)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                color: 'rgba(0,0,0,0.55)',
                fontFamily: 'Poppins, sans-serif',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <PublicOutlinedIcon fontSize="small" />
                Powered by Google Earth Engine
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <VerifiedUserOutlinedIcon fontSize="small" />
                Secure Data
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* FEATURES STRIP */}
      <Box sx={{ bgcolor: 'common.white', py: { xs: 5, md: 6 } }}>
        <Container maxWidth="lg">
          <Typography
            sx={{
              fontFamily: 'Rozha One, serif',
              color: '#2D5A27',
              fontSize: { xs: '2rem', md: '2.4rem' },
              mb: 1,
            }}
          >
            What CPDE watches
          </Typography>
          <Typography sx={{ fontFamily: 'Poppins, sans-serif', color: '#444', maxWidth: 860, mb: 3 }}>
            Small differences inside your field can quietly grow into yield loss. CPDE looks for early warnings:
          </Typography>

          <Grid container spacing={2.5}>
            <Grid item xs={12} md={4}>
              <FeatureCard
                icon={<GrassIcon />}
                title="Soil Micro-variability"
                text="One corner can be too wet or too dry."
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FeatureCard
                icon={<ScienceIcon />}
                title="Nutrient Lock-in"
                text="Plants can’t absorb nutrients even when fertilizer is present."
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FeatureCard
                icon={<CloudQueueIcon />}
                title="Micro-climate Divergence"
                text="Tiny temperature/humidity changes can stress crops."
              />
            </Grid>
          </Grid>

        </Container>
      </Box>
    </Box>
  )
}


function FeatureCard({ icon, title, text }) {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: '14px',
        overflow: 'hidden',
        boxSizing: 'border-box',
        border: '1px solid rgba(74,59,50,0.14)',
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '14px',
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'rgba(74,59,50,0.08)',
            color: '#4A3B32',
            mb: 1.5,
            '& svg': { fontSize: 26 },
          }}
        >
          {icon}
        </Box>
        <Typography
          sx={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 900,
            color: '#1f1f1f',
            mb: 0.75,
          }}
        >
          {title}
        </Typography>
        <Typography sx={{ fontFamily: 'Poppins, sans-serif', color: 'rgba(0,0,0,0.65)', fontWeight: 500 }}>
          {text}
        </Typography>
      </CardContent>
    </Card>
  )
}
