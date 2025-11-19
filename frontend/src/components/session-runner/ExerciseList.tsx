import { IconButton } from '@mui/material'
import { ArrowDown, ArrowUp } from 'lucide-react'

import type { WorkoutSessionExerciseDto } from '../../types/api'

interface ExerciseListProps {
  exercises: WorkoutSessionExerciseDto[]
  activeExerciseId: string | null
  onSelect: (exerciseId: string) => void
  onReorder: (exerciseId: string, direction: -1 | 1) => void
  disableReorder: boolean
  isReordering: boolean
}

export const ExerciseList = ({
  exercises,
  activeExerciseId,
  onSelect,
  onReorder,
  disableReorder,
  isReordering,
}: ExerciseListProps) => (
  <div className="exercise-list">
    {exercises
      .slice()
      .sort((a, b) => a.orderPerformed - b.orderPerformed)
      .map((exercise, index, ordered) => {
        const isActive = exercise.id === activeExerciseId
        return (
          <div key={exercise.id} className={isActive ? 'exercise-list-item active' : 'exercise-list-item'}>
            <button type="button" onClick={() => onSelect(exercise.id)}>
              <strong>{exercise.exerciseName}</strong>
              {exercise.isAdHoc && <span className="badge" style={{ marginLeft: '0.5rem' }}>Custom</span>}
              <p>{exercise.sets.length} sets • Rest {exercise.restSeconds}s</p>
            </button>
            {!disableReorder && (
              <div className="reorder-actions">
                <IconButton size="small" onClick={() => onReorder(exercise.id, -1)} disabled={index === 0 || isReordering}>
                  <ArrowUp size={18} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => onReorder(exercise.id, 1)}
                  disabled={index === ordered.length - 1 || isReordering}
                >
                  <ArrowDown size={18} />
                </IconButton>
              </div>
            )}
          </div>
        )
      })}
  </div>
)
