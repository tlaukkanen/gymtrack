import { useMemo } from 'react'
import { Box, Typography } from '@mui/material'
import { MuscleMap, MuscleMapLegend, type MuscleEngagement } from '../../pages/analysis/MuscleMap'
import { getMuscleEngagementScore } from '../../utils/muscleEngagement'
import type { ExerciseDto, WorkoutSessionExerciseDto } from '../../types/api'

interface SessionMuscleMapProps {
  sessionExercises: WorkoutSessionExerciseDto[]
  exerciseCatalog: ExerciseDto[]
}

const calculateSessionMuscleEngagements = (
  sessionExercises: WorkoutSessionExerciseDto[],
  exerciseCatalog: ExerciseDto[]
): MuscleEngagement[] => {
  if (sessionExercises.length === 0) {
    return []
  }

  const exerciseMap = new Map(exerciseCatalog.map((e) => [e.id, e]))
  const muscleScores: Record<string, number> = {}

  sessionExercises.forEach((sessionExercise) => {
    // Only process catalog exercises (not ad-hoc)
    if (!sessionExercise.exerciseId) return

    const exercise = exerciseMap.get(sessionExercise.exerciseId)
    if (!exercise) return

    // Weight the score by the number of sets
    const setCount = Math.max(sessionExercise.sets.length, 1)

    exercise.muscleEngagements.forEach((engagement) => {
      const muscle = engagement.muscleGroup
      const score = getMuscleEngagementScore(engagement.level)
      if (score > 0) {
        muscleScores[muscle] = (muscleScores[muscle] || 0) + score * setCount
      }
    })
  })

  // Convert to intensity percentage (0-100)
  const maxScore = Math.max(...Object.values(muscleScores), 1)

  return Object.entries(muscleScores).map(([muscle, score]) => ({
    muscle,
    intensity: (score / maxScore) * 100,
  }))
}

const SessionMuscleMap = ({ sessionExercises, exerciseCatalog }: SessionMuscleMapProps) => {
  const muscleEngagements = useMemo(
    () => calculateSessionMuscleEngagements(
      sessionExercises,
      exerciseCatalog
    ),
    [sessionExercises, exerciseCatalog]
  )

  const trainedMuscles = muscleEngagements.filter((e) => e.intensity > 0).length
  const totalSets = sessionExercises.reduce(
    (sum, ex) => sum + ex.sets.length,
    0
  )

  if (trainedMuscles === 0) {
    return null
  }

  return (
    <Box className="flex flex-col items-center gap-4 py-4">
      <Typography
        variant="subtitle2"
        color="text.secondary"
        className="text-center"
      >
        {sessionExercises.length} exercise{sessionExercises.length !== 1 ? 's' : ''} · {totalSets} set{totalSets !== 1 ? 's' : ''} · {trainedMuscles} muscle group{trainedMuscles !== 1 ? 's' : ''}
      </Typography>
      <MuscleMap engagements={muscleEngagements} />
      <MuscleMapLegend />
    </Box>
  )
}

export default SessionMuscleMap
