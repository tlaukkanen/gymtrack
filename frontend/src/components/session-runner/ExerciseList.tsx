import { useMemo, useRef } from 'react'
import type { TouchEvent } from 'react'
import clsx from 'clsx'
import { IconButton } from '@mui/material'
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, GripVertical } from 'lucide-react'

import type { WorkoutSessionExerciseDto } from '../../types/api'

interface ExerciseListProps {
  exercises: WorkoutSessionExerciseDto[]
  activeExerciseId: string | null
  onSelect: (exerciseId: string) => void
  completedExerciseIds?: Set<string>
  isMobileView?: boolean
  reorderMode?: boolean
  onReorder?: (orderedIds: string[]) => void
}

export const ExerciseList = ({
  exercises,
  activeExerciseId,
  onSelect,
  completedExerciseIds,
  isMobileView = false,
  reorderMode = false,
  onReorder,
}: ExerciseListProps) => {
  const orderedExercises = useMemo(() => {
    if (reorderMode) {
      return [...exercises]
    }
    return [...exercises].sort((a, b) => a.orderPerformed - b.orderPerformed)
  }, [exercises, reorderMode])
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const activeIndex = orderedExercises.findIndex((exercise) => exercise.id === activeExerciseId)
  const fallbackIndex = activeIndex === -1 && orderedExercises.length > 0 ? 0 : activeIndex
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )
  const exerciseIds = orderedExercises.map((exercise) => exercise.id)

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

  const handleDragEnd = (event: DragEndEvent) => {
    if (!reorderMode || !onReorder) return
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = exerciseIds.findIndex((id) => id === active.id)
    const newIndex = exerciseIds.findIndex((id) => id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    onReorder(arrayMove(exerciseIds, oldIndex, newIndex))
  }

  const handleMove = (exerciseId: string, direction: -1 | 1) => {
    if (!onReorder) return
    const currentIndex = orderedExercises.findIndex((exercise) => exercise.id === exerciseId)
    if (currentIndex === -1) return
    const nextIndex = currentIndex + direction
    if (nextIndex < 0 || nextIndex >= orderedExercises.length) return
    const nextOrder = [...orderedExercises]
    const [removed] = nextOrder.splice(currentIndex, 1)
    nextOrder.splice(nextIndex, 0, removed)
    onReorder(nextOrder.map((exercise) => exercise.id))
  }

  if (isMobileView) {
    if (reorderMode) {
      return (
        <div className="exercise-list">
          {orderedExercises.map((exercise, index) => {
            const isCompleted = completedExerciseIds?.has(exercise.id) ?? false
            return (
              <div
                key={exercise.id}
                className={clsx('exercise-list-item', 'exercise-list-item--reorder', isCompleted && 'completed')}
              >
                <div>
                  <strong>{exercise.exerciseName}</strong>
                  {exercise.isAdHoc && <span className="badge" style={{ marginLeft: '0.5rem' }}>Custom</span>}
                  <p>{exercise.sets.length} sets • Rest {exercise.restSeconds}s</p>
                </div>
                <div className="reorder-actions reorder-actions--mobile">
                  <IconButton
                    color="primary"
                    size="small"
                    onClick={() => handleMove(exercise.id, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${exercise.exerciseName} up`}
                  >
                    <ArrowUp size={16} />
                  </IconButton>
                  <IconButton
                    color="primary"
                    size="small"
                    onClick={() => handleMove(exercise.id, 1)}
                    disabled={index === orderedExercises.length - 1}
                    aria-label={`Move ${exercise.exerciseName} down`}
                  >
                    <ArrowDown size={16} />
                  </IconButton>
                </div>
              </div>
            )
          })}
        </div>
      )
    }

    const currentExercise = fallbackIndex >= 0 ? orderedExercises[fallbackIndex] : undefined
    const totalExercises = orderedExercises.length
    const canGoPrev = fallbackIndex > 0
    const canGoNext = fallbackIndex >= 0 && fallbackIndex < totalExercises - 1
    const progressLabel = fallbackIndex >= 0 ? `${fallbackIndex + 1}/${totalExercises}` : `0/${totalExercises}`

    return (
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
    )
  }

  if (reorderMode) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={exerciseIds} strategy={verticalListSortingStrategy}>
          <div className="exercise-list">
            {orderedExercises.map((exercise) => {
              const isCompleted = completedExerciseIds?.has(exercise.id) ?? false
              return <SortableExerciseRow key={exercise.id} exercise={exercise} isCompleted={isCompleted} />
            })}
          </div>
        </SortableContext>
      </DndContext>
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

interface SortableExerciseRowProps {
  exercise: WorkoutSessionExerciseDto
  isCompleted: boolean
}

const SortableExerciseRow = ({ exercise, isCompleted }: SortableExerciseRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: exercise.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx('exercise-list-item', 'exercise-list-item--reorder', isCompleted && 'completed', isDragging && 'dragging')}
    >
      <div className="exercise-list-item__body">
        <strong>{exercise.exerciseName}</strong>
        {exercise.isAdHoc && <span className="badge" style={{ marginLeft: '0.5rem' }}>Custom</span>}
        <p>{exercise.sets.length} sets • Rest {exercise.restSeconds}s</p>
      </div>
      <button type="button" className="reorder-handle" {...attributes} {...listeners} aria-label={`Drag to move ${exercise.exerciseName}`}>
        <GripVertical size={18} />
      </button>
    </div>
  )
}
