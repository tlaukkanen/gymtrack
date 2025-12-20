import { Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material'
import { MuscleMap, MuscleMapLegend, type MuscleEngagement } from '../../pages/analysis/MuscleMap'
import type { ExerciseDto } from '../../types/api'
import { Button } from '../ui/Button'

interface ExerciseMuscleMapDialogProps {
  open: boolean
  exercise: ExerciseDto | null
  onClose: () => void
}

const getMuscleEngagementLevel = (level: string | number): number => {
  if (typeof level === 'number') {
    // 0 = No, 1 = Some, 2 = Yes
    return level === 2 ? 1 : level === 1 ? 0.5 : 0
  }
  switch (level) {
    case 'Yes':
      return 1
    case 'Some':
      return 0.5
    case 'No':
      return 0
    default:
      return 0
  }
}

const calculateMuscleEngagements = (exercise: ExerciseDto): MuscleEngagement[] => {
  const muscleScores: Record<string, number> = {}

  exercise.muscleEngagements.forEach((engagement) => {
    const muscle = engagement.muscleGroup
    const level = getMuscleEngagementLevel(engagement.level)
    if (level > 0) {
      muscleScores[muscle] = Math.max(muscleScores[muscle] || 0, level)
    }
  })

  // Convert to intensity percentage (0-100)
  // For a single exercise, we'll use the raw engagement levels
  // where 1.0 (Yes) = 100% and 0.5 (Some) = 50%
  return Object.entries(muscleScores).map(([muscle, score]) => ({
    muscle,
    intensity: score * 100,
  }))
}

export const ExerciseMuscleMapDialog = ({ open, exercise, onClose }: ExerciseMuscleMapDialogProps) => {
  if (!exercise) return null

  const muscleEngagements = calculateMuscleEngagements(exercise)

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <Stack spacing={1}>
          <Typography variant="h6">{exercise.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            Muscle Engagement
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <MuscleMap engagements={muscleEngagements} />
          <MuscleMapLegend />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
