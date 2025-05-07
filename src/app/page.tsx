'use client'

import { AboutButton } from './components/AboutButton'
import { AnalysisPendingEffect } from './components/AnalysisPendingEffect'
import { analyzeDrivingPlan, ImpactedClosure, ImpactScore } from '@/api/analyzeDrivingPlan'
import { ClosuresDataGrid, GridRowData } from './components/ClosuresDataGrid'
import { ClosureStatusText } from './components/ClosureStatusText'
import { Container } from '@mui/material'
import { ErrorSnackbar } from './components/ErrorSnackbar'
import { fetchClosures, ClosureFeature } from '@/api/fetchClosures'
import { GridSortModel } from '@mui/x-data-grid'
import { Header } from './components/Header'
import { SuccessSnackbar } from './components/SuccessSnackbar'
import { usePersistentState } from '@/hooks/usePersistentState'
import { useState, useEffect, useMemo, useCallback } from 'react'

export default function Home() {
  const [analysisResults, setAnalysisResults] = useState<ImpactedClosure[]>([])
  const [closures, setClosures] = useState<ClosureFeature[]>([])
  const [error, setError] = useState<string | null>(null)
  const [island, setIsland] = usePersistentState<string>('island', 'Oahu')
  const [isErrorSnackbarOpen, setIsErrorSnackbarOpen] = useState<boolean>(false)
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false)
  const [isLoadingClosures, setIsLoadingClosures] = useState<boolean>(true)
  const [isMounted, setIsMounted] = useState<boolean>(false)
  const [isShowingAllClosures, setIsShowingAllClosures] = useState<boolean>(false)
  const [isSuccessSnackbarOpen, setIsSuccessSnackbarOpen] = useState<boolean>(false)
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'Route', sort: 'asc' }])

  const analysisResultsMap = useMemo(() => {
    const map = new Map<number, { analysis: string; impactScore: ImpactScore }>()

    analysisResults.forEach(result =>
      map.set(result.id, { analysis: result.analysis, impactScore: result.impactScore })
    )

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
        setIsErrorSnackbarOpen(true)
        setIsShowingAllClosures(false)
        setIsSuccessSnackbarOpen(false)

        return
      }

      if (sortModel[0]?.field === 'analysisInfo') setSortModel([{ field: 'Route', sort: 'asc' }])

      setAnalysisResults([])
      setError(null)
      setIsErrorSnackbarOpen(false)
      setIsLoadingAnalysis(true)
      setIsShowingAllClosures(false)
      setIsSuccessSnackbarOpen(false)

      try {
        const results = await analyzeDrivingPlan(closures, drivingPlan)

        setAnalysisResults(results)

        if (results.length > 0) {
          setSortModel([{ field: 'analysisInfo', sort: 'desc' }])
        } else {
          setIsSuccessSnackbarOpen(true)
        }
      } catch (error: unknown) {
        console.error('Analysis error:', error)

        setError('AI service unavailable. Please try again later.')
        setIsErrorSnackbarOpen(true)

        setIsSuccessSnackbarOpen(false)
      } finally {
        setIsLoadingAnalysis(false)
      }
    },
    [closures, sortModel]
  )

  const handleCloseErrorSnackbar = () => setIsErrorSnackbarOpen(false)

  const handleCloseSuccessSnackbar = () => setIsSuccessSnackbarOpen(false)

  const handleToggleView = useCallback(
    (isShowingAll: boolean) => {
      setIsShowingAllClosures(isShowingAll)

      if (isShowingAll) {
        setSortModel([{ field: 'Route', sort: 'asc' }])
      } else {
        impactedClosureIds.size > 0
          ? setSortModel([{ field: 'analysisInfo', sort: 'desc' }])
          : setSortModel([{ field: 'Route', sort: 'asc' }])
      }
    },
    [impactedClosureIds.size]
  )

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
      setSortModel([{ field: 'Route', sort: 'asc' }])

      try {
        const fetchedClosures = await fetchClosures(island)

        setClosures(fetchedClosures)
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : 'An unknown error occurred')
        setIsErrorSnackbarOpen(true)

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
      <AnalysisPendingEffect isVisible={isLoadingAnalysis} />

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

      <ClosuresDataGrid
        analysisResultsMap={analysisResultsMap}
        closures={closures}
        impactedClosureIds={impactedClosureIds}
        isLoadingAnalysis={isLoadingAnalysis}
        isLoadingClosures={isLoadingClosures}
        onAnalyzePlan={handleAnalyzePlan}
        onSortModelChange={setSortModel}
        rows={rows}
        sortModel={sortModel}
      />

      <AboutButton />

      <ErrorSnackbar error={error} onClose={handleCloseErrorSnackbar} open={isErrorSnackbarOpen} />

      <SuccessSnackbar onClose={handleCloseSuccessSnackbar} open={isSuccessSnackbarOpen} />
    </Container>
  )
}
