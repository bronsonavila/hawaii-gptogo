export const formatDate = (timestamp: number | null): string => {
  if (!timestamp) return 'N/A'

  const date = new Date(timestamp)
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' })
  const dateTime = date.toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })

  return `${dayOfWeek}\n${dateTime}`
}
