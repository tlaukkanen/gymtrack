import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  CircularProgress,
  MenuItem,
  Select,
  Stack,
  Typography,
  type SelectChangeEvent,
} from '@mui/material'
import { subDays } from 'date-fns'
import { Card } from '../../components/ui/Card'
import { exerciseApi, sessionsApi } from '../../api/requests'
import { getMuscleEngagementScore } from '../../utils/muscleEngagement'
import { MuscleMap, MuscleMapLegend, type MuscleEngagement } from './MuscleMap'
import type { ExerciseDto, WorkoutSessionSummaryDto } from '../../types/api'

type TimeRange = 'last' | '2' | '3' | '5' | '7' | '14' | '30'

interface TimeRangeOption {
  value: TimeRange
  label: string
}

const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { value: 'last', label: 'Last workout' },
  { value: '2', label: 'Last 2 days' },
  { value: '3', label: 'Last 3 days' },
  { value: '5', label: 'Last 5 days' },
  { value: '7', label: 'Last 7 days' },
  { value: '14', label: 'Last 14 days' },
  { value: '30', label: 'Last 30 days' },
]

const calculateMuscleEngagements = (
  sessions: WorkoutSessionSummaryDto[],
  exercises: ExerciseDto[],
  sessionDetails: Map<string, { exerciseIds: string[] }>
): MuscleEngagement[] => {
  if (sessions.length === 0) {
    return []
  }

  const exerciseMap = new Map(exercises.map((e) => [e.id, e]))
  const muscleScores: Record<string, number> = {}
  const muscleCounts: Record<string, number> = {}

  sessions.forEach((session) => {
    const details = sessionDetails.get(session.id)
    if (!details) return

    details.exerciseIds.forEach((exerciseId) => {
      const exercise = exerciseMap.get(exerciseId)
      if (!exercise) return

      exercise.muscleEngagements.forEach((engagement) => {
        const muscle = engagement.muscleGroup
        const score = getMuscleEngagementScore(engagement.level)
        if (score > 0) {
          muscleScores[muscle] = (muscleScores[muscle] || 0) + score
          muscleCounts[muscle] = (muscleCounts[muscle] || 0) + 1
        }
      })
    })
  })

  // Convert to intensity percentage (0-100)
  const maxScore = Math.max(...Object.values(muscleScores), 1)

  return Object.entries(muscleScores).map(([muscle, score]) => ({
    muscle,
    intensity: (score / maxScore) * 100,
  }))
}

const AnalysisPage = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7')

  // Fetch exercises catalog
  const { data: exercises = [], isLoading: exercisesLoading } = useQuery({
    queryKey: ['exercises'],
    queryFn: exerciseApi.list,
  })

  // Fetch sessions based on time range
  const dateFilter = useMemo(() => {
    if (timeRange === 'last') {
      return undefined // Will be handled differently
    }
    const days = parseInt(timeRange, 10)
    return subDays(new Date(), days).toISOString().split('T')[0]
  }, [timeRange])

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions', 'analysis', dateFilter],
    queryFn: () =>
      sessionsApi.list({
        status: 'Completed',
        startedFrom: dateFilter,
        page: 1,
        pageSize: 100,
      }),
  })

  const sessions = useMemo(() => {
    const items = sessionsData?.items ?? []
    if (timeRange === 'last') {
      // Return only the most recent session
      return items.length > 0 ? [items[0]] : []
    }
    return items
  }, [sessionsData, timeRange])

  // Fetch session details for exercise information
  const { data: sessionDetailsMap, isLoading: detailsLoading } = useQuery({
    queryKey: ['session-details', sessions.map((s) => s.id)],
    queryFn: async () => {
      const map = new Map<string, { exerciseIds: string[] }>()
      await Promise.all(
        sessions.map(async (session) => {
          try {
            const detail = await sessionsApi.detail(session.id)
            const exerciseIds = detail.exercises
              .filter((e) => e.exerciseId)
              .map((e) => e.exerciseId as string)
            map.set(session.id, { exerciseIds })
          } catch {
            // Silently ignore individual session fetch failures to show partial data
          }
        })
      )
      return map
    },
    enabled: sessions.length > 0,
  })

  const muscleEngagements = useMemo(() => {
    if (!sessionDetailsMap || exercises.length === 0) {
      return []
    }
    return calculateMuscleEngagements(sessions, exercises, sessionDetailsMap)
  }, [sessions, exercises, sessionDetailsMap])

  const handleTimeRangeChange = (event: SelectChangeEvent<TimeRange>) => {
    setTimeRange(event.target.value as TimeRange)
  }

  const isLoading = exercisesLoading || sessionsLoading || detailsLoading

  const selectedRangeLabel = TIME_RANGE_OPTIONS.find((o) => o.value === timeRange)?.label ?? ''
  const sessionCount = sessions.length
  const trainedMuscles = muscleEngagements.filter((e) => e.intensity > 0).length

  return (
    <Stack spacing={3}>
      <div className="section-header">
        <div>
          <Typography variant="h2">Analysis</Typography>
          <p style={{ color: 'var(--text-muted)', marginBottom: 0 }}>
            Visualize muscle engagement across your workouts.
          </p>
        </div>
        <Select
          value={timeRange}
          onChange={handleTimeRangeChange}
          size="small"
          sx={{ minWidth: 160 }}
        >
          {TIME_RANGE_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </div>

      <Card>
        {isLoading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : sessions.length === 0 ? (
          <Box py={4} textAlign="center">
            <Typography color="text.secondary">
              No completed workouts found for the selected time range.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={4}>
            <Box textAlign="center">
              <Typography variant="subtitle1" color="text.secondary">
                {selectedRangeLabel}: {sessionCount} workout{sessionCount !== 1 ? 's' : ''} •{' '}
                {trainedMuscles} muscle group{trainedMuscles !== 1 ? 's' : ''} trained
              </Typography>
            </Box>

            <MuscleMap engagements={muscleEngagements} />
            <MuscleMapLegend />
          </Stack>
        )}
      </Card>
    </Stack>
  )
}

export default AnalysisPage
