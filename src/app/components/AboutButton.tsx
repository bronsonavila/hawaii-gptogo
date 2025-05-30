import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  IconButton,
  Link,
  Stack,
  Typography
} from '@mui/material'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import { useState } from 'react'

export const AboutButton = () => {
  const [open, setOpen] = useState<boolean>(false)

  const handleClose = () => setOpen(false)

  const handleOpen = () => setOpen(true)

  return (
    <Box sx={{ position: 'fixed', bottom: { xs: 11, sm: 15 }, left: '50%', transform: 'translateX(-50%)' }}>
      <IconButton
        aria-label="About"
        onClick={handleOpen}
        size="small"
        sx={{ mt: { xs: 1, sm: 1.5 }, opacity: 0.3, '&:hover': { opacity: 1 } }}
      >
        <HelpOutlineIcon />
      </IconButton>

      <Dialog onClose={handleClose} open={open}>
        <DialogContent>
          <Stack spacing={1.5}>
            <Typography variant="body2">
              This website uses data from the Hawaii Department of Transportation's{' '}
              <Link href="https://hidot.hawaii.gov/highways/roadwork/" rel="noopener noreferrer" target="_blank">
                Lane Closure Public Access
              </Link>{' '}
              ArcGIS API to show lane closures occurring in the next 24 hours.
            </Typography>

            <Typography variant="body2">
              Enter your planned route and travel timeframe to get an AI-generated analysis of how these closures might
              impact your trip.
            </Typography>

            <Typography variant="body2">
              The AI analysis is powered by{' '}
              <Link href="https://deepmind.google/technologies/gemini/" rel="noopener noreferrer" target="_blank">
                Google Gemini
              </Link>
              . This is an experimental technology that may be unreliable or unavailable. Generating the analysis may
              take 30 seconds to 1 minute.
            </Typography>
          </Stack>

          <Divider sx={{ my: 2.5 }} />

          <Stack spacing={1.5}>
            <Typography variant="body2">
              Created by:{' '}
              <Link href="https://github.com/bronsonavila/hawaii-gptogo" rel="noopener noreferrer" target="_blank">
                Bronson Avila
              </Link>
            </Typography>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} size="small">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
