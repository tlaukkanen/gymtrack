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
import ProgramLoadChart from '../../components/session-runner/ProgramLoadChart'
import ExerciseLoadChart from '../../components/session-runner/ExerciseLoadChart'
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

const arraysEqual = (a: string[], b: string[]) => a.length === b.length && a.every((value, index) => value === b[index])

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
  const [isReorderMode, setIsReorderMode] = useState(false)
  const [pendingOrderIds, setPendingOrderIds] = useState<string[] | null>(null)

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

  const baseOrderedExercises = useMemo(
    () => (session ? [...session.exercises].sort((a, b) => a.orderPerformed - b.orderPerformed) : []),
    [session],
  )

  const orderedExercises = useMemo(() => {
    if (isReorderMode && pendingOrderIds && baseOrderedExercises.length > 0) {
      const lookup = new Map(baseOrderedExercises.map((exercise) => [exercise.id, exercise]))
      return pendingOrderIds
        .map((id) => lookup.get(id))
        .filter((exercise): exercise is WorkoutSessionExerciseDto => Boolean(exercise))
    }
    return baseOrderedExercises
  }, [baseOrderedExercises, isReorderMode, pendingOrderIds])

  const baseOrderedExerciseIds = useMemo(
    () => baseOrderedExercises.map((exercise) => exercise.id),
    [baseOrderedExercises],
  )

  const reorderDirty = Boolean(pendingOrderIds && !arraysEqual(pendingOrderIds, baseOrderedExerciseIds))

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

  const exerciseChartElement = !isReorderMode && showExerciseChart && activeExercise
    ? (
        <ExerciseLoadChart
          currentSessionExerciseId={activeExercise.id}
          points={exerciseProgressionQuery.data}
          isLoading={exerciseProgressionQuery.isLoading}
        />
      )
    : null

  const renderExerciseHeader = (isMobileHeader: boolean) => (
    <div
      className="section-header"
      style={{
        marginBottom: isMobileHeader ? '0.5rem' : '1rem',
        flexDirection: isMobileHeader ? 'column' : 'row',
        alignItems: isMobileHeader ? 'flex-start' : 'center',
        gap: '0.5rem',
      }}
    >
      <div>
        <h3>Exercises</h3>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{session!.exercises.length} movements</span>
      </div>
      {canEditSession && orderedExercises.length > 1 && (
        <div className={isMobileHeader ? 'reorder-actions reorder-actions--mobile' : 'reorder-actions'}>
          {isReorderMode ? (
            <>
              <Button
                variant="ghost"
                onClick={handleCancelReorder}
                disabled={reorderExercisesMutation.isPending}
                fullWidth={isMobileHeader}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveReorder}
                disabled={!reorderDirty || reorderExercisesMutation.isPending}
                fullWidth={isMobileHeader}
              >
                {reorderExercisesMutation.isPending ? 'Saving…' : 'Save order'}
              </Button>
            </>
          ) : (
            <Button onClick={handleEnterReorderMode} variant="ghost" fullWidth={isMobileHeader}>
              Reorder
            </Button>
          )}
        </div>
      )}
    </div>
  )

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

  const reorderExercisesMutation = useMutation({
    mutationFn: (orderedExerciseIds: string[]) =>
      sessionsApi.reorderExercises(sessionId!, {
        orderedExerciseIds,
      }),
    onSuccess: () => {
      invalidateSession()
      setIsReorderMode(false)
      setPendingOrderIds(null)
      push({ title: 'Exercises reordered', tone: 'success' })
    },
    onError: () => push({ title: 'Unable to reorder exercises', tone: 'error' }),
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

  const handleEnterReorderMode = () => {
    if (session?.completedAt || baseOrderedExerciseIds.length < 2) return
    setIsReorderMode(true)
    setPendingOrderIds(baseOrderedExerciseIds)
  }

  const handleCancelReorder = () => {
    setIsReorderMode(false)
    setPendingOrderIds(null)
  }

  const handleReorderChange = (orderedIds: string[]) => {
    if (!isReorderMode) return
    setPendingOrderIds(orderedIds)
  }

  const handleSaveReorder = () => {
    if (!sessionId || !pendingOrderIds || !reorderDirty) return
    reorderExercisesMutation.mutate(pendingOrderIds)
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
          <Button
            variant="ghost"
            onClick={() => setAddDialogOpen(true)}
            startIcon={<Plus size={16} />}
            sx={{ height: '44px' }}
            disabled={!canEditSession || isReorderMode}
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
          Session was completed on {new Date(session.completedAt).toLocaleString()}. Editing is disabled.
        </Alert>
      )}

      <div className="runner-layout">
        {isMobile ? (
          <div className="mobile-exercise-shell">
            {renderExerciseHeader(true)}
            {isReorderMode && (
              <Alert severity="info" sx={{ mb: 1 }}>
                Use the arrow buttons to reorder exercises, then tap Save order to persist the sequence.
              </Alert>
            )}
            <ExerciseList
              exercises={orderedExercises}
              activeExerciseId={isReorderMode ? null : activeExercise?.id ?? null}
              onSelect={setActiveExerciseId}
              completedExerciseIds={completedExerciseIds}
              isMobileView
              reorderMode={isReorderMode}
              onReorder={handleReorderChange}
            />
          </div>
        ) : (
          <Card className="exercise-list-card">
            {renderExerciseHeader(false)}
            {isReorderMode && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Drag exercises vertically to reorder them, then select Save order to persist.
              </Alert>
            )}
            <ExerciseList
              exercises={orderedExercises}
              activeExerciseId={isReorderMode ? null : activeExercise?.id ?? null}
              onSelect={setActiveExerciseId}
              completedExerciseIds={completedExerciseIds}
              reorderMode={isReorderMode}
              onReorder={handleReorderChange}
            />
          </Card>
        )}

        {isMobile ? (
          <div>
            {isReorderMode ? (
              <Alert severity="info">Exit reorder mode to view exercise details and log sets.</Alert>
            ) : activeExercise ? (
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
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>Select an exercise to begin logging.</p>
            )}
          </div>
        ) : (
          <Card>
            {isReorderMode ? (
              <Alert severity="info">Exit reorder mode to view exercise details and log sets.</Alert>
            ) : activeExercise ? (
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
