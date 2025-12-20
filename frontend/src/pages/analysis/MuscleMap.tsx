import { Box, Tooltip, Typography } from '@mui/material'
import { useState } from 'react'

export interface MuscleEngagement {
  muscle: string
  intensity: number // 0-100 scale
}

interface MuscleMapProps {
  engagements: MuscleEngagement[]
}

// Ellipse-based muscle regions for smoother overlay rendering
// cx, cy = center position, rx, ry = radii (all as percentages of viewBox 0-100)
// The image has front view on left half (0-50) and back view on right half (50-100)
interface EllipseRegion {
  id: string
  view: 'front' | 'back'
  cx: number
  cy: number
  rx: number
  ry: number
}

const MUSCLE_ELLIPSES: Record<string, { label: string; regions: EllipseRegion[] }> = {
  'Chest': { label: 'Chest', regions: [
    { id: 'chest-left', view: 'front', cx: 19, cy: 24, rx: 5, ry: 5 },
    { id: 'chest-right', view: 'front', cx: 31, cy: 24, rx: 5, ry: 5 },
  ]},
  'Upper Chest': { label: 'Upper Chest', regions: [
    { id: 'chest-left', view: 'front', cx: 19, cy: 24, rx: 5, ry: 5 },
    { id: 'chest-right', view: 'front', cx: 31, cy: 24, rx: 5, ry: 5 },
  ]},
  'Shoulders': { label: 'Shoulders', regions: [
    { id: 'shoulder-left', view: 'front', cx: 10, cy: 21, rx: 4, ry: 5 },
    { id: 'shoulder-right', view: 'front', cx: 40, cy: 21, rx: 4, ry: 5 },
  ]},
  'Rear Delts': { label: 'Rear Delts', regions: [
    { id: 'rear-delt-left', view: 'back', cx: 60, cy: 21, rx: 4, ry: 5 },
    { id: 'rear-delt-right', view: 'back', cx: 90, cy: 21, rx: 4, ry: 5 },
  ]},
  'Triceps': { label: 'Triceps', regions: [
    { id: 'tricep-left', view: 'back', cx: 56, cy: 34, rx: 2.5, ry: 6 },
    { id: 'tricep-right', view: 'back', cx: 94, cy: 34, rx: 2.5, ry: 6 },
  ]},
  'Biceps': { label: 'Biceps', regions: [
    { id: 'bicep-left', view: 'front', cx: 7, cy: 34, rx: 2.5, ry: 6 },
    { id: 'bicep-right', view: 'front', cx: 43, cy: 34, rx: 2.5, ry: 6 },
  ]},
  'Brachialis': { label: 'Brachialis', regions: [
    { id: 'bicep-left', view: 'front', cx: 7, cy: 34, rx: 2.5, ry: 6 },
    { id: 'bicep-right', view: 'front', cx: 43, cy: 34, rx: 2.5, ry: 6 },
  ]},
  'Forearms': { label: 'Forearms', regions: [
    { id: 'forearm-left', view: 'front', cx: 5, cy: 48, rx: 2, ry: 6 },
    { id: 'forearm-right', view: 'front', cx: 45, cy: 48, rx: 2, ry: 6 },
  ]},
  'Lats': { label: 'Lats', regions: [
    { id: 'lat-left', view: 'back', cx: 64, cy: 32, rx: 5, ry: 8 },
    { id: 'lat-right', view: 'back', cx: 86, cy: 32, rx: 5, ry: 8 },
  ]},
  'Back': { label: 'Back', regions: [
    { id: 'upper-back', view: 'back', cx: 75, cy: 24, rx: 8, ry: 6 },
    { id: 'lat-left', view: 'back', cx: 64, cy: 32, rx: 5, ry: 8 },
    { id: 'lat-right', view: 'back', cx: 86, cy: 32, rx: 5, ry: 8 },
  ]},
  'Upper Back': { label: 'Upper Back', regions: [
    { id: 'upper-back', view: 'back', cx: 75, cy: 24, rx: 8, ry: 6 },
  ]},
  'Lower Back': { label: 'Lower Back', regions: [
    { id: 'lower-back', view: 'back', cx: 75, cy: 44, rx: 6, ry: 5 },
  ]},
  'Core': { label: 'Core', regions: [
    { id: 'abs', view: 'front', cx: 25, cy: 38, rx: 5, ry: 9 },
  ]},
  'Obliques': { label: 'Obliques', regions: [
    { id: 'oblique-left', view: 'front', cx: 16, cy: 38, rx: 3, ry: 7 },
    { id: 'oblique-right', view: 'front', cx: 34, cy: 38, rx: 3, ry: 7 },
  ]},
  'Hip Flexors': { label: 'Hip Flexors', regions: [
    { id: 'hip-left', view: 'front', cx: 19, cy: 51, rx: 4, ry: 3 },
    { id: 'hip-right', view: 'front', cx: 31, cy: 51, rx: 4, ry: 3 },
  ]},
  'Glutes': { label: 'Glutes', regions: [
    { id: 'glute-left', view: 'back', cx: 69, cy: 53, rx: 5, ry: 5 },
    { id: 'glute-right', view: 'back', cx: 81, cy: 53, rx: 5, ry: 5 },
  ]},
  'Quadriceps': { label: 'Quadriceps', regions: [
    { id: 'quad-left', view: 'front', cx: 19, cy: 67, rx: 5, ry: 11 },
    { id: 'quad-right', view: 'front', cx: 31, cy: 67, rx: 5, ry: 11 },
  ]},
  'Hamstrings': { label: 'Hamstrings', regions: [
    { id: 'hamstring-left', view: 'back', cx: 68, cy: 70, rx: 4, ry: 10 },
    { id: 'hamstring-right', view: 'back', cx: 82, cy: 70, rx: 4, ry: 10 },
  ]},
  'Adductors': { label: 'Adductors', regions: [
    { id: 'adductor-left', view: 'front', cx: 22, cy: 62, rx: 2, ry: 6 },
    { id: 'adductor-right', view: 'front', cx: 28, cy: 62, rx: 2, ry: 6 },
  ]},
  'Calves': { label: 'Calves', regions: [
    { id: 'calf-left', view: 'front', cx: 18, cy: 87, rx: 3, ry: 6 },
    { id: 'calf-right', view: 'front', cx: 32, cy: 87, rx: 3, ry: 6 },
    { id: 'calf-back-left', view: 'back', cx: 68, cy: 88, rx: 3, ry: 6 },
    { id: 'calf-back-right', view: 'back', cx: 82, cy: 88, rx: 3, ry: 6 },
  ]},
  'Trapezius': { label: 'Trapezius', regions: [
    { id: 'trap-front-left', view: 'front', cx: 20, cy: 16, rx: 3, ry: 2 },
    { id: 'trap-front-right', view: 'front', cx: 30, cy: 16, rx: 3, ry: 2 },
    { id: 'trap-back', view: 'back', cx: 75, cy: 16, rx: 8, ry: 5 },
  ]},
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

// Pre-compute all unique ellipse regions from MUSCLE_ELLIPSES (static data)
const ALL_ELLIPSE_REGIONS: EllipseRegion[] = (() => {
  const regions: EllipseRegion[] = []
  const seenIds = new Set<string>()
  
  Object.values(MUSCLE_ELLIPSES).forEach((group) => {
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
    const group = MUSCLE_ELLIPSES[muscle]
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
    
    ALL_ELLIPSE_REGIONS.forEach((region) => {
      const intensity = regionIntensities[region.id] || 0
      if (intensity === 0) return

      const color = getBaseColor(intensity)
      const gradientId = `gradient-${region.id}-${region.view}`
      
      gradients.push(
        <radialGradient
          key={gradientId}
          id={gradientId}
          cx="50%"
          cy="50%"
          r="50%"
          fx="50%"
          fy="50%"
        >
          <stop offset="0%" stopColor={`rgba(${color.r}, ${color.g}, ${color.b}, 0.7)`} />
          <stop offset="50%" stopColor={`rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`} />
          <stop offset="100%" stopColor={`rgba(${color.r}, ${color.g}, ${color.b}, 0)`} />
        </radialGradient>
      )
    })
    
    return gradients
  }

  const renderEllipseOverlay = (region: EllipseRegion) => {
    const intensity = regionIntensities[region.id] || 0
    const labels = regionLabels[region.id] || []
    const tooltipContent = labels.length > 0
      ? `${labels.join(', ')}: ${getIntensityLabel(intensity)} (${Math.round(intensity)}%)`
      : ''

    if (intensity === 0) return null

    const gradientId = `gradient-${region.id}-${region.view}`

    return (
      <Tooltip key={`${region.id}-${region.view}`} title={tooltipContent} arrow placement="top">
        <ellipse
          cx={region.cx}
          cy={region.cy}
          rx={region.rx}
          ry={region.ry}
          fill={`url(#${gradientId})`}
          style={{ 
            cursor: 'pointer', 
            transition: 'opacity 0.3s ease',
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
        {/* Base anatomical image with brightness filter */}
        {!imageError ? (
          <img
            src={MUSCLE_IMAGE_URL}
            alt="Human muscle anatomy - front and back view"
            onError={() => setImageError(true)}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              filter: 'brightness(1.3) contrast(0.95)',
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
        
        {/* SVG overlay for muscle highlights using ellipses */}
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
            {ALL_ELLIPSE_REGIONS.map(renderEllipseOverlay)}
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
          className="rounded-full"
          sx={{ width: 16, height: 16, backgroundColor: color }}
        />
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </Box>
    ))}
  </Box>
)
