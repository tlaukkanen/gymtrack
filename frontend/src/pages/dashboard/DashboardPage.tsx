import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { exerciseApi, programsApi, sessionsApi } from '../../api/requests'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useToast } from '../../components/feedback/ToastProvider'
import { formatDate } from '../../utils/time'
import { useNavigate } from 'react-router-dom'
import { Edit, Play, Trash } from 'lucide-react'

const DashboardPage = () => {
  const { data: programs, isLoading } = useQuery({ queryKey: ['programs'], queryFn: programsApi.list })
  const { data: exercises } = useQuery({ queryKey: ['exercises'], queryFn: exerciseApi.list })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { push } = useToast()

  const deleteMutation = useMutation({
    mutationFn: (id: string) => programsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] })
      push({ title: 'Program removed', tone: 'success' })
    },
    onError: () => push({ title: 'Unable to delete program', tone: 'error' }),
  })

  const startSessionMutation = useMutation({
    mutationFn: (programId: string) => sessionsApi.start(programId, { notes: '' }),
    onSuccess: (session) => {
      push({ title: 'Session started', description: 'Let’s lift.' })
      navigate(`/app/sessions/${session.id}`)
    },
    onError: () => push({ title: 'Unable to start session', tone: 'error' }),
  })

  return (
    <div className="grid" style={{ gap: '1.5rem' }}>
      <div className="section-header">
        <div>
          <h2>Dashboard</h2>
          <p style={{ color: 'var(--text-muted)' }}>Programs, catalog, and active workouts.</p>
        </div>
        <Button onClick={() => navigate('/app/programs/new')}>New Program</Button>
      </div>

      <div className="grid grid-2">
        <Card>
          <h3>Programs</h3>
          <p style={{ fontSize: '2rem', margin: '0.25rem 0' }}>{programs?.length ?? 0}</p>
          <p style={{ color: 'var(--text-muted)' }}>Templates ready to train.</p>
        </Card>
        <Card>
          <h3>Exercise catalog</h3>
          <p style={{ fontSize: '2rem', margin: '0.25rem 0' }}>{exercises?.length ?? 0}</p>
          <p style={{ color: 'var(--text-muted)' }}>Movements available.</p>
        </Card>
      </div>

      <section>
        <div className="section-header">
          <h3>Your workout programs</h3>
        </div>
        {isLoading && <p>Loading programs…</p>}
        {!isLoading && (!programs || programs.length === 0) && (
          <Card>
            <p>No programs yet. Create your first template to get started.</p>
            <Button style={{ marginTop: '1rem' }} onClick={() => navigate('/app/programs/new')}>
              Build a program
            </Button>
          </Card>
        )}
        <div className="grid grid-2">
          {programs?.map((program) => (
            <Card key={program.id} className="card-muted">
              <div className="section-header" style={{ alignItems: 'flex-start' }}>
                <div>
                  <h4>{program.name}</h4>
                  {program.description && <p style={{ color: 'var(--text-muted)', marginTop: '0.3rem' }}>{program.description}</p>}
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {program.exerciseCount} exercises • created {formatDate(program.createdAt)}
                  </p>
                </div>
                <Button variant="ghost" 
                  startIcon={<Edit size={16} />}
                  onClick={() => navigate(`/app/programs/${program.id}/edit`)}>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  startIcon={<Trash size={16} />}
                  onClick={() => deleteMutation.mutate(program.id)}
                  disabled={deleteMutation.isPending}
                >
                  Delete
                </Button>
              </div>
              <div className="field-row" style={{ marginTop: '1.25rem' }}>
                <Button
                  onClick={() => startSessionMutation.mutate(program.id)}
                  startIcon={<Play size={16} />}
                  disabled={startSessionMutation.isPending}
                  fullWidth
                >
                  {startSessionMutation.isPending ? 'Starting…' : 'Start Workout'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}

export default DashboardPage
