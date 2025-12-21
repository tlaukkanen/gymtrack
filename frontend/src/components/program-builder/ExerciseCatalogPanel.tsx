import type { ExerciseDto, ExerciseMuscleEngagementDto } from '../../types/api'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { resolveRegion } from '../../utils/regions'

interface ExerciseCatalogPanelProps {
  totalCount: number
  search: string
  onSearchChange: (value: string) => void
   selectedCategory: ExerciseDto['category'] | 'All'
   onCategoryChange: (value: ExerciseDto['category'] | 'All') => void
   selectedPrimaryMuscle: string | 'All'
   onPrimaryMuscleChange: (value: string | 'All') => void
  exercises: ExerciseDto[]
  onAddExercise: (exercise: ExerciseDto) => void
}

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

const categoryOptions: Array<{ value: ExerciseDto['category'] | 'All'; label: string; style: 'yes' | 'some' | 'no' | 'cardio' }> = [
  { value: 'All', label: 'All', style: 'no' },
  { value: 'Strength', label: 'Strength', style: 'yes' },
  { value: 'Cardio', label: 'Cardio', style: 'cardio' }
]

const primaryMuscleOptions: Array<{ value: string | 'All'; label: string }> = [
  { value: 'All', label: 'All' },
  { value: 'Core', label: 'Core' },
  { value: 'Chest', label: 'Chest' },
  { value: 'Back', label: 'Back' },
  { value: 'Shoulders', label: 'Shoulders' },
  { value: 'Legs', label: 'Legs' },
  { value: 'Quadriceps', label: 'Quads' },
  { value: 'Hamstrings', label: 'Hamstrings' },
  { value: 'Glutes', label: 'Glutes' },
  { value: 'Arms', label: 'Arms' }
]

const ExerciseCatalogPanel = ({
  totalCount,
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedPrimaryMuscle,
  onPrimaryMuscleChange,
  exercises,
  onAddExercise
}: ExerciseCatalogPanelProps) => (
  <Card className="border border-brand/30 bg-surface shadow-card">
    <div className="section-header border-b border-white/5 pb-3">
      <div className="flex flex-col">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Catalog</span>
        <h3 className="mt-1 text-text-primary">Exercise catalog</h3>
      </div>
      <span className="rounded-full border border-brand/30 px-3 py-1 text-sm text-text-muted">{totalCount} total</span>
    </div>
    <p className="mt-3 text-sm text-text-muted">Keep the catalog handy while you refine the program order.</p>
    <div className="mt-4 flex flex-col gap-3">
      <input
        className="w-full bg-surface-muted border border-[var(--border)] text-text-primary rounded-lg px-3 py-2 placeholder:text-text-muted"
        placeholder="Search by name or muscle"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-text-muted">Category:</span>
        {categoryOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`badge badge-${option.style} ${
              selectedCategory === option.value ? 'ring-1 ring-brand ring-offset-1 ring-offset-surface-darkest' : ''
            }`}
            onClick={() => onCategoryChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-text-muted">Primary muscle:</span>
        {primaryMuscleOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`badge badge-some ${
              selectedPrimaryMuscle === option.value ? 'ring-1 ring-success ring-offset-1 ring-offset-surface-darkest' : ''
            }`}
            onClick={() => onPrimaryMuscleChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted">
        <span>
          Showing <strong className="text-text-primary">{exercises.length}</strong>
          {selectedCategory !== 'All' && (
            <>
              {' '}
              · <span>{selectedCategory}</span>
            </>
          )}
          {selectedPrimaryMuscle !== 'All' && (
            <>
              {' '}
              · <span>{selectedPrimaryMuscle}</span>
            </>
          )}
        </span>
        {(selectedCategory !== 'All' || selectedPrimaryMuscle !== 'All' || search) && (
          <button
            type="button"
            className="badge badge-no hover:border-brand/60 hover:text-brand"
            onClick={() => {
              onSearchChange('')
              onCategoryChange('All')
              onPrimaryMuscleChange('All')
            }}
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
    <div className="mt-4 max-h-[65vh] space-y-3 overflow-y-auto pr-1">
      {exercises.map((exercise) => (
        <div
          key={exercise.id}
          className="rounded-2xl border border-[var(--border)] bg-surface-muted p-4 shadow-card transition-colors hover:border-brand/50"
        >
          <div className="section-header">
            <div>
              <strong className="text-base text-text-primary">{exercise.name}</strong>
              <p className="text-sm text-text-muted">
                {exercise.primaryMuscle}
                {resolveRegion(exercise.primaryMuscle) !== 'Other' && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-brand/20 px-2 py-0.5 text-[0.7rem] uppercase tracking-wide text-brand-light">
                    {resolveRegion(exercise.primaryMuscle)}
                  </span>
                )}
              </p>
            </div>
            <Button variant="secondary" onClick={() => onAddExercise(exercise)}>
              Add
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
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
)

export default ExerciseCatalogPanel
