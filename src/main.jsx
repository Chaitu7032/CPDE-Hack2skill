import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './routes/routes.jsx'
import { cpdeTheme } from './theme/cpdeTheme.js'
import { AuthProvider } from './auth/AuthProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={cpdeTheme}>
      <CssBaseline />
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
