import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { exerciseApi, programsApi, sessionsApi } from '../../api/requests'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useToast } from '../../components/feedback/ToastProvider'
import { useNavigate } from 'react-router-dom'
import ProgramCard from '../../components/dashboard/ProgramCard'
import { useMemo } from 'react'
import type { WorkoutSessionSummaryDto } from '../../types/api'

const DashboardPage = () => {
  const { data: programs, isLoading } = useQuery({ queryKey: ['programs'], queryFn: programsApi.list })
  const { data: exercises } = useQuery({ queryKey: ['exercises'], queryFn: exerciseApi.list })
  const { data: recentSessions } = useQuery({
    queryKey: ['sessions', 'completed', 'recent'],
    queryFn: () => sessionsApi.list({ status: 'Completed', page: 1, pageSize: 50 }),
    staleTime: 10_000,
  })
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

  const latestSessionsByProgram = useMemo(() => {
    const sessions = recentSessions?.items ?? []
    const map = new Map<string, WorkoutSessionSummaryDto>()
    for (const session of sessions) {
      if (!map.has(session.programId)) {
        map.set(session.programId, session)
      }
    }
    return map
  }, [recentSessions])

  const sortedPrograms = useMemo(() => {
    if (!programs) return []
    return [...programs].sort((a, b) => {
      const aCompleted = latestSessionsByProgram.get(a.id)?.completedAt
      const bCompleted = latestSessionsByProgram.get(b.id)?.completedAt
      if (aCompleted && bCompleted) return new Date(bCompleted).getTime() - new Date(aCompleted).getTime()
      if (aCompleted) return -1
      if (bCompleted) return 1
      return 0
    })
  }, [programs, latestSessionsByProgram])

  return (
    <div className="grid" style={{ gap: '1.5rem' }}>
      <div className="section-header">
        <div>
          <h2>Dashboard</h2>
          <p style={{ color: 'var(--text-muted)' }}>Programs, catalog, and active workouts.</p>
        </div>
        <Button onClick={() => navigate('/app/programs/new')}>New Program</Button>
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
          {sortedPrograms.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              latestSession={latestSessionsByProgram.get(program.id)}
              onEdit={() => navigate(`/app/programs/${program.id}/edit`)}
              onDelete={() => deleteMutation.mutate(program.id)}
              onStartSession={() => startSessionMutation.mutate(program.id)}
              deletePending={deleteMutation.isPending && deleteMutation.variables === program.id}
              startPending={startSessionMutation.isPending && startSessionMutation.variables === program.id}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

export default DashboardPage
