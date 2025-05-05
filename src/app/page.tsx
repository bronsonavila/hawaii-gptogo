'use client'

import { AboutButton } from './components/AboutButton'
import { Alert, Container } from '@mui/material'
import { analyzeDrivingPlan, ImpactedClosure } from '@/api/analyzeDrivingPlan'
import { ClosuresDataGrid, GridRowData } from './components/ClosuresDataGrid'
import { ClosureStatusText } from './components/ClosureStatusText'
import { fetchClosures, ClosureFeature } from '@/api/fetchClosures'
import { Header } from './components/Header'
import { SuccessSnackbar } from './components/SuccessSnackbar'
import { usePersistentState } from '@/hooks/usePersistentState'
import { useState, useEffect, useMemo, useCallback } from 'react'

export default function Home() {
  const [analysisResults, setAnalysisResults] = useState<ImpactedClosure[]>([])
  const [closures, setClosures] = useState<ClosureFeature[]>([])
  const [error, setError] = useState<string | null>(null)
  const [island, setIsland] = usePersistentState<string>('island', 'Oahu')
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false)
  const [isLoadingClosures, setIsLoadingClosures] = useState<boolean>(true)
  const [isMounted, setIsMounted] = useState<boolean>(false)
  const [isShowingAllClosures, setIsShowingAllClosures] = useState<boolean>(false)
  const [isSuccessSnackbarOpen, setIsSuccessSnackbarOpen] = useState<boolean>(false)

  const analysisResultsMap = useMemo(() => {
    const map = new Map<number, string>()

    analysisResults.forEach(result => map.set(result.id, result.analysis))

    return map
  }, [analysisResults])

  const impactedClosureIds = useMemo(() => new Set(analysisResults.map(result => result.id)), [analysisResults])

  const rows: GridRowData[] = useMemo(() => {
    const baseRows = closures.filter(closure => typeof closure.properties.OBJECTID === 'number')

    if (impactedClosureIds.size > 0 && !isShowingAllClosures) {
      return baseRows
        .filter(closure => impactedClosureIds.has(closure.properties.OBJECTID as number))
        .map(closure => ({ id: closure.properties.OBJECTID as number, ...closure.properties }))
    }

    return baseRows.map(closure => ({ id: closure.properties.OBJECTID as number, ...closure.properties }))
  }, [closures, impactedClosureIds, isShowingAllClosures])

  // Functions

  const handleAnalyzePlan = useCallback(
    async (drivingPlan: string) => {
      if (!drivingPlan.trim()) {
        setError('Please enter your driving plan.')
        setIsSuccessSnackbarOpen(false)
        setIsShowingAllClosures(false)

        return
      }

      setAnalysisResults([])
      setError(null)
      setIsLoadingAnalysis(true)
      setIsSuccessSnackbarOpen(false)
      setIsShowingAllClosures(false)

      try {
        const results = await analyzeDrivingPlan(closures, drivingPlan)

        setAnalysisResults(results)

        if (results.length === 0) setIsSuccessSnackbarOpen(true)
      } catch (error: unknown) {
        console.error('Analysis error:', error)

        setError(error instanceof Error ? error.message : 'Failed to get analysis. Please try again.')

        setIsSuccessSnackbarOpen(false)
      } finally {
        setIsLoadingAnalysis(false)
      }
    },
    [closures]
  )

  const handleCloseSuccessSnackbar = (_?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return

    setIsSuccessSnackbarOpen(false)
  }

  const handleToggleView = useCallback((showAll: boolean) => setIsShowingAllClosures(showAll), [])

  // Effects

  useEffect(() => {
    // This ensures the component only renders client-side after hydration,
    // preventing fetches with the default state before localStorage is read.
    setIsMounted(true)
  }, [])

  useEffect(() => {
    ;(async () => {
      if (!isMounted) return

      setAnalysisResults([])
      setClosures([])
      setError(null)
      setIsLoadingClosures(true)
      setIsSuccessSnackbarOpen(false)
      setIsShowingAllClosures(false)

      try {
        const fetchedClosures = await fetchClosures(island)

        setClosures(fetchedClosures)
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : 'An unknown error occurred')

        console.error('Error fetching closures:', error)
      } finally {
        setIsLoadingClosures(false)
      }
    })()
  }, [island, isMounted])

  // Render

  if (!isMounted) return null

  return (
    <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, pb: { xs: 1, sm: 1.5 } }}>
      <Header
        island={island}
        isLoadingAnalysis={isLoadingAnalysis}
        isLoadingClosures={isLoadingClosures}
        onIslandChange={setIsland}
      />

      <ClosureStatusText
        closures={closures}
        impactedClosureIds={impactedClosureIds}
        isLoadingClosures={isLoadingClosures}
        isShowingAllClosures={isShowingAllClosures}
        onToggleView={handleToggleView}
      />

      {error && (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      )}

      <ClosuresDataGrid
        analysisResultsMap={analysisResultsMap}
        closures={closures}
        impactedClosureIds={impactedClosureIds}
        isLoadingAnalysis={isLoadingAnalysis}
        isLoadingClosures={isLoadingClosures}
        onAnalyzePlan={handleAnalyzePlan}
        rows={rows}
      />

      <AboutButton />

      <SuccessSnackbar onClose={handleCloseSuccessSnackbar} open={isSuccessSnackbarOpen} />
    </Container>
  )
}
