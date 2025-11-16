import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { ArrowDown, ArrowUp, Pause, Play, Plus, RefreshCcw, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useToast } from '../../components/feedback/ToastProvider'
import { exerciseApi, sessionsApi } from '../../api/requests'
import type {
  AddSessionExerciseRequest,
  WorkoutSessionExerciseDto,
  WorkoutSessionSetDto,
} from '../../types/api'
import { restOptions } from '../../utils/time'
import { useRestTimers } from '../../hooks/useRestTimers'

const formatTimer = (remainingMs: number) => {
  if (remainingMs <= 0) return '00:00'
  const totalSeconds = Math.ceil(remainingMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

interface SetLogRowProps {
  set: WorkoutSessionSetDto
  onSave: (payload: { actualWeight?: number | null; actualReps?: number | null; actualDurationSeconds?: number | null }) => void
  isSaving: boolean
  canRemove: boolean
  onRemove?: () => void
  disabled?: boolean
}

const resolveInitialValue = (actual?: number | null, planned?: number | null) => {
  if (actual !== undefined && actual !== null) return actual.toString()
  if (planned !== undefined && planned !== null) return planned.toString()
  return ''
}

const SetLogRow = ({ set, onSave, isSaving, canRemove, onRemove, disabled }: SetLogRowProps) => {
  const [weight, setWeight] = useState<string>(resolveInitialValue(set.actualWeight, set.plannedWeight))
  const [reps, setReps] = useState<string>(resolveInitialValue(set.actualReps, set.plannedReps))
  const [duration, setDuration] = useState<string>(resolveInitialValue(set.actualDurationSeconds, set.plannedDurationSeconds))

  useEffect(() => {
    setWeight(resolveInitialValue(set.actualWeight, set.plannedWeight))
    setReps(resolveInitialValue(set.actualReps, set.plannedReps))
    setDuration(resolveInitialValue(set.actualDurationSeconds, set.plannedDurationSeconds))
  }, [set.id, set.actualDurationSeconds, set.actualReps, set.actualWeight, set.plannedDurationSeconds, set.plannedReps, set.plannedWeight])

  const handleSave = () => {
    onSave({
      actualWeight: weight === '' ? null : Number(weight),
      actualReps: reps === '' ? null : Number(reps),
      actualDurationSeconds: duration === '' ? null : Number(duration),
    })
  }

  return (
    <div className="set-row">
      <div>
        <small style={{ color: 'var(--text-muted)' }}>Set #{set.setIndex}</small>
        <div style={{ fontSize: '0.85rem' }}>
          {set.plannedReps ? `${set.plannedReps} reps` : '—'} • {set.plannedWeight ? `${set.plannedWeight} kg` : '—'} •{' '}
          {set.plannedDurationSeconds ? `${set.plannedDurationSeconds}s` : '—'}
        </div>
      </div>
      <TextField
        size="small"
        label="Weight"
        value={weight}
        onChange={(event) => setWeight(event.target.value)}
        inputProps={{ inputMode: 'decimal', pattern: '[0-9]*' }}
        disabled={disabled}
      />
      <TextField
        size="small"
        label="Reps"
        value={reps}
        onChange={(event) => setReps(event.target.value)}
        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
        disabled={disabled}
      />
      <TextField
        size="small"
        label="Seconds"
        value={duration}
        onChange={(event) => setDuration(event.target.value)}
        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
      />
      <Button onClick={handleSave} disabled={isSaving || disabled} sx={{ height: '40px' }}>
        {isSaving ? 'Saving…' : 'Save'}
      </Button>
      <IconButton onClick={onRemove} disabled={!canRemove || !onRemove || disabled} color="error">
        <Trash2 size={18} />
      </IconButton>
    </div>
  )
}

const SessionRunnerPage = () => {
  const { sessionId } = useParams()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const queryClient = useQueryClient()
  const { push } = useToast()
  const { getTimerState, startTimer, pauseTimer, resetTimer } = useRestTimers()

  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null)
  const [detailsRestSeconds, setDetailsRestSeconds] = useState<number>(60)
  const [detailsNotes, setDetailsNotes] = useState<string>('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addTab, setAddTab] = useState<'catalog' | 'custom'>('catalog')
  const [catalogSearch, setCatalogSearch] = useState('')
  const [catalogExerciseId, setCatalogExerciseId] = useState<string>('')
  const [catalogNotes, setCatalogNotes] = useState('')
  const [catalogRestSeconds, setCatalogRestSeconds] = useState(90)
  const [catalogSetCount, setCatalogSetCount] = useState(3)
  const [customName, setCustomName] = useState('')
  const [customCategory, setCustomCategory] = useState<'Strength' | 'Cardio'>('Strength')
  const [customRestSeconds, setCustomRestSeconds] = useState(90)
  const [customSetCount, setCustomSetCount] = useState(3)
  const [customNotes, setCustomNotes] = useState('')

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

  useEffect(() => {
    if (!activeExercise) return
    setDetailsRestSeconds(activeExercise.restSeconds)
    setDetailsNotes(activeExercise.notes ?? '')
  }, [activeExercise?.id])

  const resetFormState = () => {
    setCatalogExerciseId('')
    setCatalogNotes('')
    setCatalogRestSeconds(90)
    setCatalogSetCount(3)
    setCustomName('')
    setCustomNotes('')
    setCustomRestSeconds(90)
    setCustomSetCount(3)
  }

  const closeAddDialog = () => {
    setAddDialogOpen(false)
    resetFormState()
  }

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
      resetFormState()
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

  const handleSaveExerciseDetails = () => {
    if (!activeExercise) return
    updateExerciseMutation.mutate({
      sessionExerciseId: activeExercise.id,
      restSeconds: clampRestSeconds(detailsRestSeconds),
      notes: detailsNotes,
    })
  }

  const handleAddSet = () => {
    if (!activeExercise || session?.completedAt) return
    addSetMutation.mutate(activeExercise.id)
  }

  const handleRemoveSet = (set: WorkoutSessionSetDto, exercise: WorkoutSessionExerciseDto) => {
    if (session?.completedAt) return
    if (!set.isUserAdded && !exercise.isAdHoc) {
      push({ title: 'Only custom sets can be removed', tone: 'info' })
      return
    }
    removeSetMutation.mutate(set.id)
  }

  const filteredExercises = useMemo(() => {
    if (!exercisesQuery.data) return []
    if (!catalogSearch) return exercisesQuery.data
    return exercisesQuery.data.filter((exercise) => exercise.name.toLowerCase().includes(catalogSearch.toLowerCase()))
  }, [catalogSearch, exercisesQuery.data])

  const catalogSelection = useMemo(() => {
    if (!catalogExerciseId || !exercisesQuery.data) return undefined
    return exercisesQuery.data.find((exercise) => exercise.id === catalogExerciseId)
  }, [catalogExerciseId, exercisesQuery.data])

  useEffect(() => {
    if (!catalogSelection) return
    setCatalogRestSeconds(catalogSelection.defaultRestSeconds)
  }, [catalogSelection?.id])

  const clampSetCount = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) return 1
    return Math.min(10, Math.max(1, Math.round(value)))
  }

  const clampRestSeconds = (value: number) => {
    if (!Number.isFinite(value) || value < 0) return 0
    return Math.min(600, Math.max(0, Math.round(value)))
  }

  const createSetTemplate = (isCardio: boolean) => ({
    plannedWeight: isCardio ? null : 0,
    plannedReps: isCardio ? null : 8,
    plannedDurationSeconds: isCardio ? 60 : null,
  })

  const handleAddExercise = () => {
    if (!session) return
    if (addTab === 'catalog') {
      if (!catalogSelection) {
        push({ title: 'Select an exercise', tone: 'info' })
        return
      }
      const isCardio = catalogSelection.category === 'Cardio' || catalogSelection.category === 1
      const sets = Array.from({ length: clampSetCount(catalogSetCount) }, () => createSetTemplate(isCardio))
      const payload: AddSessionExerciseRequest = {
        exerciseId: catalogSelection.id,
        restSeconds: clampRestSeconds(catalogRestSeconds),
        notes: catalogNotes,
        sets,
      }
      addExerciseMutation.mutate(payload)
      return
    }

    if (!customName.trim()) {
      push({ title: 'Provide a custom name', tone: 'info' })
      return
    }

    const isCardio = customCategory === 'Cardio'
    const sets = Array.from({ length: clampSetCount(customSetCount) }, () => createSetTemplate(isCardio))
    const payload: AddSessionExerciseRequest = {
      customExerciseName: customName.trim(),
      customCategory,
      restSeconds: clampRestSeconds(customRestSeconds),
      notes: customNotes,
      sets,
    }
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
          <div className="exercise-list">
            {session.exercises
              .slice()
              .sort((a, b) => a.orderPerformed - b.orderPerformed)
              .map((exercise, index) => {
                const isActive = exercise.id === activeExercise?.id
                return (
                  <div key={exercise.id} className={isActive ? 'exercise-list-item active' : 'exercise-list-item'}>
                    <button type="button" onClick={() => setActiveExerciseId(exercise.id)}>
                      <strong>{exercise.exerciseName}</strong>
                      {exercise.isAdHoc && <span className="badge" style={{ marginLeft: '0.5rem' }}>Custom</span>}
                      <p>{exercise.sets.length} sets • Rest {exercise.restSeconds}s</p>
                    </button>
                    {!session.completedAt && (
                      <div className="reorder-actions">
                        <IconButton size="small" onClick={() => handleReorder(exercise.id, -1)} disabled={index === 0 || reorderMutation.isPending}>
                          <ArrowUp size={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleReorder(exercise.id, 1)}
                          disabled={index === session.exercises.length - 1 || reorderMutation.isPending}
                        >
                          <ArrowDown size={18} />
                        </IconButton>
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </Card>

        <Card>
          {activeExercise ? (
            <Stack spacing={3}>
              <div className="section-header">
                <div>
                  <h3 style={{ marginBottom: '0.25rem' }}>{activeExercise.exerciseName}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                    {activeExercise.sets.length} sets • default rest {activeExercise.restSeconds}s
                  </p>
                </div>
                {activeExercise.isAdHoc && !session.completedAt && (
                  <Button variant="danger" onClick={() => handleRemoveExercise(activeExercise)} disabled={removeExerciseMutation.isPending}>
                    Remove
                  </Button>
                )}
              </div>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Rest timer
                </Typography>
                <div className="field-row" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                  <div className="timer-display">{formatTimer(getTimerState(activeExercise.id).remainingMs)}</div>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconButton
                      color="primary"
                      onClick={() => startTimer(activeExercise.id, activeExercise.restSeconds)}
                      disabled={Boolean(session.completedAt)}
                    >
                      <Play size={18} />
                    </IconButton>
                    <IconButton color="warning" onClick={() => pauseTimer(activeExercise.id)} disabled={Boolean(session.completedAt)}>
                      <Pause size={18} />
                    </IconButton>
                    <IconButton color="secondary" onClick={() => resetTimer(activeExercise.id)} disabled={Boolean(session.completedAt)}>
                      <RefreshCcw size={18} />
                    </IconButton>
                  </Stack>
                </div>
                <Stack direction="row" spacing={1} flexWrap="wrap" marginTop={1}>
                  {restOptions.map((value) => (
                    <Chip
                      key={value}
                      label={value === 0 ? 'No rest' : `${value}s`}
                      clickable
                      onClick={() => startTimer(activeExercise.id, value)}
                      disabled={Boolean(session.completedAt)}
                    />
                  ))}
                </Stack>
              </Box>

              <Divider />

              <Stack spacing={2}>
                <Typography variant="subtitle2">Details</Typography>
                <div className="field-row">
                  <TextField
                    label="Rest seconds"
                    type="number"
                    value={detailsRestSeconds}
                    onChange={(event) => setDetailsRestSeconds(Number(event.target.value))}
                    inputProps={{ min: 0, max: 600 }}
                    disabled={Boolean(session.completedAt)}
                  />
                  <TextField
                    label="Notes"
                    multiline
                    minRows={2}
                    fullWidth
                    value={detailsNotes}
                    onChange={(event) => setDetailsNotes(event.target.value)}
                    disabled={Boolean(session.completedAt)}
                  />
                  <Button onClick={handleSaveExerciseDetails} disabled={Boolean(session.completedAt) || updateExerciseMutation.isPending}>
                    {updateExerciseMutation.isPending ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              </Stack>

              <Divider />

              <Stack spacing={1} direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Sets</Typography>
                {!session.completedAt && (
                  <Button onClick={handleAddSet} startIcon={<Plus size={16} />} disabled={addSetMutation.isPending}>
                    Add Set
                  </Button>
                )}
              </Stack>

              <Stack spacing={1.5}>
                {activeExercise.sets.map((set) => (
                  <SetLogRow
                    key={set.id}
                    set={set}
                    canRemove={!session.completedAt && (set.isUserAdded || activeExercise.isAdHoc)}
                    onSave={(body) => updateSetMutation.mutate({ setId: set.id, body })}
                    isSaving={updateSetMutation.isPending}
                    onRemove={!session.completedAt ? () => handleRemoveSet(set, activeExercise) : undefined}
                    disabled={Boolean(session.completedAt)}
                  />
                ))}
              </Stack>
            </Stack>
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

      <Dialog open={addDialogOpen} onClose={closeAddDialog} fullWidth maxWidth="md">
        <DialogTitle>Add exercise to session</DialogTitle>
        <DialogContent dividers>
          <Tabs value={addTab} onChange={(_, value) => setAddTab(value)} sx={{ mb: 2 }}>
            <Tab label="Catalog" value="catalog" />
            <Tab label="Custom" value="custom" />
          </Tabs>

          {addTab === 'catalog' ? (
            <Stack spacing={2}>
              <TextField
                label="Search"
                value={catalogSearch}
                onChange={(event) => setCatalogSearch(event.target.value)}
                placeholder="Search exercises"
              />
              <TextField
                select
                label="Exercise"
                value={catalogExerciseId}
                onChange={(event) => setCatalogExerciseId(event.target.value)}
                SelectProps={{ native: true }}
              >
                <option value="">Select from catalog</option>
                {filteredExercises.map((exercise) => (
                  <option key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </option>
                ))}
              </TextField>
              <div className="field-row">
                <TextField
                  label="Rest seconds"
                  type="number"
                  value={catalogRestSeconds}
                  onChange={(event) => setCatalogRestSeconds(Number(event.target.value))}
                  inputProps={{ min: 0, max: 600 }}
                />
                <TextField
                  label="Initial sets"
                  type="number"
                  value={catalogSetCount}
                  onChange={(event) => setCatalogSetCount(Number(event.target.value))}
                  inputProps={{ min: 1, max: 10 }}
                />
              </div>
              <TextField label="Notes" multiline minRows={2} value={catalogNotes} onChange={(event) => setCatalogNotes(event.target.value)} />
            </Stack>
          ) : (
            <Stack spacing={2}>
              <TextField label="Exercise name" value={customName} onChange={(event) => setCustomName(event.target.value)} />
              <TextField
                select
                label="Category"
                value={customCategory}
                onChange={(event) => setCustomCategory(event.target.value as 'Strength' | 'Cardio')}
                SelectProps={{ native: true }}
              >
                <option value="Strength">Strength</option>
                <option value="Cardio">Cardio</option>
              </TextField>
              <div className="field-row">
                <TextField
                  label="Rest seconds"
                  type="number"
                  value={customRestSeconds}
                  onChange={(event) => setCustomRestSeconds(Number(event.target.value))}
                  inputProps={{ min: 0, max: 600 }}
                />
                <TextField
                  label="Initial sets"
                  type="number"
                  value={customSetCount}
                  onChange={(event) => setCustomSetCount(Number(event.target.value))}
                  inputProps={{ min: 1, max: 10 }}
                />
              </div>
              <TextField label="Notes" multiline minRows={2} value={customNotes} onChange={(event) => setCustomNotes(event.target.value)} />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="ghost" onClick={closeAddDialog}>
            Cancel
          </Button>
          <Button onClick={handleAddExercise} disabled={addExerciseMutation.isPending}>
            {addExerciseMutation.isPending ? 'Adding…' : 'Add Exercise'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default SessionRunnerPage
