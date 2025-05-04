import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
    <>
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
              Information regarding lane closures for the upcoming 24 hours is sourced from the Hawaii Department of
              Transportation's{' '}
              <Link href="https://hidot.hawaii.gov/highways/roadwork/" rel="noopener noreferrer" target="_blank">
                Lane Closure Public Access
              </Link>{' '}
              website.
            </Typography>

            <Typography variant="body2">
              To see how these closures might impact your trip, enter your planned route in the text field below the
              table for an AI-generated analysis.
            </Typography>

            <Typography variant="body2">
              For the most accurate analysis, please include specific details such as route numbers, direction, key
              locations or intersections, and your estimated time of travel.
            </Typography>
          </Stack>

          <Divider sx={{ my: 2.5 }} />

          <Stack spacing={1.5}>
            <Typography variant="body2">
              Created by:{' '}
              <Link href="https://github.com/bronsonavila/gptogo" rel="noopener noreferrer" target="_blank">
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
    </>
  )
}
