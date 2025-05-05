import { Box, Button, Skeleton, Typography } from '@mui/material'
import { ClosureFeature } from '@/api/fetchClosures'
import { GridRowData } from './ClosuresDataGrid'

interface ClosureStatusTextProps {
  closures: ClosureFeature[]
  impactedClosureIds: Set<number>
  isLoadingClosures: boolean
  isShowingAllClosures: boolean
  onShowAllClick: () => void
  rows: GridRowData[]
}

export const ClosureStatusText: React.FC<ClosureStatusTextProps> = ({
  closures,
  impactedClosureIds,
  isLoadingClosures,
  isShowingAllClosures,
  onShowAllClick,
  rows
}) => {
  return (
    <Typography color="text.secondary" variant="subtitle1" gutterBottom>
      {isLoadingClosures ? (
        <Skeleton animation="wave" variant="text" width="320px" />
      ) : (
        <>
          {(() => {
            const totalClosures = closures.filter(c => typeof c.properties.OBJECTID === 'number').length
            const relevantCount = impactedClosureIds.size

            if (relevantCount > 0) {
              if (isShowingAllClosures) {
                return `Showing all ${totalClosures} ${
                  totalClosures === 1 ? 'closure' : 'closures'
                } (${relevantCount} relevant).`
              } else {
                const relevantShownCount = rows.length

                return (
                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                    {`${relevantShownCount} relevant ${relevantShownCount === 1 ? 'closure' : 'closures'} found.`}

                    <Button
                      onClick={onShowAllClick}
                      size="small"
                      sx={{ minWidth: 'auto', ml: 1, mt: '2px', p: '1px 4px' }}
                      variant="text"
                    >
                      Show All
                    </Button>
                  </Box>
                )
              }
            } else {
              return totalClosures === 0
                ? 'No closures active within the next 24 hours.'
                : `${totalClosures} ${totalClosures === 1 ? 'closure' : 'closures'} active within the next 24 hours.`
            }
          })()}
        </>
      )}
    </Typography>
  )
}
