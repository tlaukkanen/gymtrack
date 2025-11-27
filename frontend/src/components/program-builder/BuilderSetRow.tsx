import type { ChangeEvent } from 'react'
import IconButton from '@mui/material/IconButton'
import { FiTrash2 } from 'react-icons/fi'
import type { BuilderSet, NormalizedCategory } from './types'

interface BuilderSetRowProps {
  category: NormalizedCategory
  set: BuilderSet
  index: number
  showFieldLabels: boolean
  onChange: (updater: (set: BuilderSet) => BuilderSet) => void
  onRemove: () => void
}

const BuilderSetRow = ({ category, set, index, showFieldLabels, onChange, onRemove }: BuilderSetRowProps) => {
  const handleNumberChange = (field: 'targetWeight' | 'targetReps' | 'targetDurationSeconds' | 'restSeconds') =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target
      onChange((current) => ({
        ...current,
        [field]: value === '' ? '' : Number(value),
      }))
    }

  const inputLabel = (label: string) => label
  const isCardio = category === 'Cardio'
  const baseRowClass = `set-row builder-set-row${isCardio ? ' builder-set-row--cardio' : ''}`

  return (
    <>
      {showFieldLabels && (
        <div className={`${baseRowClass} builder-set-row--labels`} aria-hidden="true">
          <div className="builder-set-index">
            <span className="builder-set-index__label">#</span>
          </div>
          {category === 'Strength' ? (
            <>
              <span className="builder-set-field-label">Weight</span>
              <span className="builder-set-field-label">Reps</span>
              <span className="builder-set-field-label">Rest (sec)</span>
            </>
          ) : (
            <span className="builder-set-field-label builder-set-field-label--full">Duration (sec)</span>
          )}
          <div />
        </div>
      )}
      <div className={baseRowClass}>
        <div className="builder-set-index">
          <strong>{index}</strong>
        </div>
        {category === 'Strength' && (
          <>
            <label className="field-group builder-set-field">
              <input
                type="number"
                value={set.targetWeight ?? ''}
                onChange={handleNumberChange('targetWeight')}
                placeholder="kg"
                aria-label={inputLabel('Weight')}
              />
            </label>
            <label className="field-group builder-set-field">
              <input type="number" value={set.targetReps ?? ''} onChange={handleNumberChange('targetReps')} aria-label={inputLabel('Reps')} />
            </label>
            <label className="field-group builder-set-field">
              <input type="number" value={set.restSeconds ?? ''} onChange={handleNumberChange('restSeconds')} aria-label={inputLabel('Rest seconds')} />
            </label>
          </>
        )}
        {isCardio && (
          <label className="field-group builder-set-field builder-set-field--full">
            <input
              type="number"
              value={set.targetDurationSeconds ?? ''}
              onChange={handleNumberChange('targetDurationSeconds')}
              aria-label={inputLabel('Duration seconds')}
            />
          </label>
        )}
        <IconButton
          size="small"
          color="error"
          onClick={onRemove}
          className="builder-set-remove"
          aria-label={`Remove set ${index}`}
        >
          <FiTrash2 size={18} />
        </IconButton>
      </div>
    </>
  )
}

export default BuilderSetRow
