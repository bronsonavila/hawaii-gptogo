import { Theme } from '@mui/material'

export enum ImpactLevel {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Severe = 'Severe'
}

export const getImpactColor = (level: string, theme: Theme): string => {
  switch (level) {
    case ImpactLevel.Low:
      return theme.palette.common.white
    case ImpactLevel.Medium:
      return theme.palette.info.main
    case ImpactLevel.High:
      return theme.palette.warning.main
    case ImpactLevel.Severe:
      return theme.palette.error.main
    default:
      return theme.palette.info.main
  }
}
