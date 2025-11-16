import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { exerciseApi, programsApi } from '../../api/requests'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import type { ExerciseDto, ExerciseMuscleEngagementDto, WorkoutProgramDetailDto } from '../../types/api'
import { useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../../components/feedback/ToastProvider'
import { restOptions } from '../../utils/time'

interface FormValues {
  name: string
  description?: string
}

interface BuilderSet {
  key: string
  sourceId?: string | null
  targetWeight?: number | ''
  targetReps?: number | ''
  targetDurationSeconds?: number | ''
  isWarmup: boolean
}

interface BuilderExercise {
  key: string
  sourceId?: string | null
  exerciseId: string
  exerciseName: string
  category: ExerciseDto['category']
  restSeconds: number
  notes?: string
  sets: BuilderSet[]
}

const createSet = (category: ExerciseDto['category']): BuilderSet => ({
  key: crypto.randomUUID(),
  targetWeight: category === 'Strength' ? 0 : '',
  targetReps: category === 'Strength' ? 8 : '',
  targetDurationSeconds: category === 'Cardio' ? 60 : '',
  isWarmup: false,
})

const resolveEngagementLabel = (level: ExerciseMuscleEngagementDto['level']): 'No' | 'Some' | 'Yes' => {
  if (typeof level === 'string') {
    if (level === 'No' || level === 'Some' || level === 'Yes') {
      return level
    }
    return 'No'
  }

  switch (level) {
    case 1:
      return 'Some'
    case 2:
      return 'Yes'
    default:
      return 'No'
  }
}

const ProgramBuilderPage = () => {
  const navigate = useNavigate()
  const { programId } = useParams()
  const isEditing = Boolean(programId && programId !== 'new')
  const queryClient = useQueryClient()
  const { push } = useToast()
  const [builderExercises, setBuilderExercises] = useState<BuilderExercise[]>([])
  const [search, setSearch] = useState('')

  const { register, handleSubmit, setValue } = useForm<FormValues>({ defaultValues: { name: '', description: '' } })
  const [initialized, setInitialized] = useState(false)

  const exercisesQuery = useQuery({ queryKey: ['exercises'], queryFn: exerciseApi.list })
  const programQuery = useQuery({
    queryKey: ['programs', programId],
    queryFn: () => programsApi.detail(programId!),
    enabled: isEditing,
  })

  useEffect(() => {
    if (!isEditing) {
      setBuilderExercises([])
      setValue('name', '')
      setValue('description', '')
      setInitialized(false)
      return
    }

    if (initialized) return
    if (programQuery.data && exercisesQuery.data) {
      hydrateForm(programQuery.data, exercisesQuery.data)
      setInitialized(true)
    }
  }, [isEditing, initialized, programQuery.data, exercisesQuery.data, setValue])

  const hydrateForm = (program: WorkoutProgramDetailDto, exerciseCatalog: ExerciseDto[]) => {
    setValue('name', program.name)
    setValue('description', program.description ?? '')
    const mapped: BuilderExercise[] = program.exercises.map((exercise) => {
      const sourceExercise = exerciseCatalog.find((x) => x.id === exercise.exerciseId)
      return {
        key: crypto.randomUUID(),
        sourceId: exercise.id ?? undefined,
        exerciseId: exercise.exerciseId,
        exerciseName: sourceExercise?.name ?? 'Exercise',
        category: sourceExercise?.category ?? 'Strength',
        restSeconds: exercise.restSeconds,
        notes: exercise.notes ?? '',
        sets: exercise.sets.map((set) => ({
          key: crypto.randomUUID(),
          sourceId: set.id ?? undefined,
          targetWeight: set.targetWeight ?? '',
          targetReps: set.targetReps ?? '',
          targetDurationSeconds: set.targetDurationSeconds ?? '',
          isWarmup: set.isWarmup,
        })),
      }
    })
    setBuilderExercises(mapped)
  }

  const addExercise = (exercise: ExerciseDto) => {
    const entity: BuilderExercise = {
      key: crypto.randomUUID(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      category: exercise.category,
      restSeconds: exercise.defaultRestSeconds,
      notes: '',
      sets: [createSet(exercise.category)],
    }
    setBuilderExercises((prev) => [...prev, entity])
  }

  const updateExercise = (key: string, updater: (exercise: BuilderExercise) => BuilderExercise) => {
    setBuilderExercises((prev) => prev.map((exercise) => (exercise.key === key ? updater(exercise) : exercise)))
  }

  const removeExercise = (key: string) => {
    setBuilderExercises((prev) => prev.filter((exercise) => exercise.key !== key))
  }

  const moveExercise = (index: number, direction: -1 | 1) => {
    setBuilderExercises((prev) => {
      const copy = [...prev]
      const targetIndex = index + direction
      if (targetIndex < 0 || targetIndex >= copy.length) return prev
      const [item] = copy.splice(index, 1)
      copy.splice(targetIndex, 0, item)
      return copy
    })
  }

  const addSet = (exerciseKey: string) => {
    const exercise = builderExercises.find((x) => x.key === exerciseKey)
    if (!exercise) return
    updateExercise(exerciseKey, (entity) => ({ ...entity, sets: [...entity.sets, createSet(entity.category)] }))
  }

  const updateSet = (exerciseKey: string, setKey: string, updater: (set: BuilderSet) => BuilderSet) => {
    updateExercise(exerciseKey, (exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => (set.key === setKey ? updater(set) : set)),
    }))
  }

  const removeSet = (exerciseKey: string, setKey: string) => {
    updateExercise(exerciseKey, (exercise) => ({
      ...exercise,
      sets: exercise.sets.filter((set) => set.key !== setKey),
    }))
  }

  const mutation = useMutation({
    mutationFn: (payload: FormValues) => {
      const request = {
        name: payload.name,
        description: payload.description,
        exercises: builderExercises.map((exercise, index) => ({
          id: exercise.sourceId ?? null,
          exerciseId: exercise.exerciseId,
          displayOrder: index + 1,
          restSeconds: exercise.restSeconds,
          notes: exercise.notes,
          sets: exercise.sets.map((set, setIndex) => ({
            id: set.sourceId ?? null,
            sequence: setIndex + 1,
            targetWeight: set.targetWeight === '' ? null : Number(set.targetWeight),
            targetReps: set.targetReps === '' ? null : Number(set.targetReps),
            targetDurationSeconds: set.targetDurationSeconds === '' ? null : Number(set.targetDurationSeconds),
            isWarmup: set.isWarmup,
          })),
        })),
      }
      if (isEditing) {
        return programsApi.update(programId!, request)
      }
      return programsApi.create(request)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] })
      push({ title: isEditing ? 'Program updated' : 'Program created', tone: 'success' })
      navigate('/app/dashboard')
    },
    onError: () => push({ title: 'Unable to save program', tone: 'error' }),
  })

  const onSubmit = (values: FormValues) => {
    if (builderExercises.length === 0) {
      push({ title: 'Add at least one exercise', tone: 'error' })
      return
    }
    mutation.mutate(values)
  }

  const filteredCatalog = useMemo(() => {
    if (!exercisesQuery.data) return []
    if (!search) return exercisesQuery.data
    const normalized = search.toLowerCase()
    return exercisesQuery.data.filter((exercise) => {
      return (
        exercise.name.toLowerCase().includes(normalized) ||
        exercise.primaryMuscle.toLowerCase().includes(normalized) ||
        exercise.secondaryMuscle?.toLowerCase().includes(normalized)
      )
    })
  }, [exercisesQuery.data, search])

  return (
    <div className="grid" style={{ gap: '1.5rem' }}>
      <div className="section-header">
        <div>
          <h2>{isEditing ? 'Edit workout program' : 'Create a workout program'}</h2>
          <p style={{ color: 'var(--text-muted)' }}>Define exercises, rest intervals, and targets.</p>
        </div>
        <div className="field-row">
          <Button variant="secondary" onClick={() => navigate('/app/dashboard')}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save program'}
          </Button>
        </div>
      </div>

      <Card>
        <div className="field-row">
          <label className="field-group" style={{ flex: 1 }}>
            <span>Name</span>
            <input placeholder="Upper Body Power" {...register('name', { required: true })} />
          </label>
          <label className="field-group" style={{ flex: 1 }}>
            <span>Description</span>
            <input placeholder="Focus on pull/chest strength" {...register('description')} />
          </label>
        </div>
      </Card>

      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <Card>
          <div className="section-header">
            <h3>Program exercises</h3>
            <span>{builderExercises.length} selected</span>
          </div>
          {builderExercises.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Add an exercise from the catalog to begin.</p>}
          <div className="grid" style={{ gap: '1rem', marginTop: '1rem' }}>
            {builderExercises.map((exercise, index) => (
              <div key={exercise.key} className="card card-muted">
                <div className="section-header">
                  <div>
                    <h4>{exercise.exerciseName}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{exercise.category}</p>
                  </div>
                  <div className="field-row" style={{ justifyContent: 'flex-end' }}>
                    <Button variant="secondary" onClick={() => moveExercise(index, -1)} disabled={index === 0}>
                      ↑
                    </Button>
                    <Button variant="secondary" onClick={() => moveExercise(index, 1)} disabled={index === builderExercises.length - 1}>
                      ↓
                    </Button>
                    <Button variant="danger" onClick={() => removeExercise(exercise.key)}>
                      Remove
                    </Button>
                  </div>
                </div>
                <div className="field-row" style={{ marginTop: '1rem' }}>
                  <label className="field-group" style={{ flex: 1 }}>
                    <span>Rest seconds</span>
                    <select
                      value={exercise.restSeconds}
                      onChange={(event) =>
                        updateExercise(exercise.key, (entity) => ({ ...entity, restSeconds: Number(event.target.value) }))
                      }
                    >
                      {restOptions.map((option) => (
                        <option key={option} value={option}>
                          {option === 0 ? 'Off' : `${option}s`}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field-group" style={{ flex: 2 }}>
                    <span>Notes</span>
                    <input
                      value={exercise.notes ?? ''}
                      onChange={(event) =>
                        updateExercise(exercise.key, (entity) => ({ ...entity, notes: event.target.value }))
                      }
                      placeholder="Tempo cues, reminders, etc."
                    />
                  </label>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <div className="section-header" style={{ marginBottom: '0.5rem' }}>
                    <h5>Sets</h5>
                    <Button variant="secondary" onClick={() => addSet(exercise.key)}>
                      Add set
                    </Button>
                  </div>
                  <div className="grid" style={{ gap: '0.75rem' }}>
                    {exercise.sets.map((set) => (
                      <div key={set.key} className="set-row">
                        {exercise.category === 'Strength' && (
                          <>
                            <label className="field-group">
                              <span>Weight</span>
                              <input
                                type="number"
                                value={set.targetWeight ?? ''}
                                onChange={(event) =>
                                  updateSet(exercise.key, set.key, (entity) => ({
                                    ...entity,
                                    targetWeight: event.target.value === '' ? '' : Number(event.target.value),
                                  }))
                                }
                                placeholder="kg"
                              />
                            </label>
                            <label className="field-group">
                              <span>Reps</span>
                              <input
                                type="number"
                                value={set.targetReps ?? ''}
                                onChange={(event) =>
                                  updateSet(exercise.key, set.key, (entity) => ({
                                    ...entity,
                                    targetReps: event.target.value === '' ? '' : Number(event.target.value),
                                  }))
                                }
                              />
                            </label>
                          </>
                        )}
                        {exercise.category === 'Cardio' && (
                          <label className="field-group">
                            <span>Duration (sec)</span>
                            <input
                              type="number"
                              value={set.targetDurationSeconds ?? ''}
                              onChange={(event) =>
                                updateSet(exercise.key, set.key, (entity) => ({
                                  ...entity,
                                  targetDurationSeconds: event.target.value === '' ? '' : Number(event.target.value),
                                }))
                              }
                            />
                          </label>
                        )}
                        <label className="field-group">
                          <span>Warmup?</span>
                          <select
                            value={set.isWarmup ? 'yes' : 'no'}
                            onChange={(event) =>
                              updateSet(exercise.key, set.key, (entity) => ({
                                ...entity,
                                isWarmup: event.target.value === 'yes',
                              }))
                            }
                          >
                            <option value="no">No</option>
                            <option value="yes">Yes</option>
                          </select>
                        </label>
                        <Button variant="danger" onClick={() => removeSet(exercise.key, set.key)}>
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="section-header">
            <h3>Exercise catalog</h3>
            <span>{exercisesQuery.data?.length ?? 0} total</span>
          </div>
          <input
            placeholder="Search by name or muscle"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ marginTop: '1rem', width: '100%' }}
          />
          <div className="grid" style={{ marginTop: '1rem', gap: '0.75rem', maxHeight: '65vh', overflowY: 'auto' }}>
            {filteredCatalog.map((exercise) => (
              <div key={exercise.id} className="card card-muted" style={{ padding: '0.9rem' }}>
                <div className="section-header">
                  <div>
                    <strong>{exercise.name}</strong>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{exercise.primaryMuscle}</p>
                  </div>
                  <Button variant="secondary" onClick={() => addExercise(exercise)}>
                    Add
                  </Button>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  {exercise.muscleEngagements.map((engagement) => {
                    const levelLabel = resolveEngagementLabel(engagement.level)
                    return (
                      <span
                        key={engagement.muscleGroup}
                        className={`badge badge-${levelLabel.toLowerCase()}`}
                        title={`${engagement.muscleGroup}: ${levelLabel}`}
                      >
                        {engagement.muscleGroup}
                      </span>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default ProgramBuilderPage
