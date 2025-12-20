import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { exerciseApi, programsApi } from '../../api/requests'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import ProgramExercisesPanel from '../../components/program-builder/ProgramExercisesPanel'
import ExerciseCatalogPanel from '../../components/program-builder/ExerciseCatalogPanel'
import { ExerciseMuscleMapDialog } from '../../components/program-builder/ExerciseMuscleMapDialog'
import { useToast } from '../../components/feedback/ToastProvider'
import { restOptions } from '../../utils/time'
import type { ExerciseDto, WorkoutProgramDetailDto } from '../../types/api'
import type { BuilderExercise, BuilderSet, NormalizedCategory } from '../../components/program-builder/types'

interface FormValues {
  name: string
  description?: string
}

const normalizeCategory = (category?: ExerciseDto['category']): NormalizedCategory => {
  if (category === 'Cardio' || category === 1) return 'Cardio'
  return 'Strength'
}

const DEFAULT_EXERCISE_REST_SECONDS = 90

const createSet = (category: NormalizedCategory): BuilderSet => ({
  key: crypto.randomUUID(),
  targetWeight: category === 'Strength' ? 0 : '',
  targetReps: category === 'Strength' ? 8 : '',
  targetDurationSeconds: category === 'Cardio' ? 60 : '',
  restSeconds: category === 'Strength' ? 90 : '',
})

