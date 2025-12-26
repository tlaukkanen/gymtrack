import { Dialog, DialogTitle, DialogContent, IconButton, Box, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { MuscleMap, MuscleMapLegend, type MuscleEngagement } from '../../pages/analysis/MuscleMap'
import { getMuscleEngagementIntensity } from '../../utils/muscleEngagement'
import type { ExerciseDto } from '../../types/api'

interface ExerciseMuscleDialogProps {
  exercise: ExerciseDto | null
  open: boolean
  onClose: () => void
}

const convertExerciseToMuscleEngagements = (exercise: ExerciseDto): MuscleEngagement[] => {
  return exercise.muscleEngagements
    .filter((engagement) => getMuscleEngagementIntensity(engagement.level) > 0)
    .map((engagement) => ({
      muscle: engagement.muscleGroup,
      intensity: getMuscleEngagementIntensity(engagement.level),
    }))
}

const ExerciseMuscleDialog = ({ exercise, open, onClose }: ExerciseMuscleDialogProps) => {
  if (!exercise) return null

  const muscleEngagements = convertExerciseToMuscleEngagements(exercise)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        className: 'bg-surface',
      }}
    >
      <DialogTitle className="flex items-center justify-between">
        <Box>
          <Typography variant="h6" component="span">
            {exercise.name}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            component="div"
          >
            {exercise.primaryMuscle}
            {exercise.secondaryMuscle && ` · ${exercise.secondaryMuscle}`}
          </Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box className="py-4">
          <Typography
            variant="subtitle2"
            color="text.secondary"
            className="mb-4 text-center"
          >
            Muscle groups trained by this exercise
          </Typography>
          <MuscleMap engagements={muscleEngagements} />
          <MuscleMapLegend />
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default ExerciseMuscleDialog
