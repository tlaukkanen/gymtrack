import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, CircularProgress, useMediaQuery, useTheme } from '@mui/material'
import { Plus } from 'lucide-react'

import { exerciseApi, sessionsApi } from '../../api/requests'
import { useToast } from '../../components/feedback/ToastProvider'
import { AddExerciseDialog } from '../../components/session-runner/AddExerciseDialog'
import { ExerciseDetailsPanel } from '../../components/session-runner/ExerciseDetailsPanel'
import { ExerciseList } from '../../components/session-runner/ExerciseList'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useRestTimers } from '../../hooks/useRestTimers'
import type {
  AddSessionExerciseRequest,
  WorkoutSessionExerciseDto,
  WorkoutSessionSetDto,
} from '../../types/api'
import { restOptions } from '../../utils/time'

const clampRestSeconds = (value: number) => {
  if (!Number.isFinite(value) || value < 0) return 0
  return Math.min(600, Math.max(0, Math.round(value)))
}

const SessionRunnerPage = () => {
  const { sessionId } = useParams()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const queryClient = useQueryClient()
  const { push } = useToast()
  const { getTimerState, startTimer, pauseTimer, resetTimer } = useRestTimers()

  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const sessionQuery = useQuery({
    queryKey: ['sessions', sessionId],
    queryFn: () => sessionsApi.detail(sessionId!),
    enabled: Boolean(sessionId),
    staleTime: 10_000,
  })

  const exercisesQuery = useQuery({ queryKey: ['exercises'], queryFn: exerciseApi.list })

  const session = sessionQuery.data

  useEffect(() => {
    if (!session) return
    const firstExercise = session.exercises[0]
    setActiveExerciseId((prev) => {
      if (prev && session.exercises.some((exercise) => exercise.id === prev)) {
        return prev
      }
      return firstExercise ? firstExercise.id : null
    })
  }, [session])

  const activeExercise = useMemo(() => {
    if (!session || !activeExerciseId) return undefined
    return session.exercises.find((exercise) => exercise.id === activeExerciseId)
  }, [session, activeExerciseId])

  const activeTimerState = activeExercise ? getTimerState(activeExercise.id) : undefined

  const closeAddDialog = () => setAddDialogOpen(false)

  const invalidateSession = () => queryClient.invalidateQueries({ queryKey: ['sessions', sessionId] })

  const updateSetMutation = useMutation({
    mutationFn: (payload: { setId: string; body: { actualWeight?: number | null; actualReps?: number | null; actualDurationSeconds?: number | null } }) =>
      sessionsApi.updateSet(sessionId!, payload.setId, payload.body),
    onSuccess: () => {
      invalidateSession()
      push({ title: 'Set logged', tone: 'success' })
    },
    onError: () => push({ title: 'Unable to save set', tone: 'error' }),
  })

  const addExerciseMutation = useMutation({
    mutationFn: (payload: AddSessionExerciseRequest) => sessionsApi.addExercise(sessionId!, payload),
    onSuccess: () => {
      invalidateSession()
      setAddDialogOpen(false)
      push({ title: 'Exercise added', tone: 'success' })
    },
    onError: () => push({ title: 'Unable to add exercise', tone: 'error' }),
  })

  const removeExerciseMutation = useMutation({
    mutationFn: (sessionExerciseId: string) => sessionsApi.removeExercise(sessionId!, sessionExerciseId),
    onSuccess: () => {
      invalidateSession()
      push({ title: 'Exercise removed', tone: 'success' })
    },
    onError: () => push({ title: 'Unable to remove exercise', tone: 'error' }),
  })

  const reorderMutation = useMutation({
    mutationFn: (orderedExerciseIds: string[]) => sessionsApi.reorderExercises(sessionId!, { orderedExerciseIds }),
    onSuccess: () => invalidateSession(),
    onError: () => push({ title: 'Unable to reorder exercises', tone: 'error' }),
  })

  const updateExerciseMutation = useMutation({
    mutationFn: (payload: { sessionExerciseId: string; restSeconds?: number; notes?: string }) =>
      sessionsApi.updateExercise(sessionId!, payload.sessionExerciseId, {
        restSeconds: payload.restSeconds,
        notes: payload.notes,
      }),
    onSuccess: () => {
      invalidateSession()
      push({ title: 'Exercise updated', tone: 'success' })
    },
    onError: () => push({ title: 'Unable to update exercise', tone: 'error' }),
  })

  const addSetMutation = useMutation({
    mutationFn: (sessionExerciseId: string) => sessionsApi.addSet(sessionId!, sessionExerciseId, {}),
    onSuccess: () => invalidateSession(),
    onError: () => push({ title: 'Unable to add set', tone: 'error' }),
  })

  const removeSetMutation = useMutation({
    mutationFn: (setId: string) => sessionsApi.removeSet(sessionId!, setId),
    onSuccess: () => invalidateSession(),
    onError: () => push({ title: 'Unable to remove set', tone: 'error' }),
  })

  const completeMutation = useMutation({
    mutationFn: () => sessionsApi.complete(sessionId!),
    onSuccess: () => {
      invalidateSession()
      push({ title: 'Workout complete', description: 'Session locked for edits', tone: 'success' })
    },
    onError: () => push({ title: 'Unable to complete session', tone: 'error' }),
  })

  const handleReorder = (exerciseId: string, direction: -1 | 1) => {
    if (!session) return
    const ordered = [...session.exercises].sort((a, b) => a.orderPerformed - b.orderPerformed)
    const index = ordered.findIndex((exercise) => exercise.id === exerciseId)
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= ordered.length) return
    const nextOrder = [...ordered]
    const [item] = nextOrder.splice(index, 1)
    nextOrder.splice(targetIndex, 0, item)
    reorderMutation.mutate(nextOrder.map((exercise) => exercise.id))
  }

  const handleSaveExerciseDetails = (exerciseId: string, restSeconds: number, notes: string) => {
    updateExerciseMutation.mutate({
      sessionExerciseId: exerciseId,
      restSeconds: clampRestSeconds(restSeconds),
      notes,
    })
  }

  const handleAddSet = (sessionExerciseId: string) => {
    if (session?.completedAt) return
    addSetMutation.mutate(sessionExerciseId)
  }

  const handleRemoveSet = (set: WorkoutSessionSetDto, exercise: WorkoutSessionExerciseDto) => {
    if (session?.completedAt) return
    if (!set.isUserAdded && !exercise.isAdHoc) {
      push({ title: 'Only custom sets can be removed', tone: 'info' })
      return
    }
    removeSetMutation.mutate(set.id)
  }

  const handleAddExercise = (payload: AddSessionExerciseRequest) => {
    addExerciseMutation.mutate(payload)
  }

  const handleCompleteSession = () => {
    if (session?.completedAt) return
    if (!window.confirm('Mark this workout as complete? You will not be able to edit it afterwards.')) return
    completeMutation.mutate()
  }

  const handleRemoveExercise = (exercise: WorkoutSessionExerciseDto) => {
    if (!exercise.isAdHoc) return
    if (!window.confirm('Remove this ad-hoc exercise from the session?')) return
    removeExerciseMutation.mutate(exercise.id)
  }

  if (sessionQuery.isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <CircularProgress />
      </div>
    )
  }

  if (sessionQuery.isError || !session) {
    return (
      <Alert severity="error">
        Unable to load workout session. Please try again later.
      </Alert>
    )
  }

  const startedAt = new Date(session.startedAt).toLocaleString()

  return (
    <div className="grid" style={{ gap: '1.5rem' }}>
      <div className="section-header">
        <div>
          <h2>Workout session</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 0 }}>Started {startedAt}</p>
        </div>
        <div className="field-row">
          <Button variant="ghost" onClick={() => setAddDialogOpen(true)} startIcon={<Plus size={16} />}
            sx={{ height: '44px' }}>
            Add Exercise
          </Button>
          <Button onClick={handleCompleteSession} disabled={Boolean(session.completedAt) || completeMutation.isPending}>
            {session.completedAt ? 'Completed' : completeMutation.isPending ? 'Completing…' : 'Complete Workout'}
          </Button>
        </div>
      </div>

      {session.completedAt && (
        <Alert severity="info">
          Session was completed on {new Date(session.completedAt).toLocaleString()}. Editing is disabled.
        </Alert>
      )}

      <div className="runner-layout">
        <Card className="exercise-list-card">
          <div className="section-header" style={{ marginBottom: '1rem' }}>
            <h3>Exercises</h3>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{session.exercises.length} movements</span>
          </div>
          <ExerciseList
            exercises={session.exercises}
            activeExerciseId={activeExercise?.id ?? null}
            onSelect={setActiveExerciseId}
            onReorder={handleReorder}
            disableReorder={Boolean(session.completedAt)}
            isReordering={reorderMutation.isPending}
          />
        </Card>

        <Card>
          {activeExercise ? (
            <ExerciseDetailsPanel
              exercise={activeExercise}
              isSessionCompleted={Boolean(session.completedAt)}
              restOptions={restOptions}
              timerRemainingMs={activeTimerState?.remainingMs ?? 0}
              onStartTimer={(seconds) => startTimer(activeExercise.id, seconds)}
              onPauseTimer={() => pauseTimer(activeExercise.id)}
              onResetTimer={() => resetTimer(activeExercise.id)}
              onSaveDetails={({ restSeconds, notes }) => handleSaveExerciseDetails(activeExercise.id, restSeconds, notes)}
              onAddSet={() => handleAddSet(activeExercise.id)}
              onSaveSet={(setId, body) => updateSetMutation.mutate({ setId, body })}
              onRemoveSet={(set) => handleRemoveSet(set, activeExercise)}
              onRemoveExercise={() => handleRemoveExercise(activeExercise)}
              canRemoveExercise={!session.completedAt}
              isUpdateExercisePending={updateExerciseMutation.isPending}
              isAddSetPending={addSetMutation.isPending}
              isUpdateSetPending={updateSetMutation.isPending}
              isRemoveExercisePending={removeExerciseMutation.isPending}
            />
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Select an exercise to begin logging.</p>
          )}
        </Card>
      </div>

      {isMobile && (
        <Button fullWidth onClick={() => setAddDialogOpen(true)} startIcon={<Plus size={16} />}>
          Add Exercise
        </Button>
      )}

      <AddExerciseDialog
        open={addDialogOpen}
        onClose={closeAddDialog}
        exercises={exercisesQuery.data}
        isSubmitting={addExerciseMutation.isPending}
        onAddExercise={handleAddExercise}
      />
    </div>
  )
}

export default SessionRunnerPage
