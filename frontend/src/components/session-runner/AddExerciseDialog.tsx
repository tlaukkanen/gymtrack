import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogActions, DialogContent, DialogTitle, Stack, Tab, Tabs, TextField } from '@mui/material'

import type { AddSessionExerciseRequest, ExerciseDto } from '../../types/api'
import { useToast } from '../feedback/ToastProvider'
import { Button } from '../ui/Button'

const DEFAULT_CATALOG_REST_SECONDS = 90

const clampSetCount = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return 1
  return Math.min(10, Math.max(1, Math.round(value)))
}

const clampRestSeconds = (value: number) => {
  if (!Number.isFinite(value) || value < 0) return 0
  return Math.min(600, Math.max(0, Math.round(value)))
}

const createSetTemplate = (isCardio: boolean) => ({
  plannedWeight: isCardio ? null : 0,
  plannedReps: isCardio ? null : 8,
  plannedDurationSeconds: isCardio ? 60 : null,
})

interface AddExerciseDialogProps {
  open: boolean
  exercises?: ExerciseDto[]
  isSubmitting: boolean
  onClose: () => void
  onAddExercise: (payload: AddSessionExerciseRequest) => void
}

export const AddExerciseDialog = ({ open, exercises, isSubmitting, onClose, onAddExercise }: AddExerciseDialogProps) => {
  const { push } = useToast()
  const [tab, setTab] = useState<'catalog' | 'custom'>('catalog')
  const [catalogSearch, setCatalogSearch] = useState('')
  const [catalogExerciseId, setCatalogExerciseId] = useState('')
  const [catalogNotes, setCatalogNotes] = useState('')
  const [catalogRestSeconds, setCatalogRestSeconds] = useState(90)
  const [catalogSetCount, setCatalogSetCount] = useState(3)
  const [customName, setCustomName] = useState('')
  const [customCategory, setCustomCategory] = useState<'Strength' | 'Cardio'>('Strength')
  const [customRestSeconds, setCustomRestSeconds] = useState(90)
  const [customSetCount, setCustomSetCount] = useState(3)
  const [customNotes, setCustomNotes] = useState('')

  const resetState = () => {
    setTab('catalog')
    setCatalogSearch('')
    setCatalogExerciseId('')
    setCatalogNotes('')
    setCatalogRestSeconds(90)
    setCatalogSetCount(3)
    setCustomName('')
    setCustomCategory('Strength')
    setCustomRestSeconds(90)
    setCustomSetCount(3)
    setCustomNotes('')
  }

  useEffect(() => {
    if (open) {
      resetState()
    }
  }, [open])

  const filteredExercises = useMemo(() => {
    if (!exercises) return []
    if (!catalogSearch) return exercises
    return exercises.filter((exercise) => exercise.name.toLowerCase().includes(catalogSearch.toLowerCase()))
  }, [catalogSearch, exercises])

  const catalogSelection = useMemo(() => {
    if (!catalogExerciseId || !exercises) return undefined
    return exercises.find((exercise) => exercise.id === catalogExerciseId)
  }, [catalogExerciseId, exercises])

  useEffect(() => {
    if (!catalogSelection) return
    setCatalogRestSeconds(DEFAULT_CATALOG_REST_SECONDS)
  }, [catalogSelection?.id])

  const handleAdd = () => {
    if (tab === 'catalog') {
      if (!catalogSelection) {
        push({ title: 'Select an exercise', tone: 'info' })
        return
      }
      const isCardio = catalogSelection.category === 'Cardio' || catalogSelection.category === 1
      const sets = Array.from({ length: clampSetCount(catalogSetCount) }, () => createSetTemplate(isCardio))
      onAddExercise({
        exerciseId: catalogSelection.id,
        restSeconds: clampRestSeconds(catalogRestSeconds),
        notes: catalogNotes,
        sets,
      })
      return
    }

    if (!customName.trim()) {
      push({ title: 'Provide a custom name', tone: 'info' })
      return
    }

    const isCardio = customCategory === 'Cardio'
    const sets = Array.from({ length: clampSetCount(customSetCount) }, () => createSetTemplate(isCardio))
    onAddExercise({
      customExerciseName: customName.trim(),
      customCategory,
      restSeconds: clampRestSeconds(customRestSeconds),
      notes: customNotes,
      sets,
    })
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Add exercise to session</DialogTitle>
      <DialogContent dividers>
        <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
          <Tab label="Catalog" value="catalog" />
          <Tab label="Custom" value="custom" />
        </Tabs>

        {tab === 'catalog' ? (
          <Stack spacing={2}>
            <TextField label="Search" value={catalogSearch} onChange={(event) => setCatalogSearch(event.target.value)} placeholder="Search exercises" />
            <TextField select label="Exercise" value={catalogExerciseId} onChange={(event) => setCatalogExerciseId(event.target.value)} SelectProps={{ native: true }}>
              <option value="">Select from catalog</option>
              {filteredExercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </option>
              ))}
            </TextField>
            <div className="field-row">
              <TextField
                label="Rest seconds"
                type="number"
                value={catalogRestSeconds}
                onChange={(event) => setCatalogRestSeconds(Number(event.target.value))}
                inputProps={{ min: 0, max: 600 }}
              />
              <TextField
                label="Initial sets"
                type="number"
                value={catalogSetCount}
                onChange={(event) => setCatalogSetCount(Number(event.target.value))}
                inputProps={{ min: 1, max: 10 }}
              />
            </div>
            <TextField label="Notes" multiline minRows={2} value={catalogNotes} onChange={(event) => setCatalogNotes(event.target.value)} />
          </Stack>
        ) : (
          <Stack spacing={2}>
            <TextField label="Exercise name" value={customName} onChange={(event) => setCustomName(event.target.value)} />
            <TextField select label="Category" value={customCategory} onChange={(event) => setCustomCategory(event.target.value as 'Strength' | 'Cardio')} SelectProps={{ native: true }}>
              <option value="Strength">Strength</option>
              <option value="Cardio">Cardio</option>
            </TextField>
            <div className="field-row">
              <TextField
                label="Rest seconds"
                type="number"
                value={customRestSeconds}
                onChange={(event) => setCustomRestSeconds(Number(event.target.value))}
                inputProps={{ min: 0, max: 600 }}
              />
              <TextField
                label="Initial sets"
                type="number"
                value={customSetCount}
                onChange={(event) => setCustomSetCount(Number(event.target.value))}
                inputProps={{ min: 1, max: 10 }}
              />
            </div>
            <TextField label="Notes" multiline minRows={2} value={customNotes} onChange={(event) => setCustomNotes(event.target.value)} />
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleAdd} disabled={isSubmitting}>
          {isSubmitting ? 'Adding…' : 'Add Exercise'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
