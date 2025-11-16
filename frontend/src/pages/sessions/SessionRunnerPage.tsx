import { useParams } from 'react-router-dom'

const SessionRunnerPage = () => {
  const { sessionId } = useParams()
  return (
    <div className="grid" style={{ gap: '1.25rem' }}>
      <div className="section-header">
        <div>
          <h2>Workout session</h2>
          <p style={{ color: 'var(--text-muted)' }}>Session runner coming soon.</p>
        </div>
      </div>
      <div className="card">
        <p>Session ID: {sessionId}</p>
      </div>
    </div>
  )
}

export default SessionRunnerPage
