'use client'

import { ClosureFeature } from '@/api/fetchClosures'
import { ClosureInfo } from '../../supabase/functions/analyze-lane-closures'
import { DateFormatSeparator, formatDate } from '@/utils/dateUtils'
import { supabase } from '@/api/supabaseClient'

// Types

interface AnalysisResponse {
  impactedClosures: ImpactedClosure[]
}

interface FunctionErrorResponse {
  error: string
}

export interface ImpactedClosure {
  id: number
  analysis: string
  impactScore: ImpactScore
}

export interface ImpactScore {
  level: string
  value: number
}

// Functions

export const analyzeDrivingPlan = async (
  closures: ClosureFeature[],
  drivingPlan: string
): Promise<ImpactedClosure[]> => {
  const closureInfoForApi = transformClosuresForApi(closures)
  const planWithDateTime = getPlanWithCurrentDateTime(drivingPlan)

  const { data, error } = await supabase.functions.invoke<AnalysisResponse | FunctionErrorResponse>(
    'analyze-lane-closures',
    { body: { closures: closureInfoForApi, drivingPlan: planWithDateTime } }
  )

  if (error) {
    console.error('Supabase function invocation error:', error)

    if (data && typeof data === 'object' && 'error' in data) {
      const functionError = data as FunctionErrorResponse

      throw new Error(`Analysis function failed: ${functionError.error}`)
    }

    throw new Error(`Failed to analyze driving plan: ${error.message}`)
  }

  if (data && typeof data === 'object' && 'impactedClosures' in data) {
    const successData = data as AnalysisResponse

    return successData.impactedClosures
  } else if (data && typeof data === 'object' && 'error' in data) {
    const errorData = data as FunctionErrorResponse

    throw new Error(`Analysis function returned an error: ${errorData.error}`)
  } else {
    console.error('Unexpected response format from analysis function:', data)

    throw new Error('Received an unexpected response format from the analysis service.')
  }
}

const getPlanWithCurrentDateTime = (drivingPlan: string): string => {
  const date = new Date()

  const formattedDate = date.toLocaleDateString('en-US', {
    timeZone: 'Pacific/Honolulu',
    weekday: 'long',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  })

  const formattedTime = date.toLocaleTimeString('en-US', {
    timeZone: 'Pacific/Honolulu',
    hour: 'numeric',
    minute: '2-digit'
  })

  return `It is currently ${formattedDate} at ${formattedTime}. Planned route: ${drivingPlan}`
}

const transformClosuresForApi = (closures: ClosureFeature[]): ClosureInfo[] =>
  closures.map(({ properties }) => ({
    id: properties.OBJECTID,
    Route: `${properties.Route || 'N/A'} (Direction: ${properties.direct || 'N/A'})`,
    From: properties.intsfroml,
    To: properties.intstol,
    Starts: formatDate(properties.beginDate, DateFormatSeparator.CommaSpace),
    Ends: formatDate(properties.enDate, DateFormatSeparator.CommaSpace),
    LanesAffected: properties.NumLanes
      ? `${properties.NumLanes} Lane${properties.NumLanes > 1 ? 's' : ''} (Side: ${properties.ClosureSide || 'N/A'})`
      : `${properties.CloseFact || 'N/A'} (Side: ${properties.ClosureSide || 'N/A'})`,
    Reason: properties.ClosReason,
    Details: properties.DirPRemarks,
    Remarks: properties.Remarks
  }))
