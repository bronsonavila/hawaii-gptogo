import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
// @ts-ignore
import { GoogleGenAI, Type } from 'npm:@google/genai@0.13.0'

// Types

interface AnalysisResponse {
  impactedClosures: {
    id: number
    analysis: string
    impactScore: {
      level: string
      value: number
    }
  }[]
}

interface AnalyzeRequest {
  closures: ClosureInfo[]
  drivingPlan: string
}

export interface ClosureInfo {
  id: number | null
  Route: string | null
  From: string | null
  To: string | null
  Starts: string | null
  Ends: string | null
  LanesAffected: string | null
  Reason: string | null
  Details: string | null
  Remarks: string | null
}

interface ErrorResponse {
  error: string
}

// Constants

const AI_MODEL = 'gemini-2.5-flash-preview-05-20'

const AI_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.NUMBER, description: "The id of the lane closure that impacts the user's driving plan" },
      analysis: {
        type: Type.STRING,
        description: "Detailed analysis of how this specific lane closure affects the user's driving plan"
      },
      impactScore: {
        type: Type.OBJECT,
        properties: {
          level: {
            type: Type.STRING,
            description: "A descriptive label for the impact level ('Low', 'Medium', 'High', 'Severe')"
          },
          value: {
            type: Type.NUMBER,
            description: 'Numeric value representing the impact score (1 = Low, 2 = Medium, 3 = High, 4 = Severe)'
          }
        },
        required: ['level', 'value'],
        description: "Score evaluating the magnitude and directness of the impact on the user's route"
      }
    },
    required: ['id', 'analysis', 'impactScore']
  }
}

const AI_SYSTEM_INSTRUCTION = `
<instructions>
  <general_instructions>
    Review the driving plan and the list of active lane closures. For each lane closure that has a material impact on the driving plan, provide an analysis explaining how and why it could affect the user. Address the analysis directly to the user (using "you" and "your").

    The driving plan is for a one-way trip, unless the user explicitly mentions a return trip.

    When evaluating lane closures, if there are conflicting directions or other information between fields, prioritize them in this order: Route > From/To > Details > Remarks.

    A lane closure is considered to have a material impact if it's directly on the user's route. It may also have a material impact if it's on an adjacent road and is likely to indirectly affect the user's travel (e.g., by causing congestion or requiring lane alterations on the user's route). Only include closures that meet these criteria for having a direct or indirect material impact. Do not include a closure if its scheduled time does not coincide with the driving plan, or if it's otherwise not relevant.
  </general_instructions>

  <closure_requirements>
    For each impacted closure, include:
    <requirement>
      <id_info>The closure's id (IMPORTANT: Include this in the structured data response ONLY - do NOT mention closure IDs in the analysis text)</id_info>
    </requirement>
    <requirement>
      <analysis_info>
        A concise analysis of how it might affect the user's drive (without mentioning the closure's id)
        <tone_and_style>
          Maintain a consistent, neutral, and factual tone throughout the analysis. Avoid empathetic or conversational language. The language should be direct and objective.
          Explain the impact clearly and simply, using short sentences and common words, as if explaining to a 12-year-old. Be as brief as possible while still conveying the necessary information.
          Each analysis must be self-contained and written from an isolated standpoint. Do not refer to other lane closures or analyses. Each reported closure and its analysis should be understandable on its own.
        </tone_and_style>
      </analysis_info>
    </requirement>
    <requirement>
      <impact_score_info>
        An impact score with the following criteria:
        <level>Level: One of ['Low', 'Medium', 'High', 'Severe']</level>
        <value>Value: Corresponding numeric value (1 = Low, 2 = Medium, 3 = High, 4 = Severe)</value>
      </impact_score_info>
    </requirement>
  </closure_requirements>

  <impact_score_guidelines>
    When determining the impact score, consider the following factors:
    <impact_level name="Low Impact">
      <scenarios>Scenarios: Shoulder closures, brief off-peak single-lane closures.</scenarios>
      <effect>Effect: Minimal traffic disruption; normal speeds likely; no significant delays.</effect>
    </impact_level>
    <impact_level name="Medium Impact">
      <scenarios>Scenarios: Single-lane closures (regular/peak hours), short full closures with detours, multi-lane off-peak closures.</scenarios>
      <effect>Effect: Some traffic disruption; slight to moderate delays and slowdowns; reasonable flow generally maintained.</effect>
    </impact_level>
    <impact_level name="High Impact">
      <scenarios>Scenarios: Multiple lane closures/reductions, long-term lane reductions, some full road closures (especially in high-traffic areas).</scenarios>
      <effect>Effect: Significant traffic disruption; notable delays and congestion; slower speeds; consider alternate routes.</effect>
    </impact_level>
    <impact_level name="Severe Impact">
      <scenarios>Scenarios: Complete roadway closures, significant long-term reductions, often due to incidents or emergencies.</scenarios>
      <effect>Effect: Major, widespread disruption; extensive delays; detours required; drivers must use alternate routes; may need multi-agency coordination.</effect>
    </impact_level>
  </impact_score_guidelines>
</instructions>
`

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://bronsonavila.github.io',
  'https://gptogo.app',
  'https://www.gptogo.app'
]

