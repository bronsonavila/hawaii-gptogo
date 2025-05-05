'use client'

import { Alert } from '@mui/material'
import { BaseSnackbar } from './BaseSnackbar'

interface ErrorSnackbarProps {
  error: string | null
  onClose: () => void
  open: boolean
}

export const ErrorSnackbar: React.FC<ErrorSnackbarProps> = ({ error, onClose, open }) => (
  <BaseSnackbar onClose={onClose} open={open}>
    <Alert onClose={onClose} severity="error" variant="filled" sx={{ width: '100%' }}>
      {error}
    </Alert>
  </BaseSnackbar>
)
