import IconButton from '@mui/material/IconButton'
import { FiTrash2 } from 'react-icons/fi'
import { Button } from '../ui/Button'
import BuilderSetRow from './BuilderSetRow'
import type { BuilderExercise, BuilderSet } from './types'

interface BuilderExerciseCardProps {
  exercise: BuilderExercise
  index: number
  total: number
  restOptions: number[]
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
  restOptions,
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
    <div className="card card-muted">
      <div className="section-header">
        <div>
          <h4>{exercise.exerciseName}</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{exercise.category}</p>
        </div>
        <div className="field-row" style={{ justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onMoveUp} disabled={index === 0}>
            ↑
          </Button>
          <Button variant="secondary" onClick={onMoveDown} disabled={index === total - 1}>
            ↓
          </Button>
          <IconButton color="error" onClick={onRemove} aria-label={`Remove ${exercise.exerciseName}`}>
            <FiTrash2 size={18} />
          </IconButton>
        </div>
      </div>
      <div className="field-row" style={{ marginTop: '1rem' }}>
        <label className="field-group" style={{ flex: 1 }}>
          <span>Rest seconds</span>
          <select value={exercise.restSeconds} onChange={(event) => onUpdate((entity) => ({ ...entity, restSeconds: Number(event.target.value) }))}>
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
            onChange={(event) => onUpdate((entity) => ({ ...entity, notes: event.target.value }))}
            placeholder="Tempo cues, reminders, etc."
          />
        </label>
      </div>
      <div style={{ marginTop: '1rem' }}>
        <div className="section-header" style={{ marginBottom: '0.5rem' }}>
          <h5>Sets</h5>
        </div>
        <div className="grid" style={{ gap: '0.75rem' }}>
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