// @ts-ignore
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

// Functions

function getCorsHeaders(origin: string | null): Record<string, string> {
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin)

  return {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0]
  }
}

function setPromptContents(closures: ClosureInfo[], drivingPlan: string): string {
  return `
Analyze the following lane closure information in the context of the user's driving plan.

**Lane Closures:**
\`\`\`json
${JSON.stringify(closures, null, 2)}
\`\`\`

**User's Driving Plan:**
"${drivingPlan}"
`
}

// Main

// @ts-ignore
Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  // Handle CORS preflight request
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  // Validate API Key
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY environment variable not set.')

    const errorResponse: ErrorResponse = { error: 'Server configuration error: Missing API key.' }

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }

  // Validate Request Method and Content Type
  if (req.method !== 'POST') {
    const errorResponse: ErrorResponse = { error: 'Method Not Allowed' }

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405
    })
  }

  let requestPayload: AnalyzeRequest

  try {
    requestPayload = await req.json()
  } catch (error) {
    console.error('Failed to parse request JSON:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorResponse: ErrorResponse = { error: `Bad Request: Invalid JSON format. ${errorMessage}` }

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }

  // Validate Payload Content
  const { closures, drivingPlan } = requestPayload
  if (!Array.isArray(closures) || typeof drivingPlan !== 'string' || drivingPlan.trim() === '') {
    const errorResponse: ErrorResponse = {
      error: "Bad Request: Missing or invalid 'closures' array or 'drivingPlan' string."
    }

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }

  // AI Interaction
  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

    const config = {
      responseMimeType: 'application/json',
      responseSchema: AI_SCHEMA,
      systemInstruction: AI_SYSTEM_INSTRUCTION,
      temperature: 0
    }

    const contents = setPromptContents(closures, drivingPlan)

    const { text, usageMetadata } = await ai.models.generateContent({ config, contents, model: AI_MODEL })

    const { candidatesTokenCount, promptTokenCount, thoughtsTokenCount, totalTokenCount } = usageMetadata

    console.log({ candidatesTokenCount, promptTokenCount, thoughtsTokenCount, totalTokenCount })

    const impactedClosures = JSON.parse(text)

    const successResponse: AnalysisResponse = { impactedClosures }

    return new Response(JSON.stringify(successResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error during AI interaction:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to get analysis from AI service.'
    const errorResponse: ErrorResponse = { error: `AI Service Error: ${errorMessage}` }

    const status = error instanceof Error && error.message?.includes('quota') ? 429 : 503

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status
    })
  }
})
