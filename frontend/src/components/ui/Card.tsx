import Paper, { type PaperProps } from '@mui/material/Paper'
import { alpha } from '@mui/material/styles'
import clsx from 'clsx'

interface CardProps extends PaperProps {
  muted?: boolean
  type?: string
}

export const Card = ({ className, muted = false, sx, ...props }: CardProps) => {
  return (
    <Paper
      elevation={0}
      {...props}
      className={clsx('card', muted && 'card-muted', className)}
      sx={{
        p: 3,
        borderRadius: 0.4,
        border: (theme) => `1px solid ${alpha(theme.palette.common.white, 0.12)}`,
        backgroundColor: (theme) => (muted ? theme.palette.background.default : theme.palette.background.paper),
        ...sx,
      }}
    />
  )
}
