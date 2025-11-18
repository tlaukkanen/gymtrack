import { Card } from '../ui/Card'
import BuilderExerciseCard from './BuilderExerciseCard'
import type { BuilderExercise, BuilderSet } from './types'

interface ProgramExercisesPanelProps {
  exercises: BuilderExercise[]
  restOptions: number[]
  onMoveExercise: (index: number, direction: -1 | 1) => void
  onRemoveExercise: (key: string) => void
  onUpdateExercise: (key: string, updater: (exercise: BuilderExercise) => BuilderExercise) => void
  onAddSet: (exerciseKey: string) => void
  onUpdateSet: (exerciseKey: string, setKey: string, updater: (set: BuilderSet) => BuilderSet) => void
  onRemoveSet: (exerciseKey: string, setKey: string) => void
}

const ProgramExercisesPanel = ({
  exercises,
  restOptions,
  onMoveExercise,
  onRemoveExercise,
  onUpdateExercise,
  onAddSet,
  onUpdateSet,
  onRemoveSet,
}: ProgramExercisesPanelProps) => (
  <Card>
    <div className="section-header">
      <h3>Program exercises</h3>
      <span>{exercises.length} selected</span>
    </div>
    {exercises.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Add an exercise from the catalog to begin.</p>}
    <div className="grid" style={{ gap: '1rem', marginTop: '1rem' }}>
      {exercises.map((exercise, index) => (
        <BuilderExerciseCard
          key={exercise.key}
          exercise={exercise}
          index={index}
          total={exercises.length}
          restOptions={restOptions}
          onMoveUp={() => onMoveExercise(index, -1)}
          onMoveDown={() => onMoveExercise(index, 1)}
          onRemove={() => onRemoveExercise(exercise.key)}
          onUpdate={(updater) => onUpdateExercise(exercise.key, updater)}
          onAddSet={() => onAddSet(exercise.key)}
          onUpdateSet={(setKey, updater) => onUpdateSet(exercise.key, setKey, updater)}
          onRemoveSet={(setKey) => onRemoveSet(exercise.key, setKey)}
        />
      ))}
    </div>
  </Card>
)

export default ProgramExercisesPanel
