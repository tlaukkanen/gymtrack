import { useCallback, useEffect, useMemo, useState } from 'react'
import { Box, Chip, Divider, IconButton, Stack, TextField, Typography, useMediaQuery } from '@mui/material'
import { ArrowRight, CheckCircle, Pause, Play, Plus, RefreshCcw } from 'lucide-react'

import type { WorkoutSessionExerciseDto, WorkoutSessionSetDto } from '../../types/api'
import { Button } from '../ui/Button'
import { SetLogRow } from './SetLogRow'

type SessionExerciseCategory = 'Strength' | 'Cardio'

const formatTimer = (remainingMs: number) => {
  if (remainingMs <= 0) return '00:00'
  const totalSeconds = Math.ceil(remainingMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const normalizeCategoryValue = (value?: string | number | null): SessionExerciseCategory | undefined => {
  if (value === 'Cardio' || value === 1) return 'Cardio'
  if (value === 'Strength' || value === 0) return 'Strength'
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'cardio') return 'Cardio'
    if (normalized === 'strength') return 'Strength'
  }
  return undefined
}

const deriveExerciseCategory = (exercise: WorkoutSessionExerciseDto): SessionExerciseCategory => {
  const explicitCategory =
    normalizeCategoryValue(exercise.category ?? null) || normalizeCategoryValue(exercise.customCategory ?? null)
  if (explicitCategory) return explicitCategory

  const hasStrengthSignals = exercise.sets.some(
    (set) => set.plannedWeight != null || set.plannedReps != null || set.actualWeight != null || set.actualReps != null,
  )
  const hasCardioSignals = exercise.sets.some((set) => set.plannedDurationSeconds != null || set.actualDurationSeconds != null)

  if (hasCardioSignals && !hasStrengthSignals) return 'Cardio'
  return 'Strength'
}

interface ExerciseDetailsPanelProps {
  exercise: WorkoutSessionExerciseDto
  isSessionCompleted: boolean
  restOptions: number[]
  timerRemainingMs: number
  onStartTimer: (seconds: number) => void
  onPauseTimer: () => void
  onResetTimer: () => void
  onSaveDetails: (payload: { restSeconds: number; notes: string }) => void
  onAddSet: () => void
  onSaveSet: (setId: string, body: { actualWeight?: number | null; actualReps?: number | null; actualDurationSeconds?: number | null }) => void
  onRemoveSet: (set: WorkoutSessionSetDto) => void
  onRemoveExercise?: () => void
  canRemoveExercise: boolean
  isUpdateExercisePending: boolean
  isAddSetPending: boolean
  isUpdateSetPending: boolean
  isRemoveExercisePending: boolean
  onGoToNextExercise: () => void
  hasNextExercise: boolean
  isExerciseCompleted: boolean
  onCompleteWorkout: () => void
}

