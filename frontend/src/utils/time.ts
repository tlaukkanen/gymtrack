export const restOptions = [0, 30, 60, 90, 120, 180, 240, 300]

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
