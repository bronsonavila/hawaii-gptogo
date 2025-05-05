'use client'

import { Snackbar } from '@mui/material'
import React from 'react'

interface BaseSnackbarProps {
  children: React.ReactNode
  onClose: () => void
  open: boolean
}

export const BaseSnackbar: React.FC<BaseSnackbarProps> = ({ children, onClose, open }) => {
  const handleClose = (_?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return

    onClose()
  }

  return (
    <Snackbar
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      autoHideDuration={6000}
      onClose={handleClose}
      open={open}
    >
      <div>
        {/* Wrapping div prevents Snackbar from passing props to Alert */}
        {children}
      </div>
    </Snackbar>
  )
}
