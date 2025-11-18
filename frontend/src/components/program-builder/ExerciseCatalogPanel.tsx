import type { ExerciseDto, ExerciseMuscleEngagementDto } from '../../types/api'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

interface ExerciseCatalogPanelProps {
  totalCount: number
  search: string
  onSearchChange: (value: string) => void
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

const ExerciseCatalogPanel = ({ totalCount, search, onSearchChange, exercises, onAddExercise }: ExerciseCatalogPanelProps) => (
  <Card>
    <div className="section-header">
      <h3>Exercise catalog</h3>
      <span>{totalCount} total</span>
    </div>
    <input
      placeholder="Search by name or muscle"
      value={search}
      onChange={(event) => onSearchChange(event.target.value)}
      style={{ marginTop: '1rem', width: '100%' }}
    />
    <div className="grid" style={{ marginTop: '1rem', gap: '0.75rem', maxHeight: '65vh', overflowY: 'auto' }}>
      {exercises.map((exercise) => (
        <div key={exercise.id} className="card card-muted" style={{ padding: '0.9rem' }}>
          <div className="section-header">
            <div>
              <strong>{exercise.name}</strong>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{exercise.primaryMuscle}</p>
            </div>
            <Button variant="secondary" onClick={() => onAddExercise(exercise)}>
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
)

export default ExerciseCatalogPanel
