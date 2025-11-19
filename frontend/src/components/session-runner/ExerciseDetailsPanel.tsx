import { useEffect, useState } from 'react'
import { Box, Chip, Divider, IconButton, Stack, TextField, Typography, useMediaQuery } from '@mui/material'
import { Pause, Play, Plus, RefreshCcw } from 'lucide-react'

import type { WorkoutSessionExerciseDto, WorkoutSessionSetDto } from '../../types/api'
import { Button } from '../ui/Button'
import { SetLogRow } from './SetLogRow'

const formatTimer = (remainingMs: number) => {
  if (remainingMs <= 0) return '00:00'
  const totalSeconds = Math.ceil(remainingMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
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
}: ExerciseDetailsPanelProps) => {
  const [restSeconds, setRestSeconds] = useState<number>(exercise.restSeconds)
  const [notes, setNotes] = useState<string>(exercise.notes ?? '')
  const isMobile = useMediaQuery('(max-width:600px)')

  const isSetCompleted = (sessionSet: WorkoutSessionSetDto) =>
    [sessionSet.actualWeight, sessionSet.actualReps, sessionSet.actualDurationSeconds].some(
      (value) => value !== null && value !== undefined,
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

  return (
    <Stack spacing={3}>
      <div
        className="section-header"
        style={{ flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: '0.75rem' }}
      >
        <div>
          <h3 style={{ marginBottom: '0.25rem' }}>{exercise.exerciseName}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            {exercise.sets.length} sets • default rest {exercise.restSeconds}s
          </p>
        </div>
        {exercise.isAdHoc && canRemoveExercise && (
          <Button variant="danger" onClick={onRemoveExercise} disabled={isRemoveExercisePending} fullWidth={isMobile}>
            Remove
          </Button>
        )}
      </div>

      <Stack spacing={2}>
        <Typography variant="subtitle2">Details</Typography>
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
            label="Notes"
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
        <div
          className="field-row"
          style={{
            alignItems: isMobile ? 'stretch' : 'center',
            flexWrap: 'wrap',
            flexDirection: isMobile ? 'column' : 'row',
          }}
        >
          <div className="timer-display">{formatTimer(timerRemainingMs)}</div>
          <Stack
            direction={isMobile ? 'column' : 'row'}
            spacing={1}
            alignItems={isMobile ? 'stretch' : 'center'}
            flexWrap={isMobile ? 'nowrap' : 'wrap'}
          >
            <IconButton color="primary" onClick={() => onStartTimer(exercise.restSeconds)} disabled={isSessionCompleted}>
              <Play size={18} />
            </IconButton>
            <IconButton color="warning" onClick={onPauseTimer} disabled={isSessionCompleted}>
              <Pause size={18} />
            </IconButton>
            <IconButton color="secondary" onClick={onResetTimer} disabled={isSessionCompleted}>
              <RefreshCcw size={18} />
            </IconButton>
          </Stack>
        </div>
        <Stack direction="row" spacing={1} flexWrap="wrap" marginTop={1}>
          {restOptions.map((value) => (
            <Chip key={value} label={value === 0 ? 'No rest' : `${value}s`} clickable onClick={() => onStartTimer(value)} disabled={isSessionCompleted} />
          ))}
        </Stack>
      </Box>

      <Divider />

      <Stack spacing={1} direction={isMobile ? 'column' : 'row'} justifyContent="space-between" alignItems={isMobile ? 'flex-start' : 'center'}>
        <Typography variant="h6">Sets</Typography>
        {!isSessionCompleted && (
          <Button onClick={onAddSet} startIcon={<Plus size={16} />} disabled={isAddSetPending} fullWidth={isMobile}>
            Add Set
          </Button>
        )}
      </Stack>

      <Stack spacing={1.5}>
        {exercise.sets.map((set) => {
          const completed = isSetCompleted(set)
          const isActiveSet = !isSessionCompleted && !completed && activeSetId === set.id

          return (
            <SetLogRow
              key={set.id}
              set={set}
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
    </Stack>
  )
}
