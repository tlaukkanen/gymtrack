import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, CircularProgress, useMediaQuery, useTheme } from '@mui/material'
import { CheckCircle, Plus, Trash2 } from 'lucide-react'

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
  const navigate = useNavigate()
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

  const orderedExercises = useMemo(
    () => (session ? [...session.exercises].sort((a, b) => a.orderPerformed - b.orderPerformed) : []),
    [session],
  )

  const isSetLogged = (sessionSet: WorkoutSessionSetDto) =>
    [sessionSet.actualWeight, sessionSet.actualReps, sessionSet.actualDurationSeconds].some(
      (value) => value !== null && value !== undefined,
    )

  const isExerciseLoggedComplete = (exercise: WorkoutSessionExerciseDto) =>
    exercise.sets.length > 0 && exercise.sets.every(isSetLogged)

  const completedExerciseIds = useMemo(
    () => new Set(orderedExercises.filter((exercise) => isExerciseLoggedComplete(exercise)).map((exercise) => exercise.id)),
    [orderedExercises],
  )

  useEffect(() => {
    if (!orderedExercises.length) {
      setActiveExerciseId(null)
      return
    }
    const firstExercise = orderedExercises[0]
    setActiveExerciseId((prev) => {
      if (prev && orderedExercises.some((exercise) => exercise.id === prev)) {
        return prev
      }
      return firstExercise ? firstExercise.id : null
    })
  }, [orderedExercises])

  const activeExercise = useMemo(() => {
    if (!activeExerciseId) return undefined
    return orderedExercises.find((exercise) => exercise.id === activeExerciseId)
  }, [orderedExercises, activeExerciseId])

  const activeExerciseIsCompleted = activeExercise ? isExerciseLoggedComplete(activeExercise) : false

  const activeExerciseHasNext = useMemo(() => {
    if (!activeExercise) return false
    const index = orderedExercises.findIndex((exercise) => exercise.id === activeExercise.id)
    return index >= 0 && index < orderedExercises.length - 1
  }, [orderedExercises, activeExercise])

  const handleGoToNextExercise = () => {
    if (!activeExercise) return
    const index = orderedExercises.findIndex((exercise) => exercise.id === activeExercise.id)
    const nextExercise = index >= 0 ? orderedExercises[index + 1] : undefined
    if (nextExercise) {
      setActiveExerciseId(nextExercise.id)
    }
  }

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

  const deleteSessionMutation = useMutation({
    mutationFn: () => sessionsApi.remove(sessionId!),
    onSuccess: () => {
      push({ title: 'Workout deleted', tone: 'success' })
      navigate('/app/sessions')
    },
    onError: () => push({ title: 'Unable to delete session', tone: 'error' }),
  })

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

  const handleDeleteSession = () => {
    if (!sessionId) return
    if (!window.confirm('Delete this workout session? This action cannot be undone.')) return
    deleteSessionMutation.mutate()
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
          <Button
            variant="ghost"
            onClick={() => navigate(`/app/programs/${session.programId}/edit`)}
            sx={{ height: '44px' }}
          >
            Open Program
          </Button>
          <Button variant="ghost" onClick={() => setAddDialogOpen(true)} startIcon={<Plus size={16} />}
            sx={{ height: '44px' }}>
            Add Exercise
          </Button>
          <Button
            variant="ghost"
            onClick={handleDeleteSession}
            startIcon={<Trash2 size={16} />}
            disabled={deleteSessionMutation.isPending}
          >
            {deleteSessionMutation.isPending ? 'Deleting…' : 'Delete Workout'}
          </Button>
          <Button onClick={handleCompleteSession} 
          startIcon={<CheckCircle size={16} />}
          fullWidth={isMobile}
          disabled={Boolean(session.completedAt) || completeMutation.isPending}>
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
        {isMobile ? (
          <div className="mobile-exercise-shell">
            <div className="section-header" style={{ marginBottom: '0.5rem' }}>
              <h3>Exercises</h3>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{session.exercises.length} movements</span>
            </div>
            <ExerciseList
              exercises={orderedExercises}
              activeExerciseId={activeExercise?.id ?? null}
              onSelect={setActiveExerciseId}
              completedExerciseIds={completedExerciseIds}
              isMobileView
            />
          </div>
        ) : (
          <Card className="exercise-list-card">
            <div className="section-header" style={{ marginBottom: '1rem' }}>
              <h3>Exercises</h3>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{session.exercises.length} movements</span>
            </div>
            <ExerciseList
              exercises={orderedExercises}
              activeExerciseId={activeExercise?.id ?? null}
              onSelect={setActiveExerciseId}
              completedExerciseIds={completedExerciseIds}
            />
          </Card>
        )}

        {isMobile ? (
          <div>
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
                onGoToNextExercise={handleGoToNextExercise}
                hasNextExercise={activeExerciseHasNext}
                isExerciseCompleted={activeExerciseIsCompleted}
                onCompleteWorkout={handleCompleteSession}
              />
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>Select an exercise to begin logging.</p>
            )}
          </div>
        ) : (
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
                onGoToNextExercise={handleGoToNextExercise}
                hasNextExercise={activeExerciseHasNext}
                isExerciseCompleted={activeExerciseIsCompleted}
                onCompleteWorkout={handleCompleteSession}
              />
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>Select an exercise to begin logging.</p>
            )}
          </Card>
        )}
      </div>

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
