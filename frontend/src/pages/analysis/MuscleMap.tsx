import { Box, Tooltip, Typography } from '@mui/material'
import { useState } from 'react'

export interface MuscleEngagement {
  muscle: string
  intensity: number // 0-100 scale
}

interface MuscleMapProps {
  engagements: MuscleEngagement[]
}

// Map muscle group names from backend to overlay regions
// Coordinates are percentages relative to the image dimensions (viewBox 0 0 100 100)
// The image has front view on left half (0-50) and back view on right half (50-100)
const MUSCLE_REGIONS: Record<string, { label: string; regions: MuscleRegion[] }> = {
  'Chest': { label: 'Chest', regions: [
    { id: 'chest', view: 'front', path: 'M 18 18 Q 25 15, 32 18 L 32 28 Q 25 31, 18 28 Z' },
  ]},
  'Upper Chest': { label: 'Upper Chest', regions: [
    { id: 'chest', view: 'front', path: 'M 18 18 Q 25 15, 32 18 L 32 28 Q 25 31, 18 28 Z' },
  ]},
  'Shoulders': { label: 'Shoulders', regions: [
    { id: 'shoulder-left', view: 'front', path: 'M 11 16 Q 8 18, 10 26 L 17 24 L 17 18 Q 14 14, 11 16 Z' },
    { id: 'shoulder-right', view: 'front', path: 'M 39 16 Q 42 18, 40 26 L 33 24 L 33 18 Q 36 14, 39 16 Z' },
  ]},
  'Rear Delts': { label: 'Rear Delts', regions: [
    { id: 'rear-delt-left', view: 'back', path: 'M 61 16 Q 58 18, 60 26 L 67 24 L 67 18 Q 64 14, 61 16 Z' },
    { id: 'rear-delt-right', view: 'back', path: 'M 89 16 Q 92 18, 90 26 L 83 24 L 83 18 Q 86 14, 89 16 Z' },
  ]},
  'Triceps': { label: 'Triceps', regions: [
    { id: 'tricep-left', view: 'back', path: 'M 58 26 L 55 40 L 60 42 L 63 28 Z' },
    { id: 'tricep-right', view: 'back', path: 'M 92 26 L 95 40 L 90 42 L 87 28 Z' },
  ]},
  'Biceps': { label: 'Biceps', regions: [
    { id: 'bicep-left', view: 'front', path: 'M 8 26 L 5 40 L 10 42 L 13 28 Z' },
    { id: 'bicep-right', view: 'front', path: 'M 42 26 L 45 40 L 40 42 L 37 28 Z' },
  ]},
  'Brachialis': { label: 'Brachialis', regions: [
    { id: 'bicep-left', view: 'front', path: 'M 8 26 L 5 40 L 10 42 L 13 28 Z' },
    { id: 'bicep-right', view: 'front', path: 'M 42 26 L 45 40 L 40 42 L 37 28 Z' },
  ]},
  'Forearms': { label: 'Forearms', regions: [
    { id: 'forearm-left', view: 'front', path: 'M 4 42 L 2 56 L 7 58 L 9 44 Z' },
    { id: 'forearm-right', view: 'front', path: 'M 46 42 L 48 56 L 43 58 L 41 44 Z' },
  ]},
  'Lats': { label: 'Lats', regions: [
    { id: 'lat-left', view: 'back', path: 'M 64 24 L 62 38 Q 68 42, 74 38 L 72 28 Z' },
    { id: 'lat-right', view: 'back', path: 'M 86 24 L 88 38 Q 82 42, 78 38 L 78 28 Z' },
  ]},
  'Back': { label: 'Back', regions: [
    { id: 'upper-back', view: 'back', path: 'M 68 16 L 82 16 L 84 28 L 66 28 Z' },
    { id: 'lat-left', view: 'back', path: 'M 64 24 L 62 38 Q 68 42, 74 38 L 72 28 Z' },
    { id: 'lat-right', view: 'back', path: 'M 86 24 L 88 38 Q 82 42, 78 38 L 78 28 Z' },
  ]},
  'Upper Back': { label: 'Upper Back', regions: [
    { id: 'upper-back', view: 'back', path: 'M 68 16 L 82 16 L 84 28 L 66 28 Z' },
  ]},
  'Lower Back': { label: 'Lower Back', regions: [
    { id: 'lower-back', view: 'back', path: 'M 68 38 L 82 38 L 84 48 L 66 48 Z' },
  ]},
  'Core': { label: 'Core', regions: [
    { id: 'abs', view: 'front', path: 'M 20 30 L 30 30 L 31 48 L 19 48 Z' },
  ]},
  'Obliques': { label: 'Obliques', regions: [
    { id: 'oblique-left', view: 'front', path: 'M 16 30 L 19 30 L 19 46 L 16 44 Z' },
    { id: 'oblique-right', view: 'front', path: 'M 34 30 L 31 30 L 31 46 L 34 44 Z' },
  ]},
  'Hip Flexors': { label: 'Hip Flexors', regions: [
    { id: 'hip-left', view: 'front', path: 'M 17 48 L 23 48 L 22 54 L 16 52 Z' },
    { id: 'hip-right', view: 'front', path: 'M 33 48 L 27 48 L 28 54 L 34 52 Z' },
  ]},
  'Glutes': { label: 'Glutes', regions: [
    { id: 'glute-left', view: 'back', path: 'M 66 48 L 75 48 L 74 58 L 65 56 Z' },
    { id: 'glute-right', view: 'back', path: 'M 84 48 L 75 48 L 76 58 L 85 56 Z' },
  ]},
  'Quadriceps': { label: 'Quadriceps', regions: [
    { id: 'quad-left', view: 'front', path: 'M 15 54 L 24 54 L 22 78 L 14 78 Z' },
    { id: 'quad-right', view: 'front', path: 'M 35 54 L 26 54 L 28 78 L 36 78 Z' },
  ]},
  'Hamstrings': { label: 'Hamstrings', regions: [
    { id: 'hamstring-left', view: 'back', path: 'M 65 58 L 74 58 L 72 80 L 64 80 Z' },
    { id: 'hamstring-right', view: 'back', path: 'M 85 58 L 76 58 L 78 80 L 86 80 Z' },
  ]},
  'Adductors': { label: 'Adductors', regions: [
    { id: 'adductor-left', view: 'front', path: 'M 21 56 L 24 56 L 24 70 L 21 70 Z' },
    { id: 'adductor-right', view: 'front', path: 'M 26 56 L 29 56 L 29 70 L 26 70 Z' },
  ]},
  'Calves': { label: 'Calves', regions: [
    { id: 'calf-left', view: 'front', path: 'M 15 80 L 22 80 L 21 94 L 16 94 Z' },
    { id: 'calf-right', view: 'front', path: 'M 35 80 L 28 80 L 29 94 L 34 94 Z' },
    { id: 'calf-back-left', view: 'back', path: 'M 65 82 L 72 82 L 71 94 L 66 94 Z' },
    { id: 'calf-back-right', view: 'back', path: 'M 85 82 L 78 82 L 79 94 L 84 94 Z' },
  ]},
  'Trapezius': { label: 'Trapezius', regions: [
    { id: 'trap-back', view: 'back', path: 'M 68 10 L 82 10 L 84 18 L 66 18 Z' },
  ]},
}

