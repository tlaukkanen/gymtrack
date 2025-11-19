import { useEffect, useState } from 'react'
import { IconButton, TextField, Tooltip } from '@mui/material'
import { Check, Trash2 } from 'lucide-react'

import type { WorkoutSessionSetDto } from '../../types/api'

const resolveInitialValue = (actual?: number | null, planned?: number | null) => {
  if (actual !== undefined && actual !== null) return actual.toString()
  if (planned !== undefined && planned !== null) return planned.toString()
  return ''
}

export interface SetLogRowProps {
  set: WorkoutSessionSetDto
  onSave: (payload: { actualWeight?: number | null; actualReps?: number | null; actualDurationSeconds?: number | null }) => void
  isSaving: boolean
  canRemove: boolean
  onRemove?: () => void
  disabled?: boolean
  isActive?: boolean
  isCompleted?: boolean
}

export const SetLogRow = ({ set, onSave, isSaving, canRemove, onRemove, disabled, isActive = false, isCompleted = false }: SetLogRowProps) => {
  const [weight, setWeight] = useState<string>(resolveInitialValue(set.actualWeight, set.plannedWeight))
  const [reps, setReps] = useState<string>(resolveInitialValue(set.actualReps, set.plannedReps))
  const [duration, setDuration] = useState<string>(resolveInitialValue(set.actualDurationSeconds, set.plannedDurationSeconds))

  useEffect(() => {
    setWeight(resolveInitialValue(set.actualWeight, set.plannedWeight))
    setReps(resolveInitialValue(set.actualReps, set.plannedReps))
    setDuration(resolveInitialValue(set.actualDurationSeconds, set.plannedDurationSeconds))
  }, [set.id, set.actualDurationSeconds, set.actualReps, set.actualWeight, set.plannedDurationSeconds, set.plannedReps, set.plannedWeight])

  const handleSave = () => {
    onSave({
      actualWeight: weight === '' ? null : Number(weight),
      actualReps: reps === '' ? null : Number(reps),
      actualDurationSeconds: duration === '' ? null : Number(duration),
    })
  }

  const plannedWeightPlaceholder = set.plannedWeight != null ? set.plannedWeight.toString() : undefined
  const plannedRepsPlaceholder = set.plannedReps != null ? set.plannedReps.toString() : undefined
  const plannedDurationPlaceholder = set.plannedDurationSeconds != null ? set.plannedDurationSeconds.toString() : undefined
  const isActionDisabled = isSaving || disabled || !isActive
  const actionTooltip = isCompleted ? 'Set already logged' : isActive ? 'Mark set done' : 'Complete earlier sets first'
  const rowStyle = isActive
    ? {
        border: '1px solid var(--accent)',
        borderRadius: '0.75rem',
        padding: '0.5rem',
      }
    : undefined

  return (
    <div className="set-row" data-active={isActive} data-completed={isCompleted} style={rowStyle}>
      <div>
        <small style={{ color: 'var(--text-muted)' }}>Set #{set.setIndex}</small>
        {isCompleted && <div style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Completed</div>}
      </div>
      <TextField
        size="small"
        label="Weight"
        value={weight}
        onChange={(event) => setWeight(event.target.value)}
        inputProps={{ inputMode: 'decimal', pattern: '[0-9]*' }}
        placeholder={plannedWeightPlaceholder}
        disabled={disabled}
      />
      <TextField
        size="small"
        label="Reps"
        value={reps}
        onChange={(event) => setReps(event.target.value)}
        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
        placeholder={plannedRepsPlaceholder}
        disabled={disabled}
      />
      <TextField
        size="small"
        label="Seconds"
        value={duration}
        onChange={(event) => setDuration(event.target.value)}
        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
        placeholder={plannedDurationPlaceholder}
        disabled={disabled}
      />
      <Tooltip title={actionTooltip} placement="top">
        <span style={{ display: 'inline-flex' }}>
          <IconButton onClick={handleSave} disabled={isActionDisabled} color="success">
            <Check size={18} />
          </IconButton>
        </span>
      </Tooltip>
      <IconButton onClick={onRemove} disabled={!canRemove || !onRemove || disabled} color="error">
        <Trash2 size={18} />
      </IconButton>
    </div>
  )
}
