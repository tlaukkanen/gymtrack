export const restOptions = [15, 30, 60, 90, 120, 180, 240]

export const formatSeconds = (totalSeconds?: number | null) => {
  if (!totalSeconds || totalSeconds <= 0) return '—'
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) {
    return `${seconds}s`
  }
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`
}

export const formatDate = (value: string) => {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export const formatDateTime = (value?: string | null) => {
  if (!value) return '—'
  return new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}
