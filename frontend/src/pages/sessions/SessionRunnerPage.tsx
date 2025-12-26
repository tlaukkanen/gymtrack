import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, CircularProgress, useMediaQuery, useTheme } from '@mui/material'
import { CheckCircle, Plus, Trash2 } from 'lucide-react'

import { exerciseApi, sessionsApi } from '../../api/requests'
import { useToast } from '../../components/feedback/ToastProvider'
import { useProgress } from '../../hooks/useProgress'
import { AddExerciseDialog } from '../../components/session-runner/AddExerciseDialog'
import { ExerciseDetailsPanel } from '../../components/session-runner/ExerciseDetailsPanel'
import { ExerciseList } from '../../components/session-runner/ExerciseList'
import ProgramLoadChart from '../../components/session-runner/ProgramLoadChart'
import ExerciseLoadChart from '../../components/session-runner/ExerciseLoadChart'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useRestTimers } from '../../hooks/useRestTimers'
import { useTimerAudio } from '../../hooks/useTimerAudio'
import type {
  AddSessionExerciseRequest,
  WorkoutSessionExerciseDto,
  WorkoutSessionSetDto,
} from '../../types/api'
import { formatDateTime, restOptions } from '../../utils/time'

const SWIPE_DISTANCE_THRESHOLD = 60
const SWIPE_DURATION_THRESHOLD_MS = 800

const isInteractiveSwipeTarget = (target: EventTarget | null) => {
  if (!(target instanceof Element)) {
    return false
  }
  return Boolean(
    target.closest('input, textarea, select, button, a, [role="button"], [contenteditable="true"], [data-swipe-ignore="true"]'),
  )
}

