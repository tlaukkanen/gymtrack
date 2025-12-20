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
// Adjusted to match the anatomical muscle image layout
const MUSCLE_REGIONS: Record<string, { label: string; regions: MuscleRegion[] }> = {
  'Chest': { label: 'Chest', regions: [
    { id: 'chest-left', view: 'front', path: 'M 15 20 Q 18 18, 22 20 L 23 28 Q 20 30, 15 28 Z' },
    { id: 'chest-right', view: 'front', path: 'M 28 20 Q 32 18, 35 20 L 35 28 Q 30 30, 27 28 Z' },
  ]},
  'Upper Chest': { label: 'Upper Chest', regions: [
    { id: 'chest-left', view: 'front', path: 'M 15 20 Q 18 18, 22 20 L 23 28 Q 20 30, 15 28 Z' },
    { id: 'chest-right', view: 'front', path: 'M 28 20 Q 32 18, 35 20 L 35 28 Q 30 30, 27 28 Z' },
  ]},
  'Shoulders': { label: 'Shoulders', regions: [
    { id: 'shoulder-left', view: 'front', path: 'M 8 17 Q 5 20, 7 28 L 14 26 L 14 19 Q 11 16, 8 17 Z' },
    { id: 'shoulder-right', view: 'front', path: 'M 42 17 Q 45 20, 43 28 L 36 26 L 36 19 Q 39 16, 42 17 Z' },
  ]},
  'Rear Delts': { label: 'Rear Delts', regions: [
    { id: 'rear-delt-left', view: 'back', path: 'M 58 17 Q 55 20, 57 28 L 64 26 L 64 19 Q 61 16, 58 17 Z' },
    { id: 'rear-delt-right', view: 'back', path: 'M 92 17 Q 95 20, 93 28 L 86 26 L 86 19 Q 89 16, 92 17 Z' },
  ]},
  'Triceps': { label: 'Triceps', regions: [
    { id: 'tricep-left', view: 'back', path: 'M 55 28 Q 53 32, 54 40 L 59 42 L 62 30 Z' },
    { id: 'tricep-right', view: 'back', path: 'M 95 28 Q 97 32, 96 40 L 91 42 L 88 30 Z' },
  ]},
  'Biceps': { label: 'Biceps', regions: [
    { id: 'bicep-left', view: 'front', path: 'M 5 28 Q 3 32, 4 40 L 9 42 L 12 30 Z' },
    { id: 'bicep-right', view: 'front', path: 'M 45 28 Q 47 32, 46 40 L 41 42 L 38 30 Z' },
  ]},
  'Brachialis': { label: 'Brachialis', regions: [
    { id: 'bicep-left', view: 'front', path: 'M 5 28 Q 3 32, 4 40 L 9 42 L 12 30 Z' },
    { id: 'bicep-right', view: 'front', path: 'M 45 28 Q 47 32, 46 40 L 41 42 L 38 30 Z' },
  ]},
  'Forearms': { label: 'Forearms', regions: [
    { id: 'forearm-left', view: 'front', path: 'M 3 42 Q 1 48, 3 56 L 8 56 L 10 44 Z' },
    { id: 'forearm-right', view: 'front', path: 'M 47 42 Q 49 48, 47 56 L 42 56 L 40 44 Z' },
  ]},
  'Lats': { label: 'Lats', regions: [
    { id: 'lat-left', view: 'back', path: 'M 62 24 Q 58 30, 62 40 L 70 38 L 70 26 Z' },
    { id: 'lat-right', view: 'back', path: 'M 88 24 Q 92 30, 88 40 L 80 38 L 80 26 Z' },
  ]},
  'Back': { label: 'Back', regions: [
    { id: 'upper-back', view: 'back', path: 'M 66 18 Q 75 15, 84 18 L 84 30 Q 75 33, 66 30 Z' },
    { id: 'lat-left', view: 'back', path: 'M 62 24 Q 58 30, 62 40 L 70 38 L 70 26 Z' },
    { id: 'lat-right', view: 'back', path: 'M 88 24 Q 92 30, 88 40 L 80 38 L 80 26 Z' },
  ]},
  'Upper Back': { label: 'Upper Back', regions: [
    { id: 'upper-back', view: 'back', path: 'M 66 18 Q 75 15, 84 18 L 84 30 Q 75 33, 66 30 Z' },
  ]},
  'Lower Back': { label: 'Lower Back', regions: [
    { id: 'lower-back', view: 'back', path: 'M 68 38 Q 75 36, 82 38 L 82 48 Q 75 50, 68 48 Z' },
  ]},
  'Core': { label: 'Core', regions: [
    { id: 'abs', view: 'front', path: 'M 19 30 Q 25 28, 31 30 L 31 48 Q 25 50, 19 48 Z' },
  ]},
  'Obliques': { label: 'Obliques', regions: [
    { id: 'oblique-left', view: 'front', path: 'M 14 30 L 18 30 L 18 46 Q 14 44, 14 40 Z' },
    { id: 'oblique-right', view: 'front', path: 'M 36 30 L 32 30 L 32 46 Q 36 44, 36 40 Z' },
  ]},
  'Hip Flexors': { label: 'Hip Flexors', regions: [
    { id: 'hip-left', view: 'front', path: 'M 16 48 L 23 48 L 22 55 Q 18 54, 16 52 Z' },
    { id: 'hip-right', view: 'front', path: 'M 34 48 L 27 48 L 28 55 Q 32 54, 34 52 Z' },
  ]},
  'Glutes': { label: 'Glutes', regions: [
    { id: 'glute-left', view: 'back', path: 'M 64 48 Q 68 46, 74 48 L 73 60 Q 67 58, 64 56 Z' },
    { id: 'glute-right', view: 'back', path: 'M 86 48 Q 82 46, 76 48 L 77 60 Q 83 58, 86 56 Z' },
  ]},
  'Quadriceps': { label: 'Quadriceps', regions: [
    { id: 'quad-left', view: 'front', path: 'M 14 55 Q 18 53, 24 55 L 22 78 Q 17 79, 13 78 Z' },
    { id: 'quad-right', view: 'front', path: 'M 36 55 Q 32 53, 26 55 L 28 78 Q 33 79, 37 78 Z' },
  ]},
  'Hamstrings': { label: 'Hamstrings', regions: [
    { id: 'hamstring-left', view: 'back', path: 'M 64 60 Q 68 58, 73 60 L 71 82 Q 66 83, 63 82 Z' },
    { id: 'hamstring-right', view: 'back', path: 'M 86 60 Q 82 58, 77 60 L 79 82 Q 84 83, 87 82 Z' },
  ]},
  'Adductors': { label: 'Adductors', regions: [
    { id: 'adductor-left', view: 'front', path: 'M 21 56 Q 24 55, 25 56 L 25 72 Q 22 72, 21 70 Z' },
    { id: 'adductor-right', view: 'front', path: 'M 29 56 Q 26 55, 25 56 L 25 72 Q 28 72, 29 70 Z' },
  ]},
  'Calves': { label: 'Calves', regions: [
    { id: 'calf-left', view: 'front', path: 'M 14 80 Q 18 78, 22 80 L 21 94 Q 17 95, 15 94 Z' },
    { id: 'calf-right', view: 'front', path: 'M 36 80 Q 32 78, 28 80 L 29 94 Q 33 95, 35 94 Z' },
    { id: 'calf-back-left', view: 'back', path: 'M 64 84 Q 68 82, 72 84 L 71 96 Q 67 97, 65 96 Z' },
    { id: 'calf-back-right', view: 'back', path: 'M 86 84 Q 82 82, 78 84 L 79 96 Q 83 97, 85 96 Z' },
  ]},
  'Trapezius': { label: 'Trapezius', regions: [
    { id: 'trap-front-left', view: 'front', path: 'M 18 14 Q 22 12, 25 14 L 24 18 Q 20 17, 17 18 Z' },
    { id: 'trap-front-right', view: 'front', path: 'M 32 14 Q 28 12, 25 14 L 26 18 Q 30 17, 33 18 Z' },
    { id: 'trap-back', view: 'back', path: 'M 66 12 Q 75 8, 84 12 L 84 22 Q 75 18, 66 22 Z' },
  ]},
}

