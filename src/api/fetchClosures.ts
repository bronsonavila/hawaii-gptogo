// Types

interface ApiErrorResponse {
  error: {
    code: number
    message: string
  }
}

export type ClosureProperties = typeof CLOSURE_PROPERTIES

export interface ClosureFeature {
  properties: ClosureProperties
}

interface FeatureCollection {
  features: ClosureFeature[]
}

// Constants

const ARCGIS_BASE_URL =
  'https://services.arcgis.com/HQ0xoN0EzDPBOEci/arcgis/rest/services/Lane_Closure_WFL1_View_NoEd/FeatureServer/0/query'

const CLOSURE_PROPERTIES = {
  Active: null as number | null,
  begDyWk: null as string | null,
  beginDate: null as number | null,
  CloseFact: null as string | null,
  ClosHours: null as string | null,
  ClosReason: null as string | null,
  ClosType: null as string | null,
  ClosureSide: null as string | null,
  direct: null as string | null,
  DIRPInfo: null as string | null,
  DirPRemarks: null as string | null,
  enDate: null as number | null,
  enDyWk: null as string | null,
  IntersFrom: null as string | null,
  IntersTo: null as string | null,
  intsfroml: null as string | null,
  intstol: null as string | null,
  Island: null as string | null,
  NumLanes: null as number | null,
  OBJECTID: null as number | null,
  Remarks: null as string | null,
  RoadName: null as string | null,
  Route: null as string | null,
  RteDirn: null as string | null
}

// Functions

const buildArcGisQueryUrl = (island: string): string => {
  const now = new Date()
  const queryStartDate = new Date(now)
  const queryEndDate = new Date(now)

  queryEndDate.setHours(now.getHours() + 24) // Look 24 hours ahead

  const formattedStartDate = formatArcGisTimestamp(queryStartDate)
  const formattedEndDate = formatArcGisTimestamp(queryEndDate)

  const baseWhere = `(beginDate+%3C%3E+enDate)+and+(Active+%3D+'1')+and+(DIRPInfo+%3D+'Yes')+and+(CloseFact+%3C%3E+'Sidewalk')`
  const dateWhere = `(beginDate+%3C%3D+timestamp+'${formattedEndDate}')+and+(enDate+%3E%3D+timestamp+'${formattedStartDate}')`
  const islandWhere = `(Island+%3D+'${island}')`

  const format = `f=geoJson`
  const geometry = `returnGeometry=false`
  const outFields = `outFields=${Object.keys(CLOSURE_PROPERTIES).join(',')}`

  return `${ARCGIS_BASE_URL}?where=${baseWhere}+and+${dateWhere}+and+${islandWhere}&${outFields}&${geometry}&${format}`
}

