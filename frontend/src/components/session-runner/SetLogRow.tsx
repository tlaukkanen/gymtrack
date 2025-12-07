import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { IconButton, TextField, Tooltip } from '@mui/material'
import { Check } from 'lucide-react'

import type { WorkoutSessionSetDto } from '../../types/api'

type SessionExerciseCategory = 'Strength' | 'Cardio'

type DraftInputs = {
  key: string
  weight: string
  reps: string
  duration: string
}

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
  disabled?: boolean
  isActive?: boolean
  isCompleted?: boolean
  showFieldLabels?: boolean
  onSetCompleted?: () => void
}

export const SetLogRow = ({
  set,
  category,
  onSave,
  isSaving,
  disabled,
  isActive = false,
  isCompleted = false,
  showFieldLabels = false,
  onSetCompleted,
}: SetLogRowProps) => {
  const [draftValues, setDraftValues] = useState<DraftInputs | null>(null)
  const baseValues = useMemo(
    () => ({
      weight: resolveInitialValue(set.actualWeight, set.plannedWeight),
      reps: resolveInitialValue(set.actualReps, set.plannedReps),
      duration: resolveInitialValue(set.actualDurationSeconds, set.plannedDurationSeconds),
    }),
    [set.actualDurationSeconds, set.actualReps, set.actualWeight, set.plannedDurationSeconds, set.plannedReps, set.plannedWeight],
  )
  const syncKey = useMemo(
    () =>
      [
        set.id,
        set.actualWeight ?? '',
        set.actualReps ?? '',
        set.actualDurationSeconds ?? '',
        set.plannedWeight ?? '',
        set.plannedReps ?? '',
        set.plannedDurationSeconds ?? '',
      ].join('|'),
    [
      set.id,
      set.actualWeight,
      set.actualReps,
      set.actualDurationSeconds,
      set.plannedWeight,
      set.plannedReps,
      set.plannedDurationSeconds,
    ],
  )
  const weightValue = draftValues?.key === syncKey ? draftValues.weight : baseValues.weight
  const repsValue = draftValues?.key === syncKey ? draftValues.reps : baseValues.reps
  const durationValue = draftValues?.key === syncKey ? draftValues.duration : baseValues.duration
  const isCardio = category === 'Cardio'

  const formatDecimal = (value?: number | null) => {
    if (value === undefined || value === null) return null
    return value % 1 === 0 ? value.toString() : value.toFixed(2).replace(/\.0+$/, '').replace(/0+$/, '').replace(/\.$/, '')
  }

  const lastDisplayValue = (() => {
    if (isCardio) {
      return set.lastDurationSeconds !== undefined && set.lastDurationSeconds !== null ? `${set.lastDurationSeconds}s` : '—'
    }

    const formattedWeight = formatDecimal(set.lastWeight)
    const hasReps = set.lastReps !== undefined && set.lastReps !== null

    if (formattedWeight && hasReps) {
      return `${formattedWeight}\u00D7${set.lastReps}`
    }

    if (formattedWeight) {
      return formattedWeight
    }

    if (hasReps) {
      return `${set.lastReps} reps`
    }

    return '—'
  })()

  const updateDraftValue = (field: 'weight' | 'reps' | 'duration', value: string) => {
    setDraftValues((previous) => {
      const baseDraft =
        previous && previous.key === syncKey
          ? previous
          : {
              key: syncKey,
              weight: baseValues.weight,
              reps: baseValues.reps,
              duration: baseValues.duration,
            }

      if (baseDraft[field] === value) {
        return previous && previous.key === syncKey ? previous : baseDraft
      }

      return {
        ...baseDraft,
        [field]: value,
      }
    })
  }

  const handleSave = () => {
    if (isCompleted) {
      onSave({ actualWeight: null, actualReps: null, actualDurationSeconds: null })
      return
    }
    const normalizedNumber = (value: string) => (value === '' ? null : Number(value))
    if (isCardio) {
      onSave({ actualDurationSeconds: normalizedNumber(durationValue), actualWeight: null, actualReps: null })
      onSetCompleted?.()
      return
    }

    onSave({
      actualWeight: normalizedNumber(weightValue),
      actualReps: normalizedNumber(repsValue),
      actualDurationSeconds: null,
    })
    onSetCompleted?.()
  }

  const plannedWeightPlaceholder = set.plannedWeight != null ? set.plannedWeight.toString() : undefined
  const plannedRepsPlaceholder = set.plannedReps != null ? set.plannedReps.toString() : undefined
  const plannedDurationPlaceholder = set.plannedDurationSeconds != null ? set.plannedDurationSeconds.toString() : undefined
  const isActionDisabled = isSaving || disabled || (!isActive && !isCompleted)
  const actionTooltip = isCompleted ? 'Undo completion' : isActive ? 'Mark set done' : 'Complete earlier sets first'
  const rowClasses = clsx(
    'flex w-full flex-nowrap items-stretch gap-2 overflow-x-auto pb-2 sm:gap-3',
    'rounded-xl border border-transparent px-1 py-2 sm:px-2',
    isActive && 'border-[var(--accent)] bg-[rgba(14,165,233,0.08)] shadow-[0_0_0_1px_rgba(14,165,233,0.25)]',
  )

  const headerRowClasses = 'flex w-full flex-nowrap items-center gap-2 px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)] sm:gap-3 sm:px-2'
  const indexColumnClass = 'flex min-w-[36px] shrink-0 flex-col items-center justify-center text-xs text-[var(--text-muted)]'
  const metricColumnBase = 'flex-1 min-w-[50px] max-w-[140px] shrink-0 sm:max-w-none'
  const weightFieldClass = metricColumnBase
  const repsFieldClass = metricColumnBase
  const cardioFieldClass = 'flex-1 min-w-[120px]'
  const lastHeaderColumnClass = clsx('flex items-center text-left', metricColumnBase)
  const lastValueColumnClass = clsx('flex items-center justify-start', metricColumnBase)
  const actionsColumnClass = 'flex min-w-[50px] shrink-0 items-center justify-end gap-1 sm:min-w-[120px] sm:gap-2'
  const lastValueTextClass = clsx(
    'text-sm font-semibold sm:text-base',
    lastDisplayValue === '—' ? 'text-[var(--text-muted)]' : 'text-[var(--text)]',
  )

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
          <div className="min-w-[36px] shrink-0 text-center">#</div>
          <div className={lastHeaderColumnClass}>Last</div>
          {isCardio ? (
            <div className={cardioFieldClass}>Duration (sec)</div>
          ) : (
            <>
              <div className={weightFieldClass}>Weight</div>
              <div className={repsFieldClass}>Reps</div>
            </>
          )}
          <div className="min-w-[50px] shrink-0 text-right sm:min-w-[120px]">Actions</div>
        </div>
      )}
      <div className={rowClasses} data-active={isActive} data-completed={isCompleted}>
        <div className={indexColumnClass}>
          <span className="text-sm font-semibold text-[var(--text)]">#{set.setIndex}</span>
          {isCompleted && <span className="h-1 w-full rounded-full bg-[rgba(16,185,129,0.9)]" aria-hidden="true" />}
        </div>
        <div className={lastValueColumnClass}>
          <span className={lastValueTextClass}>{lastDisplayValue}</span>
        </div>
        {isCardio ? (
          <div className={cardioFieldClass}>
            <TextField
              size="small"
              value={durationValue}
              onChange={(event) => updateDraftValue('duration', event.target.value)}
              onFocus={(event) => event.target.select()}
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
                value={weightValue}
                onChange={(event) => updateDraftValue('weight', event.target.value)}
                onFocus={(event) => event.target.select()}
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
                value={repsValue}
                onChange={(event) => updateDraftValue('reps', event.target.value)}
                onFocus={(event) => event.target.select()}
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
        </div>
      </div>
    </>
  )
}
