import { useCallback } from 'react'

interface ScrollToElementOptions extends ScrollToOptions {
  containerSelector: string // CSS selector for the scrollable container
  targetSelector: string // CSS selector for the target element to scroll to
  containerElement?: HTMLElement | null // Optional container element reference (alternative to selector)
}

export const useScrollToElement = () => {
  const scrollToElement = useCallback((options: ScrollToElementOptions): boolean => {
    const { containerSelector, targetSelector, containerElement, behavior = 'smooth', ...otherOptions } = options

    const container = containerElement || (document.querySelector(containerSelector) as HTMLElement)

    if (!container) return false

    const targetElement = container.querySelector(targetSelector) as HTMLElement

    if (!targetElement) return false

    container.scrollTo({ behavior, top: targetElement.offsetTop, ...otherOptions })

    return true
  }, [])

  return scrollToElement
}
