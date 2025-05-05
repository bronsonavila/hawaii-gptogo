'use client'

import { Alert } from '@mui/material'
import { BaseSnackbar } from './BaseSnackbar'
import React from 'react'
import TaskAltIcon from '@mui/icons-material/TaskAlt'

interface SuccessSnackbarProps {
  onClose: () => void
  open: boolean
}

export const SuccessSnackbar: React.FC<SuccessSnackbarProps> = ({ onClose, open }) => (
  <BaseSnackbar onClose={onClose} open={open}>
    <Alert
      icon={<TaskAltIcon fontSize="inherit" />}
      onClose={onClose}
      severity="info"
      sx={{ color: 'text.primary', width: '100%' }}
      variant="filled"
    >
      Your driving plan is clear of known closures.
    </Alert>
  </BaseSnackbar>
)
