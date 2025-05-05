import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
// @ts-ignore
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.24.0'

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

const AI_MODEL = 'gemini-2.5-pro-preview-03-25'

const AI_SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: { type: 'number', description: "The id of the lane closure that impacts the user's driving plan" },
      analysis: {
        type: 'string',
        description: "Detailed analysis of how this specific lane closure affects the user's driving plan"
      },
      impactScore: {
        type: 'object',
        properties: {
          level: {
            type: 'string',
            description: "A descriptive label for the impact level ('Low', 'Medium', 'High', 'Severe')"
          },
          value: {
            type: 'number',
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

// @ts-ignore
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

const ALLOWED_ORIGINS = ['http://localhost:3000', 'https://bronsonavila.github.io']

// Functions

function getCorsHeaders(origin: string | null): Record<string, string> {
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin)

  return {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0]
  }
}

function buildAiPrompt(closures: ClosureInfo[], drivingPlan: string): string {
  return `
Analyze the following lane closure information in the context of the user's driving plan.

**Lane Closures:**
\`\`\`json
${JSON.stringify(closures, null, 2)}
\`\`\`

**User's Driving Plan:**
"${drivingPlan}"

**Task:**
Review the driving plan and the list of active lane closures. For each lane closure that might impact your driving plan, provide an analysis explaining how and why it could affect you. Address the analysis directly to the user (using "you" and "your").

Assume the driving plan is for a one-way trip unless the user explicitly mentions a return trip.

Only include closures that are likely to directly impact the user's plan based on the routes, locations, and timing mentioned. If a closure is not relevant to their plan, do not include it in the response.

For each impacted closure, include:
1. The closure's id
2. A detailed analysis of how it might affect the user's drive
3. An impact score with the following criteria:
   - Level: One of ['Low', 'Medium', 'High', 'Severe']
   - Value: Corresponding numeric value (1 = Low, 2 = Medium, 3 = High, 4 = Severe)

The impact score should consider the following factors, using information from all provided closure fields:

1.  **Directness & Location:**
    *   How directly the closure affects the user's specific route (e.g., on the route vs. nearby surface street)?
    *   Type of Closure: Is it a full closure, ramp closure, lane closure, or shoulder closure? (Check \`LanesAffected\`, \`Details\`, \`Remarks\`. Ramp/Full closures usually have higher impact if on the route; shoulder closures usually lower).

2.  **Timing & Duration:**
    *   Time Sensitivity: Does the closure overlap with the user's likely travel time based on their plan and current time?

3.  **Severity & Disruption:**
    *   Number of Lanes Affected: How many lanes are closed relative to the total available? (More lanes = higher impact). Check \`Remarks\` for phrases like "one lane closed at a time" which might reduce impact compared to simultaneous closures.
    *   Nature of Work: Is it routine maintenance (e.g., grass trimming, litter pickup) or potentially more disruptive work (e.g., emergency repairs, paving, construction)? Check \`Reason\` and \`Details\`.
    *   Magnitude of Impact: Overall, is this likely to cause minor delays or major disruption?

4.  **Predictability & Mitigation:**
    *   Is the closure roving/mobile? (Check \`Details\`/\`Remarks\` for 'Roving'). These increase uncertainty and potential impact area.
    *   Alternative Route Availability: Are easy detours explicitly mentioned or obviously available?
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
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

    const model = genAI.getGenerativeModel({
      model: AI_MODEL,
      generationConfig: { responseMimeType: 'application/json', responseSchema: AI_SCHEMA, temperature: 0 }
    })

    const prompt = buildAiPrompt(closures, drivingPlan)

    const { response } = await model.generateContent([prompt])

    const impactedClosures = JSON.parse(response.text())

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
