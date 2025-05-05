import { ImpactScore } from '@/api/analyzeDrivingPlan'

export enum ImpactLevel {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Severe = 'Severe'
}

export const getImpactColor = (impactScore: ImpactScore): string => {
  switch (impactScore.level) {
    case ImpactLevel.Low:
      return 'text-info-main'

    case ImpactLevel.Medium:
      return 'text-success-main'

    case ImpactLevel.High:
      return 'text-warning-main'

    case ImpactLevel.Severe:
      return 'text-error-main'

    default:
      return 'text-gray-600'
  }
}

export const getImpactBadgeColor = (impactScore: ImpactScore): string => {
  switch (impactScore.level) {
    case ImpactLevel.Low:
      return 'bg-info-50 text-info-900'

    case ImpactLevel.Medium:
      return 'bg-success-50 text-success-900'

    case ImpactLevel.High:
      return 'bg-warning-50 text-warning-900'

    case ImpactLevel.Severe:
      return 'bg-error-50 text-error-900'

    default:
      return 'bg-gray-100 text-gray-800'
  }
}