export const fetchClosures = async (island: string): Promise<ClosureFeature[]> => {
  const url = buildArcGisQueryUrl(island)

  try {
    const response = await fetch(url)

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`)

    const data = await response.json()

    if ('error' in data) {
      const errorResponse = data as ApiErrorResponse

      throw new Error(`API Error: ${errorResponse.error.message} (Code: ${errorResponse.error.code})`)
    }

    const sortedClosures = sortClosures((data as FeatureCollection).features || [])
    const mergedClosures = mergeIdenticalClosures(sortedClosures)
    const transformedClosures = mergedClosures.map(closure => {
      closure.properties.DirPRemarks = replaceNewlinesWithPeriods(closure.properties.DirPRemarks)
      closure.properties.intsfroml = transformLocationString(closure.properties.intsfroml)
      closure.properties.intstol = transformLocationString(closure.properties.intstol)
      closure.properties.Remarks = replaceNewlinesWithPeriods(closure.properties.Remarks)

      return closure
    })

    return transformedClosures
  } catch (error: unknown) {
    console.error('Fetch error in fetchClosures:', error)

    if (error instanceof Error) throw new Error(`Failed to fetch closure data: ${error.message}`)

    throw new Error(`Failed to fetch closure data: ${String(error)}`)
  }
}

const formatArcGisTimestamp = (date: Date): string => {
  const year = date.getUTCFullYear()
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0')
  const day = date.getUTCDate().toString().padStart(2, '0')
  const hours = date.getUTCHours().toString().padStart(2, '0')
  const minutes = date.getUTCMinutes().toString().padStart(2, '0')
  const seconds = date.getUTCSeconds().toString().padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const getClosureKey = (closure: ClosureFeature): string => {
  const props = closure.properties

  return [
    props.Route ?? '',
    props.direct ?? '',
    props.intsfroml ?? '',
    props.intstol ?? '',
    props.NumLanes ?? '',
    props.ClosureSide ?? '',
    props.CloseFact ?? '',
    props.ClosReason ?? '',
    props.DirPRemarks ?? '',
    props.Remarks ?? ''
  ].join('|')
}

const mergeIdenticalClosures = (closures: ClosureFeature[]): ClosureFeature[] => {
  // Group closures by identical properties (except dates)
  const closureGroups = new Map<string, ClosureFeature[]>()

  closures.forEach(closure => {
    const key = getClosureKey(closure)

    if (!closureGroups.has(key)) closureGroups.set(key, [])

    closureGroups.get(key)?.push(closure)
  })

  // Merge closures in each group
  const mergedClosures: ClosureFeature[] = []

  closureGroups.forEach(group => {
    if (group.length === 1) {
      // No merging needed for single closures
      mergedClosures.push(group[0])
    } else {
      // Check if all closures in the group have ClosHours === '24Hrs'
      const allAre24Hours = group.every(closure => closure.properties.ClosHours === '24Hrs')

      if (!allAre24Hours) {
        // If not all are 24-hour closures, don't merge and add them individually
        group.forEach(closure => mergedClosures.push(closure))

        return
      }

      // Find earliest start date and latest end date
      let earliestStartDate: number | null = null
      let latestEndDate: number | null = null
      let highestId: number | null = null

      group.forEach(closure => {
        const { beginDate, enDate, OBJECTID } = closure.properties

        if (beginDate !== null && (earliestStartDate === null || beginDate < earliestStartDate)) {
          earliestStartDate = beginDate
        }

        if (enDate !== null && (latestEndDate === null || enDate > latestEndDate)) {
          latestEndDate = enDate
        }

        if (OBJECTID !== null && (highestId === null || OBJECTID > highestId)) {
          highestId = OBJECTID
        }
      })

      // Create a merged closure with the representative closure from the group
      const mergedClosure = structuredClone(group[0])
      mergedClosure.properties.beginDate = earliestStartDate
      mergedClosure.properties.enDate = latestEndDate
      mergedClosure.properties.OBJECTID = highestId

      mergedClosures.push(mergedClosure)
    }
  })

  return sortClosures(mergedClosures)
}

const sortClosures = (features: ClosureFeature[]): ClosureFeature[] =>
  [...features].sort((a, b) => {
    // Sort by beginDate (ascending), treating null as 0
    const dateA = a.properties.beginDate || 0
    const dateB = b.properties.beginDate || 0
    const dateComp = dateA - dateB

    if (dateComp !== 0) return dateComp

    // If dates are the same, sort by Route (alphabetical), treating null/undefined as empty string
    const routeA = a.properties.Route ?? ''
    const routeB = b.properties.Route ?? ''
    const routeComp = routeA.localeCompare(routeB)

    if (routeComp !== 0) return routeComp

    // If Routes are the same, sort by location (alphabetical), treating null/undefined as empty string
    const locA = a.properties.intsfroml ?? ''
    const locB = b.properties.intsfroml ?? ''

    return locA.localeCompare(locB)
  })

const replaceNewlinesWithPeriods = (text: string | null): string | null => {
  if (!text) return null

  // Replace newlines with period and space, then consolidate double periods
  return text.replace(/\n/g, '. ').replace(/\.\. /g, '. ')
}

const transformLocationString = (location: string | null): string | null => {
  if (!location) return null

  const cutoff = ', Hawaii, '
  const index = location.indexOf(cutoff)

  return index !== -1 ? location.substring(0, index) : location
}
