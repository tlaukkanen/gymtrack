import { Box, Tooltip, Typography } from '@mui/material'

export interface MuscleEngagement {
  muscle: string
  intensity: number // 0-100 scale
}

interface MuscleMapProps {
  engagements: MuscleEngagement[]
}

// Map muscle group names from backend to SVG path IDs
const MUSCLE_GROUPS: Record<string, { label: string; paths: string[] }> = {
  'Chest': { label: 'Chest', paths: ['chest-left', 'chest-right'] },
  'Upper Chest': { label: 'Upper Chest', paths: ['chest-left', 'chest-right'] },
  'Shoulders': { label: 'Shoulders', paths: ['shoulder-left', 'shoulder-right'] },
  'Rear Delts': { label: 'Rear Delts', paths: ['rear-delt-left', 'rear-delt-right'] },
  'Triceps': { label: 'Triceps', paths: ['tricep-left', 'tricep-right'] },
  'Biceps': { label: 'Biceps', paths: ['bicep-left', 'bicep-right'] },
  'Brachialis': { label: 'Brachialis', paths: ['bicep-left', 'bicep-right'] },
  'Forearms': { label: 'Forearms', paths: ['forearm-left', 'forearm-right'] },
  'Lats': { label: 'Lats', paths: ['lat-left', 'lat-right'] },
  'Back': { label: 'Back', paths: ['upper-back', 'lat-left', 'lat-right'] },
  'Upper Back': { label: 'Upper Back', paths: ['upper-back'] },
  'Lower Back': { label: 'Lower Back', paths: ['lower-back'] },
  'Core': { label: 'Core', paths: ['abs'] },
  'Obliques': { label: 'Obliques', paths: ['oblique-left', 'oblique-right'] },
  'Hip Flexors': { label: 'Hip Flexors', paths: ['hip-left', 'hip-right'] },
  'Glutes': { label: 'Glutes', paths: ['glute-left', 'glute-right'] },
  'Quadriceps': { label: 'Quadriceps', paths: ['quad-left', 'quad-right'] },
  'Hamstrings': { label: 'Hamstrings', paths: ['hamstring-left', 'hamstring-right'] },
  'Adductors': { label: 'Adductors', paths: ['quad-left', 'quad-right'] },
  'Calves': { label: 'Calves', paths: ['calf-left', 'calf-right'] },
  'Trapezius': { label: 'Trapezius', paths: ['trap'] },
}

const getIntensityColor = (intensity: number): string => {
  if (intensity === 0) return '#e2e8f0' // Slate 200
  if (intensity <= 25) return '#86efac' // Green 300
  if (intensity <= 50) return '#fde047' // Yellow 300
  if (intensity <= 75) return '#fdba74' // Orange 300
  return '#f87171' // Red 400
}

const getIntensityLabel = (intensity: number): string => {
  if (intensity === 0) return 'Not trained'
  if (intensity <= 25) return 'Light'
  if (intensity <= 50) return 'Moderate'
  if (intensity <= 75) return 'High'
  return 'Intense'
}

