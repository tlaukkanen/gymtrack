import { useMemo } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import type { WorkoutSessionProgressPointDto } from '../../types/api'
import { Card } from '../ui/Card'

const axisFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 })

interface ProgramLoadChartProps {
  points?: WorkoutSessionProgressPointDto[]
  currentSessionId: string
  isLoading?: boolean
}

type ChartDatum = WorkoutSessionProgressPointDto & {
  label: string
}

const ProgramLoadChart = ({ points, currentSessionId, isLoading = false }: ProgramLoadChartProps) => {
  const data = useMemo<ChartDatum[]>(() => {
    if (!points) return []
    return points.map((point) => ({
      ...point,
      label: new Date(point.completedAt).toLocaleDateString(),
    }))
  }, [points])

  const renderDot = (props: any) => {
    const { cx, cy, payload } = props as { cx?: number; cy?: number; payload?: ChartDatum }
    if (!cx || !cy || !payload) return null
    if (payload.sessionId === currentSessionId) {
      return <circle cx={cx} cy={cy} r={6} fill="var(--accent-strong)" stroke="var(--bg)" strokeWidth={2} />
    }
    return <circle cx={cx} cy={cy} r={4} fill="var(--card-muted)" stroke="var(--accent)" strokeWidth={1.5} />
  }

  if (!isLoading && data.length === 0) {
    return null
  }

  return (
    <Card>
      <div className="section-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h3>Load progression</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Timeline of total weight lifted per completed session.</p>
        </div>
      </div>
      <div style={{ height: 260 }}>
        {isLoading ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Loading progression…</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: 8, right: 12, top: 10, bottom: 0 }}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.25)" strokeDasharray="4 4" />
              <XAxis
                dataKey="label"
                tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                stroke="var(--text-muted)"
              />
              <YAxis
                tickFormatter={(value) => `${axisFormatter.format(value as number)} kg`}
                tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                stroke="var(--text-muted)"
              />
              <Tooltip
                contentStyle={{ background: 'var(--card-muted)', border: '1px solid var(--border)' }}
                labelStyle={{ color: 'var(--text-muted)' }}
                formatter={(value: number) => [`${axisFormatter.format(value)} kg`, 'Total load']}
              />
              <Line
                type="monotone"
                dataKey="totalWeightLiftedKg"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={renderDot}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}

export default ProgramLoadChart
