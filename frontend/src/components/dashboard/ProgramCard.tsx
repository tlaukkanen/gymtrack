import { Edit, Play, Trash } from 'lucide-react'
import type { WorkoutProgramSummaryDto, WorkoutSessionSummaryDto } from '../../types/api'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { formatDate } from '../../utils/time'
import { useMemo } from 'react'

const weightFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
})

interface ProgramCardProps {
  program: WorkoutProgramSummaryDto
  latestSession?: WorkoutSessionSummaryDto
  onEdit: () => void
  onDelete: () => void
  onStartSession: () => void
  deletePending?: boolean
  startPending?: boolean
}

const ProgramCard = ({
  program,
  latestSession,
  onEdit,
  onDelete,
  onStartSession,
  deletePending = false,
  startPending = false,
}: ProgramCardProps) => {
  const formattedWeight = useMemo(() => {
    if (latestSession?.totalWeightLiftedKg == null) {
      return '—'
    }
    return `${weightFormatter.format(latestSession.totalWeightLiftedKg)} kg`
  }, [latestSession])

  const completionLabel = latestSession?.completedAt
    ? `Completed ${formatDate(latestSession.completedAt)}`
    : 'No completed workouts yet'

  return (
    <Card className="card-muted">
      <div className="section-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <h4>{program.name}</h4>
          {program.description && (
            <p style={{ color: 'var(--text-muted)', marginTop: '0.3rem' }}>{program.description}</p>
          )}
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {program.exerciseCount} exercises • created {formatDate(program.createdAt)}
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Total {formattedWeight} • {completionLabel}
          </p>
        </div>
        <Button variant="ghost" startIcon={<Edit size={16} />} onClick={onEdit}>
          Edit
        </Button>
        <Button
          variant="ghost"
          startIcon={<Trash size={16} />}
          onClick={onDelete}
          disabled={deletePending}
        >
          {deletePending ? 'Removing…' : 'Delete'}
        </Button>
      </div>
      <div className="field-row" style={{ marginTop: '1.25rem' }}>
        <Button
          onClick={onStartSession}
          startIcon={<Play size={16} />}
          disabled={startPending}
          fullWidth
        >
          {startPending ? 'Starting…' : 'Start Workout'}
        </Button>
      </div>
    </Card>
  )
}

export default ProgramCard