export const MuscleMap = ({ engagements }: MuscleMapProps) => {
  // Create a map of path ID to intensity
  const pathIntensities: Record<string, number> = {}
  const pathLabels: Record<string, string[]> = {}

  engagements.forEach(({ muscle, intensity }) => {
    const group = MUSCLE_GROUPS[muscle]
    if (group) {
      group.paths.forEach((pathId) => {
        // Take the max intensity for each path
        pathIntensities[pathId] = Math.max(pathIntensities[pathId] || 0, intensity)
        if (!pathLabels[pathId]) pathLabels[pathId] = []
        if (!pathLabels[pathId].includes(muscle)) {
          pathLabels[pathId].push(muscle)
        }
      })
    }
  })

  const getPathColor = (pathId: string) => getIntensityColor(pathIntensities[pathId] || 0)

  const renderMuscle = (pathId: string, d: string) => {
    const intensity = pathIntensities[pathId] || 0
    const labels = pathLabels[pathId] || []
    const tooltipContent = labels.length > 0
      ? `${labels.join(', ')}: ${getIntensityLabel(intensity)} (${Math.round(intensity)}%)`
      : 'Not trained'

    return (
      <Tooltip key={pathId} title={tooltipContent} arrow placement="top">
        <path
          id={pathId}
          d={d}
          fill={getPathColor(pathId)}
          stroke="#94a3b8"
          strokeWidth="1"
          style={{ transition: 'fill 0.3s ease', cursor: 'pointer' }}
        />
      </Tooltip>
    )
  }

  return (
    <Box className="flex flex-col items-center gap-6 md:flex-row md:justify-center md:gap-12">
      {/* Front View */}
      <Box className="flex flex-col items-center">
        <Typography variant="subtitle2" color="text.secondary" className="mb-2">
          Front
        </Typography>
        <svg viewBox="0 0 200 400" width="160" height="320" aria-label="Front view of human body muscles">
          {/* Head */}
          <ellipse cx="100" cy="30" rx="25" ry="28" fill="#fcd34d" stroke="#94a3b8" strokeWidth="1" />

          {/* Neck */}
          <rect x="90" y="55" width="20" height="15" fill="#fcd34d" stroke="#94a3b8" strokeWidth="1" />

          {/* Trapezius */}
          {renderMuscle('trap', 'M70 70 L90 70 L85 85 L75 85 Z M110 70 L130 70 L125 85 L115 85 Z')}

          {/* Shoulders */}
          {renderMuscle('shoulder-left', 'M50 75 C40 80, 35 100, 45 115 L65 100 L70 75 Z')}
          {renderMuscle('shoulder-right', 'M150 75 C160 80, 165 100, 155 115 L135 100 L130 75 Z')}

          {/* Chest */}
          {renderMuscle('chest-left', 'M70 85 L65 100 L65 130 L90 140 L95 100 L90 85 Z')}
          {renderMuscle('chest-right', 'M130 85 L135 100 L135 130 L110 140 L105 100 L110 85 Z')}

          {/* Biceps */}
          {renderMuscle('bicep-left', 'M45 115 L30 170 L45 175 L60 120 Z')}
          {renderMuscle('bicep-right', 'M155 115 L170 170 L155 175 L140 120 Z')}

          {/* Forearms */}
          {renderMuscle('forearm-left', 'M30 175 L20 240 L35 245 L45 180 Z')}
          {renderMuscle('forearm-right', 'M170 175 L180 240 L165 245 L155 180 Z')}

          {/* Abs */}
          {renderMuscle('abs', 'M90 145 L110 145 L115 200 L100 210 L85 200 Z')}

          {/* Obliques */}
          {renderMuscle('oblique-left', 'M65 135 L85 200 L85 210 L65 195 Z')}
          {renderMuscle('oblique-right', 'M135 135 L115 200 L115 210 L135 195 Z')}

          {/* Hip area */}
          {renderMuscle('hip-left', 'M65 200 L85 215 L80 235 L60 225 Z')}
          {renderMuscle('hip-right', 'M135 200 L115 215 L120 235 L140 225 Z')}

          {/* Quadriceps */}
          {renderMuscle('quad-left', 'M60 230 L80 240 L75 320 L55 320 Z')}
          {renderMuscle('quad-right', 'M140 230 L120 240 L125 320 L145 320 Z')}

          {/* Calves */}
          {renderMuscle('calf-left', 'M55 325 L75 325 L70 390 L60 390 Z')}
          {renderMuscle('calf-right', 'M145 325 L125 325 L130 390 L140 390 Z')}

          {/* Hands */}
          <ellipse cx="15" cy="260" rx="10" ry="15" fill="#fcd34d" stroke="#94a3b8" strokeWidth="1" />
          <ellipse cx="185" cy="260" rx="10" ry="15" fill="#fcd34d" stroke="#94a3b8" strokeWidth="1" />

          {/* Feet */}
          <ellipse cx="65" cy="395" rx="12" ry="6" fill="#fcd34d" stroke="#94a3b8" strokeWidth="1" />
          <ellipse cx="135" cy="395" rx="12" ry="6" fill="#fcd34d" stroke="#94a3b8" strokeWidth="1" />
        </svg>
      </Box>

      {/* Back View */}
      <Box className="flex flex-col items-center">
        <Typography variant="subtitle2" color="text.secondary" className="mb-2">
          Back
        </Typography>
        <svg viewBox="0 0 200 400" width="160" height="320" aria-label="Back view of human body muscles">
          {/* Head */}
          <ellipse cx="100" cy="30" rx="25" ry="28" fill="#fcd34d" stroke="#94a3b8" strokeWidth="1" />

          {/* Neck */}
          <rect x="90" y="55" width="20" height="15" fill="#fcd34d" stroke="#94a3b8" strokeWidth="1" />

          {/* Trapezius */}
          {renderMuscle('trap', 'M75 70 L125 70 L130 95 L100 105 L70 95 Z')}

          {/* Rear Delts */}
          {renderMuscle('rear-delt-left', 'M50 75 C40 80, 35 100, 45 115 L65 100 L70 75 Z')}
          {renderMuscle('rear-delt-right', 'M150 75 C160 80, 165 100, 155 115 L135 100 L130 75 Z')}

          {/* Upper Back */}
          {renderMuscle('upper-back', 'M70 95 L130 95 L125 130 L75 130 Z')}

          {/* Lats */}
          {renderMuscle('lat-left', 'M65 100 L75 130 L80 180 L65 190 L55 150 Z')}
          {renderMuscle('lat-right', 'M135 100 L125 130 L120 180 L135 190 L145 150 Z')}

          {/* Lower Back */}
          {renderMuscle('lower-back', 'M75 135 L125 135 L130 200 L100 210 L70 200 Z')}

          {/* Triceps */}
          {renderMuscle('tricep-left', 'M45 115 L30 170 L45 175 L60 120 Z')}
          {renderMuscle('tricep-right', 'M155 115 L170 170 L155 175 L140 120 Z')}

          {/* Forearms */}
          {renderMuscle('forearm-left', 'M30 175 L20 240 L35 245 L45 180 Z')}
          {renderMuscle('forearm-right', 'M170 175 L180 240 L165 245 L155 180 Z')}

          {/* Glutes */}
          {renderMuscle('glute-left', 'M65 200 L95 210 L90 250 L60 240 Z')}
          {renderMuscle('glute-right', 'M135 200 L105 210 L110 250 L140 240 Z')}

          {/* Hamstrings */}
          {renderMuscle('hamstring-left', 'M60 245 L90 255 L85 330 L55 325 Z')}
          {renderMuscle('hamstring-right', 'M140 245 L110 255 L115 330 L145 325 Z')}

          {/* Calves */}
          {renderMuscle('calf-left', 'M55 330 L85 335 L75 390 L60 390 Z')}
          {renderMuscle('calf-right', 'M145 330 L115 335 L125 390 L140 390 Z')}

          {/* Hands */}
          <ellipse cx="15" cy="260" rx="10" ry="15" fill="#fcd34d" stroke="#94a3b8" strokeWidth="1" />
          <ellipse cx="185" cy="260" rx="10" ry="15" fill="#fcd34d" stroke="#94a3b8" strokeWidth="1" />

          {/* Feet */}
          <ellipse cx="65" cy="395" rx="12" ry="6" fill="#fcd34d" stroke="#94a3b8" strokeWidth="1" />
          <ellipse cx="135" cy="395" rx="12" ry="6" fill="#fcd34d" stroke="#94a3b8" strokeWidth="1" />
        </svg>
      </Box>
    </Box>
  )
}

export const MuscleMapLegend = () => (
  <Box className="flex flex-wrap justify-center gap-4 mt-4">
    {[
      { label: 'Not trained', color: '#e2e8f0' },
      { label: 'Light', color: '#86efac' },
      { label: 'Moderate', color: '#fde047' },
      { label: 'High', color: '#fdba74' },
      { label: 'Intense', color: '#f87171' },
    ].map(({ label, color }) => (
      <Box key={label} className="flex items-center gap-2">
        <Box
          className="rounded"
          sx={{ width: 16, height: 16, backgroundColor: color, border: '1px solid #94a3b8' }}
        />
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </Box>
    ))}
  </Box>
)