const cloneFromPreviousSet = (category: NormalizedCategory, previous?: BuilderSet): BuilderSet => {
  if (!previous) return createSet(category)
  return {
    key: crypto.randomUUID(),
    targetWeight: previous.targetWeight,
    targetReps: previous.targetReps,
    targetDurationSeconds: previous.targetDurationSeconds,
    restSeconds: previous.restSeconds,
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
  const [selectedCategory, setSelectedCategory] = useState<NormalizedCategory | 'All'>('All')
  const [selectedPrimaryMuscle, setSelectedPrimaryMuscle] = useState<string | 'All'>('All')
  const [selectedExerciseForMap, setSelectedExerciseForMap] = useState<ExerciseDto | null>(null)

  const { register, handleSubmit, setValue } = useForm<FormValues>({ defaultValues: { name: '', description: '' } })
  const [initialized, setInitialized] = useState(false)

  const exercisesQuery = useQuery({ queryKey: ['exercises'], queryFn: exerciseApi.list })
  const programQuery = useQuery({
    queryKey: ['programs', programId],
    queryFn: () => programsApi.detail(programId!),
    enabled: isEditing,
  })

  const hydrateForm = useCallback(
    (program: WorkoutProgramDetailDto, exerciseCatalog: ExerciseDto[]) => {
      setValue('name', program.name)
      setValue('description', program.description ?? '')
      const mapped: BuilderExercise[] = program.exercises.map((exercise) => {
        const sourceExercise = exerciseCatalog.find((x) => x.id === exercise.exerciseId)
        const category = normalizeCategory(sourceExercise?.category)
        const primaryMuscle = sourceExercise?.primaryMuscle ?? 'Other'
        return {
          key: crypto.randomUUID(),
          sourceId: exercise.id ?? undefined,
          exerciseId: exercise.exerciseId,
          exerciseName: sourceExercise?.name ?? 'Exercise',
          primaryMuscle,
          secondaryMuscle: sourceExercise?.secondaryMuscle ?? null,
          category,
          restSeconds: exercise.restSeconds,
          notes: exercise.notes ?? '',
          sets: exercise.sets.map((set) => ({
            key: crypto.randomUUID(),
            sourceId: set.id ?? undefined,
            targetWeight: set.targetWeight ?? '',
            targetReps: set.targetReps ?? '',
            targetDurationSeconds: set.targetDurationSeconds ?? '',
            restSeconds: set.restSeconds ?? '',
          })),
        }
      })
      setBuilderExercises(mapped)
    },
    [setBuilderExercises, setValue]
  )

  const resetBuilderState = useCallback(() => {
    setBuilderExercises([])
    setValue('name', '')
    setValue('description', '')
    setInitialized(false)
  }, [setBuilderExercises, setInitialized, setValue])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isEditing) {
      resetBuilderState()
      return
    }

    if (initialized) return
    if (programQuery.data && exercisesQuery.data) {
      hydrateForm(programQuery.data, exercisesQuery.data)
      setInitialized(true)
    }
  }, [isEditing, initialized, programQuery.data, exercisesQuery.data, hydrateForm, resetBuilderState])
  /* eslint-enable react-hooks/set-state-in-effect */

  const addExercise = (exercise: ExerciseDto) => {
    const category = normalizeCategory(exercise.category)
    const entity: BuilderExercise = {
      key: crypto.randomUUID(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      primaryMuscle: exercise.primaryMuscle,
      secondaryMuscle: exercise.secondaryMuscle ?? null,
      category,
      restSeconds: DEFAULT_EXERCISE_REST_SECONDS,
      notes: '',
      sets: [createSet(category)],
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
    const previous = exercise.sets[exercise.sets.length - 1]
    const nextSet = cloneFromPreviousSet(exercise.category, previous)
    updateExercise(exerciseKey, (entity) => ({ ...entity, sets: [...entity.sets, nextSet] }))
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
            restSeconds: set.restSeconds === '' || set.restSeconds === undefined ? null : Number(set.restSeconds),
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
    const normalizedSearch = search.toLowerCase()
    return exercisesQuery.data.filter((exercise) => {
      const matchesSearch =
        !normalizedSearch ||
        exercise.name.toLowerCase().includes(normalizedSearch) ||
        exercise.primaryMuscle.toLowerCase().includes(normalizedSearch) ||
        exercise.secondaryMuscle?.toLowerCase().includes(normalizedSearch)

      const normalizedCategory = normalizeCategory(exercise.category)
      const matchesCategory = selectedCategory === 'All' || normalizedCategory === selectedCategory

      const matchesPrimaryMuscle =
        selectedPrimaryMuscle === 'All' || exercise.primaryMuscle.toLowerCase() === selectedPrimaryMuscle.toLowerCase()

      return matchesSearch && matchesCategory && matchesPrimaryMuscle
    })
  }, [exercisesQuery.data, search, selectedCategory, selectedPrimaryMuscle])

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2>{isEditing ? 'Edit workout program' : 'Create a workout program'}</h2>
          <p className="text-[var(--text-muted)]">Define exercises, rest intervals, and targets.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button variant="secondary" onClick={() => navigate('/app/dashboard')}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save program'}
          </Button>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap gap-4">
          <label className="flex flex-1 flex-col gap-2">
            <span>Name</span>
            <input placeholder="Upper Body Power" {...register('name', { required: true })} />
          </label>
          <label className="flex flex-1 flex-col gap-2">
            <span>Description</span>
            <input placeholder="Focus on pull/chest strength" {...register('description')} />
          </label>
        </div>
      </Card>

      <div className="flex flex-col gap-6">
        <ProgramExercisesPanel
          exercises={builderExercises}
          restOptions={restOptions}
          onMoveExercise={moveExercise}
          onRemoveExercise={removeExercise}
          onUpdateExercise={updateExercise}
          onAddSet={addSet}
          onUpdateSet={updateSet}
          onRemoveSet={removeSet}
        />

        <ExerciseCatalogPanel
          totalCount={exercisesQuery.data?.length ?? 0}
          search={search}
          onSearchChange={setSearch}
          selectedCategory={selectedCategory === 'All' ? 'All' : selectedCategory}
          onCategoryChange={(value) => setSelectedCategory(value === 'All' ? 'All' : normalizeCategory(value))}
          selectedPrimaryMuscle={selectedPrimaryMuscle}
          onPrimaryMuscleChange={setSelectedPrimaryMuscle}
          exercises={filteredCatalog}
          onAddExercise={addExercise}
          onExerciseClick={setSelectedExerciseForMap}
        />
      </div>

      <ExerciseMuscleMapDialog
        open={selectedExerciseForMap !== null}
        exercise={selectedExerciseForMap}
        onClose={() => setSelectedExerciseForMap(null)}
      />
    </div>
  )
}

export default ProgramBuilderPage
