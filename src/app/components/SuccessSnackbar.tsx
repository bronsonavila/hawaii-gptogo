import { Alert, Snackbar, useMediaQuery, useTheme } from '@mui/material'
import React from 'react'
import TaskAltIcon from '@mui/icons-material/TaskAlt'

interface SuccessSnackbarProps {
  onClose: (event?: React.SyntheticEvent | Event, reason?: string) => void
  open: boolean
}

export const SuccessSnackbar: React.FC<SuccessSnackbarProps> = ({ onClose, open }) => {
  const theme = useTheme()
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'))

  return (
    <Snackbar
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      autoHideDuration={6000}
      onClose={onClose}
      open={open}
      sx={isSmUp ? { bottom: '30px !important', right: '29px !important' } : {}}
    >
      <Alert
        icon={<TaskAltIcon fontSize="inherit" />}
        onClose={onClose}
        severity="info"
        sx={{ color: 'text.primary', width: '100%' }}
        variant="filled"
      >
        Your driving plan is clear of known closures.
      </Alert>
    </Snackbar>
  )
}
