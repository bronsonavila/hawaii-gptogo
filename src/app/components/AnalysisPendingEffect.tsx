import { Fade } from '@mui/material'
import { ImpactLevel, getImpactColor } from '@/utils/impactUtils'
import { loadSlim } from '@tsparticles/slim'
import { type ISourceOptions } from '@tsparticles/engine'
import { useEffect, useMemo, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import useMediaQuery from '@mui/material/useMediaQuery'

interface AnalysisPendingEffectProps {
  isVisible: boolean
}

export const AnalysisPendingEffect = ({ isVisible }: AnalysisPendingEffectProps) => {
  const [init, setInit] = useState(false)
  const theme = useTheme()
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'))

  const options: ISourceOptions = useMemo(() => {
    const lowColor = getImpactColor(ImpactLevel.Low, theme)
    const mediumColor = getImpactColor(ImpactLevel.Medium, theme)
    const highColor = getImpactColor(ImpactLevel.High, theme)
    const severeColor = getImpactColor(ImpactLevel.Severe, theme)

    const weightedColors = [
      ...Array(4).fill(lowColor),
      ...Array(3).fill(mediumColor),
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
      interactivity: {
        events: {
          onClick: {
            enable: false,
            mode: 'push'
          },
          onHover: {
            enable: false,
            mode: 'repulse'
          }
        },
        modes: {
          push: {
            quantity: 4
          },
          repulse: {
            distance: 25,
            duration: 0.4
          }
        }
      },
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
          speed: { min: 0.1, max: 1 },
          straight: false
        },
        number: {
          density: {
            enable: true
          },
          value: 80
        },
        opacity: {
          value: { min: 0.1, max: 0.4 },
          random: true
        },
        shape: {
          type: 'circle'
        },
        size: {
          value: { min: 1, max: 4 },
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

  if (init) {
    return (
      <Fade in={isVisible && isSmUp} timeout={1500}>
        <div>
          <Particles id="tsparticles" options={options} />
        </div>
      </Fade>
    )
  }

  return null
}
