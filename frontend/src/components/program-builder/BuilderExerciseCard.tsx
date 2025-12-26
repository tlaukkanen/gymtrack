import IconButton from '@mui/material/IconButton'
import { FiChevronDown, FiChevronUp, FiTrash2 } from 'react-icons/fi'
import { Button } from '../ui/Button'
import BuilderSetRow from './BuilderSetRow'
import type { BuilderExercise, BuilderSet } from './types'
import { resolveRegion } from '../../utils/regions'

interface BuilderExerciseCardProps {
  exercise: BuilderExercise
  index: number
  total: number
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  onUpdate: (updater: (exercise: BuilderExercise) => BuilderExercise) => void
  onAddSet: () => void
  onUpdateSet: (setKey: string, updater: (set: BuilderSet) => BuilderSet) => void
  onRemoveSet: (setKey: string) => void
}

const BuilderExerciseCard = ({
  exercise,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
  onUpdate,
  onAddSet,
  onUpdateSet,
  onRemoveSet,
}: BuilderExerciseCardProps) => {
  const setChangeHandler = (setKey: string) => (updater: (set: BuilderSet) => BuilderSet) => onUpdateSet(setKey, updater)
  const setRemoveHandler = (setKey: string) => () => onRemoveSet(setKey)

  return (
    <div className="rounded-lg border border-[var(--border)] bg-surface-muted p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="text-text-primary font-semibold">{exercise.exerciseName}</h4>
          <p className="text-text-muted text-sm flex items-center gap-2">
            <span>{exercise.category}</span>
            <span className="badge badge-some uppercase text-[0.65rem] tracking-wider">
              {resolveRegion(exercise.primaryMuscle)}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-1">
          <IconButton
            size="small"
            onClick={onMoveUp}
            disabled={index === 0}
            aria-label={`Move ${exercise.exerciseName} up`}
          >
            <FiChevronUp size={18} />
          </IconButton>
          <IconButton
            size="small"
            onClick={onMoveDown}
            disabled={index === total - 1}
            aria-label={`Move ${exercise.exerciseName} down`}
          >
            <FiChevronDown size={18} />
          </IconButton>
          <IconButton color="error" onClick={onRemove} aria-label={`Remove ${exercise.exerciseName}`}>
            <FiTrash2 size={18} />
          </IconButton>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 mt-4">
        <label className="flex flex-col gap-2 flex-1">
          <span className="text-text-muted text-sm">Notes</span>
          <input
            className="bg-surface border border-[var(--border)] text-text-primary rounded-lg px-3 py-2"
            value={exercise.notes ?? ''}
            onChange={(event) => onUpdate((entity) => ({ ...entity, notes: event.target.value }))}
            placeholder="Tempo cues, reminders, etc."
          />
        </label>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h5 className="text-text-primary font-medium">Sets</h5>
        </div>
        <div className="grid gap-3">
          {exercise.sets.map((set, setIndex) => (
            <BuilderSetRow
              key={set.key}
              category={exercise.category}
              set={set}
              index={setIndex + 1}
              showFieldLabels={setIndex === 0}
              onChange={setChangeHandler(set.key)}
              onRemove={setRemoveHandler(set.key)}
            />
          ))}
          <div className="set-row builder-set-row builder-set-row--add">
            <div className="builder-set-index" aria-hidden="true">
              {exercise.sets.length === 0 && <span className="builder-set-index__label">Set</span>}
            </div>
            <Button variant="secondary" onClick={onAddSet} className="builder-add-set-button">
              Add set
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BuilderExerciseCard