interface MuscleRegion {
  id: string
  view: 'front' | 'back'
  path: string
}

// Get intensity gradient ID
const getGradientId = (regionId: string, intensity: number): string => {
  if (intensity === 0) return ''
  if (intensity <= 25) return `gradient-green-${regionId}`
  if (intensity <= 50) return `gradient-yellow-${regionId}`
  if (intensity <= 75) return `gradient-orange-${regionId}`
  return `gradient-red-${regionId}`
}

// Get base color for gradient
const getBaseColor = (intensity: number): { r: number; g: number; b: number } => {
  if (intensity <= 25) return { r: 34, g: 197, b: 94 } // Green
  if (intensity <= 50) return { r: 234, g: 179, b: 8 } // Yellow
  if (intensity <= 75) return { r: 249, g: 115, b: 22 } // Orange
  return { r: 239, g: 68, b: 68 } // Red
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

// Pre-compute all unique regions from MUSCLE_REGIONS (static data)
const ALL_REGIONS: MuscleRegion[] = (() => {
  const regions: MuscleRegion[] = []
  const seenIds = new Set<string>()
  
  Object.values(MUSCLE_REGIONS).forEach((group) => {
    group.regions.forEach((region) => {
      const key = `${region.id}-${region.view}`
      if (!seenIds.has(key)) {
        seenIds.add(key)
        regions.push(region)
      }
    })
  })
  return regions
})()

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

  const renderGradientDefs = () => {
    const gradients: JSX.Element[] = []
    
    ALL_REGIONS.forEach((region) => {
      const intensity = regionIntensities[region.id] || 0
      if (intensity === 0) return

      const color = getBaseColor(intensity)
      const gradientId = getGradientId(region.id, intensity)
      
      gradients.push(
        <radialGradient
          key={gradientId}
          id={gradientId}
          cx="50%"
          cy="50%"
          r="70%"
          fx="50%"
          fy="50%"
        >
          <stop offset="0%" stopColor={`rgba(${color.r}, ${color.g}, ${color.b}, 0.6)`} />
          <stop offset="60%" stopColor={`rgba(${color.r}, ${color.g}, ${color.b}, 0.4)`} />
          <stop offset="100%" stopColor={`rgba(${color.r}, ${color.g}, ${color.b}, 0.1)`} />
        </radialGradient>
      )
    })
    
    return gradients
  }

  const renderOverlay = (region: MuscleRegion) => {
    const intensity = regionIntensities[region.id] || 0
    const labels = regionLabels[region.id] || []
    const tooltipContent = labels.length > 0
      ? `${labels.join(', ')}: ${getIntensityLabel(intensity)} (${Math.round(intensity)}%)`
      : ''

    if (intensity === 0) return null

    const gradientId = getGradientId(region.id, intensity)

    return (
      <Tooltip key={`${region.id}-${region.view}`} title={tooltipContent} arrow placement="top">
        <path
          d={region.path}
          fill={`url(#${gradientId})`}
          style={{ 
            cursor: 'pointer', 
            transition: 'opacity 0.3s ease',
            mixBlendMode: 'multiply',
          }}
        />
      </Tooltip>
    )
  }

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
          <defs>
            {renderGradientDefs()}
          </defs>
          <g style={{ pointerEvents: 'auto' }}>
            {ALL_REGIONS.map(renderOverlay)}
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
