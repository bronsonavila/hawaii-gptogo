import { Fade } from '@mui/material'
import { ImpactLevel, getImpactColor } from '@/utils/impactUtils'
import { loadSlim } from '@tsparticles/slim'
import { type ISourceOptions } from '@tsparticles/engine'
import { useEffect, useMemo, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import useMediaQuery from '@mui/material/useMediaQuery'
import React from 'react'

interface AnalysisPendingEffectProps {
  isVisible: boolean
}

// Memoize to prevent re-renders caused by parent state changes (e.g., `sortModel` in <Home>).
export const AnalysisPendingEffect = React.memo(({ isVisible }: AnalysisPendingEffectProps) => {
  const [init, setInit] = useState(false)
  const theme = useTheme()
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'))

  const options: ISourceOptions = useMemo(() => {
    const lowColor = getImpactColor(ImpactLevel.Low, theme)
    const mediumColor = getImpactColor(ImpactLevel.Medium, theme)
    const highColor = getImpactColor(ImpactLevel.High, theme)
    const severeColor = getImpactColor(ImpactLevel.Severe, theme)

    const weightedColors = [
      ...Array(8).fill(lowColor),
      ...Array(4).fill(mediumColor),
      ...Array(2).fill(highColor),
      ...Array(1).fill(severeColor)
    ]

    return {
      background: {
        color: {
          value: 'transparent'
        }
      },
      fpsLimit: 60,
      particles: {
        color: {
          value: weightedColors
        },
        links: {
          color: theme.palette.grey[500],
          distance: 150,
          enable: true,
          opacity: 0.2,
          width: 1
        },
        move: {
          direction: 'none',
          enable: true,
          outModes: {
            default: 'bounce'
          },
          random: true,
          speed: { min: 0.1, max: 0.8 },
          straight: false
        },
        number: {
          density: {
            enable: true
          },
          value: 120
        },
        opacity: {
          value: { min: 0.1, max: 0.4 },
          random: true
        },
        shape: {
          type: 'circle'
        },
        size: {
          value: { min: 1, max: 3 },
          random: true
        }
      },
      detectRetina: true,
      fullScreen: {
        enable: true,
        zIndex: -1
      }
    }
  }, [theme])

  useEffect(() => {
    initParticlesEngine(async engine => {
      await loadSlim(engine)
    }).then(() => {
      setInit(true)
    })
  }, [])

  if (!isVisible) return null

  if (init) {
    return (
      <Fade in={isSmUp} timeout={2000}>
        <div>
          <Particles id="tsparticles" options={options} />
        </div>
      </Fade>
    )
  }

  return null
})

AnalysisPendingEffect.displayName = 'AnalysisPendingEffect'
