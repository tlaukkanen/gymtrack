import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Chip, Divider, IconButton, Stack, TextField, Typography, useMediaQuery } from '@mui/material'
import { ArrowRight, CheckCircle, Pause, Play, Plus, RefreshCcw, Trash2, Volume2, VolumeX } from 'lucide-react'

import type { WorkoutSessionExerciseDto, WorkoutSessionSetDto } from '../../types/api'
import { Button } from '../ui/Button'
import { SetLogRow } from './SetLogRow'
import { useSettingsStore, selectTimerAudioMuted, selectToggleTimerAudioMuted } from '../../store/settings-store'

type SessionExerciseCategory = 'Strength' | 'Cardio'

const QUICK_ADD_SECONDS = [15, 30, 60] as const

const formatTimer = (remainingMs: number) => {
  if (remainingMs <= 0) return '00:00'
  const totalSeconds = Math.ceil(remainingMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const normalizeCategoryValue = (value?: string | number | null): SessionExerciseCategory | undefined => {
  if (value === 'Cardio' || value === 1) return 'Cardio'
  if (value === 'Strength' || value === 0) return 'Strength'
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'cardio') return 'Cardio'
    if (normalized === 'strength') return 'Strength'
  }
  return undefined
}

const deriveExerciseCategory = (exercise: WorkoutSessionExerciseDto): SessionExerciseCategory => {
  const explicitCategory =
    normalizeCategoryValue(exercise.category ?? null) || normalizeCategoryValue(exercise.customCategory ?? null)
  if (explicitCategory) return explicitCategory

  const hasStrengthSignals = exercise.sets.some(
    (set) => set.plannedWeight != null || set.plannedReps != null || set.actualWeight != null || set.actualReps != null,
  )
  const hasCardioSignals = exercise.sets.some((set) => set.plannedDurationSeconds != null || set.actualDurationSeconds != null)

  if (hasCardioSignals && !hasStrengthSignals) return 'Cardio'
  return 'Strength'
}

interface ExerciseDetailsPanelProps {
  exercise: WorkoutSessionExerciseDto
  isSessionCompleted: boolean
  restOptions: number[]
  timerRemainingMs: number
  onStartTimer: (seconds: number) => void
  onPauseTimer: () => void
  onResetTimer: () => void
  onSaveDetails: (payload: { restSeconds: number; notes: string }) => void
  onAddSet: () => void
  onSaveSet: (setId: string, body: { actualWeight?: number | null; actualReps?: number | null; actualDurationSeconds?: number | null }) => void
  onRemoveSet: (set: WorkoutSessionSetDto, options?: { force?: boolean }) => void
  onRemoveExercise?: () => void
  canRemoveExercise: boolean
  isUpdateExercisePending: boolean
  isAddSetPending: boolean
  isUpdateSetPending: boolean
  isRemoveExercisePending: boolean
  onGoToNextExercise: () => void
  hasNextExercise: boolean
  isExerciseCompleted: boolean
  onCompleteWorkout: () => void
}

