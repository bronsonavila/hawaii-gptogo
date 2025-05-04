import { Box, CircularProgress, TextField, IconButton, Tooltip } from '@mui/material'
import TravelExploreIcon from '@mui/icons-material/TravelExplore'
import { GridFooterContainer } from '@mui/x-data-grid'
import { usePersistentState } from '@/hooks/usePersistentState'
import React from 'react'
import ClearIcon from '@mui/icons-material/Clear'

// Types

interface AnalyzeButtonProps {
  disabled: boolean
  loading: boolean
  onClick: () => void
}

interface CustomFooterProps {
  disabled: boolean
  loading: boolean
  onAnalyze: (drivingPlan: string) => void
}

// Components

const AnalyzeButton = ({ disabled, loading, onClick }: AnalyzeButtonProps) => (
  <span>
    <IconButton color="primary" disabled={disabled} onClick={onClick} sx={{ height: 40, width: 40 }}>
      {loading ? <CircularProgress size={24} color="inherit" /> : <TravelExploreIcon />}
    </IconButton>
  </span>
)

export const Footer = ({ disabled, loading, onAnalyze }: CustomFooterProps) => {
  const [drivingPlan, setDrivingPlan] = usePersistentState<string>('drivingPlan', '')

  const isButtonDisabled = disabled || loading || !drivingPlan.trim()

  const handleAnalyzeClick = () => {
    if (drivingPlan.trim()) onAnalyze(drivingPlan)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault()

      handleAnalyzeClick()
    }
  }

  return (
    <GridFooterContainer sx={{ backgroundColor: theme => theme.palette.grey[900] }}>
      <Box
        sx={{
          alignItems: 'center',
          borderColor: 'divider',
          borderTop: 1,
          display: 'flex',
          gap: 1,
          mx: 'auto',
          p: 1,
          width: { xs: '100vw', sm: '80vw', md: '70vw', lg: '60vw' }
        }}
      >
        <TextField
          autoComplete="off"
          disabled={disabled || loading}
          fullWidth
          label="Enter your planned route"
          onChange={event => setDrivingPlan(event.target.value)}
          onKeyDown={handleKeyDown}
          size="small"
          slotProps={{
            input: {
              endAdornment: (
                <>
                  {drivingPlan && !disabled && !loading && (
                    <IconButton aria-label="clear input" edge="end" onClick={() => setDrivingPlan('')} size="small">
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  )}
                </>
              )
            }
          }}
          sx={{ backgroundColor: theme => theme.palette.background.paper }}
          value={drivingPlan}
          variant="outlined"
        />

        <AnalyzeButton disabled={isButtonDisabled} loading={loading} onClick={handleAnalyzeClick} />
      </Box>
    </GridFooterContainer>
  )
}
