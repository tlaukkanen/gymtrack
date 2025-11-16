import MuiButton, { type ButtonProps as MuiButtonProps } from '@mui/material/Button'
import type { SxProps, Theme } from '@mui/material/styles'
import clsx from 'clsx'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends Omit<MuiButtonProps, 'variant' | 'color'> {
  variant?: ButtonVariant
}

const variantConfig: Record<ButtonVariant, { color?: MuiButtonProps['color']; muiVariant?: MuiButtonProps['variant']; sx?: SxProps<Theme> }> = {
  primary: {
    color: 'primary',
    muiVariant: 'contained',
  },
  secondary: {
    color: 'secondary',
    muiVariant: 'contained',
  },
  danger: {
    color: 'error',
    muiVariant: 'contained',
  },
  ghost: {
    color: 'inherit',
    muiVariant: 'text',
    sx: {
      color: (theme) => theme.palette.text.secondary,
    },
  },
}

export const Button = ({ variant = 'primary', className, sx: sxProp, ...props }: ButtonProps) => {
  const config = variantConfig[variant]
  const mergedSx = [
    {
      borderRadius: 2,
      fontWeight: 600,
    },
    ...(config.sx ? [config.sx] : []),
    ...(sxProp ? [sxProp] : []),
  ] as SxProps<Theme>

  return (
    <MuiButton
      disableElevation
      {...props}
      variant={config.muiVariant}
      color={config.color}
      className={clsx('btn', `btn-${variant}`, className)}
      sx={mergedSx}
    />
  )
}