export const ExerciseDetailsPanel = ({
  exercise,
  isSessionCompleted,
  restOptions,
  timerRemainingMs,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onSaveDetails,
  onAddSet,
  onSaveSet,
  onRemoveSet,
  onRemoveExercise,
  canRemoveExercise,
  isUpdateExercisePending,
  isAddSetPending,
  isUpdateSetPending,
  isRemoveExercisePending,
  onGoToNextExercise,
  hasNextExercise,
  isExerciseCompleted,
  onCompleteWorkout,
}: ExerciseDetailsPanelProps) => {
  const [stickyOffset, setStickyOffset] = useState(0)
  const [isTimerPinned, setIsTimerPinned] = useState(false)
  const stickySentinelRef = useRef<HTMLDivElement | null>(null)
  const isMobile = useMediaQuery('(max-width:600px)')
  const exerciseCategory = useMemo(() => deriveExerciseCategory(exercise), [exercise])
  const isStickyTimer = !isSessionCompleted && isMobile
  const quickAddSeconds = useMemo(() => (restOptions.length ? restOptions : QUICK_ADD_SECONDS).slice(0, 3), [restOptions])
  const isTimerPinnedActive = isStickyTimer && isTimerPinned
  const showQuickAddChips = !isTimerPinnedActive
  const timerButtonSize = isTimerPinnedActive ? 'medium' : isMobile ? 'large' : 'medium'
  const timerButtonMin = isTimerPinnedActive ? 48 : isMobile ? 64 : undefined
  const timerStackSpacing = isTimerPinnedActive ? 1 : isMobile ? 0.8 : 2
  const timerControlSpacing = isTimerPinnedActive ? 0.5 : 1
  const computedStickyOffset = isStickyTimer ? Math.max(stickyOffset, 16) : 0

  // Audio mute state
  const isAudioMuted = useSettingsStore(selectTimerAudioMuted)
  const toggleAudioMute = useSettingsStore(selectToggleTimerAudioMuted)

  const renderTimerDisplay = () => (
    <Box
      className="timer-display"
      sx={{
        textAlign: isMobile ? 'center' : 'left',
        flex: isMobile ? '1 1 auto' : '0 0 auto',
        lineHeight: isMobile ? 0.9 : 1.1,
        fontSize: isStickyTimer ? 'clamp(1.75rem, 10vw, 3rem)' : undefined,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      {formatTimer(timerRemainingMs)}
    </Box>
  )

  const handleIncrementTimer = useCallback(
    (incrementSeconds: number) => {
      if (isSessionCompleted) return
      const baseSeconds = Math.ceil(Math.max(0, timerRemainingMs) / 1000)
      onStartTimer(baseSeconds + incrementSeconds)
    },
    [isSessionCompleted, onStartTimer, timerRemainingMs],
  )

  const isSetCompleted = useCallback(
    (sessionSet: WorkoutSessionSetDto) => {
      if (exerciseCategory === 'Cardio') {
        return sessionSet.actualDurationSeconds !== null && sessionSet.actualDurationSeconds !== undefined
      }
      return sessionSet.actualWeight !== null && sessionSet.actualWeight !== undefined
        ? true
        : sessionSet.actualReps !== null && sessionSet.actualReps !== undefined
    },
    [exerciseCategory],
  )

  const firstIncompleteSet = exercise.sets.find((sessionSet) => !isSetCompleted(sessionSet))
  const activeSetId = !isSessionCompleted && firstIncompleteSet ? firstIncompleteSet.id : null

  useEffect(() => {
    if (!isStickyTimer || typeof window === 'undefined' || typeof ResizeObserver === 'undefined') {
      return undefined
    }
    const shell = document.querySelector<HTMLElement>('.mobile-exercise-shell')
    if (!shell) {
      return undefined
    }
    const updateOffset = () => {
      const rect = shell.getBoundingClientRect()
      setStickyOffset(rect.height + 12)
    }
    const observer = new ResizeObserver(updateOffset)
    observer.observe(shell)
    const rafId = window.requestAnimationFrame(updateOffset)
    return () => {
      observer.disconnect()
      window.cancelAnimationFrame(rafId)
    }
  }, [isStickyTimer])

  useEffect(() => {
    if (!isStickyTimer || typeof IntersectionObserver === 'undefined') {
      return undefined
    }
    const sentinel = stickySentinelRef.current
    if (!sentinel) {
      return undefined
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsTimerPinned(!entry.isIntersecting)
      },
      { threshold: 1 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [isStickyTimer])

  const shouldShowExerciseCta = !isSessionCompleted && isExerciseCompleted
  const isLastExercise = shouldShowExerciseCta && !hasNextExercise
  const lastSet = exercise.sets.length > 0 ? exercise.sets[exercise.sets.length - 1] : undefined
  const canRemoveLastSet = Boolean(lastSet && !isSessionCompleted)

  const handleRemoveLastSet = () => {
    if (!lastSet || !canRemoveLastSet) return
    onRemoveSet(lastSet, { force: true })
  }

  return (
    <Stack spacing={3}>
      <div
        className="section-header"
        style={{ flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: '0.75rem' }}
      >
        {exercise.isAdHoc && canRemoveExercise && (
          <Button variant="danger" onClick={onRemoveExercise} disabled={isRemoveExercisePending} fullWidth={isMobile}>
            Remove
          </Button>
        )}
      </div>

      <Stack spacing={2}>
        <ExerciseDetailsEditor
          key={`${exercise.id}-${exercise.restSeconds}-${exercise.notes ?? ''}`}
          initialRestSeconds={exercise.restSeconds}
          initialNotes={exercise.notes ?? ''}
          isSessionCompleted={isSessionCompleted}
          isMobile={isMobile}
          isUpdateExercisePending={isUpdateExercisePending}
          onSaveDetails={onSaveDetails}
        />
      </Stack>

      {!isSessionCompleted && (
        <>
          <Divider />

          {isMobile && <div ref={stickySentinelRef} aria-hidden style={{ height: 1, marginBottom: -1 }} />}
          <Box
            sx={(theme) => ({
              position: isStickyTimer ? 'sticky' : 'static',
              top: isStickyTimer ? `${computedStickyOffset}px` : 'auto',
              zIndex: isStickyTimer ? theme.zIndex.appBar : 'auto',
              backgroundColor: isStickyTimer ? theme.palette.background.paper : 'transparent',
              borderRadius: isStickyTimer ? 1 : 0,
              padding: isStickyTimer ? theme.spacing(1.25) : 0,
              border: isStickyTimer ? `1px solid ${theme.palette.divider}` : 'none',
              boxShadow: isStickyTimer ? theme.shadows[1] : 'none',
              marginBottom: isStickyTimer ? theme.spacing(1) : 0,
            })}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography variant="subtitle2" noWrap>
                  Rest Timer
                </Typography>
                <IconButton
                  size="small"
                  onClick={toggleAudioMute}
                  aria-label={isAudioMuted ? 'Unmute timer audio' : 'Mute timer audio'}
                  title={isAudioMuted ? 'Unmute timer audio' : 'Mute timer audio'}
                >
                  {isAudioMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </IconButton>
              </Stack>
              {isMobile && showQuickAddChips && (
                <Stack
                  direction="row"
                  spacing={0.5}
                  flexWrap="wrap"
                  alignItems="center"
                  justifyContent="flex-end"
                  sx={{ columnGap: 0.5, rowGap: 0.5, marginLeft: 'auto' }}
                >
                  {quickAddSeconds.map((value) => (
                    <Chip
                      key={`mobile-${value}`}
                      label={`+${value}s`}
                      clickable
                      onClick={() => handleIncrementTimer(value)}
                      disabled={isSessionCompleted}
                      size="small"
                    />
                  ))}
                </Stack>
              )}
            </Stack>
            <Stack spacing={timerStackSpacing}>
              {isMobile ? (
                <Stack direction="row" spacing={timerStackSpacing} alignItems="center" justifyContent="space-between">
                  <IconButton
                    color="primary"
                    onClick={() => onStartTimer(exercise.restSeconds)}
                    disabled={isSessionCompleted}
                    size={timerButtonSize as 'small' | 'medium' | 'large'}
                    sx={{ minWidth: timerButtonMin, minHeight: timerButtonMin }}
                    aria-label="Start rest timer"
                  >
                    <Play size={20} />
                  </IconButton>
                  {renderTimerDisplay()}
                  <IconButton
                    color="secondary"
                    onClick={onResetTimer}
                    disabled={isSessionCompleted}
                    size={timerButtonSize as 'small' | 'medium' | 'large'}
                    sx={{ minWidth: timerButtonMin, minHeight: timerButtonMin }}
                    aria-label="Reset rest timer"
                  >
                    <RefreshCcw size={20} />
                  </IconButton>
                </Stack>
              ) : (
                <Stack
                  direction="row"
                  spacing={timerStackSpacing}
                  alignItems="center"
                  justifyContent="space-between"
                  flexWrap="wrap"
                >
                  {renderTimerDisplay()}
                  <Stack
                    direction="row"
                    spacing={timerControlSpacing}
                    alignItems="center"
                    justifyContent="flex-start"
                    width="auto"
                    flexWrap="wrap"
                  >
                    <IconButton
                      color="primary"
                      onClick={() => onStartTimer(exercise.restSeconds)}
                      disabled={isSessionCompleted}
                      size={timerButtonSize as 'small' | 'medium' | 'large'}
                      aria-label="Start rest timer"
                    >
                      <Play size={18} />
                    </IconButton>
                    <IconButton
                      color="warning"
                      onClick={onPauseTimer}
                      disabled={isSessionCompleted}
                      size={timerButtonSize as 'small' | 'medium' | 'large'}
                      aria-label="Pause rest timer"
                    >
                      <Pause size={18} />
                    </IconButton>
                    <IconButton
                      color="secondary"
                      onClick={onResetTimer}
                      disabled={isSessionCompleted}
                      size={timerButtonSize as 'small' | 'medium' | 'large'}
                      aria-label="Reset rest timer"
                    >
                      <RefreshCcw size={18} />
                    </IconButton>
                  </Stack>
                </Stack>
              )}
            </Stack>
            {!isMobile && showQuickAddChips && (
              <Stack
                direction="row"
                flexWrap="wrap"
                marginTop={1}
                justifyContent="flex-start"
                sx={{ columnGap: 1, rowGap: 0.5 }}
              >
                {quickAddSeconds.map((value) => (
                  <Chip
                    key={`desktop-${value}`}
                    label={`+${value}s`}
                    clickable
                    onClick={() => handleIncrementTimer(value)}
                    disabled={isSessionCompleted}
                    size="medium"
                  />
                ))}
              </Stack>
            )}
          </Box>

          <Divider />
        </>
      )}

      <Stack spacing={1.5}>
        <Typography variant="h6">Sets</Typography>
        {exercise.sets.map((set, setIndex) => {
          const completed = isSetCompleted(set)
          const isActiveSet = !isSessionCompleted && !completed && activeSetId === set.id
          const isLastSet = setIndex === exercise.sets.length - 1

          // Determine callback when set is completed:
          // - Last set with next exercise: auto-navigate to next exercise
          // - Non-last set with rest time: start rest timer
          // - Otherwise: no callback
          let setCompletedCallback: (() => void) | undefined
          if (isLastSet && hasNextExercise) {
            setCompletedCallback = onGoToNextExercise
          } else if (!isLastSet && exercise.restSeconds > 0) {
            setCompletedCallback = () => onStartTimer(exercise.restSeconds)
          }

          return (
            <SetLogRow
              key={set.id}
              set={set}
              category={exerciseCategory}
              onSave={(body) => onSaveSet(set.id, body)}
              isSaving={isUpdateSetPending}
              disabled={isSessionCompleted}
              isActive={isActiveSet}
              isCompleted={completed}
              showFieldLabels={setIndex === 0}
              onSetCompleted={setCompletedCallback}
            />
          )
        })}
      </Stack>

      <Stack spacing={1} direction="row" justifyContent="space-between" alignItems="center" flexWrap={isMobile ? 'wrap' : 'nowrap'}>
        {!isSessionCompleted && (
          <>
            <Button
              variant='ghost'
              onClick={handleRemoveLastSet}
              startIcon={<Trash2 size={16} />}
              disabled={!canRemoveLastSet}
              sx={(theme) => ({
                color: canRemoveLastSet ? theme.palette.error.main : theme.palette.text.disabled,
                flex: isMobile ? 1 : undefined,
              })}
            >
              Remove Last Set
            </Button>
            <Button
              variant='secondary'
              onClick={onAddSet}
              startIcon={<Plus size={16} />}
              disabled={isAddSetPending}
              sx={{ flex: isMobile ? 1 : undefined }}
            >
              Add Set
            </Button>
          </>
        )}
      </Stack>


      {shouldShowExerciseCta && (
        <Button
          onClick={isLastExercise ? onCompleteWorkout : onGoToNextExercise}
          startIcon={isLastExercise ? <CheckCircle size={16} /> : <ArrowRight size={16} />}
          fullWidth={isMobile}
        >
          {isLastExercise ? 'Complete workout' : 'Next exercise'}
        </Button>
      )}
    </Stack>
  )
}

interface ExerciseDetailsEditorProps {
  initialRestSeconds: number
  initialNotes: string
  isSessionCompleted: boolean
  isMobile: boolean
  isUpdateExercisePending: boolean
  onSaveDetails: (payload: { restSeconds: number; notes: string }) => void
}

const ExerciseDetailsEditor = ({
  initialRestSeconds,
  initialNotes,
  isSessionCompleted,
  isMobile,
  isUpdateExercisePending,
  onSaveDetails,
}: ExerciseDetailsEditorProps) => {
  const [restSeconds, setRestSeconds] = useState(initialRestSeconds)
  const [notes, setNotes] = useState(initialNotes)

  const hasDetailChanges = restSeconds !== initialRestSeconds || notes !== initialNotes

  const handleSaveDetails = () => {
    onSaveDetails({ restSeconds, notes })
  }

  return (
    <div
      className="field-row"
      style={{
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: isMobile ? '0.75rem' : '1rem',
      }}
    >
      <TextField
        label="Rest seconds between sets"
        type="number"
        value={restSeconds}
        onChange={(event) => {
          const nextValue = Number(event.target.value)
          setRestSeconds(Number.isFinite(nextValue) ? nextValue : 0)
        }}
        inputProps={{ min: 0, max: 600 }}
        fullWidth
        disabled={isSessionCompleted}
      />
      <TextField
        label="My Notes"
        multiline
        minRows={2}
        fullWidth
        value={notes}
        onChange={(event) => {
          setNotes(event.target.value)
        }}
        disabled={isSessionCompleted}
      />
      {hasDetailChanges && !isSessionCompleted && (
        <Button onClick={handleSaveDetails} disabled={isUpdateExercisePending} fullWidth={isMobile}>
          {isUpdateExercisePending ? 'Saving…' : 'Save'}
        </Button>
      )}
    </div>
  )
}
