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

  const inputLabel = (label: string) => (showFieldLabels ? undefined : label)
  const isCardio = category === 'Cardio'

  return (
    <div className={`set-row builder-set-row${isCardio ? ' builder-set-row--cardio' : ''}`}>
      <div className="builder-set-index">
        {showFieldLabels && <span className="builder-set-index__label">Set</span>}
        <strong>{index}</strong>
      </div>
      {category === 'Strength' && (
        <>
          <label className="field-group builder-set-field">
            {showFieldLabels && <span>Weight</span>}
            <input
              type="number"
              value={set.targetWeight ?? ''}
              onChange={handleNumberChange('targetWeight')}
              placeholder="kg"
              aria-label={inputLabel('Weight')}
            />
          </label>
          <label className="field-group builder-set-field">
            {showFieldLabels && <span>Reps</span>}
            <input type="number" value={set.targetReps ?? ''} onChange={handleNumberChange('targetReps')} aria-label={inputLabel('Reps')} />
          </label>
          <label className="field-group builder-set-field">
            {showFieldLabels && <span>Rest (sec)</span>}
            <input type="number" value={set.restSeconds ?? ''} onChange={handleNumberChange('restSeconds')} aria-label={inputLabel('Rest seconds')} />
          </label>
        </>
      )}
      {isCardio && (
        <label className="field-group builder-set-field builder-set-field--full">
          {showFieldLabels && <span>Duration (sec)</span>}
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
  )
}

export default BuilderSetRow
