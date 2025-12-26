import { useMemo, useState } from 'react'
import { Dialog, DialogActions, DialogContent, DialogTitle, Stack, Tab, Tabs, TextField } from '@mui/material'

import type { AddSessionExerciseRequest, ExerciseDto } from '../../types/api'
import { useToast } from '../feedback/ToastProvider'
import { Button } from '../ui/Button'

const clampSetCount = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return 1
  return Math.min(10, Math.max(1, Math.round(value)))
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
  const [catalogSetCount, setCatalogSetCount] = useState(3)
  const [customName, setCustomName] = useState('')
  const [customCategory, setCustomCategory] = useState<'Strength' | 'Cardio'>('Strength')
  const [customSetCount, setCustomSetCount] = useState(3)
  const [customNotes, setCustomNotes] = useState('')

  const resetState = () => {
    setTab('catalog')
    setCatalogSearch('')
    setCatalogExerciseId('')
    setCatalogNotes('')
    setCatalogSetCount(3)
    setCustomName('')
    setCustomCategory('Strength')
    setCustomSetCount(3)
    setCustomNotes('')
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const filteredExercises = useMemo(() => {
    if (!exercises) return []
    if (!catalogSearch) return exercises
    return exercises.filter((exercise) => exercise.name.toLowerCase().includes(catalogSearch.toLowerCase()))
  }, [catalogSearch, exercises])

  const catalogSelection = useMemo(() => {
    if (!catalogExerciseId || !exercises) return undefined
    return exercises.find((exercise) => exercise.id === catalogExerciseId)
  }, [catalogExerciseId, exercises])

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
      notes: customNotes,
      sets,
    })
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
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
            <TextField
              label="Initial sets"
              type="number"
              value={catalogSetCount}
              onChange={(event) => setCatalogSetCount(Number(event.target.value))}
              inputProps={{ min: 1, max: 10 }}
              fullWidth
            />
            <TextField label="Notes" multiline minRows={2} value={catalogNotes} onChange={(event) => setCatalogNotes(event.target.value)} />
          </Stack>
        ) : (
          <Stack spacing={2}>
            <TextField label="Exercise name" value={customName} onChange={(event) => setCustomName(event.target.value)} />
            <TextField select label="Category" value={customCategory} onChange={(event) => setCustomCategory(event.target.value as 'Strength' | 'Cardio')} SelectProps={{ native: true }}>
              <option value="Strength">Strength</option>
              <option value="Cardio">Cardio</option>
            </TextField>
            <TextField
              label="Initial sets"
              type="number"
              value={customSetCount}
              onChange={(event) => setCustomSetCount(Number(event.target.value))}
              inputProps={{ min: 1, max: 10 }}
              fullWidth
            />
            <TextField label="Notes" multiline minRows={2} value={customNotes} onChange={(event) => setCustomNotes(event.target.value)} />
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="ghost" onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleAdd} disabled={isSubmitting}>
          {isSubmitting ? 'Adding…' : 'Add Exercise'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