export const ExerciseDetailsPanel = ({
  exercise,
  isSessionCompleted,
  restOptions,
  timerRemainingMs,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onSaveDetails,
  onAddSet,
  onSaveSet,
  onRemoveSet,
  onRemoveExercise,
  canRemoveExercise,
  isUpdateExercisePending,
  isAddSetPending,
  isUpdateSetPending,
  isRemoveExercisePending,
  onGoToNextExercise,
  hasNextExercise,
  isExerciseCompleted,
  onCompleteWorkout,
}: ExerciseDetailsPanelProps) => {
  const [restSeconds, setRestSeconds] = useState<number>(exercise.restSeconds)
  const [notes, setNotes] = useState<string>(exercise.notes ?? '')
  const isMobile = useMediaQuery('(max-width:600px)')
  const exerciseCategory = useMemo(() => deriveExerciseCategory(exercise), [exercise])

  const isSetCompleted = useCallback(
    (sessionSet: WorkoutSessionSetDto) => {
      if (exerciseCategory === 'Cardio') {
        return sessionSet.actualDurationSeconds !== null && sessionSet.actualDurationSeconds !== undefined
      }
      return sessionSet.actualWeight !== null && sessionSet.actualWeight !== undefined
        ? true
        : sessionSet.actualReps !== null && sessionSet.actualReps !== undefined
    },
    [exerciseCategory],
  )

  const firstIncompleteSet = exercise.sets.find((sessionSet) => !isSetCompleted(sessionSet))
  const activeSetId = !isSessionCompleted && firstIncompleteSet ? firstIncompleteSet.id : null

  useEffect(() => {
    setRestSeconds(exercise.restSeconds)
    setNotes(exercise.notes ?? '')
  }, [exercise.id, exercise.notes, exercise.restSeconds])

  const handleSaveDetails = () => {
    onSaveDetails({ restSeconds, notes })
  }

  const shouldShowExerciseCta = !isSessionCompleted && isExerciseCompleted
  const isLastExercise = shouldShowExerciseCta && !hasNextExercise

  return (
    <Stack spacing={3}>
      <div
        className="section-header"
        style={{ flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: '0.75rem' }}
      >
        {exercise.isAdHoc && canRemoveExercise && (
          <Button variant="danger" onClick={onRemoveExercise} disabled={isRemoveExercisePending} fullWidth={isMobile}>
            Remove
          </Button>
        )}
      </div>

      <Stack spacing={2}>
        <div
          className="field-row"
          style={{
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
          }}
        >
          {/*
          <TextField
            label="Rest seconds"
            type="number"
            value={restSeconds}
            onChange={(event) => setRestSeconds(Number(event.target.value))}
            inputProps={{ min: 0, max: 600 }}
            fullWidth={isMobile}
            disabled={isSessionCompleted}
          />*/}
          <TextField
            label="My Notes"
            multiline
            minRows={2}
            fullWidth
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            disabled={isSessionCompleted}
          />
          <Button onClick={handleSaveDetails} disabled={isSessionCompleted || isUpdateExercisePending} fullWidth={isMobile}>
            {isUpdateExercisePending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </Stack>

      <Divider />

      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Rest timer
        </Typography>
        <Stack spacing={isMobile ? 1.5 : 2}>
          <Stack
            direction={isMobile ? 'column' : 'row'}
            spacing={isMobile ? 1.5 : 2}
            alignItems={isMobile ? 'stretch' : 'center'}
            justifyContent="space-between"
            flexWrap={isMobile ? 'nowrap' : 'wrap'}
          >
            <Box
              className="timer-display"
              sx={{
                textAlign: isMobile ? 'center' : 'left',
                flex: isMobile ? '1 1 auto' : '0 0 auto',
                lineHeight: 1.1,
              }}
            >
              {formatTimer(timerRemainingMs)}
            </Box>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent={isMobile ? 'space-between' : 'flex-start'}
              width={isMobile ? '100%' : 'auto'}
              flexWrap="wrap"
            >
              <IconButton
                color="primary"
                onClick={() => onStartTimer(exercise.restSeconds)}
                disabled={isSessionCompleted}
                size={isMobile ? 'large' : 'medium'}
                sx={{ flex: isMobile ? 1 : undefined, minWidth: isMobile ? 64 : undefined, minHeight: isMobile ? 64 : undefined }}
                aria-label="Start rest timer"
              >
                <Play size={isMobile ? 20 : 18} />
              </IconButton>
              <IconButton
                color="warning"
                onClick={onPauseTimer}
                disabled={isSessionCompleted}
                size={isMobile ? 'large' : 'medium'}
                sx={{ flex: isMobile ? 1 : undefined, minWidth: isMobile ? 64 : undefined, minHeight: isMobile ? 64 : undefined }}
                aria-label="Pause rest timer"
              >
                <Pause size={isMobile ? 20 : 18} />
              </IconButton>
              <IconButton
                color="secondary"
                onClick={onResetTimer}
                disabled={isSessionCompleted}
                size={isMobile ? 'large' : 'medium'}
                sx={{ flex: isMobile ? 1 : undefined, minWidth: isMobile ? 64 : undefined, minHeight: isMobile ? 64 : undefined }}
                aria-label="Reset rest timer"
              >
                <RefreshCcw size={isMobile ? 20 : 18} />
              </IconButton>
            </Stack>
          </Stack>
        </Stack>
        <Stack
          direction="row"
          flexWrap="wrap"
          marginTop={1}
          justifyContent={isMobile ? 'center' : 'flex-start'}
          sx={{ columnGap: isMobile ? 0.75 : 1, rowGap: isMobile ? 0.75 : 0.5 }}
        >
          {restOptions.map((value) => (
            <Chip key={value} label={value === 0 ? 'No rest' : `${value}s`} clickable onClick={() => onStartTimer(value)} disabled={isSessionCompleted} />
          ))}
        </Stack>
      </Box>

      <Divider />

      <Stack spacing={1.5}>
        <Typography variant="h6">Sets</Typography>
        {exercise.sets.map((set) => {
          const completed = isSetCompleted(set)
          const isActiveSet = !isSessionCompleted && !completed && activeSetId === set.id

          return (
            <SetLogRow
              key={set.id}
              set={set}
              category={exerciseCategory}
              canRemove={!isSessionCompleted && (set.isUserAdded || exercise.isAdHoc)}
              onSave={(body) => onSaveSet(set.id, body)}
              isSaving={isUpdateSetPending}
              onRemove={!isSessionCompleted ? () => onRemoveSet(set) : undefined}
              disabled={isSessionCompleted}
              isActive={isActiveSet}
              isCompleted={completed}
            />
          )
        })}
      </Stack>

      <Stack spacing={1} direction={isMobile ? 'column' : 'row'} justifyContent="space-between" alignItems={isMobile ? 'flex-start' : 'center'}>
        {!isSessionCompleted && (
          <Button variant='ghost' onClick={onAddSet} startIcon={<Plus size={16} />} disabled={isAddSetPending} fullWidth={isMobile}>
            Add Additional Set
          </Button>
        )}
      </Stack>


      {shouldShowExerciseCta && (
        <Button
          onClick={isLastExercise ? onCompleteWorkout : onGoToNextExercise}
          startIcon={isLastExercise ? <CheckCircle size={16} /> : <ArrowRight size={16} />}
          fullWidth={isMobile}
        >
          {isLastExercise ? 'Complete workout' : 'Next exercise'}
        </Button>
      )}
    </Stack>
  )
}
