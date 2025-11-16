import type { IconBaseProps } from 'react-icons'
import { FiActivity, FiLayers, FiLogOut, FiUser, FiSettings } from 'react-icons/fi'

export const iconRegistry = {
  dashboard: FiActivity,
  programs: FiLayers,
  profile: FiUser,
  logout: FiLogOut,
  settings: FiSettings,
} as const

export type IconName = keyof typeof iconRegistry

interface IconProps extends Omit<IconBaseProps, 'name'> {
  name: IconName
}

export const Icon = ({ name, ...props }: IconProps) => {
  const Component = iconRegistry[name]
  return <Component aria-hidden focusable={false} {...props} />
}
