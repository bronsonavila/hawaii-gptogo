export enum DateFormatSeparator {
  Newline = '\n',
  CommaSpace = ', '
}

export const formatDate = (
  timestamp: number | null,
  separator: DateFormatSeparator = DateFormatSeparator.Newline
): string => {
  if (!timestamp) return 'N/A'

  const date = new Date(timestamp)
  const options: Intl.DateTimeFormatOptions = { timeZone: 'Pacific/Honolulu' }

  const dayOfWeek = date.toLocaleDateString('en-US', { ...options, weekday: 'short' })
  const monthDay = date.toLocaleDateString('en-US', { ...options, day: 'numeric', month: 'numeric' })
  const time = date.toLocaleTimeString('en-US', { ...options, hour: 'numeric', minute: '2-digit' })

  const datePart = `${dayOfWeek} (${monthDay})`

  return `${datePart}${separator}${time}`
}

export const getFormattedDatePrefix = (): string => {
  const formattedDate = new Date().toLocaleDateString('en-US', {
    timeZone: 'Pacific/Honolulu',
    weekday: 'long',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  })

  return `Today's date is ${formattedDate}. `
}
