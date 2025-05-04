import { ClosureInfo } from '../../supabase/functions/analyze-lane-closures'
import { supabase } from '@/api/supabaseClient'

interface AnalysisResponse {
  impactedClosures: ImpactedClosure[]
}

export interface ImpactedClosure {
  id: number
  analysis: string
}

interface FunctionErrorResponse {
  error: string
}

export const analyzeDrivingPlan = async (closures: ClosureInfo[], drivingPlan: string): Promise<ImpactedClosure[]> => {
  const { data, error } = await supabase.functions.invoke<AnalysisResponse | FunctionErrorResponse>(
    'analyze-lane-closures',
    { body: { closures, drivingPlan } }
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