const SessionRunnerPage = () => {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const queryClient = useQueryClient()
  const { push } = useToast()
  const { showProgress, hideProgress } = useProgress()
  const { playBeep } = useTimerAudio()

  const handleTimerComplete = useCallback(() => {
    playBeep()
  }, [playBeep])

  const { getTimerState, startTimer, pauseTimer, resetTimer } = useRestTimers({
    onTimerComplete: handleTimerComplete,
  })

  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const swipeOriginRef = useRef<{ x: number; y: number; time: number } | null>(null) // Enables global swipe gestures

  const sessionQuery = useQuery({
    queryKey: ['sessions', sessionId],
    queryFn: () => sessionsApi.detail(sessionId!),
    enabled: Boolean(sessionId),
    staleTime: 10_000,
  })

  const exercisesQuery = useQuery({ queryKey: ['exercises'], queryFn: exerciseApi.list })

  const session = sessionQuery.data

  const progressionQuery = useQuery({
    queryKey: ['programs', session?.programId, 'progression'],
    queryFn: () => sessionsApi.progression(session!.programId),
    enabled: Boolean(session?.programId && session?.completedAt),
    staleTime: 60_000,
  })

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

  const showProgressionChart = Boolean(
    session?.completedAt && (progressionQuery.isLoading || (progressionQuery.data?.length ?? 0) > 0),
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

  const activeExerciseHasWeightSets = useMemo(() => {
    if (!activeExercise) return false
    return activeExercise.sets.some((set) => set.plannedWeight != null || set.actualWeight != null)
  }, [activeExercise])

  const activeExerciseHasNext = useMemo(() => {
    if (!activeExercise) return false
    const index = orderedExercises.findIndex((exercise) => exercise.id === activeExercise.id)
    return index >= 0 && index < orderedExercises.length - 1
  }, [orderedExercises, activeExercise])

  const canEditSession = Boolean(session && !session.completedAt)

  const canBypassCompletionForChart = Boolean(!activeExerciseHasWeightSets && session?.completedAt)

  const exerciseProgressionQueryEnabled = Boolean(
    sessionId &&
      activeExercise?.id &&
      (activeExerciseIsCompleted || canBypassCompletionForChart),
  )

  const exerciseProgressionQuery = useQuery({
    queryKey: ['sessions', sessionId, 'exercises', activeExercise?.id, 'progression'],
    queryFn: () => {
      if (!sessionId || !activeExercise) {
        throw new Error('Exercise context unavailable')
      }
      return sessionsApi.exerciseProgression(sessionId, activeExercise.id)
    },
    enabled: exerciseProgressionQueryEnabled,
    staleTime: 60_000,
  })

  const showExerciseChart = Boolean(
    exerciseProgressionQueryEnabled &&
      !exerciseProgressionQuery.isError &&
      (exerciseProgressionQuery.isLoading || (exerciseProgressionQuery.data?.length ?? 0) > 0),
  )

  const exerciseChartElement = showExerciseChart && activeExercise
    ? (
        <ExerciseLoadChart
          currentSessionExerciseId={activeExercise.id}
          points={exerciseProgressionQuery.data}
          isLoading={exerciseProgressionQuery.isLoading}
        />
      )
    : null

  const handleGoToNextExercise = () => {
    if (!activeExercise) return
    const index = orderedExercises.findIndex((exercise) => exercise.id === activeExercise.id)
    const nextExercise = index >= 0 ? orderedExercises[index + 1] : undefined
    if (nextExercise) {
      setActiveExerciseId(nextExercise.id)
    }
  }

  const handleGoToPreviousExercise = () => {
    if (!activeExercise) return
    const index = orderedExercises.findIndex((exercise) => exercise.id === activeExercise.id)
    const previousExercise = index > 0 ? orderedExercises[index - 1] : undefined
    if (previousExercise) {
      setActiveExerciseId(previousExercise.id)
    }
  }

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!activeExercise || event.touches.length !== 1) {
      swipeOriginRef.current = null
      return
    }
    if (isInteractiveSwipeTarget(event.target)) {
      swipeOriginRef.current = null
      return
    }
    const touch = event.touches[0]
    if (!touch) return
    swipeOriginRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() }
  }

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = swipeOriginRef.current
    swipeOriginRef.current = null
    if (!start || !activeExercise) return
    const touch = event.changedTouches[0]
    if (!touch) return
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    const duration = Date.now() - start.time
    if (duration > SWIPE_DURATION_THRESHOLD_MS) return
    if (Math.abs(dx) < SWIPE_DISTANCE_THRESHOLD) return
    if (Math.abs(dx) < Math.abs(dy)) return
    if (dx > 0) {
      handleGoToPreviousExercise()
    } else {
      handleGoToNextExercise()
    }
  }

  const activeTimerState = activeExercise ? getTimerState(activeExercise.id) : undefined

  const closeAddDialog = () => setAddDialogOpen(false)

  const invalidateSession = () => queryClient.invalidateQueries({ queryKey: ['sessions', sessionId] })

  const updateSetMutation = useMutation({
    mutationFn: (payload: { setId: string; body: { actualWeight?: number | null; actualReps?: number | null; actualDurationSeconds?: number | null } }) =>
      sessionsApi.updateSet(sessionId!, payload.setId, payload.body),
    onMutate: () => {
      showProgress()
    },
    onSuccess: () => {
      hideProgress()
      invalidateSession()
      push({ title: 'Set logged', tone: 'success' })
    },
    onError: () => {
      hideProgress()
      push({ title: 'Unable to save set', tone: 'error' })
    },
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
    mutationFn: (payload: { sessionExerciseId: string; notes?: string }) =>
      sessionsApi.updateExercise(sessionId!, payload.sessionExerciseId, {
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
    mutationFn: (payload: { setId: string; force?: boolean }) =>
      sessionsApi.removeSet(
        sessionId!,
        payload.setId,
        { force: payload.force },
      ),
    onSuccess: (updatedSession) => {
      if (!sessionId) return
      queryClient.setQueryData(['sessions', sessionId], updatedSession)
    },
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

  const handleSaveExerciseDetails = (exerciseId: string, notes: string) => {
    updateExerciseMutation.mutate({
      sessionExerciseId: exerciseId,
      notes,
    })
  }

  const handleAddSet = (sessionExerciseId: string) => {
    if (session?.completedAt) return
    addSetMutation.mutate(sessionExerciseId)
  }

  const handleRemoveSet = (
    set: WorkoutSessionSetDto,
    exercise: WorkoutSessionExerciseDto,
    options?: { force?: boolean },
  ) => {
    if (session?.completedAt) return
    if (!options?.force && !set.isUserAdded && !exercise.isAdHoc) {
      push({ title: 'Only custom sets can be removed', tone: 'info' })
      return
    }
    removeSetMutation.mutate({ setId: set.id, force: options?.force })
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

  const startedAt = formatDateTime(session.startedAt)

  return (
    <div
      className="grid"
      style={{ gap: '1.5rem' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
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
          <Button
            variant="ghost"
            onClick={() => setAddDialogOpen(true)}
            startIcon={<Plus size={16} />}
            sx={{ height: '44px' }}
            disabled={!canEditSession}
          >
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

        {showProgressionChart && session && (
          <ProgramLoadChart
            currentSessionId={session.id}
            points={progressionQuery.data}
            isLoading={progressionQuery.isLoading}
          />
        )}

      {session.completedAt && (
        <Alert severity="info">
          Session was completed on {formatDateTime(session.completedAt)}. Editing is disabled.
        </Alert>
      )}

      <div className="runner-layout">
        {isMobile ? (
          <div className="mobile-exercise-shell">
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
              <>
                {exerciseChartElement}
                <ExerciseDetailsPanel
                  exercise={activeExercise}
                  isSessionCompleted={Boolean(session.completedAt)}
                  restOptions={restOptions}
                  timerRemainingMs={activeTimerState?.remainingMs ?? 0}
                  onStartTimer={(seconds) => startTimer(activeExercise.id, seconds)}
                  onPauseTimer={() => pauseTimer(activeExercise.id)}
                  onResetTimer={() => resetTimer(activeExercise.id)}
                  onSaveDetails={({ notes }) => handleSaveExerciseDetails(activeExercise.id, notes)}
                  onAddSet={() => handleAddSet(activeExercise.id)}
                  onSaveSet={(setId, body) => updateSetMutation.mutate({ setId, body })}
                  onRemoveSet={(set, options) => handleRemoveSet(set, activeExercise, options)}
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
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>Select an exercise to begin logging.</p>
            )}
          </div>
        ) : (
          <Card>
            {activeExercise ? (
              <>
                {exerciseChartElement}
                <ExerciseDetailsPanel
                  exercise={activeExercise}
                  isSessionCompleted={Boolean(session.completedAt)}
                  restOptions={restOptions}
                  timerRemainingMs={activeTimerState?.remainingMs ?? 0}
                  onStartTimer={(seconds) => startTimer(activeExercise.id, seconds)}
                  onPauseTimer={() => pauseTimer(activeExercise.id)}
                  onResetTimer={() => resetTimer(activeExercise.id)}
                  onSaveDetails={({ notes }) => handleSaveExerciseDetails(activeExercise.id, notes)}
                  onAddSet={() => handleAddSet(activeExercise.id)}
                  onSaveSet={(setId, body) => updateSetMutation.mutate({ setId, body })}
                  onRemoveSet={(set, options) => handleRemoveSet(set, activeExercise, options)}
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
              </>
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
