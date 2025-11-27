import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { IconButton, TextField, Tooltip } from '@mui/material'
import { Check, Trash2 } from 'lucide-react'

import type { WorkoutSessionSetDto } from '../../types/api'

type SessionExerciseCategory = 'Strength' | 'Cardio'

const resolveInitialValue = (actual?: number | null, planned?: number | null) => {
  if (actual !== undefined && actual !== null) return actual.toString()
  if (planned !== undefined && planned !== null) return planned.toString()
  return ''
}

export interface SetLogRowProps {
  set: WorkoutSessionSetDto
  category: SessionExerciseCategory
  onSave: (payload: { actualWeight?: number | null; actualReps?: number | null; actualDurationSeconds?: number | null }) => void
  isSaving: boolean
  canRemove: boolean
  onRemove?: () => void
  disabled?: boolean
  isActive?: boolean
  isCompleted?: boolean
  showFieldLabels?: boolean
}

export const SetLogRow = ({
  set,
  category,
  onSave,
  isSaving,
  canRemove,
  onRemove,
  disabled,
  isActive = false,
  isCompleted = false,
  showFieldLabels = false,
}: SetLogRowProps) => {
  const [weight, setWeight] = useState<string>(resolveInitialValue(set.actualWeight, set.plannedWeight))
  const [reps, setReps] = useState<string>(resolveInitialValue(set.actualReps, set.plannedReps))
  const [duration, setDuration] = useState<string>(resolveInitialValue(set.actualDurationSeconds, set.plannedDurationSeconds))
  const isCardio = category === 'Cardio'

  useEffect(() => {
    setWeight(resolveInitialValue(set.actualWeight, set.plannedWeight))
    setReps(resolveInitialValue(set.actualReps, set.plannedReps))
    setDuration(resolveInitialValue(set.actualDurationSeconds, set.plannedDurationSeconds))
  }, [set.id, set.actualDurationSeconds, set.actualReps, set.actualWeight, set.plannedDurationSeconds, set.plannedReps, set.plannedWeight])

  const handleSave = () => {
    const normalizedNumber = (value: string) => (value === '' ? null : Number(value))
    if (isCardio) {
      onSave({ actualDurationSeconds: normalizedNumber(duration), actualWeight: null, actualReps: null })
      return
    }

    onSave({
      actualWeight: normalizedNumber(weight),
      actualReps: normalizedNumber(reps),
      actualDurationSeconds: null,
    })
  }

  const plannedWeightPlaceholder = set.plannedWeight != null ? set.plannedWeight.toString() : undefined
  const plannedRepsPlaceholder = set.plannedReps != null ? set.plannedReps.toString() : undefined
  const plannedDurationPlaceholder = set.plannedDurationSeconds != null ? set.plannedDurationSeconds.toString() : undefined
  const isActionDisabled = isSaving || disabled || !isActive
  const actionTooltip = isCompleted ? 'Set already logged' : isActive ? 'Mark set done' : 'Complete earlier sets first'
  const rowClasses = clsx(
    'flex w-full flex-nowrap items-stretch gap-2 overflow-x-auto pb-2 sm:gap-3',
    'rounded-xl border border-transparent px-1 py-2 sm:px-2',
    isActive && 'border-[var(--accent)] bg-[rgba(14,165,233,0.08)] shadow-[0_0_0_1px_rgba(14,165,233,0.25)]',
  )

  const headerRowClasses = 'flex w-full flex-nowrap items-center gap-2 px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)] sm:gap-3 sm:px-2'
  const indexColumnClass = 'flex min-w-[30px] shrink-0 flex-col items-center justify-center text-xs text-[var(--text-muted)]'
  const weightFieldClass = 'flex-1 min-w-[30px] max-w-[140px] sm:max-w-none'
  const repsFieldClass = 'flex-1 min-w-[68px] max-w-[140px] sm:max-w-none'
  const cardioFieldClass = 'flex-1 min-w-[120px]'
  const actionsColumnClass = 'flex min-w-[90px] shrink-0 items-center justify-end gap-1 sm:min-w-[120px] sm:gap-2'

  const completedFieldSx = isCompleted
    ? {
        '& .MuiOutlinedInput-root': {
          backgroundColor: 'rgba(6, 78, 59, 0.65)',
          color: 'var(--text)',
          '& fieldset': { borderColor: 'rgba(52, 211, 153, 0.8)' },
          '&:hover fieldset': { borderColor: 'rgba(16, 185, 129, 0.9)' },
        },
        '& .MuiInputLabel-root': {
          color: 'rgba(167, 243, 208, 0.95)',
        },
      }
    : undefined

  return (
    <>
      {showFieldLabels && (
        <div className={headerRowClasses} aria-hidden="true">
          <div className="min-w-[30px] shrink-0 text-center">#</div>
          {isCardio ? (
            <div className={cardioFieldClass}>Duration (sec)</div>
          ) : (
            <>
              <div className={weightFieldClass}>Weight</div>
              <div className={repsFieldClass}>Reps</div>
            </>
          )}
          <div className="min-w-[90px] shrink-0 text-right sm:min-w-[120px]">Actions</div>
        </div>
      )}
      <div className={rowClasses} data-active={isActive} data-completed={isCompleted}>
        <div className={indexColumnClass}>
          <span className="text-sm font-semibold text-[var(--text)]">#{set.setIndex}</span>
          {isCompleted && <span className="h-1 w-full rounded-full bg-[rgba(16,185,129,0.9)]" aria-hidden="true" />}
        </div>
        {isCardio ? (
          <div className={cardioFieldClass}>
            <TextField
              size="small"
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', 'aria-label': 'Actual duration in seconds' }}
              placeholder={plannedDurationPlaceholder}
              disabled={disabled}
              fullWidth
              sx={completedFieldSx}
            />
          </div>
        ) : (
          <>
            <div className={weightFieldClass}>
              <TextField
                size="small"
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
                inputProps={{ inputMode: 'decimal', pattern: '[0-9]*', 'aria-label': 'Actual weight' }}
                placeholder={plannedWeightPlaceholder}
                disabled={disabled}
                fullWidth
                sx={completedFieldSx}
              />
            </div>
            <div className={repsFieldClass}>
              <TextField
                size="small"
                value={reps}
                onChange={(event) => setReps(event.target.value)}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', 'aria-label': 'Actual repetitions' }}
                placeholder={plannedRepsPlaceholder}
                disabled={disabled}
                fullWidth
                sx={completedFieldSx}
              />
            </div>
          </>
        )}
        <div className={actionsColumnClass}>
          <Tooltip title={actionTooltip} placement="top">
            <span className="inline-flex">
              <IconButton onClick={handleSave} disabled={isActionDisabled} color="success">
                <Check size={18} />
              </IconButton>
            </span>
          </Tooltip>
          <IconButton onClick={onRemove} disabled={!canRemove || !onRemove || disabled} color="error">
            <Trash2 size={18} />
          </IconButton>
        </div>
      </div>
    </>
  )
}
