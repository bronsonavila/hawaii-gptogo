import {
  alpha,
  Box,
  CircularProgress,
  IconButton,
  Popover,
  Theme,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material'
import { ClosureFeature, ClosureProperties } from '@/api/fetchClosures'
import {
  DataGrid,
  GridColDef,
  GridColumnResizeParams,
  GridRenderCellParams,
  GridRowClassNameParams,
  GridSortModel
} from '@mui/x-data-grid'
import { Footer } from './Footer'
import { formatDate } from '@/utils/dateUtils'
import { getImpactColor } from '@/utils/impactUtils'
import { ImpactScore } from '@/api/analyzeDrivingPlan'
import DarkMode from '@mui/icons-material/DarkMode'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import LightMode from '@mui/icons-material/LightMode'
import React, { useState, MouseEvent } from 'react'

// Types

interface ClosuresDataGridProps {
  analysisResultsMap: Map<number, { analysis: string; impactScore: ImpactScore }>
  closures: ClosureFeature[]
  impactedClosureIds: Set<number>
  isLoadingAnalysis: boolean
  isLoadingClosures: boolean
  onAnalyzePlan: (drivingPlan: string) => void
  onSortModelChange: (model: GridSortModel) => void
  rows: GridRowData[]
  sortModel: GridSortModel
}

export type GridRowData = ClosureProperties & { id: number }

// Constants

const MAX_WIDTHS = {
  DirPRemarks: 320,
  Remarks: 1200
}

// Functions

const getColumns = (
  impactedClosureIds: Set<number>,
  analysisResultsMap: Map<number, { analysis: string; impactScore: ImpactScore }>,
  isTouchDevice: boolean,
  handleIconClick: (event: MouseEvent<HTMLButtonElement>, content: string, impactScore: ImpactScore) => void,
  theme: Theme
): GridColDef<GridRowData>[] => [
  {
    field: 'analysisInfo',
    headerName: '',
    resizable: false,
    sortable: impactedClosureIds.size > 0,
    width: 40,
    valueGetter: (_, row: GridRowData) => {
      const analysisData = analysisResultsMap.get(row.id)

      return analysisData ? analysisData.impactScore.value : -1
    },
    renderCell: (params: GridRenderCellParams<GridRowData>) => {
      const closureId = params.row.id

      if (!impactedClosureIds.has(closureId)) return null

      const analysisData = analysisResultsMap.get(closureId)

      if (!analysisData) return null

      const { analysis, impactScore } = analysisData
      const impactColor = getImpactColor(impactScore.level, theme)
      const iconProps = { fontSize: 'small' as const, sx: { color: impactColor } }

      if (isTouchDevice) {
        return (
          <IconButton
            aria-label="Show analysis"
            onClick={event => handleIconClick(event, analysis, impactScore)}
            size="small"
            sx={{ p: 0.5 }}
          >
            <InfoOutlinedIcon fontSize={iconProps.fontSize} sx={iconProps.sx} />
          </IconButton>
        )
      }

      return (
        <Tooltip
          arrow
          title={
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Impact: <strong style={{ color: impactColor }}>{impactScore.level}</strong>
              </Typography>

              <Typography sx={{ whiteSpace: 'pre-line' }} variant="body2">
                {analysis}
              </Typography>
            </Box>
          }
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <IconButton
              aria-label="Show analysis tooltip"
              size="small"
              sx={{ p: 0.5, cursor: 'pointer' }}
              tabIndex={-1}
            >
              <InfoOutlinedIcon fontSize={iconProps.fontSize} sx={iconProps.sx} />
            </IconButton>
          </Box>
        </Tooltip>
      )
    }
  },
  {
    field: 'Route',
    headerName: 'Route',
    width: 130,
    valueGetter: (_, row: GridRowData) => `${row.Route || 'N/A'}\nDirection: ${row.direct || 'N/A'}`
  },
  { field: 'intsfroml', headerName: 'From', flex: 1, minWidth: 160 },
  { field: 'intstol', headerName: 'To', flex: 1, minWidth: 160 },
  {
    field: 'lanesAffected',
    headerName: 'Lanes Affected',
    width: 150,
    valueGetter: (_, row: GridRowData) =>
      row.NumLanes
        ? `${row.NumLanes} Lane${row.NumLanes > 1 ? 's' : ''}\nSide: ${row.ClosureSide || 'N/A'}`
        : `${row.CloseFact || 'N/A'}\nSide: ${row.ClosureSide || 'N/A'}`
  },
  {
    field: 'beginDate',
    headerName: 'Starts',
    minWidth: 90,
    renderCell: (params: GridRenderCellParams<GridRowData>) => {
      const timestamp = params.value as number | null

      if (timestamp === null) return 'N/A'

      const icon = getTimeOfDayIcon(timestamp)

      return (
        <Box>
          <Typography variant="body2">{formatDate(timestamp)}</Typography>

          {icon}
        </Box>
      )
    }
  },
  {
    field: 'enDate',
    headerName: 'Ends',
    minWidth: 90,
    renderCell: (params: GridRenderCellParams<GridRowData>) => {
      const timestamp = params.value as number | null

      if (timestamp === null) return 'N/A'

      const icon = getTimeOfDayIcon(timestamp)

      return (
        <Box>
          <Typography variant="body2">{formatDate(timestamp)}</Typography>

          {icon}
        </Box>
      )
    }
  },
  { field: 'ClosReason', headerName: 'Reason' },
  {
    field: 'DirPRemarks',
    headerName: 'Details',
    flex: 1.5,
    maxWidth: MAX_WIDTHS.DirPRemarks,
    minWidth: 250
  },
  {
    field: 'Remarks',
    headerName: 'Remarks',
    flex: 2.75,
    maxWidth: MAX_WIDTHS.Remarks,
    minWidth: 250
  }
]

const getTimeOfDayIcon = (timestamp: number | null): React.ReactNode => {
  if (timestamp === null) return null

  const date = new Date(timestamp)
  const timeString = date.toLocaleString('en-US', { timeZone: 'Pacific/Honolulu', hour: 'numeric', hour12: false })
  const hour = parseInt(timeString, 10)

  const isEarlyMorning = hour >= 0 && hour < 6
  const isDaytime = hour >= 6 && hour < 18
  const isEvening = hour >= 18

  if (isDaytime) {
    return <LightMode color="warning" sx={{ fontSize: '1rem', verticalAlign: 'middle' }} />
  } else if (isEarlyMorning || isEvening) {
    return <DarkMode color="primary" sx={{ fontSize: '1rem', verticalAlign: 'middle' }} />
  }

  return null
}

// Component

export const ClosuresDataGrid: React.FC<ClosuresDataGridProps> = ({
  analysisResultsMap,
  closures,
  impactedClosureIds,
  isLoadingAnalysis,
  isLoadingClosures,
  onAnalyzePlan,
  onSortModelChange,
  rows,
  sortModel
}) => {
  const [popoverAnchorEl, setPopoverAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [popoverContent, setPopoverContent] = useState<string>('')
  const [popoverImpactScore, setPopoverImpactScore] = useState<ImpactScore | null>(null)

  const isTouchDevice = typeof window !== 'undefined' && window.navigator.maxTouchPoints > 0

  const openPopover = Boolean(popoverAnchorEl)
  const popoverId = openPopover ? 'analysis-popover' : undefined

  const theme = useTheme()
  const isXs = useMediaQuery(theme.breakpoints.down('sm'))
  const gridHeight = isXs ? 'calc(100dvh - 143px)' : 'calc(100dvh - 168px)'

  const getRowClassName = (params: GridRowClassNameParams<GridRowData>): string =>
    impactedClosureIds.has(params.row.id) ? 'highlighted-row' : ''

  const handleColumnResize = (params: GridColumnResizeParams) => {
    if (params.colDef.field === 'DirPRemarks' && params.width > MAX_WIDTHS.DirPRemarks) return false

    if (params.colDef.field === 'Remarks' && params.width > MAX_WIDTHS.Remarks) return false

    return true
  }

  const handleIconClick = (event: MouseEvent<HTMLButtonElement>, content: string, impactScore: ImpactScore) => {
    setPopoverAnchorEl(event.currentTarget)
    setPopoverContent(content)
    setPopoverImpactScore(impactScore)
  }

  const handlePopoverClose = () => {
    setPopoverAnchorEl(null)
    setPopoverContent('')
    setPopoverImpactScore(null)
  }

  const columns = getColumns(impactedClosureIds, analysisResultsMap, isTouchDevice, handleIconClick, theme)

  if (isLoadingClosures) {
    return (
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          height: gridHeight,
          justifyContent: 'center',
          width: '100%'
        }}
      >
        <CircularProgress size={40} />
      </Box>
    )
  }

  return (
    <Box>
      {rows.length === 0 ? null : (
        <Box sx={{ height: gridHeight, width: '100%' }}>
          <DataGrid<GridRowData>
            columns={columns}
            disableColumnMenu
            disableColumnFilter
            disableColumnSelector
            disableDensitySelector
            disableRowSelectionOnClick
            disableVirtualization
            getRowClassName={getRowClassName}
            hideFooterPagination
            initialState={{
              pagination: { paginationModel: { pageSize: 100, page: 0 } },
              sorting: { sortModel: [{ field: 'Route', sort: 'asc' }] }
            }}
            onColumnResize={handleColumnResize}
            onSortModelChange={onSortModelChange}
            pageSizeOptions={[100]}
            rowHeight={72}
            rows={rows}
            sortModel={sortModel}
            sx={{
              '& .MuiDataGrid-footerContainer .MuiBox-root': { borderTop: 'none' },
              '& .MuiDataGrid-footerContainer': { minHeight: 64 },
              '& .highlighted-row': { backgroundColor: theme => alpha(theme.palette.info.light, 0.1) },
              '& .MuiDataGrid-row.highlighted-row:hover': {
                backgroundColor: theme => alpha(theme.palette.info.light, 0.1)
              },
              '& .MuiDataGrid-row:not(.highlighted-row):hover': { backgroundColor: 'transparent' },
              '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none !important' },
              '& .MuiDataGrid-cell': {
                alignItems: 'flex-start',
                boxSizing: 'border-box',
                display: '-webkit-box',
                lineHeight: '1.4 !important',
                maxHeight: 'calc(1.4em * 3 + 6px)',
                overflow: 'hidden',
                pt: '6px',
                textOverflow: 'ellipsis',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: '3',
                whiteSpace: 'pre-line !important'
              },
              '& .MuiDataGrid-columnHeader': { alignItems: 'flex-start', pt: 1 },
              '& .MuiDataGrid-columnHeader[data-field="analysisInfo"] .MuiDataGrid-columnHeaderTitleContainerContent': {
                width: '100%'
              }
            }}
            slots={{
              footer: () => (
                <Footer disabled={closures.length === 0} loading={isLoadingAnalysis} onAnalyze={onAnalyzePlan} />
              )
            }}
          />
        </Box>
      )}

      <Popover
        anchorEl={popoverAnchorEl}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
        id={popoverId}
        onClose={handlePopoverClose}
        open={openPopover}
        transformOrigin={{ horizontal: 'center', vertical: 'top' }}
      >
        <Box sx={{ p: 2, maxWidth: 400 }}>
          {popoverImpactScore && (
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Impact:{' '}
              <strong
                style={{ color: popoverImpactScore ? getImpactColor(popoverImpactScore.level, theme) : undefined }}
              >
                {popoverImpactScore.level}
              </strong>
            </Typography>
          )}

          <Typography sx={{ whiteSpace: 'pre-line' }} variant="body2">
            {popoverContent}
          </Typography>
        </Box>
      </Popover>
    </Box>
  )
}
