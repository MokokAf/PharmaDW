import Image from 'next/image'
import { cn } from '@/lib/utils'

type LogoSize = 'xs' | 'sm' | 'md' | 'lg'

type Props = {
  size?: LogoSize
  showText?: boolean
  className?: string
  suffix?: React.ReactNode
}

const sizeConfig: Record<LogoSize, { height: number; heightClass: string }> = {
  xs: { height: 20, heightClass: 'h-5' },
  sm: { height: 28, heightClass: 'h-7' },
  md: { height: 36, heightClass: 'h-9' },
  lg: { height: 48, heightClass: 'h-12' },
}

const iconSizeConfig: Record<LogoSize, { size: number; sizeClass: string }> = {
  xs: { size: 20, sizeClass: 'w-5 h-5' },
  sm: { size: 28, sizeClass: 'w-7 h-7' },
  md: { size: 36, sizeClass: 'w-9 h-9' },
  lg: { size: 48, sizeClass: 'w-12 h-12' },
}

export default function DwaIALogo({ size = 'md', showText = true, className, suffix }: Props) {
  const cfg = sizeConfig[size]
  const iconCfg = iconSizeConfig[size]

  if (!showText) {
    return (
      <span className={cn('inline-flex items-center', className)}>
        <Image
          src="/logo-icon.png"
          alt="DwaIA"
          width={iconCfg.size}
          height={iconCfg.size}
          className={cn(iconCfg.sizeClass, 'object-contain')}
        />
      </span>
    )
  }

  const width = Math.round(cfg.height * 3.71)

  return (
    <span className={cn('inline-flex items-center', className)}>
      <Image
        src="/logo.png"
        alt="DwaIA"
        width={width}
        height={cfg.height}
        className={cn(cfg.heightClass, 'w-auto object-contain')}
      />
      {suffix}
    </span>
  )
}
