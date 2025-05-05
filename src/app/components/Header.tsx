import { Box, MenuItem, Select, Typography } from '@mui/material'
import { SelectChangeEvent } from '@mui/material/Select'

interface HeaderProps {
  island: string
  isLoadingAnalysis: boolean
  isLoadingClosures: boolean
  onIslandChange: (island: string) => void
}

const ISLAND_OPTIONS = ['Hawaii', 'Kauai', 'Lanai', 'Maui', 'Molokai', 'Oahu']

export const Header: React.FC<HeaderProps> = ({ island, isLoadingAnalysis, isLoadingClosures, onIslandChange }) => {
  return (
    <Typography
      component="h1"
      gutterBottom
      sx={{
        alignItems: 'center',
        display: 'flex',
        fontSize: { xs: '1.2rem', sm: '1.5rem' },
        letterSpacing: '0.00735em',
        lineHeight: 1.235
      }}
      variant="h5"
    >
      <Select
        disableUnderline
        disabled={isLoadingClosures || isLoadingAnalysis}
        MenuProps={{ PaperProps: { style: { maxHeight: 48 * 4.5 + 8, width: 250 } } }}
        onChange={(event: SelectChangeEvent<string>) => onIslandChange(event.target.value as string)}
        sx={{
          fontSize: 'inherit',
          fontWeight: 'inherit',
          mr: 1,
          '.MuiSelect-select': { pb: '2px' },
          '.MuiSvgIcon-root': { fontSize: '1.5rem' }
        }}
        value={island}
        variant="standard"
      >
        {ISLAND_OPTIONS.map(islandOption => (
          <MenuItem key={islandOption} value={islandOption}>
            {islandOption}
          </MenuItem>
        ))}
      </Select>

      <Box sx={{ alignItems: 'baseline', display: 'flex', flexDirection: 'row', gap: 2.5, width: '100%' }}>
        <Typography component="span" variant="inherit" sx={{ pt: '3px' }}>
          GPToGo
        </Typography>

        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1, mt: -0.5 }}>
          AI Lane Closure Analysis
        </Typography>
      </Box>
    </Typography>
  )
}