interface MuscleRegion {
  id: string
  view: 'front' | 'back'
  path: string
}

// Get intensity color with semi-transparency for overlay effect
const getIntensityColor = (intensity: number): string => {
  if (intensity === 0) return 'transparent'
  if (intensity <= 25) return 'rgba(34, 197, 94, 0.5)' // Green with 50% opacity
  if (intensity <= 50) return 'rgba(234, 179, 8, 0.5)' // Yellow with 50% opacity
  if (intensity <= 75) return 'rgba(249, 115, 22, 0.5)' // Orange with 50% opacity
  return 'rgba(239, 68, 68, 0.55)' // Red with 55% opacity
}

const getIntensityLabel = (intensity: number): string => {
  if (intensity === 0) return 'Not trained'
  if (intensity <= 25) return 'Light'
  if (intensity <= 50) return 'Moderate'
  if (intensity <= 75) return 'High'
  return 'Intense'
}

// Muscle anatomy image URL - can be customized
const MUSCLE_IMAGE_URL = '/muscle-anatomy.png'

export const MuscleMap = ({ engagements }: MuscleMapProps) => {
  const [imageError, setImageError] = useState(false)

  // Create a map of region ID to intensity
  const regionIntensities: Record<string, number> = {}
  const regionLabels: Record<string, string[]> = {}

  engagements.forEach(({ muscle, intensity }) => {
    const group = MUSCLE_REGIONS[muscle]
    if (group) {
      group.regions.forEach((region) => {
        // Take the max intensity for each region
        regionIntensities[region.id] = Math.max(regionIntensities[region.id] || 0, intensity)
        if (!regionLabels[region.id]) regionLabels[region.id] = []
        if (!regionLabels[region.id].includes(muscle)) {
          regionLabels[region.id].push(muscle)
        }
      })
    }
  })

  const renderOverlay = (region: MuscleRegion) => {
    const intensity = regionIntensities[region.id] || 0
    const labels = regionLabels[region.id] || []
    const tooltipContent = labels.length > 0
      ? `${labels.join(', ')}: ${getIntensityLabel(intensity)} (${Math.round(intensity)}%)`
      : ''
    const color = getIntensityColor(intensity)

    if (intensity === 0) return null

    return (
      <Tooltip key={`${region.id}-${region.view}`} title={tooltipContent} arrow placement="top">
        <path
          d={region.path}
          fill={color}
          style={{ cursor: 'pointer', transition: 'fill 0.3s ease' }}
        />
      </Tooltip>
    )
  }

  // Collect all unique regions
  const allRegions: MuscleRegion[] = []
  const seenIds = new Set<string>()
  
  Object.values(MUSCLE_REGIONS).forEach((group) => {
    group.regions.forEach((region) => {
      const key = `${region.id}-${region.view}`
      if (!seenIds.has(key)) {
        seenIds.add(key)
        allRegions.push(region)
      }
    })
  })

  return (
    <Box className="flex flex-col items-center gap-4">
      <Box
        className="relative"
        sx={{
          width: { xs: '100%', sm: 400, md: 500 },
          maxWidth: '100%',
        }}
      >
        {/* Base anatomical image with grayscale filter */}
        {!imageError ? (
          <img
            src={MUSCLE_IMAGE_URL}
            alt="Human muscle anatomy - front and back view"
            onError={() => setImageError(true)}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              filter: 'grayscale(100%) brightness(1.1)',
            }}
          />
        ) : (
          // Fallback placeholder when image is not available
          <Box
            sx={{
              width: '100%',
              aspectRatio: '1 / 1',
              backgroundColor: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2,
              border: '1px dashed #94a3b8',
            }}
          >
            <Typography color="text.secondary" textAlign="center" sx={{ p: 2 }}>
              Add muscle-anatomy.png to the public folder<br />
              <Typography variant="caption" component="span">
                (Use a front and back anatomical muscle image)
              </Typography>
            </Typography>
          </Box>
        )}
        
        {/* SVG overlay for muscle highlights */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <g style={{ pointerEvents: 'auto' }}>
            {allRegions.map(renderOverlay)}
          </g>
        </svg>
      </Box>
    </Box>
  )
}

export const MuscleMapLegend = () => (
  <Box className="flex flex-wrap justify-center gap-4 mt-4">
    {[
      { label: 'Light', color: 'rgba(34, 197, 94, 0.7)' },
      { label: 'Moderate', color: 'rgba(234, 179, 8, 0.7)' },
      { label: 'High', color: 'rgba(249, 115, 22, 0.7)' },
      { label: 'Intense', color: 'rgba(239, 68, 68, 0.7)' },
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
