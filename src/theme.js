import { createTheme } from '@mantine/core'

// Tema SafeMine: light, primary biru korporat, radius lembut.
export const theme = createTheme({
  primaryColor: 'blue',
  primaryShade: 7,
  fontFamily: 'Inter, "Segoe UI", system-ui, -apple-system, sans-serif',
  headings: { fontFamily: 'Inter, "Segoe UI", system-ui, sans-serif', fontWeight: '700' },
  defaultRadius: 'md',
  colors: {
    // sedikit menghangatkan abu agar tidak terasa template
    gray: [
      '#f7f9fc', '#eef1f6', '#e3e8f0', '#d2dae6', '#b6c0d0',
      '#8c98ab', '#687385', '#4a5568', '#2d3543', '#1c2430',
    ],
  },
})
