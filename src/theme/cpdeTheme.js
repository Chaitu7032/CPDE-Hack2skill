import { createTheme } from '@mui/material/styles'

export const cpdeTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1f7a4d' },
    cpde: {
      kellyGreen: '#1F6F43',
      registrationOrange: '#E07A2D',
      footerBg: '#2F6F44',
      footerLink: '#FFFFFF',
      footerLinkHover: '#A7E3B2',
      footerSecondaryText: '#FFFFFF',
      footerStatusOnline: '#1E8E3E',
    },
    // Keep a green-forward secondary for outlines/accents.
    secondary: { main: '#2f8f5b', light: '#e8f5ee' },
    background: { default: '#F6F8F7', paper: '#FFFFFF' },
    success: { main: '#1f7a4d' },
    warning: { main: '#F9A825' },
    error: { main: '#D14343', light: '#FDECEC' },
    text: { primary: '#0E1F16', secondary: '#2F3C35' },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    button: { fontWeight: 700, textTransform: 'none' },
  },
  components: {
    MuiButton: {
      defaultProps: { size: 'large', disableElevation: true },
      styleOverrides: {
        root: { minHeight: 48, borderRadius: 14 }, // large touch target
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: 'saturate(180%) blur(10px)',
        },
      },
    },
    MuiTextField: {
      defaultProps: { fullWidth: true },
    },
  },
})
