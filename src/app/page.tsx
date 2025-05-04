'use client'

import { Alert, Box, Container, MenuItem, Select, Typography } from '@mui/material'
import { ClosuresDataGrid, GridRowData } from './components/ClosuresDataGrid'
import { AboutButton } from './components/AboutButton'
import { analyzeDrivingPlan, ImpactedClosure } from '@/api/analyzeDrivingPlan'
import { fetchClosures, ClosureFeature } from '@/api/fetchClosures'
import { DateFormatSeparator, formatDate } from '@/utils/dateUtils'
import { SelectChangeEvent } from '@mui/material/Select'
import { SuccessSnackbar } from './components/SuccessSnackbar'
import { useState, useEffect, useMemo, useCallback } from 'react'

// Constants

const ISLAND_OPTIONS = ['Hawaii', 'Kauai', 'Lanai', 'Maui', 'Molokai', 'Oahu']

// Functions

const getFormattedDatePrefix = (): string => {
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  })
  return `Today's date is ${formattedDate}. `
}

// Component

export default function Home() {
  const [analysisResults, setAnalysisResults] = useState<ImpactedClosure[]>([])
  const [closures, setClosures] = useState<ClosureFeature[]>([])
  const [error, setError] = useState<string | null>(null)
  const [island, setIsland] = useState<string>('Oahu')
  const [loadingClosures, setLoadingClosures] = useState<boolean>(true)
  const [loadingAnalysis, setLoadingAnalysis] = useState<boolean>(false)
  const [openSuccessSnackbar, setOpenSuccessSnackbar] = useState<boolean>(false)

  const analysisResultsMap = useMemo(() => {
    const map = new Map<number, string>()

    analysisResults.forEach(result => map.set(result.id, result.analysis))

    return map
  }, [analysisResults])

  const closureInfoForApi = useMemo(
    () =>
      closures.map(({ properties }) => ({
        id: properties.OBJECTID,
        Route: `${properties.Route || 'N/A'} (Direction: ${properties.direct || 'N/A'})`,
        From: properties.intsfroml,
        To: properties.intstol,
        Starts: formatDate(properties.beginDate, DateFormatSeparator.CommaSpace),
        Ends: formatDate(properties.enDate, DateFormatSeparator.CommaSpace),
        LanesAffected: properties.NumLanes
          ? `${properties.NumLanes} Lane${properties.NumLanes > 1 ? 's' : ''} (Side: ${
              properties.ClosureSide || 'N/A'
            })`
          : `${properties.CloseFact || 'N/A'} (Side: ${properties.ClosureSide || 'N/A'})`,
        Reason: properties.ClosReason,
        Details: properties.DirPRemarks,
        Remarks: properties.Remarks
      })),
    [closures]
  )

  const impactedClosureIds = useMemo(() => new Set(analysisResults.map(result => result.id)), [analysisResults])

  const rows: GridRowData[] = useMemo(
    () =>
      closures
        .filter(closure => typeof closure.properties.OBJECTID === 'number')
        .map(closure => ({ id: closure.properties.OBJECTID as number, ...closure.properties })),
    [closures]
  )

  useEffect(() => {
    ;(async () => {
      setAnalysisResults([])
      setClosures([])
      setError(null)
      setLoadingClosures(true)
      setOpenSuccessSnackbar(false)

      try {
        const fetchedClosures = await fetchClosures(island)

        setClosures(fetchedClosures)
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : 'An unknown error occurred')

        console.error('Error fetching closures:', error)
      } finally {
        setLoadingClosures(false)
      }
    })()
  }, [island])

  const handleCloseSuccessSnackbar = (_?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return

    setOpenSuccessSnackbar(false)
  }

  const handleAnalyzePlan = useCallback(
    async (drivingPlan: string) => {
      if (!drivingPlan.trim()) {
        setError('Please enter your driving plan.')
        setOpenSuccessSnackbar(false)

        return
      }

      setAnalysisResults([])
      setError(null)
      setLoadingAnalysis(true)
      setOpenSuccessSnackbar(false)

      const planWithDate = `${getFormattedDatePrefix()}${drivingPlan}`

      try {
        const results = await analyzeDrivingPlan(closureInfoForApi, planWithDate)

        setAnalysisResults(results)

        if (results.length === 0) setOpenSuccessSnackbar(true)
      } catch (error: unknown) {
        console.error('Analysis error:', error)

        setError(error instanceof Error ? error.message : 'Failed to get analysis. Please try again.')

        setOpenSuccessSnackbar(false)
      } finally {
        setLoadingAnalysis(false)
      }
    },
    [closureInfoForApi]
  )

  return (
    <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, pb: { xs: 1, sm: 1.5 } }}>
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
          disabled={loadingClosures || loadingAnalysis}
          MenuProps={{ PaperProps: { style: { maxHeight: 48 * 4.5 + 8, width: 250 } } }}
          onChange={(event: SelectChangeEvent<string>) => setIsland(event.target.value as string)}
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
          {ISLAND_OPTIONS.map(island => (
            <MenuItem key={island} value={island}>
              {island}
            </MenuItem>
          ))}
        </Select>

        <Box sx={{ alignItems: 'baseline', display: 'flex', flexDirection: 'row', gap: 2.5, width: '100%' }}>
          <Typography component="span" variant="inherit" sx={{ pt: '3px' }}>
            GPToGo
          </Typography>

          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1, mt: -0.5 }}>
            AI Lane Closure Analysis Tool
          </Typography>
        </Box>
      </Typography>

      <Typography color="text.secondary" variant="subtitle1" gutterBottom>
        Closures active within the next 24 hours.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      )}

      <ClosuresDataGrid
        analysisResultsMap={analysisResultsMap}
        closures={closures}
        impactedClosureIds={impactedClosureIds}
        island={island}
        loading={loadingClosures}
        loadingAnalysis={loadingAnalysis}
        onAnalyzePlan={handleAnalyzePlan}
        rows={rows}
      />

      <AboutButton />

      <SuccessSnackbar onClose={handleCloseSuccessSnackbar} open={openSuccessSnackbar} />
    </Container>
  )
}
