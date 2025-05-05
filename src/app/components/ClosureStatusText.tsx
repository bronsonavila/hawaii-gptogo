import { Box, Skeleton, Switch, Typography } from '@mui/material'
import { ClosureFeature } from '@/api/fetchClosures'

interface ClosureStatusTextProps {
  closures: ClosureFeature[]
  impactedClosureIds: Set<number>
  isLoadingClosures: boolean
  isShowingAllClosures: boolean
  onToggleView: (isShowingAll: boolean) => void
}

export const ClosureStatusText: React.FC<ClosureStatusTextProps> = ({
  closures,
  impactedClosureIds,
  isLoadingClosures,
  isShowingAllClosures,
  onToggleView
}) => {
  const totalClosures = closures.filter(closure => typeof closure.properties.OBJECTID === 'number').length
  const relevantCount = impactedClosureIds.size

  let statusContent: React.ReactNode

  if (relevantCount > 0) {
    const statusText = isShowingAllClosures
      ? `Showing ${totalClosures} ${totalClosures === 1 ? 'closure' : 'closures'}.`
      : `Showing ${relevantCount} of ${totalClosures} ${totalClosures === 1 ? 'closure' : 'closures'}.`

    statusContent = (
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
        {statusText}

        <Box sx={{ display: 'inline-flex', alignItems: 'center', ml: 1 }}>
          <Switch
            checked={!isShowingAllClosures}
            onChange={event => onToggleView(!event.target.checked)}
            size="small"
          />

          <Typography variant="caption" sx={{ fontSize: '0.65rem', lineHeight: 1, ml: 0.5 }}>
            Show relevant only
          </Typography>
        </Box>
      </Box>
    )
  } else {
    statusContent =
      totalClosures === 0
        ? 'No closures active within the next 24 hours.'
        : `${totalClosures} ${totalClosures === 1 ? 'closure' : 'closures'} active within the next 24 hours.`
  }

  return (
    <Typography color="text.secondary" variant="subtitle1" gutterBottom>
      {isLoadingClosures ? <Skeleton animation="wave" variant="text" width="320px" /> : <>{statusContent}</>}
    </Typography>
  )
}
