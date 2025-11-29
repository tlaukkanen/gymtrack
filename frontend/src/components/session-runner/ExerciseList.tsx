import { useMemo, useRef } from 'react'
import type { TouchEvent } from 'react'
import clsx from 'clsx'
import { Box, IconButton } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import type { WorkoutSessionExerciseDto } from '../../types/api'

interface ExerciseListProps {
  exercises: WorkoutSessionExerciseDto[]
  activeExerciseId: string | null
  onSelect: (exerciseId: string) => void
  completedExerciseIds?: Set<string>
  isMobileView?: boolean
}

export const ExerciseList = ({
  exercises,
  activeExerciseId,
  onSelect,
  completedExerciseIds,
  isMobileView = false,
}: ExerciseListProps) => {
  const mobilePanelSx: SxProps<Theme> = (theme: Theme) => ({
    borderRadius: 1,
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[1],
    padding: theme.spacing(1),
  })

  const orderedExercises = useMemo(
    () => [...exercises].sort((a, b) => a.orderPerformed - b.orderPerformed),
    [exercises],
  )
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const activeIndex = orderedExercises.findIndex((exercise) => exercise.id === activeExerciseId)
  const fallbackIndex = activeIndex === -1 && orderedExercises.length > 0 ? 0 : activeIndex

  const navigateToIndex = (index: number) => {
    if (index < 0 || index >= orderedExercises.length) return
    const target = orderedExercises[index]
    if (target && target.id !== activeExerciseId) {
      onSelect(target.id)
    }
  }

  const handlePrev = () => {
    if (fallbackIndex > 0) {
      navigateToIndex(fallbackIndex - 1)
    }
  }

  const handleNext = () => {
    if (fallbackIndex >= 0 && fallbackIndex < orderedExercises.length - 1) {
      navigateToIndex(fallbackIndex + 1)
    }
  }

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0]
    if (!touch) return
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const touchStart = touchStartRef.current
    const touch = event.changedTouches[0]
    touchStartRef.current = null
    if (!touchStart || !touch) return
    const deltaX = touch.clientX - touchStart.x
    const deltaY = touch.clientY - touchStart.y
    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY)) return
    if (deltaX < 0) {
      handleNext()
    } else {
      handlePrev()
    }
  }

  if (isMobileView) {
    const currentExercise = fallbackIndex >= 0 ? orderedExercises[fallbackIndex] : undefined
    const totalExercises = orderedExercises.length
    const canGoPrev = fallbackIndex > 0
    const canGoNext = fallbackIndex >= 0 && fallbackIndex < totalExercises - 1
    const progressLabel = fallbackIndex >= 0 ? `${fallbackIndex + 1}/${totalExercises}` : `0/${totalExercises}`

    return (
      <Box sx={mobilePanelSx}>
        <div className="mobile-exercise-carousel">
          <IconButton
            size="small"
            color="primary"
            onClick={handlePrev}
            disabled={!canGoPrev}
            aria-label="Previous exercise"
          >
            <ArrowLeft size={18} />
          </IconButton>
          <div className="mobile-exercise-slide" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            {currentExercise ? (
              <>
                <button type="button" onClick={() => onSelect(currentExercise.id)}>
                  <div className="mobile-exercise-slide__heading">
                    <strong>{currentExercise.exerciseName}</strong>
                    <span className="mobile-exercise-slide__progress">{progressLabel}</span>
                  </div>
                  {currentExercise.isAdHoc && <span className="badge" style={{ marginLeft: '0' }}>Custom</span>}
                  <p>{currentExercise.sets.length} sets • Rest {currentExercise.restSeconds}s</p>
                </button>
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>No exercises added yet.</p>
            )}
          </div>
          <IconButton
            size="small"
            color="primary"
            onClick={handleNext}
            disabled={!canGoNext}
            aria-label="Next exercise"
          >
            <ArrowRight size={18} />
          </IconButton>
        </div>
      </Box>
    )
  }

  return (
    <div className="exercise-list">
      {orderedExercises.map((exercise) => {
        const isActive = exercise.id === activeExerciseId
        const isCompleted = completedExerciseIds?.has(exercise.id) ?? false
        return (
          <div key={exercise.id} className={clsx('exercise-list-item', isActive && 'active', isCompleted && 'completed')}>
            <button type="button" onClick={() => onSelect(exercise.id)}>
              <strong>{exercise.exerciseName}</strong>
              {exercise.isAdHoc && <span className="badge" style={{ marginLeft: '0.5rem' }}>Custom</span>}
              <p>{exercise.sets.length} sets • Rest {exercise.restSeconds}s</p>
            </button>
          </div>
        )
      })}
    </div>
  )
}
